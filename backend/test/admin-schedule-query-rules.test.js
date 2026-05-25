import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminScheduleQuery } from '../src/admin-schedule-query-rules.js';

test('buildAdminScheduleQuery defaults to active schedules', () => {
  assert.deepEqual(buildAdminScheduleQuery({}), {
    valid: true,
    where: { ativo: true },
    pageNum: 1,
    limitNum: 20,
    skip: 0,
  });
});

test('buildAdminScheduleQuery builds inactive schedule filter', () => {
  assert.deepEqual(buildAdminScheduleQuery({ ativo: 'false' }), {
    valid: true,
    where: { ativo: false },
    pageNum: 1,
    limitNum: 20,
    skip: 0,
  });
});

test('buildAdminScheduleQuery allows empty ativo to list all schedules', () => {
  assert.deepEqual(buildAdminScheduleQuery({ ativo: '' }), {
    valid: true,
    where: {},
    pageNum: 1,
    limitNum: 20,
    skip: 0,
  });
});

test('buildAdminScheduleQuery rejects invalid ativo filter', () => {
  assert.deepEqual(buildAdminScheduleQuery({ ativo: 'todos' }), {
    valid: false,
    status: 400,
    message: 'ativo deve ser true ou false',
  });
});

test('buildAdminScheduleQuery builds valid pagination', () => {
  assert.deepEqual(buildAdminScheduleQuery({ page: '3', limit: '15' }), {
    valid: true,
    where: { ativo: true },
    pageNum: 3,
    limitNum: 15,
    skip: 30,
  });
});

test('buildAdminScheduleQuery rejects invalid pagination', () => {
  assert.deepEqual(buildAdminScheduleQuery({ page: '0' }), {
    valid: false,
    status: 400,
    message: 'page inválido',
  });

  assert.deepEqual(buildAdminScheduleQuery({ limit: '-1' }), {
    valid: false,
    status: 400,
    message: 'limit inválido',
  });
});

test('buildAdminScheduleQuery clamps limit to 100', () => {
  const result = buildAdminScheduleQuery({ limit: '150' });

  assert.equal(result.valid, true);
  assert.equal(result.limitNum, 100);
});
