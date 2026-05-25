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

export function buildAdminServiceQuery(query = {}) {
  const { ativo, page = 1, limit = 20 } = query;
  const where = {};

  if (ativo !== undefined && ativo !== null && ativo !== '') {
    if (ativo === 'true') {
      where.ativo = true;
    } else if (ativo === 'false') {
      where.ativo = false;
    } else {
      return { valid: false, status: 400, message: 'ativo deve ser true ou false' };
    }
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
