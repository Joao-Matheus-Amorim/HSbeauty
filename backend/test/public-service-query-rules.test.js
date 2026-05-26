import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPublicServiceByIdQuery,
  buildPublicServiceQuery,
} from '../src/public-service-query-rules.js';

test('buildPublicServiceQuery returns empty filter by default', () => {
  assert.deepEqual(buildPublicServiceQuery({}), {
    valid: true,
    where: {},
  });
});

test('buildPublicServiceQuery builds active and inactive filters', () => {
  assert.deepEqual(buildPublicServiceQuery({ ativo: 'true' }), {
    valid: true,
    where: { ativo: true },
  });

  assert.deepEqual(buildPublicServiceQuery({ ativo: 'false' }), {
    valid: true,
    where: { ativo: false },
  });
});

test('buildPublicServiceQuery ignores empty ativo filter', () => {
  assert.deepEqual(buildPublicServiceQuery({ ativo: '' }), {
    valid: true,
    where: {},
  });
});

test('buildPublicServiceQuery rejects invalid ativo filter', () => {
  assert.deepEqual(buildPublicServiceQuery({ ativo: 'x' }), {
    valid: false,
    status: 400,
    message: 'ativo deve ser true ou false',
  });
});

test('buildPublicServiceByIdQuery builds active-only lookup filter', () => {
  assert.deepEqual(buildPublicServiceByIdQuery('7'), {
    valid: true,
    where: {
      id: 7,
      ativo: true,
    },
  });
});

test('buildPublicServiceByIdQuery rejects invalid ids', () => {
  assert.deepEqual(buildPublicServiceByIdQuery('x'), {
    valid: false,
    status: 400,
    message: 'ID inválido',
  });

  assert.deepEqual(buildPublicServiceByIdQuery('0'), {
    valid: false,
    status: 400,
    message: 'ID inválido',
  });
});
