export const BUSINESS_OPEN_HOUR = 9;
export const BUSINESS_CLOSE_HOUR = 18;
export const SLOT_STEP_MINUTES = 30;
export const OBSERVACOES_MAX_LENGTH = 500;
export const PUBLIC_BOOKING_INITIAL_STATUS = 'pendente';

// Aceita: (11) 98765-4321 | 11987654321 | 11 98765-4321 | +5511987654321
const TELEFONE_REGEX = /^(?:\+?55\s?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}$/;

export function isValidTelefone(tel) {
  if (typeof tel !== 'string') return false;

  const value = tel.trim();
  const digits = value.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 13) return false;

  return TELEFONE_REGEX.test(value);
}

export function parsePublicBookingDateTime(value) {
  if (!value || typeof value !== 'string' || !value.trim()) return null;

  const date = new Date(value.trim());

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export function isSlotStepAligned(date, slotStepMinutes = SLOT_STEP_MINUTES) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;

  return date.getMinutes() % slotStepMinutes === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

export function buildDateTime(baseDate, hours, minutes = 0) {
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function getHoraFromDate(date) {
  return date.toTimeString().slice(0, 5);
}

export function formatDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

export function parseDateOnly(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Data inválida');
  }

  const d = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    throw new Error('Data inválida');
  }

  return d;
}

export function parseDayBounds(dateString) {
  const start = parseDateOnly(dateString);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getWeekBounds(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getCurrentWeekBounds() {
  return getWeekBounds(new Date());
}

export function getCurrentWeekRange(referenceDate = new Date()) {
  const { start, end } = getWeekBounds(referenceDate);

  return {
    inicio: formatDateOnly(start),
    fim: formatDateOnly(end),
  };
}

export function isDateInWeek(date, referenceDate = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;

  const { start, end } = getWeekBounds(referenceDate);

  return date >= start && date <= end;
}

export function isDateInCurrentWeek(date) {
  return isDateInWeek(date, new Date());
}

export function isWithinBusinessHours(
  start,
  end,
  openHour = BUSINESS_OPEN_HOUR,
  closeHour = BUSINESS_CLOSE_HOUR,
) {
  if (!(start instanceof Date) || !(end instanceof Date)) return false;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  const day = new Date(start);
  const open = buildDateTime(day, openHour, 0);
  const close = buildDateTime(day, closeHour, 0);

  return start >= open && end <= close;
}

export function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function hasConflict(startA, endA, items) {
  return items.some((item) => overlaps(startA, endA, item.inicio, item.fim));
}

export function validatePublicBookingPayload(payload) {
  const { nomeCliente, telefone, data, servicoId, observacoes } = payload || {};

  if (!nomeCliente || typeof nomeCliente !== 'string' || !nomeCliente.trim()) {
    return { valid: false, status: 400, message: 'Nome do cliente é obrigatório' };
  }

  if (!telefone || typeof telefone !== 'string' || !telefone.trim()) {
    return { valid: false, status: 400, message: 'Telefone é obrigatório' };
  }

  if (!isValidTelefone(telefone)) {
    return { valid: false, status: 400, message: 'Telefone inválido. Use o formato (11) 98765-4321 ou similar.' };
  }

  if (!data) {
    return { valid: false, status: 400, message: 'Data é obrigatória' };
  }

  if (observacoes !== undefined && observacoes !== null) {
    if (typeof observacoes !== 'string') {
      return { valid: false, status: 400, message: 'Observações deve ser texto' };
    }

    if (observacoes.length > OBSERVACOES_MAX_LENGTH) {
      return {
        valid: false,
        status: 400,
        message: `Observações excedem o limite de ${OBSERVACOES_MAX_LENGTH} caracteres`,
      };
    }
  }

  const dataAgendamento = parsePublicBookingDateTime(data);

  if (!dataAgendamento) {
    return {
      valid: false,
      status: 400,
      message: 'Data inválida. Envie data e hora em formato ISO, como 2026-05-25T09:00:00.000Z',
    };
  }

  if (!isSlotStepAligned(dataAgendamento)) {
    return { valid: false, status: 400, message: 'Horário deve estar alinhado ao intervalo de 30 minutos' };
  }

  const servicoIdNumero = Number(servicoId);

  if (!Number.isInteger(servicoIdNumero) || servicoIdNumero <= 0) {
    return { valid: false, status: 400, message: 'Serviço inválido' };
  }

  return {
    valid: true,
    data: {
      nomeCliente: nomeCliente.trim(),
      telefone: telefone.trim(),
      dataAgendamento,
      servicoIdNumero,
      observacoes: observacoes ? observacoes.trim() : undefined,
    },
  };
}
