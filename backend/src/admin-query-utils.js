export function parsePositiveInteger(value, fieldName, { defaultValue, max } = {}) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, value: defaultValue };
  }

  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    return { valid: false, status: 400, message: `${fieldName} inválido` };
  }

  return { valid: true, value: max ? Math.min(number, max) : number };
}

export function buildPagination({ page = 1, limit = 20 } = {}) {
  const pageResult = parsePositiveInteger(page, 'page', { defaultValue: 1 });
  if (!pageResult.valid) return pageResult;

  const limitResult = parsePositiveInteger(limit, 'limit', { defaultValue: 20, max: 100 });
  if (!limitResult.valid) return limitResult;

  return {
    valid: true,
    pageNum: pageResult.value,
    limitNum: limitResult.value,
    skip: (pageResult.value - 1) * limitResult.value,
  };
}
