import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthMiddleware } from '../src/auth-middleware.js';

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function authHeader(value) {
  return ['Bearer', value].join(' ');
}

test('createAuthMiddleware rejects missing authorization header', () => {
  const req = { headers: {} };
  const res = createResponse();
  const middleware = createAuthMiddleware({ jwtSecret: 'secret' });

  middleware(req, res, () => assert.fail('next should not be called'));

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { erro: 'Token não fornecido' });
});

test('createAuthMiddleware rejects verification errors', () => {
  const req = { headers: { authorization: authHeader('invalid') } };
  const res = createResponse();
  const middleware = createAuthMiddleware({
    jwtSecret: 'secret',
    jwtLib: {
      verify() {
        throw new Error('invalid');
      },
    },
  });

  middleware(req, res, () => assert.fail('next should not be called'));

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { erro: 'Token inválido ou expirado' });
});

test('createAuthMiddleware assigns decoded admin and calls next', () => {
  const decodedAdmin = { id: 1, email: 'admin@example.com' };
  const req = { headers: { authorization: authHeader('valid') } };
  const res = createResponse();
  let nextCalled = false;
  const middleware = createAuthMiddleware({
    jwtSecret: 'secret',
    jwtLib: {
      verify(value, secret) {
        assert.equal(value, 'valid');
        assert.equal(secret, 'secret');
        return decodedAdmin;
      },
    },
  });

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.admin, decodedAdmin);
  assert.equal(res.statusCode, null);
});
