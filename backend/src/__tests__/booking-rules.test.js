import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidTelefone,
  addMinutes,
  buildDateTime,
  isSlotStepAligned,
  overlaps,
  hasConflict,
  isWithinBusinessHours,
  isDateInWeek,
  getWeekBounds,
  getCurrentWeekRange,
  parseDateOnly,
  parseDayBounds,
  validatePublicBookingPayload,
  BUSINESS_OPEN_HOUR,
  BUSINESS_CLOSE_HOUR,
  SLOT_STEP_MINUTES,
} from '../booking-rules.js';

// ─── isValidTelefone ──────────────────────────────────────────────────────────
describe('isValidTelefone', () => {
  it('aceita formato (21) 98765-4321', () => {
    assert.equal(isValidTelefone('(21) 98765-4321'), true);
  });

  it('aceita 11 dígitos sem formatação', () => {
    assert.equal(isValidTelefone('21987654321'), true);
  });

  it('aceita com código +55', () => {
    assert.equal(isValidTelefone('+5521987654321'), true);
  });

  it('rejeita string vazia', () => {
    assert.equal(isValidTelefone(''), false);
  });

  it('rejeita undefined', () => {
    assert.equal(isValidTelefone(undefined), false);
  });

  it('rejeita número muito curto', () => {
    assert.equal(isValidTelefone('9999'), false);
  });

  it('rejeita letras no número', () => {
    assert.equal(isValidTelefone('abc12345678'), false);
  });
});

// ─── addMinutes ───────────────────────────────────────────────────────────────
describe('addMinutes', () => {
  it('adiciona 30 minutos corretamente', () => {
    const base = new Date('2026-05-27T09:00:00.000Z');
    const result = addMinutes(base, 30);
    assert.equal(result.getTime(), new Date('2026-05-27T09:30:00.000Z').getTime());
  });

  it('não muta a data original', () => {
    const base = new Date('2026-05-27T09:00:00.000Z');
    const original = base.getTime();
    addMinutes(base, 60);
    assert.equal(base.getTime(), original);
  });

  it('funciona com 0 minutos', () => {
    const base = new Date('2026-05-27T09:00:00.000Z');
    assert.equal(addMinutes(base, 0).getTime(), base.getTime());
  });
});

// ─── isSlotStepAligned ────────────────────────────────────────────────────────
describe('isSlotStepAligned', () => {
  it('alinhado a 30min: 09:00 → true', () => {
    const d = new Date('2026-05-27T09:00:00.000Z');
    assert.equal(isSlotStepAligned(d, 30), true);
  });

  it('alinhado a 30min: 09:30 → true', () => {
    const d = new Date('2026-05-27T09:30:00.000Z');
    assert.equal(isSlotStepAligned(d, 30), true);
  });

  it('não alinhado: 09:15 → false', () => {
    const d = new Date('2026-05-27T09:15:00.000Z');
    assert.equal(isSlotStepAligned(d, 30), false);
  });

  it('rejeita data com segundos', () => {
    const d = new Date('2026-05-27T09:00:30.000Z');
    assert.equal(isSlotStepAligned(d, 30), false);
  });
});

// ─── overlaps ─────────────────────────────────────────────────────────────────
describe('overlaps', () => {
  const t = (h, m = 0) => new Date(2026, 4, 27, h, m);

  it('sobreposição total → true', () => {
    assert.equal(overlaps(t(9), t(11), t(9), t(11)), true);
  });

  it('início de A toca fim de B → false (adjacente)', () => {
    assert.equal(overlaps(t(11), t(12), t(9), t(11)), false);
  });

  it('sem sobreposição → false', () => {
    assert.equal(overlaps(t(9), t(10), t(11), t(12)), false);
  });

  it('sobreposição parcial início → true', () => {
    assert.equal(overlaps(t(9), t(11), t(10), t(12)), true);
  });
});

// ─── hasConflict ──────────────────────────────────────────────────────────────
describe('hasConflict', () => {
  const t = (h, m = 0) => new Date(2026, 4, 27, h, m);

  it('sem ocupados → não há conflito', () => {
    assert.equal(hasConflict(t(9), t(10), []), false);
  });

  it('detecta conflito com item ocupado', () => {
    const ocupados = [{ inicio: t(9), fim: t(10, 30) }];
    assert.equal(hasConflict(t(9), t(10), ocupados), true);
  });

  it('não detecta conflito quando slots são adjacentes', () => {
    const ocupados = [{ inicio: t(10, 30), fim: t(11) }];
    assert.equal(hasConflict(t(9), t(10, 30), ocupados), false);
  });
});

