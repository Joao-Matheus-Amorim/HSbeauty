import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildAvailableSlots } from '../availability-service.js';
import { BUSINESS_OPEN_HOUR, BUSINESS_CLOSE_HOUR, SLOT_STEP_MINUTES } from '../booking-rules.js';

// ─── helpers ─────────────────────────────────────────────────────────────────
// baseDay: dia 27/05/2026 à meia-noite local (sem importar timezone — o
// buildAvailableSlots usa o Date como âncora de dia, não UTC)
const BASE_DAY = new Date(2026, 4, 27, 0, 0, 0, 0);

const t = (h, m = 0) => new Date(2026, 4, 27, h, m, 0, 0);

// ─── buildAvailableSlots — dia totalmente livre ───────────────────────────────
describe('buildAvailableSlots — dia vazio', () => {
  it('retorna array não-vazio para dia sem ocupados', () => {
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 60 }, []);
    assert.ok(slots.length > 0, 'Deve haver pelo menos um slot');
  });

  it('primeiro slot começa às 09:00', () => {
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 60 }, []);
    assert.equal(slots[0].horario, '09:00');
  });

  it('slots avançam de 30 em 30 minutos (SLOT_STEP_MINUTES)', () => {
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 30 }, []);
    // Segundo slot deve estar 30 min após o primeiro
    const first = new Date(slots[0].inicio);
    const second = new Date(slots[1].inicio);
    const diffMinutes = (second - first) / 60_000;
    assert.equal(diffMinutes, SLOT_STEP_MINUTES);
  });

  it('último slot termina no máximo às 18:00', () => {
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 60 }, []);
    const lastFim = new Date(slots.at(-1).fim);
    const fimExpediente = t(BUSINESS_CLOSE_HOUR);
    assert.ok(lastFim <= fimExpediente, 'Nenhum slot deve ultrapassar o fechamento');
  });

  it('quantidade esperada de slots para serviço de 30 min', () => {
    // 09:00 a 18:00 = 9h = 540 min / 30 = 18 slots
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 30 }, []);
    assert.equal(slots.length, 18);
  });

  it('quantidade esperada de slots para serviço de 60 min', () => {
    // cursor avança de 30 em 30; serviço de 60 min cabe em slots cujo fim ≤ 18:00
    // 09:00–10:00, 09:30–10:30, ..., 17:00–18:00 → 17 slots
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 60 }, []);
    assert.equal(slots.length, 17);
  });

  it('cada slot tem as propriedades horario, inicio e fim', () => {
    const [slot] = buildAvailableSlots(BASE_DAY, { duracao: 30 }, []);
    assert.ok('horario' in slot);
    assert.ok('inicio' in slot);
    assert.ok('fim' in slot);
  });

  it('inicio e fim são strings ISO 8601 válidas', () => {
    const [slot] = buildAvailableSlots(BASE_DAY, { duracao: 30 }, []);
    assert.ok(!Number.isNaN(Date.parse(slot.inicio)), 'inicio deve ser ISO válido');
    assert.ok(!Number.isNaN(Date.parse(slot.fim)), 'fim deve ser ISO válido');
  });
});

// ─── buildAvailableSlots — com conflitos ─────────────────────────────────────
describe('buildAvailableSlots — com ocupados', () => {
  it('remove slots que conflitam com um agendamento existente', () => {
    // Bloqueia 09:00–10:00
    const ocupados = [{ inicio: t(9), fim: t(10) }];
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 60 }, ocupados);

    // Nenhum slot deve iniciar às 09:00
    const temNove = slots.some((s) => s.horario === '09:00');
    assert.equal(temNove, false);
  });

  it('preserva slots não conflitantes', () => {
    // Bloqueia só 09:00–10:00
    const ocupados = [{ inicio: t(9), fim: t(10) }];
    const slotsLivres = buildAvailableSlots(BASE_DAY, { duracao: 30 }, ocupados);

    // 10:00 em diante deve continuar livre
    const tem10 = slotsLivres.some((s) => s.horario === '10:00');
    assert.equal(tem10, true);
  });

  it('slot adjacente ao bloqueio não é removido', () => {
    // Bloqueio 09:00–09:30; slot 09:30 deve aparecer (sem sobreposição)
    const ocupados = [{ inicio: t(9, 0), fim: t(9, 30) }];
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 30 }, ocupados);
    const tem930 = slots.some((s) => s.horario === '09:30');
    assert.equal(tem930, true);
  });

  it('dia totalmente bloqueado retorna array vazio', () => {
    // Um bloqueio cobrindo todo o expediente
    const ocupados = [{ inicio: t(BUSINESS_OPEN_HOUR), fim: t(BUSINESS_CLOSE_HOUR) }];
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 30 }, ocupados);
    assert.equal(slots.length, 0);
  });

  it('múltiplos bloqueios isolados removem apenas seus slots', () => {
    const ocupados = [
      { inicio: t(9, 0), fim: t(9, 30) },
      { inicio: t(12, 0), fim: t(13, 0) },
    ];
    const slotsLivres = buildAvailableSlots(BASE_DAY, { duracao: 30 }, ocupados);
    // 09:00 bloqueado → não aparece
    assert.equal(
      slotsLivres.some((s) => s.horario === '09:00'),
      false,
    );
    // 09:30 livre
    assert.equal(
      slotsLivres.some((s) => s.horario === '09:30'),
      true,
    );
    // 12:00 bloqueado
    assert.equal(
      slotsLivres.some((s) => s.horario === '12:00'),
      false,
    );
    // 13:00 livre
    assert.equal(
      slotsLivres.some((s) => s.horario === '13:00'),
      true,
    );
  });
});

// ─── buildAvailableSlots — serviços longos ────────────────────────────────────
describe('buildAvailableSlots — serviços com duração longa', () => {
  it('serviço de 540 min (9h) cabe exatamente em 09:00', () => {
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 540 }, []);
    assert.equal(slots.length, 1);
    assert.equal(slots[0].horario, '09:00');
  });

  it('serviço maior que expediente não retorna slots', () => {
    // 10h > 9h de expediente
    const slots = buildAvailableSlots(BASE_DAY, { duracao: 600 }, []);
    assert.equal(slots.length, 0);
  });
});
