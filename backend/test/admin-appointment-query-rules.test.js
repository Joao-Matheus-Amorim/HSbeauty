import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminAppointmentQuery } from '../src/admin-appointment-query-rules.js';

test('buildAdminAppointmentQuery returns default pagination and empty filter', () => {
  assert.deepEqual(buildAdminAppointmentQuery({}), {
    valid: true,
    where: {},
    pageNum: 1,
    limitNum: 20,
    skip: 0,
  });
});

test('buildAdminAppointmentQuery aceita busca por nome via search', () => {
  const result = buildAdminAppointmentQuery({ search: '  maria  ' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.where.OR, [
    { nomeCliente: { contains: 'maria', mode: 'insensitive' } },
    { email: { contains: 'maria', mode: 'insensitive' } },
  ]);
});

test('buildAdminAppointmentQuery aceita busca via busca (compat) e por digitos no telefone', () => {
  const result = buildAdminAppointmentQuery({ busca: '21987654321' });
  assert.equal(result.valid, true);
  const haveTel = result.where.OR.some((c) => c.telefone?.contains === '21987654321');
  assert.ok(haveTel, 'deveria filtrar pelo telefone quando termo tem digitos');
});

test('buildAdminAppointmentQuery trunca busca em 80 chars', () => {
  const longo = 'A'.repeat(120);
  const result = buildAdminAppointmentQuery({ search: longo });
  assert.equal(result.where.OR[0].nomeCliente.contains.length, 80);
});

test('buildAdminAppointmentQuery builds valid filters', () => {
  const result = buildAdminAppointmentQuery({
    status: 'confirmado',
    dataInicio: '2026-05-25T00:00:00.000',
    dataFim: '2026-05-25T23:59:59.999',
    servicoId: '7',
    page: '3',
    limit: '15',
  });

  assert.equal(result.valid, true);
  assert.equal(result.where.status, 'confirmado');
  assert.equal(result.where.servicoId, 7);
  assert.equal(result.where.data.gte.toISOString(), new Date('2026-05-25T00:00:00.000').toISOString());
  assert.equal(result.where.data.lte.toISOString(), new Date('2026-05-25T23:59:59.999').toISOString());
  assert.equal(result.pageNum, 3);
  assert.equal(result.limitNum, 15);
  assert.equal(result.skip, 30);
});

test('buildAdminAppointmentQuery accepts canonical completed status', () => {
  const result = buildAdminAppointmentQuery({ status: 'concluido' });

  assert.equal(result.valid, true);
  assert.equal(result.where.status, 'concluido');
});

test('buildAdminAppointmentQuery normalizes legacy completed status', () => {
  const result = buildAdminAppointmentQuery({ status: 'concluído' });

  assert.equal(result.valid, true);
  assert.equal(result.where.status, 'concluido');
});

test('buildAdminAppointmentQuery rejects invalid status', () => {
  assert.deepEqual(buildAdminAppointmentQuery({ status: 'aprovado' }), {
    valid: false,
    status: 400,
    message: 'Status inválido',
  });
});

test('buildAdminAppointmentQuery rejects invalid dates', () => {
  assert.deepEqual(buildAdminAppointmentQuery({ dataInicio: 'data-invalida' }), {
    valid: false,
    status: 400,
    message: 'dataInicio inválida',
  });

  assert.deepEqual(buildAdminAppointmentQuery({ dataFim: 'data-invalida' }), {
    valid: false,
    status: 400,
    message: 'dataFim inválida',
  });
});

test('buildAdminAppointmentQuery rejects inverted date range', () => {
  assert.deepEqual(
    buildAdminAppointmentQuery({
      dataInicio: '2026-05-26T00:00:00.000',
      dataFim: '2026-05-25T23:59:59.999',
    }),
    {
      valid: false,
      status: 400,
      message: 'dataFim deve ser maior ou igual a dataInicio',
    },
  );
});

test('buildAdminAppointmentQuery rejects invalid numeric filters', () => {
  assert.deepEqual(buildAdminAppointmentQuery({ servicoId: 'x' }), {
    valid: false,
    status: 400,
    message: 'servicoId inválido',
  });

  assert.deepEqual(buildAdminAppointmentQuery({ page: '0' }), {
    valid: false,
    status: 400,
    message: 'page inválido',
  });

  assert.deepEqual(buildAdminAppointmentQuery({ limit: '-1' }), {
    valid: false,
    status: 400,
    message: 'limit inválido',
  });
});

test('buildAdminAppointmentQuery clamps limit to 100', () => {
  const result = buildAdminAppointmentQuery({ limit: '150' });

  assert.equal(result.valid, true);
  assert.equal(result.limitNum, 100);
});
