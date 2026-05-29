import test from 'node:test';
import assert from 'node:assert/strict';
import { isClosedDay, isWithinBusinessHours } from '../src/booking-rules.js';
import { buildAvailableSlots, calculateAvailability } from '../src/availability-service.js';
import { validateAdminBookingUpdatePayload } from '../src/admin-booking-rules.js';

test('isClosedDay detecta domingo (0) na lista de fechados', () => {
  assert.equal(isClosedDay(new Date('2026-05-31T12:00:00'), [0]), true);
  assert.equal(isClosedDay(new Date('2026-05-25T12:00:00'), [0]), false);
});

test('isClosedDay aceita lista vazia/undefined sem quebrar', () => {
  assert.equal(isClosedDay(new Date('2026-05-31T12:00:00'), []), false);
  assert.equal(isClosedDay(new Date('2026-05-31T12:00:00')), false);
});

test('isWithinBusinessHours aceita horario customizado', () => {
  // Aberto 10-22 (caso de salao noturno)
  assert.equal(
    isWithinBusinessHours(new Date('2026-05-25T20:00:00'), new Date('2026-05-25T21:00:00'), 10, 22),
    true,
  );
  // 18:30 fora do expediente padrao 9-18
  assert.equal(
    isWithinBusinessHours(new Date('2026-05-25T18:30:00'), new Date('2026-05-25T19:30:00')),
    false,
  );
});

test('buildAvailableSlots respeita aberturaHora customizada', () => {
  const baseDay = new Date('2026-05-25T00:00:00');
  const slots = buildAvailableSlots(baseDay, { duracao: 60 }, [], null, {
    aberturaHora: 10,
    fechamentoHora: 14,
  });
  assert.equal(slots[0].horario, '10:00');
  assert.equal(slots.at(-1).horario, '13:00');
});

test('calculateAvailability retorna vazio com mensagem em dia fechado', async () => {
  const prisma = {
    siteConfig: {
      findUnique: async () => ({ aberturaHora: 9, fechamentoHora: 18, diasFechados: [0] }),
    },
    agendamento: { findMany: async () => [] },
    bloqueioHorario: { findMany: async () => [] },
  };
  // 2026-05-31 e um domingo
  const result = await calculateAvailability({
    prisma,
    dateString: '2026-05-31',
    servico: { duracao: 60 },
    referenceDate: new Date('2026-05-25T12:00:00'),
  });
  assert.equal(result.total, 0);
  assert.equal(result.mensagem, 'Fechado neste dia.');
});

test('calculateAvailability gera slots em dia aberto seguindo config custom', async () => {
  const prisma = {
    siteConfig: {
      findUnique: async () => ({ aberturaHora: 10, fechamentoHora: 14, diasFechados: [] }),
    },
    agendamento: { findMany: async () => [] },
    bloqueioHorario: { findMany: async () => [] },
  };
  const result = await calculateAvailability({
    prisma,
    dateString: '2026-05-25',
    servico: { duracao: 60 },
    referenceDate: new Date('2026-05-25T09:00:00'),
  });
  assert.equal(result.expediente.inicio, '10:00');
  assert.equal(result.expediente.fim, '14:00');
  assert.equal(result.slotsDisponiveis[0].horario, '10:00');
});

test('validateAdminBookingUpdatePayload aceita reagendamento com nova data', () => {
  // ISO local-time (sem Z) — BRT-aware
  const result = validateAdminBookingUpdatePayload({
    data: '2026-05-26T10:00:00',
  });
  assert.equal(result.valid, true);
  assert.ok(result.data.data instanceof Date);
  assert.equal(result.data.hora, '10:00');
});

test('validateAdminBookingUpdatePayload rejeita data nao-alinhada a 30min', () => {
  const result = validateAdminBookingUpdatePayload({
    data: '2026-05-26T10:15:00.000Z',
  });
  assert.equal(result.valid, false);
  assert.match(result.message, /30 minutos/);
});

test('validateAdminBookingUpdatePayload rejeita data invalida', () => {
  const result = validateAdminBookingUpdatePayload({ data: 'nao-e-data' });
  assert.equal(result.valid, false);
  assert.match(result.message, /Nova data inv/);
});
