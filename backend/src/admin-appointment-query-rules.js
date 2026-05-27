import { normalizeBookingStatus, VALID_BOOKING_STATUSES } from './admin-booking-rules.js';
import { buildPagination, parsePositiveInteger } from './admin-query-utils.js';

function parseDate(value, fieldName) {
  if (!value) return { valid: true, value: undefined };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { valid: false, status: 400, message: `${fieldName} inválida` };
  }

  return { valid: true, value: date };
}

export function buildAdminAppointmentQuery(query = {}) {
  const { status, dataInicio, dataFim, servicoId, page = 1, limit = 20 } = query;
  const where = {};

  if (status) {
    const normalizedStatus = normalizeBookingStatus(status);

    if (!VALID_BOOKING_STATUSES.includes(normalizedStatus)) {
      return { valid: false, status: 400, message: 'Status inválido' };
    }

    where.status = normalizedStatus;
  }

  const dataInicioResult = parseDate(dataInicio, 'dataInicio');
  if (!dataInicioResult.valid) return dataInicioResult;

  const dataFimResult = parseDate(dataFim, 'dataFim');
  if (!dataFimResult.valid) return dataFimResult;

  if (dataInicioResult.value || dataFimResult.value) {
    where.data = {};

    if (dataInicioResult.value) where.data.gte = dataInicioResult.value;
    if (dataFimResult.value) where.data.lte = dataFimResult.value;

    if (where.data.gte && where.data.lte && where.data.lte < where.data.gte) {
      return { valid: false, status: 400, message: 'dataFim deve ser maior ou igual a dataInicio' };
    }
  }

  if (servicoId !== undefined && servicoId !== null && servicoId !== '') {
    const servicoIdResult = parsePositiveInteger(servicoId, 'servicoId');
    if (!servicoIdResult.valid) return servicoIdResult;
    where.servicoId = servicoIdResult.value;
  }

  const pagination = buildPagination({ page, limit });
  if (!pagination.valid) return pagination;

  return {
    valid: true,
    where,
    ...pagination,
  };
}
