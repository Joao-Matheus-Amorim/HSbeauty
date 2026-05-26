import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAdminScheduleCreatePayload,
  validateAdminScheduleUpdatePayload,
} from '../src/admin-schedule-mutation-rules.js';

test('validateAdminScheduleCreatePayload normalizes valid payloads', () => {
  const result = validateAdminScheduleCreatePayload({
    dataInicio: '2026-05-25T09:00:00.000',
    dataFim: '2026-05-25T10:00:00.000',
    horaInicio: ' 09:00 ',
    horaFim: ' 10:00 ',
    motivo: '  Manutenção  ',
  });

  assert.equal(result.valid, true);
  assert.equal(result.data.dataInicio.toISOString(), new Date('2026-05-25T09:00:00.000').toISOString());
  assert.equal(result.data.dataFim.toISOString(), new Date('2026-05-25T10:00:00.000').toISOString());
  assert.equal(result.data.horaInicio, '09:00');
  assert.equal(result.data.horaFim, '10:00');
  assert.equal(result.data.motivo, 'Manutenção');
});

test('validateAdminScheduleCreatePayload requires start and end dates', () => {
  assert.deepEqual(validateAdminScheduleCreatePayload({ dataFim: '2026-05-25T10:00:00.000' }), {
    valid: false,
    status: 400,
    message: 'dataInicio é obrigatória',
  });

  assert.deepEqual(validateAdminScheduleCreatePayload({ dataInicio: '2026-05-25T09:00:00.000' }), {
    valid: false,
    status: 400,
    message: 'dataFim é obrigatória',
  });
});

test('validateAdminScheduleCreatePayload rejects invalid and inverted dates', () => {
  assert.deepEqual(validateAdminScheduleCreatePayload({ dataInicio: 'x', dataFim: '2026-05-25T10:00:00.000' }), {
    valid: false,
    status: 400,
    message: 'dataInicio inválida',
  });

  assert.deepEqual(
    validateAdminScheduleCreatePayload({
      dataInicio: '2026-05-25T10:00:00.000',
      dataFim: '2026-05-25T09:00:00.000',
    }),
    {
      valid: false,
      status: 400,
      message: 'Data de fim deve ser posterior à data de início',
    },
  );
});

test('validateAdminScheduleCreatePayload rejects non-text optional fields', () => {
  assert.deepEqual(
    validateAdminScheduleCreatePayload({
      dataInicio: '2026-05-25T09:00:00.000',
      dataFim: '2026-05-25T10:00:00.000',
      motivo: 123,
    }),
    {
      valid: false,
      status: 400,
      message: 'motivo deve ser texto',
    },
  );
});

test('validateAdminScheduleUpdatePayload normalizes valid updates', () => {
  const result = validateAdminScheduleUpdatePayload(
    {
      dataInicio: '2026-05-25T11:00:00.000',
      dataFim: '2026-05-25T12:00:00.000',
      horaInicio: '',
      motivo: '  Reunião interna  ',
      ativo: false,
    },
    { dataInicio: new Date('2026-05-25T09:00:00.000'), dataFim: new Date('2026-05-25T10:00:00.000') },
  );

  assert.equal(result.valid, true);
  assert.equal(result.data.dataInicio.toISOString(), new Date('2026-05-25T11:00:00.000').toISOString());
  assert.equal(result.data.dataFim.toISOString(), new Date('2026-05-25T12:00:00.000').toISOString());
  assert.equal(result.data.horaInicio, null);
  assert.equal(result.data.motivo, 'Reunião interna');
  assert.equal(result.data.ativo, false);
});

test('validateAdminScheduleUpdatePayload rejects empty updates', () => {
  assert.deepEqual(validateAdminScheduleUpdatePayload({}, {}), {
    valid: false,
    status: 400,
    message: 'Nenhum campo para atualizar',
  });
});

test('validateAdminScheduleUpdatePayload rejects invalid ativo', () => {
  assert.deepEqual(validateAdminScheduleUpdatePayload({ ativo: 'false' }, {}), {
    valid: false,
    status: 400,
    message: 'Ativo deve ser true ou false',
  });
});

test('validateAdminScheduleUpdatePayload rejects explicitly empty date fields', () => {
  assert.deepEqual(
    validateAdminScheduleUpdatePayload(
      { dataInicio: '', motivo: 'x' },
      { dataInicio: new Date('2026-05-25T09:00:00.000'), dataFim: new Date('2026-05-25T10:00:00.000') },
    ),
    {
      valid: false,
      status: 400,
      message: 'dataInicio inválida',
    },
  );

  assert.deepEqual(
    validateAdminScheduleUpdatePayload(
      { dataFim: null, motivo: 'x' },
      { dataInicio: new Date('2026-05-25T09:00:00.000'), dataFim: new Date('2026-05-25T10:00:00.000') },
    ),
    {
      valid: false,
      status: 400,
      message: 'dataFim inválida',
    },
  );
});

test('validateAdminScheduleUpdatePayload validates effective date range', () => {
  assert.deepEqual(
    validateAdminScheduleUpdatePayload(
      { dataFim: '2026-05-25T08:00:00.000' },
      { dataInicio: new Date('2026-05-25T09:00:00.000'), dataFim: new Date('2026-05-25T10:00:00.000') },
    ),
    {
      valid: false,
      status: 400,
      message: 'Data de fim deve ser posterior à data de início',
    },
  );
});
