import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminCategoriaQuery } from '../src/admin-categoria-query-rules.js';

test('buildAdminCategoriaQuery default filter', () => {
  assert.deepEqual(buildAdminCategoriaQuery({}), {
    valid: true,
    where: {},
    pageNum: 1,
    limitNum: 50,
    skip: 0,
  });
});

test('buildAdminCategoriaQuery filtro ativo=true', () => {
  const q = buildAdminCategoriaQuery({ ativo: 'true' });
  assert.equal(q.valid, true);
  assert.deepEqual(q.where, { ativo: true });
});

test('buildAdminCategoriaQuery filtro ativo=false', () => {
  const q = buildAdminCategoriaQuery({ ativo: 'false' });
  assert.equal(q.valid, true);
  assert.deepEqual(q.where, { ativo: false });
});

test('buildAdminCategoriaQuery rejects ativo invalido', () => {
  assert.deepEqual(buildAdminCategoriaQuery({ ativo: 'sim' }), {
    valid: false,
    status: 400,
    message: 'Filtro ativo inválido',
  });
});

test('buildAdminCategoriaQuery paginacao valida', () => {
  const q = buildAdminCategoriaQuery({ page: '3', limit: '20' });
  assert.equal(q.valid, true);
  assert.equal(q.pageNum, 3);
  assert.equal(q.limitNum, 20);
  assert.equal(q.skip, 40);
});

test('buildAdminCategoriaQuery rejects pagina invalida', () => {
  assert.deepEqual(buildAdminCategoriaQuery({ page: '0' }), {
    valid: false,
    status: 400,
    message: 'Página inválida',
  });
});

test('buildAdminCategoriaQuery clampa limit a 100', () => {
  const q = buildAdminCategoriaQuery({ limit: '500' });
  assert.equal(q.limitNum, 100);
});
