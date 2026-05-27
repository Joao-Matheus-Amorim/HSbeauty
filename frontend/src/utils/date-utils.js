/**
 * Utilitários de data/hora — extraídos dos componentes para permitir testes unitários.
 * Todas as funções são puras (sem side effects) e exportadas individualmente.
 */

// ─── Formatação ───────────────────────────────────────────────────────────────

/** "2026-05-26" → Date object (meia-noite UTC) */
export function parseDateString(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Converte minutos para texto legível: 150 → "2h30min", 60 → "1h", 45 → "45min" */
export function formatDuracao(minutos) {
  if (!minutos || minutos <= 0) return '';
  const h = Math.floor(minutos / 60);
  const min = minutos % 60;
  if (h === 0) return `${min}min`;
  if (min === 0) return `${h}h`;
  return `${h}h${min}min`;
}

/** Date → "YYYY-MM-DD" */
export function formatDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Construção de ISO sem shift de timezone ──────────────────────────────────

/**
 * Constrói ISO string usando Date.UTC para evitar shift de timezone local.
 * "2026-05-26" + "14:00" → "2026-05-26T14:00:00.000Z"
 * "2026-05-26" sem hora  → "2026-05-26T00:00:00.000Z"
 */
export function buildISODate(dateStr, timeStr = '') {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0)).toISOString();
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).toISOString();
}

/**
 * Igual ao buildISODate mas para data de fim:
 * sem hora → 23:59:59 UTC (fim do dia).
 */
export function buildISODateEnd(dateStr, timeStr = '') {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0)).toISOString();
  }
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59)).toISOString();
}

// ─── Janela de agendamento ────────────────────────────────────────────────────

/**
 * Retorna os dias disponíveis para agendamento a partir de hoje,
 * cobrindo `semanas` semanas completas (incluindo a corrente).
 * Dias passados são excluídos.
 */
export function getAvailableDays(semanas = 3) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const totalDias = semanas * 7;
  const days = [];

  for (let i = 0; i < totalDias; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (date < today) continue;

    days.push({
      value: formatDateOnly(date),
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      dayMonth: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weekIndex: Math.floor(i / 7),
    });
  }

  const end = new Date(start);
  end.setDate(start.getDate() + totalDias - 1);

  return {
    days,
    min: formatDateOnly(today),
    max: formatDateOnly(end),
  };
}
