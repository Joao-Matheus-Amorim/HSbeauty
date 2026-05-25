export function parsePositiveInteger(value, fieldName, { defaultValue, max } = {}) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, value: defaultValue };
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { valid: false, status: 400, message: `${fieldName} inválido` };
  }

  return { valid: true, value: max ? Math.min(max, parsed) : parsed };
}

export function parseDateQuery(value, fieldName) {
  if (!value) return { valid: true, value: undefined };

  if (typeof value !== 'string') {
    return { valid: false, status: 400, message: `${fieldName} inválida` };
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return { valid: false, status: 400, message: `${fieldName} inválida` };
  }

  return { valid: true, value: date };
}

export function buildAdminAppointmentQuery(query) {
  const {
    status,
    dataInicio,
    dataFim,
    servicoId,
    page = 1,
    limit = 20,
  } = query || {};

  const where = {};

  if (status) where.status = status;

  const pageResult = parsePositiveInteger(page, 'page', { defaultValue: 1 });
  if (!pageResult.valid) return pageResult;

  const limitResult = parsePositiveInteger(limit, 'limit', { defaultValue: 20, max: 100 });
  if (!limitResult.valid) return limitResult;

  if (servicoId !== undefined && servicoId !== null && servicoId !== '') {
    const servicoIdResult = parsePositiveInteger(servicoId, 'servicoId');
    if (!servicoIdResult.valid) return servicoIdResult;
    where.servicoId = servicoIdResult.value;
  }

  const inicioResult = parseDateQuery(dataInicio, 'dataInicio');
  if (!inicioResult.valid) return inicioResult;

  const fimResult = parseDateQuery(dataFim, 'dataFim');
  if (!fimResult.valid) return fimResult;

  if (inicioResult.value || fimResult.value) {
    where.data = {};

    if (inicioResult.value) {
      where.data.gte = inicioResult.value;
    }

    if (fimResult.value) {
      const end = new Date(fimResult.value);
      end.setHours(23, 59, 59, 999);
      where.data.lte = end;
    }

    if (where.data.gte && where.data.lte && where.data.lte < where.data.gte) {
      return { valid: false, status: 400, message: 'dataFim deve ser maior ou igual a dataInicio' };
    }
  }

  const pagina = pageResult.value;
  const limite = limitResult.value;

  return {
    valid: true,
    where,
    pageNum: pagina,
    limitNum: limite,
    skip: (pagina - 1) * limite,
  };
}
