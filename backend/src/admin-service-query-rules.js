import { buildPagination } from './admin-query-utils.js';

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

  const pagination = buildPagination({ page, limit });
  if (!pagination.valid) return pagination;

  return {
    valid: true,
    where,
    ...pagination,
  };
}
