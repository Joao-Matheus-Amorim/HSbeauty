import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY_DAYS, generateAccessToken, generateRefreshToken } from '../src/token-service.js';

test('generateAccessToken signs admin identity with configured expiry', () => {
  const calls = [];
  const jwtLib = {
    sign(payload, secret, options) {
      calls.push({ payload, secret, options });
      return 'signed-access-token';
    },
  };

  const token = generateAccessToken({
    admin: { id: 123, email: 'admin@hsbeauty.test', senha: 'hidden' },
    jwtSecret: 'secret-value',
    jwtLib,
  });

  assert.equal(token, 'signed-access-token');
  assert.deepEqual(calls, [
    {
      payload: { id: 123, email: 'admin@hsbeauty.test' },
      secret: 'secret-value',
      options: { expiresIn: ACCESS_TOKEN_EXPIRY },
    },
  ]);
  assert.equal(ACCESS_TOKEN_EXPIRY, '15m');
});

test('generateRefreshToken stores a 48-byte hex token expiring in 7 days', async () => {
  const created = [];
  const prisma = {
    refreshToken: {
      async create(input) {
        created.push(input);
      },
    },
  };
  const randomBytes = (size) => {
    assert.equal(size, 48);
    return Buffer.alloc(size, 0xab);
  };
  const now = () => new Date('2026-05-26T12:00:00.000Z');

  const token = await generateRefreshToken({ adminId: 456, prisma, randomBytes, now });

  assert.equal(token, 'ab'.repeat(48));
  assert.deepEqual(created, [
    {
      data: {
        token: 'ab'.repeat(48),
        adminId: 456,
        expiresAt: new Date('2026-06-02T12:00:00.000Z'),
      },
    },
  ]);
  assert.equal(REFRESH_TOKEN_EXPIRY_DAYS, 7);
});
