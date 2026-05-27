import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createAuthRouter } from '../../src/auth-routes.js';

const DATABASE_URL = process.env.DATABASE_URL_INTEGRATION;
const ADMIN_EMAIL = process.env.INTEGRATION_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.INTEGRATION_ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret';

const skip = !DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD;

if (skip) {
  console.log(
    '[integration] DATABASE_URL_INTEGRATION, INTEGRATION_ADMIN_EMAIL ou INTEGRATION_ADMIN_PASSWORD nao definidos — testes de auth ignorados',
  );
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
  app.use('/auth', createAuthRouter({ prisma, jwtSecret: JWT_SECRET }));
  return app;
}

test('integration: auth flow — login, refresh e logout com banco real', { skip }, async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD }),
    });
    assert.equal(loginRes.status, 200, 'login deve retornar 200');
    const { accessToken, refreshToken } = await loginRes.json();
    assert.ok(accessToken, 'deve retornar accessToken');
    assert.ok(refreshToken, 'deve retornar refreshToken');

    // Token gravado no banco
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    assert.ok(stored, 'refresh token deve estar no banco apos login');
    assert.equal(stored.revogado, false, 'token recente nao deve estar revogado');

    // Refresh — gera novo par de tokens e revoga o anterior
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    assert.equal(refreshRes.status, 200, 'refresh deve retornar 200');
    const { refreshToken: newRefreshToken } = await refreshRes.json();
    assert.ok(newRefreshToken, 'deve retornar novo refreshToken');
    assert.notEqual(newRefreshToken, refreshToken, 'novo token deve ser diferente do anterior');

    const revokedStored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    assert.equal(revokedStored?.revogado, true, 'token anterior deve estar revogado apos refresh');

    // Logout — revoga o token novo
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: newRefreshToken }),
    });
    assert.equal(logoutRes.status, 200, 'logout deve retornar 200');

    const loggedOutStored = await prisma.refreshToken.findUnique({ where: { token: newRefreshToken } });
    assert.equal(loggedOutStored?.revogado, true, 'token deve estar revogado apos logout');

    // Refresh apos logout deve falhar com 401
    const afterLogout = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: newRefreshToken }),
    });
    assert.equal(afterLogout.status, 401, 'refresh apos logout deve retornar 401');
  });
});

test('integration: login com credenciais invalidas retorna 401', { skip }, async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, senha: 'senha-errada-integration-test' }),
    });
    assert.equal(res.status, 401);
  });
});
