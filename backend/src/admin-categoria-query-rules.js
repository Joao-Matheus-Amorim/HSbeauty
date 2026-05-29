const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export function buildAdminCategoriaQuery(query = {}) {
  const where = {};

  if (query.ativo !== undefined && query.ativo !== '') {
    if (query.ativo === 'true') where.ativo = true;
    else if (query.ativo === 'false') where.ativo = false;
    else return { valid: false, status: 400, message: 'Filtro ativo inválido' };
  }

  let pageNum = 1;
  let limitNum = DEFAULT_LIMIT;

  if (query.page !== undefined && query.page !== '') {
    pageNum = Number(query.page);
    if (!Number.isInteger(pageNum) || pageNum <= 0) {
      return { valid: false, status: 400, message: 'Página inválida' };
    }
  }

  if (query.limit !== undefined && query.limit !== '') {
    limitNum = Number(query.limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0) {
      return { valid: false, status: 400, message: 'Limite inválido' };
    }
    if (limitNum > MAX_LIMIT) limitNum = MAX_LIMIT;
  }

  return {
    valid: true,
    where,
    pageNum,
    limitNum,
    skip: (pageNum - 1) * limitNum,
  };
}
