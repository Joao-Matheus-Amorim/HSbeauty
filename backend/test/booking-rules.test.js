import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addMinutes,
  buildPublicBookingLockKey,
  formatDateOnly,
  getCurrentWeekRange,
  getHoraFromDate,
  hasConflict,
  isDateInWeek,
  isSlotStepAligned,
  isValidTelefone,
  isWithinBusinessHours,
  parsePublicBookingDateTime,
  validatePublicBookingPayload,
} from '../src/booking-rules.js';

test('isValidTelefone accepts common Brazilian phone formats', () => {
  assert.equal(isValidTelefone('(11) 98765-4321'), true);
  assert.equal(isValidTelefone('11987654321'), true);
  assert.equal(isValidTelefone('11 98765-4321'), true);
  assert.equal(isValidTelefone('+5511987654321'), true);
});

test('isValidTelefone rejects invalid values', () => {
  assert.equal(isValidTelefone('123'), false);
  assert.equal(isValidTelefone('telefone'), false);
  assert.equal(isValidTelefone(''), false);
  assert.equal(isValidTelefone(null), false);
});

test('parsePublicBookingDateTime parses valid dates and rejects invalid dates', () => {
  assert.equal(parsePublicBookingDateTime('2026-05-25T09:00:00.000Z') instanceof Date, true);
  assert.equal(parsePublicBookingDateTime('data inválida'), null);
  assert.equal(parsePublicBookingDateTime(''), null);
});

test('isSlotStepAligned only accepts exact 30 minute slots', () => {
  assert.equal(isSlotStepAligned(new Date('2026-05-25T09:00:00.000Z')), true);
  assert.equal(isSlotStepAligned(new Date('2026-05-25T09:30:00.000Z')), true);
  assert.equal(isSlotStepAligned(new Date('2026-05-25T09:15:00.000Z')), false);
  assert.equal(isSlotStepAligned(new Date('2026-05-25T09:00:01.000Z')), false);
});

test('isWithinBusinessHours validates complete service duration inside business hours', () => {
  assert.equal(
    isWithinBusinessHours(
      new Date('2026-05-25T09:00:00'),
      new Date('2026-05-25T10:00:00'),
    ),
    true,
  );

  assert.equal(
    isWithinBusinessHours(
      new Date('2026-05-25T08:30:00'),
      new Date('2026-05-25T09:30:00'),
    ),
    false,
  );

  assert.equal(
    isWithinBusinessHours(
      new Date('2026-05-25T17:30:00'),
      new Date('2026-05-25T18:30:00'),
    ),
    false,
  );
});

test('hasConflict detects overlapping intervals', () => {
  const items = [
    {
      inicio: new Date('2026-05-25T10:00:00'),
      fim: new Date('2026-05-25T11:00:00'),
    },
  ];

  assert.equal(
    hasConflict(new Date('2026-05-25T09:00:00'), new Date('2026-05-25T10:00:00'), items),
    false,
  );

  assert.equal(
    hasConflict(new Date('2026-05-25T09:30:00'), new Date('2026-05-25T10:30:00'), items),
    true,
  );

  assert.equal(
    hasConflict(new Date('2026-05-25T11:00:00'), new Date('2026-05-25T12:00:00'), items),
    false,
  );
});

test('date formatting helpers return stable public values', () => {
  const date = new Date('2026-05-25T09:30:00');

  assert.equal(formatDateOnly(date), '2026-05-25');
  assert.equal(getHoraFromDate(date), '09:30');
  assert.deepEqual(getCurrentWeekRange(new Date('2026-05-25T12:00:00')), {
    inicio: '2026-05-25',
    fim: '2026-05-31',
  });
});

test('buildPublicBookingLockKey scopes public booking locks by day', () => {
  assert.equal(
    buildPublicBookingLockKey(new Date('2026-05-25T09:30:00')),
    'hsbeauty:public-booking:2026-05-25',
  );
});

test('isDateInWeek validates against an explicit reference date', () => {
  const reference = new Date('2026-05-25T12:00:00');

  assert.equal(isDateInWeek(new Date('2026-05-25T09:00:00'), reference), true);
  assert.equal(isDateInWeek(new Date('2026-05-31T18:00:00'), reference), true);
  assert.equal(isDateInWeek(new Date('2026-06-01T09:00:00'), reference), false);
});

test('addMinutes returns a new date with the expected offset', () => {
  const date = new Date('2026-05-25T09:00:00');
  const result = addMinutes(date, 90);

  assert.equal(result.toISOString(), new Date('2026-05-25T10:30:00').toISOString());
  assert.notEqual(result, date);
});