// ─── isWithinBusinessHours ────────────────────────────────────────────────────
describe('isWithinBusinessHours', () => {
  it('09:00–10:00 dentro do expediente', () => {
    const start = new Date(2026, 4, 27, BUSINESS_OPEN_HOUR, 0);
    const end = new Date(2026, 4, 27, BUSINESS_OPEN_HOUR + 1, 0);
    assert.equal(isWithinBusinessHours(start, end), true);
  });

  it('08:00–09:00 fora do expediente (antes da abertura)', () => {
    const start = new Date(2026, 4, 27, 8, 0);
    const end = new Date(2026, 4, 27, 9, 0);
    assert.equal(isWithinBusinessHours(start, end), false);
  });

  it('17:00–19:00 fora do expediente (passa do fechamento)', () => {
    const start = new Date(2026, 4, 27, 17, 0);
    const end = new Date(2026, 4, 27, 19, 0);
    assert.equal(isWithinBusinessHours(start, end), false);
  });
});

// ─── isDateInWeek ─────────────────────────────────────────────────────────────
describe('isDateInWeek', () => {
  it('data na mesma semana de referência → true', () => {
    // Referência: quarta 27/05/2026 → semana: 25/05–31/05
    const ref = new Date(2026, 4, 27);
    const same = new Date(2026, 4, 28);
    assert.equal(isDateInWeek(same, ref), true);
  });

  it('data na semana seguinte → false', () => {
    const ref = new Date(2026, 4, 27);
    const next = new Date(2026, 5, 1); // 01/06
    assert.equal(isDateInWeek(next, ref), false);
  });

  it('data na semana anterior → false', () => {
    const ref = new Date(2026, 4, 27);
    const prev = new Date(2026, 4, 24); // domingo anterior
    assert.equal(isDateInWeek(prev, ref), false);
  });
});

// ─── parseDateOnly ────────────────────────────────────────────────────────────
describe('parseDateOnly', () => {
  it('converte string YYYY-MM-DD para Date', () => {
    const d = parseDateOnly('2026-05-27');
    assert.ok(d instanceof Date);
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 4);
    assert.equal(d.getDate(), 27);
  });

  it('lança erro para string inválida', () => {
    assert.throws(() => parseDateOnly('não-é-data'), /Data inválida/);
  });

  it('lança erro para undefined', () => {
    assert.throws(() => parseDateOnly(undefined), /Data inválida/);
  });
});

// ─── validatePublicBookingPayload ─────────────────────────────────────────────
describe('validatePublicBookingPayload', () => {
  const dataISO = new Date(2026, 4, 27, 9, 0, 0, 0).toISOString();

  it('payload válido retorna valid: true', () => {
    const result = validatePublicBookingPayload({
      nomeCliente: 'Maria Silva',
      telefone: '21987654321',
      data: dataISO,
      servicoId: 1,
    });
    assert.equal(result.valid, true);
  });

  it('nome vazio retorna 400', () => {
    const result = validatePublicBookingPayload({ nomeCliente: '', telefone: '21987654321', data: dataISO, servicoId: 1 });
    assert.equal(result.valid, false);
    assert.equal(result.status, 400);
  });

  it('telefone inválido retorna 400', () => {
    const result = validatePublicBookingPayload({ nomeCliente: 'Maria', telefone: '123', data: dataISO, servicoId: 1 });
    assert.equal(result.valid, false);
    assert.equal(result.status, 400);
  });

  it('servicoId não-inteiro retorna 400', () => {
    const result = validatePublicBookingPayload({ nomeCliente: 'Maria', telefone: '21987654321', data: dataISO, servicoId: 'abc' });
    assert.equal(result.valid, false);
    assert.equal(result.status, 400);
  });

  it('data não alinhada ao slot de 30min retorna 400', () => {
    const dataDesalinhada = new Date(2026, 4, 27, 9, 15, 0, 0).toISOString();
    const result = validatePublicBookingPayload({ nomeCliente: 'Maria', telefone: '21987654321', data: dataDesalinhada, servicoId: 1 });
    assert.equal(result.valid, false);
    assert.match(result.message, /30 minutos/);
  });

  it('observações acima de 500 chars retorna 400', () => {
    const result = validatePublicBookingPayload({
      nomeCliente: 'Maria',
      telefone: '21987654321',
      data: dataISO,
      servicoId: 1,
      observacoes: 'x'.repeat(501),
    });
    assert.equal(result.valid, false);
    assert.equal(result.status, 400);
  });

  it('observações dentro do limite → válido', () => {
    const result = validatePublicBookingPayload({
      nomeCliente: 'Maria',
      telefone: '21987654321',
      data: dataISO,
      servicoId: 1,
      observacoes: 'Preferência por esmalte escuro.',
    });
    assert.equal(result.valid, true);
  });

  it('payload nulo retorna valid: false', () => {
    const result = validatePublicBookingPayload(null);
    assert.equal(result.valid, false);
  });
});
