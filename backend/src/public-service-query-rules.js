export function buildPublicServiceQuery(query = {}) {
  const { ativo } = query;
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

  return { valid: true, where };
}
