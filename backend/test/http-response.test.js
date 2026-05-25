import test from 'node:test';
import assert from 'node:assert/strict';
import { handleInternalError, handlePrismaConflict, sendError } from '../src/http-response.js';

function createMockResponse() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('sendError returns the expected public error contract', () => {
  const res = createMockResponse();

  const returned = sendError(res, 400, 'Payload inválido');

  assert.equal(returned, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { erro: 'Payload inválido' });
});

test('handlePrismaConflict maps unique constraint errors to 409', () => {
  const res = createMockResponse();

  const returned = handlePrismaConflict(res, { code: 'P2002' }, 'Registro duplicado');

  assert.equal(returned, res);
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { erro: 'Registro duplicado' });
});

test('handlePrismaConflict ignores non-conflict errors', () => {
  const res = createMockResponse();

  const returned = handlePrismaConflict(res, { code: 'P2025' }, 'Registro duplicado');

  assert.equal(returned, null);
  assert.equal(res.statusCode, undefined);
  assert.equal(res.body, undefined);
});

test('handleInternalError logs internally and returns only the public message', () => {
  const res = createMockResponse();
  const originalError = console.error;
  const calls = [];
  console.error = (...args) => calls.push(args);

  try {
    const returned = handleInternalError(
      res,
      new Error('database secret detail'),
      'POST /example',
      'Erro público',
      { method: 'POST', originalUrl: '/example' },
    );

    assert.equal(returned, res);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { erro: 'Erro público' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], '[HSBeauty API error]');
    assert.equal(calls[0][1].context, 'POST /example');
    assert.equal(calls[0][1].method, 'POST');
    assert.equal(calls[0][1].path, '/example');
    assert.equal(calls[0][1].message, 'database secret detail');
  } finally {
    console.error = originalError;
  }
});
