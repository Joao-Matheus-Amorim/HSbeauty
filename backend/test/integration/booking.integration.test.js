import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { getWeekBounds } from '../../src/booking-rules.js';
import { createPublicBookingRouter } from '../../src/public-booking-routes.js';

const DATABASE_URL = process.env.DATABASE_URL_INTEGRATION;
const skip = !DATABASE_URL;

if (skip) {
  console.log('[integration] DATABASE_URL_INTEGRATION nao definido — testes de booking ignorados');
}

let prisma;

if (!skip) {
  const { default: pkg } = await import('@prisma/client');
  const { PrismaNeon } = await import('@prisma/adapter-neon');
  const adapter = new PrismaNeon({ connectionString: DATABASE_URL });
  prisma = new pkg.PrismaClient({ adapter });

  after(async () => {
    await prisma.$disconnect();
  });
}

function slotInCurrentWeek(hour) {
  const now = new Date();
  const { end } = getWeekBounds(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(hour, 0, 0, 0);
  if (tomorrow <= end) return tomorrow;

  const today = new Date(now);
  today.setHours(hour, 0, 0, 0);
  if (today > now && today <= end) return today;

  return null;
}

async function withTestService(run) {
  const servico = await prisma.servico.create({
    data: { nome: '__integration_test__', duracao: 60, preco: 0, ativo: true },
  });
  try {
    await run(servico.id);
  } finally {
    await prisma.agendamento.deleteMany({ where: { servicoId: servico.id } });
    await prisma.servico.delete({ where: { id: servico.id } });
  }
}

async function withServer(app, run) {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  }
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/agendamentos', createPublicBookingRouter({ prisma }));
  return app;
}

test('integration: conflito de horario — segundo agendamento no mesmo slot retorna 409', { skip }, async () => {
  const slot = slotInCurrentWeek(10);
  if (!slot) {
    console.log('[integration] Sem slot disponivel esta semana — teste de conflito ignorado');
    return;
  }

  await withTestService(async (servicoId) => {
    const base = {
      nomeCliente: 'Teste Integracao',
      telefone: '(21) 99999-0001',
      data: slot.toISOString(),
      servicoId,
    };

    await withServer(buildApp(), async (baseUrl) => {
      const first = await fetch(`${baseUrl}/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(base),
      });
      assert.equal(first.status, 201, 'primeiro agendamento deve ser criado');

      const second = await fetch(`${baseUrl}/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...base, nomeCliente: 'Teste 2', telefone: '(21) 99999-0002' }),
      });
      assert.equal(second.status, 409, 'segundo agendamento no mesmo horario deve retornar 409');
    });
  });
});

test('integration: lock — requisicoes concorrentes no mesmo horario, somente uma aprovada', { skip }, async () => {
  const slot = slotInCurrentWeek(11);
  if (!slot) {
    console.log('[integration] Sem slot disponivel esta semana — teste de lock ignorado');
    return;
  }

  await withTestService(async (servicoId) => {
    const makeReq = (baseUrl, name, tel) =>
      fetch(`${baseUrl}/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCliente: name,
          telefone: tel,
          data: slot.toISOString(),
          servicoId,
        }),
      });

    await withServer(buildApp(), async (baseUrl) => {
      const [r1, r2] = await Promise.all([
        makeReq(baseUrl, 'Concorrente A', '(21) 99999-0003'),
        makeReq(baseUrl, 'Concorrente B', '(21) 99999-0004'),
      ]);
      const statuses = [r1.status, r2.status].sort();
      assert.deepEqual(statuses, [201, 409], 'exatamente um aprovado e um rejeitado pelo lock');
    });
  });
});