const NOW_BEFORE = new Date('2026-05-25T08:00:00.000Z');

test('validatePublicBookingPayload returns normalized data for valid payloads', () => {
  const result = validatePublicBookingPayload({
    nomeCliente: '  Maria  ',
    telefone: ' (11) 98765-4321 ',
    data: '2026-05-25T09:00:00.000Z',
    servicoId: '3',
    observacoes: '  Sem alergias  ',
  }, { now: NOW_BEFORE });

  assert.equal(result.valid, true);
  assert.equal(result.data.nomeCliente, 'Maria');
  assert.equal(result.data.telefone, '(11) 98765-4321');
  assert.equal(result.data.servicoIdNumero, 3);
  assert.equal(result.data.observacoes, 'Sem alergias');
  assert.equal(result.data.dataAgendamento instanceof Date, true);
});

test('validatePublicBookingPayload rejects when both servicoId and comboId provided', () => {
  assert.deepEqual(
    validatePublicBookingPayload({
      nomeCliente: 'Maria',
      telefone: '(11) 98765-4321',
      data: '2026-05-25T09:00:00.000Z',
      servicoId: 1,
      comboId: 2,
    }, { now: NOW_BEFORE }).valid,
    false,
  );
});

test('validatePublicBookingPayload accepts comboId and returns comboIdNumero', () => {
  const result = validatePublicBookingPayload({
    nomeCliente: 'Maria',
    telefone: '(11) 98765-4321',
    data: '2026-05-25T09:00:00.000Z',
    comboId: '3',
  }, { now: NOW_BEFORE });
  assert.equal(result.valid, true);
  assert.equal(result.data.comboIdNumero, 3);
  assert.equal(result.data.servicoIdNumero, undefined);
});

test('validatePublicBookingPayload rejects invalid public booking payloads', () => {
  assert.deepEqual(validatePublicBookingPayload({}).valid, false);

  assert.deepEqual(
    validatePublicBookingPayload({
      nomeCliente: 'Maria',
      telefone: '123',
      data: '2026-05-25T09:00:00.000Z',
      servicoId: 1,
    }, { now: NOW_BEFORE }),
    {
      valid: false,
      status: 400,
      message: 'Telefone inválido. Use o formato (11) 98765-4321 ou similar.',
    },
  );

  assert.deepEqual(
    validatePublicBookingPayload({
      nomeCliente: 'Maria',
      telefone: '(11) 98765-4321',
      data: '2026-05-25T09:15:00.000Z',
      servicoId: 1,
    }, { now: NOW_BEFORE }),
    {
      valid: false,
      status: 400,
      message: 'Horário deve estar alinhado ao intervalo de 30 minutos',
    },
  );

  assert.deepEqual(
    validatePublicBookingPayload({
      nomeCliente: 'Maria',
      telefone: '(11) 98765-4321',
      data: '2026-05-25T09:00:00.000Z',
      servicoId: 1,
      email: 'nao-e-email',
    }, { now: NOW_BEFORE }),
    { valid: false, status: 400, message: 'Email inválido' },
  );
});

test('validatePublicBookingPayload rejects past datetimes', () => {
  const result = validatePublicBookingPayload({
    nomeCliente: 'Maria',
    telefone: '(11) 98765-4321',
    data: '2026-05-25T09:00:00.000Z',
    servicoId: 1,
  }, { now: new Date('2026-05-25T10:00:00.000Z') });

  assert.deepEqual(result, {
    valid: false,
    status: 400,
    message: 'Não é possível agendar para um horário no passado',
  });
});

test('validatePublicBookingPayload accepts optional email and passes it through', () => {
  const semEmail = validatePublicBookingPayload({
    nomeCliente: 'Maria',
    telefone: '(11) 98765-4321',
    data: '2026-05-25T09:00:00.000Z',
    servicoId: 1,
  }, { now: NOW_BEFORE });
  assert.equal(semEmail.valid, true);
  assert.equal(semEmail.data.email, undefined);

  const comEmail = validatePublicBookingPayload({
    nomeCliente: 'Maria',
    telefone: '(11) 98765-4321',
    data: '2026-05-25T09:00:00.000Z',
    servicoId: 1,
    email: ' maria@example.com ',
  }, { now: NOW_BEFORE });
  assert.equal(comEmail.valid, true);
  assert.equal(comEmail.data.email, 'maria@example.com');
});
