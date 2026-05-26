import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateAccessToken,
  generateRefreshToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '../token-service.js';

// ─── generateAccessToken ──────────────────────────────────────────────────────
describe('generateAccessToken', () => {
  const ADMIN = { id: 42, email: 'admin@hsbeauty.com' };
  const SECRET = 'test-secret-key';

  it('retorna uma string não-vazia', () => {
    // jwt real via injeção default
    const token = generateAccessToken({ admin: ADMIN, jwtSecret: SECRET });
    assert.equal(typeof token, 'string');
    assert.ok(token.length > 0);
  });

  it('tem 3 segmentos separados por ponto (formato JWT)', () => {
    const token = generateAccessToken({ admin: ADMIN, jwtSecret: SECRET });
    const parts = token.split('.');
    assert.equal(parts.length, 3, 'JWT deve ter header.payload.signature');
  });

  it('usa a lib injetada (jwtLib mock)', () => {
    let capturedPayload = null;
    let capturedSecret = null;
    let capturedOptions = null;

    const mockJwt = {
      sign(payload, secret, options) {
        capturedPayload = payload;
        capturedSecret = secret;
        capturedOptions = options;
        return 'mock-token';
      },
    };

    const result = generateAccessToken({ admin: ADMIN, jwtSecret: SECRET, jwtLib: mockJwt });

    assert.equal(result, 'mock-token');
    assert.equal(capturedPayload.id, ADMIN.id);
    assert.equal(capturedPayload.email, ADMIN.email);
    assert.equal(capturedSecret, SECRET);
    assert.equal(capturedOptions.expiresIn, ACCESS_TOKEN_EXPIRY);
  });

  it('inclui id e email do admin no payload', () => {
    // Decodifica sem verificar assinatura (só payload base64)
    const token = generateAccessToken({ admin: ADMIN, jwtSecret: SECRET });
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    assert.equal(payload.id, ADMIN.id);
    assert.equal(payload.email, ADMIN.email);
  });

  it('expiração padrão é "15m"', () => {
    assert.equal(ACCESS_TOKEN_EXPIRY, '15m');
  });
});

// ─── generateRefreshToken ─────────────────────────────────────────────────────
describe('generateRefreshToken', () => {
  const ADMIN_ID = 7;

  // Helper: cria um mock de prisma que registra a última chamada
  function makePrismaMock() {
    const calls = [];
    return {
      refreshToken: {
        create({ data }) {
          calls.push(data);
          return Promise.resolve({ id: 1, ...data });
        },
      },
      calls,
    };
  }

  it('retorna uma string hexadecimal de 96 chars (48 bytes × 2)', async () => {
    const prismaMock = makePrismaMock();
    const token = await generateRefreshToken({ adminId: ADMIN_ID, prisma: prismaMock });
    assert.equal(typeof token, 'string');
    assert.equal(token.length, 96);
    assert.match(token, /^[0-9a-f]+$/);
  });

  it('persiste o token no prisma com o adminId correto', async () => {
    const prismaMock = makePrismaMock();
    const token = await generateRefreshToken({ adminId: ADMIN_ID, prisma: prismaMock });

    assert.equal(prismaMock.calls.length, 1);
    assert.equal(prismaMock.calls[0].adminId, ADMIN_ID);
    assert.equal(prismaMock.calls[0].token, token);
  });

  it('expiresAt é aproximadamente hoje + REFRESH_TOKEN_EXPIRY_DAYS', async () => {
    const prismaMock = makePrismaMock();
    const fixedNow = new Date('2026-05-27T12:00:00.000Z');

    await generateRefreshToken({
      adminId: ADMIN_ID,
      prisma: prismaMock,
      now: () => new Date(fixedNow),
    });

    const { expiresAt } = prismaMock.calls[0];
    const expectedDate = new Date(fixedNow);
    expectedDate.setDate(expectedDate.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    assert.equal(expiresAt.toISOString(), expectedDate.toISOString());
  });

  it('usa randomBytes injetado', async () => {
    const prismaMock = makePrismaMock();
    const fakeBytes = Buffer.alloc(48, 0xab); // 48 bytes todos 0xab

    const token = await generateRefreshToken({
      adminId: ADMIN_ID,
      prisma: prismaMock,
      randomBytes: (_size) => fakeBytes,
    });

    assert.equal(token, 'ab'.repeat(48));
  });

  it('tokens gerados em chamadas independentes são diferentes', async () => {
    const prismaMock = makePrismaMock();
    const t1 = await generateRefreshToken({ adminId: ADMIN_ID, prisma: prismaMock });
    const t2 = await generateRefreshToken({ adminId: ADMIN_ID, prisma: prismaMock });
    assert.notEqual(t1, t2);
  });

  it('REFRESH_TOKEN_EXPIRY_DAYS é 7', () => {
    assert.equal(REFRESH_TOKEN_EXPIRY_DAYS, 7);
  });
});
