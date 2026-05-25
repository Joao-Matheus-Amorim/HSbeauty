import { isValidTelefone, OBSERVACOES_MAX_LENGTH } from './booking-rules.js';

export const VALID_BOOKING_STATUSES = ['pendente', 'confirmado', 'cancelado', 'concluído'];

export function validateAdminBookingUpdatePayload(payload) {
  const { status, observacoes, nomeCliente, telefone, email } = payload || {};
  const data = {};

  if (status !== undefined) {
    if (!VALID_BOOKING_STATUSES.includes(status)) {
      return { valid: false, status: 400, message: 'Status inválido' };
    }

    data.status = status;
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
