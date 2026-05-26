import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLoginPayload, validateRefreshTokenPayload } from '../src/auth-payload-rules.js';

test('validateLoginPayload accepts configured credentials', () => {
  assert.deepEqual(validateLoginPayload({ email: 'admin@example.com', senha: 'secret' }), {
    valid: true,
    data: {
      email: 'admin@example.com',
      senha: 'secret',
    },
  });
});

test('validateLoginPayload rejects missing credentials', () => {
  assert.deepEqual(validateLoginPayload({ email: 'admin@example.com' }), {
    valid: false,
    status: 400,
    message: 'Email e senha são obrigatórios',
  });

  assert.deepEqual(validateLoginPayload({ senha: 'secret' }), {
    valid: false,
    status: 400,
    message: 'Email e senha são obrigatórios',
  });
});

test('validateRefreshTokenPayload accepts refresh tokens', () => {
  assert.deepEqual(validateRefreshTokenPayload({ refreshToken: 'token' }), {
    valid: true,
    data: {
      refreshToken: 'token',
    },
  });
});

test('validateRefreshTokenPayload rejects missing refresh token', () => {
  assert.deepEqual(validateRefreshTokenPayload({}), {
    valid: false,
    status: 400,
    message: 'refreshToken é obrigatório',
  });
});
