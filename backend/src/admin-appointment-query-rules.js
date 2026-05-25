import { VALID_BOOKING_STATUSES } from './admin-booking-rules.js';

function parsePositiveInteger(value, fieldName, { defaultValue, max } = {}) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, value: defaultValue };
  }

  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    return { valid: false, status: 400, message: `${fieldName} inválido` };
  }

  return { valid: true, value: max ? Math.min(number, max) : number };
}

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
    if (!VALID_BOOKING_STATUSES.includes(status)) {
      return { valid: false, status: 400, message: 'Status inválido' };
    }

    where.status = status;
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

  const pageResult = parsePositiveInteger(page, 'page', { defaultValue: 1 });
  if (!pageResult.valid) return pageResult;

  const limitResult = parsePositiveInteger(limit, 'limit', { defaultValue: 20, max: 100 });
  if (!limitResult.valid) return limitResult;

  return {
    valid: true,
    where,
    pageNum: pageResult.value,
    limitNum: limitResult.value,
    skip: (pageResult.value - 1) * limitResult.value,
  };
}
