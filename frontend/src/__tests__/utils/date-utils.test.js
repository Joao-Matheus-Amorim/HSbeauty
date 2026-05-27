import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildISODate,
  buildISODateEnd,
  formatDuracao,
  formatDateOnly,
  getAvailableDays,
} from '../../utils/date-utils';

// ─── formatDuracao ────────────────────────────────────────────────────────────
describe('formatDuracao', () => {
  it('converte 150 min para 2h30min', () => {
    expect(formatDuracao(150)).toBe('2h30min');
  });

  it('converte 60 min para 1h', () => {
    expect(formatDuracao(60)).toBe('1h');
  });

  it('converte 45 min para 45min', () => {
    expect(formatDuracao(45)).toBe('45min');
  });

  it('converte 90 min para 1h30min', () => {
    expect(formatDuracao(90)).toBe('1h30min');
  });

  it('retorna string vazia para 0', () => {
    expect(formatDuracao(0)).toBe('');
  });

  it('retorna string vazia para undefined', () => {
    expect(formatDuracao(undefined)).toBe('');
  });

  it('retorna string vazia para negativo', () => {
    expect(formatDuracao(-10)).toBe('');
  });
});

// ─── buildISODate — bug do timezone ──────────────────────────────────────────
describe('buildISODate', () => {
  it('sem hora: gera início do dia em UTC, nunca deslocado', () => {
    const result = buildISODate('2026-05-26');
    expect(result).toBe('2026-05-26T00:00:00.000Z');
  });

  it('com hora: usa a hora exata em UTC', () => {
    const result = buildISODate('2026-05-26', '14:00');
    expect(result).toBe('2026-05-26T14:00:00.000Z');
  });

  it('sem hora: dia 1 do mês fica no dia correto', () => {
    const result = buildISODate('2026-06-01');
    expect(result).toBe('2026-06-01T00:00:00.000Z');
  });

  it('retorna null para dateStr vazio', () => {
    expect(buildISODate('')).toBeNull();
    expect(buildISODate(null)).toBeNull();
  });
});

describe('buildISODateEnd', () => {
  it('sem hora: gera fim do dia em UTC (23:59:59)', () => {
    const result = buildISODateEnd('2026-05-26');
    expect(result).toBe('2026-05-26T23:59:59.000Z');
  });

  it('com hora: usa a hora exata em UTC', () => {
    const result = buildISODateEnd('2026-05-26', '18:00');
    expect(result).toBe('2026-05-26T18:00:00.000Z');
  });

  it('retorna null para dateStr vazio', () => {
    expect(buildISODateEnd('')).toBeNull();
  });
});

// ─── formatDateOnly ───────────────────────────────────────────────────────────
describe('formatDateOnly', () => {
  it('formata data corretamente com zero-padding', () => {
    const d = new Date(2026, 0, 5); // 5 de janeiro (mês 0-indexed)
    expect(formatDateOnly(d)).toBe('2026-01-05');
  });

  it('formata dezembro corretamente', () => {
    const d = new Date(2026, 11, 31);
    expect(formatDateOnly(d)).toBe('2026-12-31');
  });
});

// ─── getAvailableDays ─────────────────────────────────────────────────────────
describe('getAvailableDays', () => {
  let fakeToday;

  beforeEach(() => {
    // Fixa "hoje" em uma quarta-feira: 2026-05-27
    fakeToday = new Date(2026, 4, 27, 10, 0, 0); // 27 de maio de 2026 (mês 4 = maio)
    vi.useFakeTimers();
    vi.setSystemTime(fakeToday);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('não retorna dias passados', () => {
    const { days } = getAvailableDays(3);
    const today = formatDateOnly(fakeToday);
    const hasPast = days.some((d) => d.value < today);
    expect(hasPast).toBe(false);
  });

  it('com 3 semanas, retorna pelo menos 14 dias à frente', () => {
    const { days } = getAvailableDays(3);
    expect(days.length).toBeGreaterThanOrEqual(14);
  });

  it('com 1 semana, retorna no máximo 7 dias', () => {
    const { days } = getAvailableDays(1);
    expect(days.length).toBeLessThanOrEqual(7);
  });

  it('dia "max" está 3 semanas depois do início da semana corrente', () => {
    const { max } = getAvailableDays(3);
    // início da semana de 2026-05-27 (quarta) = 2026-05-25 (segunda)
    // 3 semanas = 21 dias → 2026-06-14 (domingo)
    expect(max).toBe('2026-06-14');
  });

  it('weekIndex 0 corresponde à semana atual', () => {
    const { days } = getAvailableDays(3);
    const week0 = days.filter((d) => d.weekIndex === 0);
    expect(week0.length).toBeGreaterThan(0);
    expect(week0.every((d) => d.value >= '2026-05-25' && d.value <= '2026-05-31')).toBe(true);
  });
});
