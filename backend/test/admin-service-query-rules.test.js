import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminServiceQuery } from '../src/admin-service-query-rules.js';

test('buildAdminServiceQuery returns defaults with empty filters', () => {
  assert.deepEqual(buildAdminServiceQuery({}), {
    valid: true,
    where: {},
    pageNum: 1,
    limitNum: 20,
    skip: 0,
  });
});

test('buildAdminServiceQuery builds active service filter', () => {
  assert.deepEqual(buildAdminServiceQuery({ ativo: 'true' }), {
    valid: true,
    where: { ativo: true },
    pageNum: 1,
    limitNum: 20,
    skip: 0,
  });

  assert.deepEqual(buildAdminServiceQuery({ ativo: 'false' }), {
    valid: true,
    where: { ativo: false },
    pageNum: 1,
    limitNum: 20,
    skip: 0,
  });
});

test('buildAdminServiceQuery rejects invalid ativo filter', () => {
  assert.deepEqual(buildAdminServiceQuery({ ativo: 'todos' }), {
    valid: false,
    status: 400,
    message: 'ativo deve ser true ou false',
  });
});

test('buildAdminServiceQuery builds valid pagination', () => {
  assert.deepEqual(buildAdminServiceQuery({ page: '3', limit: '15' }), {
    valid: true,
    where: {},
    pageNum: 3,
    limitNum: 15,
    skip: 30,
  });
});

test('buildAdminServiceQuery rejects invalid pagination', () => {
  assert.deepEqual(buildAdminServiceQuery({ page: '0' }), {
    valid: false,
    status: 400,
    message: 'page inválido',
  });

  assert.deepEqual(buildAdminServiceQuery({ limit: '-1' }), {
    valid: false,
    status: 400,
    message: 'limit inválido',
  });
});

test('buildAdminServiceQuery clamps limit to 100', () => {
  const result = buildAdminServiceQuery({ limit: '150' });

  assert.equal(result.valid, true);
  assert.equal(result.limitNum, 100);
});
