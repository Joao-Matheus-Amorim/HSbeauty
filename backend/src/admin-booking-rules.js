import { isSlotStepAligned, isValidTelefone, OBSERVACOES_MAX_LENGTH, parsePublicBookingDateTime } from './booking-rules.js';

export const BOOKING_STATUS = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  CANCELADO: 'cancelado',
  CONCLUIDO: 'concluido',
};

const LEGACY_BOOKING_STATUS_ALIASES = {
  concluído: BOOKING_STATUS.CONCLUIDO,
};

export const VALID_BOOKING_STATUSES = Object.values(BOOKING_STATUS);

export function normalizeBookingStatus(status) {
  return LEGACY_BOOKING_STATUS_ALIASES[status] || status;
}

export function validateAdminBookingUpdatePayload(payload) {
  const { status, observacoes, nomeCliente, telefone, email, data: novaData, hora } = payload || {};
  const data = {};

  if (novaData !== undefined) {
    const parsed = parsePublicBookingDateTime(novaData);
    if (!parsed) return { valid: false, status: 400, message: 'Nova data inválida (envie ISO 8601)' };
    if (!isSlotStepAligned(parsed)) return { valid: false, status: 400, message: 'Nova data deve estar alinhada ao slot de 30 minutos' };
    data.data = parsed;
  }

  if (hora !== undefined) {
    if (typeof hora !== 'string' || !/^\d{2}:\d{2}$/.test(hora)) {
      return { valid: false, status: 400, message: 'hora deve estar no formato HH:mm' };
    }
    data.hora = hora;
  } else if (data.data) {
    // Mantem hora coerente com a nova data
    const hh = String(data.data.getHours()).padStart(2, '0');
    const mm = String(data.data.getMinutes()).padStart(2, '0');
    data.hora = `${hh}:${mm}`;
  }

  if (status !== undefined) {
    const normalizedStatus = normalizeBookingStatus(status);

    if (!VALID_BOOKING_STATUSES.includes(normalizedStatus)) {
      return { valid: false, status: 400, message: 'Status inválido' };
    }

    data.status = normalizedStatus;
  }

  if (observacoes !== undefined) {
    if (observacoes === null) {
      data.observacoes = null;
    } else {
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

      data.observacoes = observacoes.trim();
    }
  }

  if (nomeCliente !== undefined) {
    if (typeof nomeCliente !== 'string' || !nomeCliente.trim()) {
      return { valid: false, status: 400, message: 'Nome do cliente inválido' };
    }

    data.nomeCliente = nomeCliente.trim();
  }

  if (telefone !== undefined) {
    if (!isValidTelefone(telefone)) {
      return { valid: false, status: 400, message: 'Telefone inválido. Use o formato (11) 98765-4321 ou similar.' };
    }

    data.telefone = telefone.trim();
  }

  if (email !== undefined) {
    data.email = email;
  }

  if (Object.keys(data).length === 0) {
    return { valid: false, status: 400, message: 'Nenhum campo para atualizar' };
  }

  return { valid: true, data };
}
