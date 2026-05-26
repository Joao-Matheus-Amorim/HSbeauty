import { VALID_BOOKING_STATUSES } from './admin-booking-rules.js';
import {
  getHoraFromDate,
  isSlotStepAligned,
  isValidTelefone,
  OBSERVACOES_MAX_LENGTH,
  parsePublicBookingDateTime,
} from './booking-rules.js';

export function validateAppointmentUpdatePayload(payload = {}) {
  const data = {};
  let dataAgendamento;
  let servicoIdNumero;

  if (payload.nomeCliente !== undefined) {
    if (typeof payload.nomeCliente !== 'string' || !payload.nomeCliente.trim()) {
      return { valid: false, status: 400, message: 'Nome do cliente inválido' };
    }

    data.nomeCliente = payload.nomeCliente.trim();
  }

  if (payload.telefone !== undefined) {
    if (!isValidTelefone(payload.telefone)) {
      return { valid: false, status: 400, message: 'Telefone inválido. Use o formato (11) 98765-4321 ou similar.' };
    }

    data.telefone = payload.telefone.trim();
  }

  if (payload.observacoes !== undefined) {
    if (payload.observacoes === null) {
      data.observacoes = null;
    } else {
      if (typeof payload.observacoes !== 'string') {
        return { valid: false, status: 400, message: 'Observações deve ser texto' };
      }

      if (payload.observacoes.length > OBSERVACOES_MAX_LENGTH) {
        return {
          valid: false,
          status: 400,
          message: `Observações excedem o limite de ${OBSERVACOES_MAX_LENGTH} caracteres`,
        };
      }

      data.observacoes = payload.observacoes.trim();
    }
  }

  if (payload.data !== undefined) {
    const parsedDate = parsePublicBookingDateTime(payload.data);

    if (!parsedDate) {
      return { valid: false, status: 400, message: 'Data inválida' };
    }

    if (!isSlotStepAligned(parsedDate)) {
      return { valid: false, status: 400, message: 'Horário deve estar alinhado ao intervalo de 30 minutos' };
    }

    dataAgendamento = parsedDate;
    data.data = parsedDate;
    data.hora = getHoraFromDate(parsedDate);
  }

  if (payload.servicoId !== undefined) {
    servicoIdNumero = Number(payload.servicoId);

    if (!Number.isInteger(servicoIdNumero) || servicoIdNumero <= 0) {
      return { valid: false, status: 400, message: 'Serviço inválido' };
    }
  }

  if (payload.status !== undefined) {
    if (!VALID_BOOKING_STATUSES.includes(payload.status)) {
      return { valid: false, status: 400, message: 'Status inválido' };
    }

    data.status = payload.status;
  }

  if (Object.keys(data).length === 0 && servicoIdNumero === undefined) {
    return { valid: false, status: 400, message: 'Nenhum campo para atualizar' };
  }

  return {
    valid: true,
    data,
    dataAgendamento,
    servicoIdNumero,
  };
}
