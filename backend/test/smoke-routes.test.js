import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import express from 'express';
import { createAuthRouter } from '../src/auth-routes.js';
import { createPublicBookingRouter } from '../src/public-booking-routes.js';

function createPrismaMock() {
  const refreshStore = new Map();
  let refreshId = 0;

  const admin = {
    id: 1,
    email: 'admin@hsbeauty.com',
    senha: bcrypt.hashSync('123456', 10),
    ativo: true,
  };

  const servico = { id: 1, nome: 'Unhas', duracao: 60, preco: 60, ativo: true };
  const createdBookings = [];

  const prisma = {
    admin: {
      findUnique: async ({ where }) => (where?.email === admin.email ? admin : null),
    },
    refreshToken: {
      create: async ({ data }) => {
        refreshId += 1;
        const value = {
          id: refreshId,
          token: data.token,
          adminId: data.adminId,
          expiresAt: data.expiresAt,
          revogado: false,
          admin,
        };
        refreshStore.set(data.token, value);
        return value;
      },
      findUnique: async ({ where, include }) => {
        const stored = refreshStore.get(where.token);
        if (!stored) return null;
        return include?.admin ? { ...stored, admin } : stored;
      },
      update: async ({ where, data }) => {
        for (const [token, stored] of refreshStore.entries()) {
          if (stored.id === where.id) {
            const updated = { ...stored, ...data };
            refreshStore.set(token, updated);
            return updated;
          }
        }
        return null;
      },
    },
    $transaction: async (fn) => {
      const tx = {
        $executeRaw: async () => undefined,
        servico: {
          findUnique: async ({ where }) => (where?.id === servico.id ? servico : null),
        },
        agendamento: {
          findMany: async () => [],
          create: async ({ data, include }) => {
            const created = {
              id: createdBookings.length + 1,
              ...data,
              servico: include?.servico ? servico : undefined,
            };
            createdBookings.push(created);
            return created;
          },
        },
        bloqueioHorario: {
          findMany: async () => [],
        },
      };
      return fn(tx);
    },
  };

  return { prisma, createdBookings };
}

async function withServer(app, run) {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('smoke: health endpoint responds ok', async () => {
  const app = express();
  app.use(express.json());
  app.get('/', (_req, res) => res.json({ status: 'ok', mensagem: 'API HSBeauty rodando' }));

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ok');
  });
});

test('smoke: auth login refresh logout flow', async () => {
  const { prisma } = createPrismaMock();
  const app = express();
  app.use(express.json());
  app.use('/auth', createAuthRouter({ prisma, jwtSecret: 'smoke-secret' }));

  await withServer(app, async (baseUrl) => {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hsbeauty.com', senha: '123456' }),
    });
    assert.equal(loginRes.status, 200);
    const loginBody = await loginRes.json();
    assert.ok(loginBody.accessToken);
    assert.ok(loginBody.refreshToken);

    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: loginBody.refreshToken }),
    });
    assert.equal(refreshRes.status, 200);
    const refreshBody = await refreshRes.json();
    assert.ok(refreshBody.accessToken);
    assert.ok(refreshBody.refreshToken);

    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshBody.refreshToken }),
    });
    assert.equal(logoutRes.status, 200);
  });
});

test('smoke: public booking creates appointment', async () => {
  const { prisma, createdBookings } = createPrismaMock();
  const app = express();
  app.use(express.json());
  app.use('/agendamentos', createPublicBookingRouter({ prisma }));

  const bookingDate = new Date();
  bookingDate.setHours(10, 0, 0, 0);

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomeCliente: 'Maria',
        telefone: '(21) 99999-8888',
        data: bookingDate.toISOString(),
        servicoId: 1,
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.nomeCliente, 'Maria');
    assert.equal(body.status, 'pendente');
    assert.equal(createdBookings.length, 1);
  });
});
