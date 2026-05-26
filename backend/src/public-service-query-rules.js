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

export function buildPublicServiceByIdQuery(idParam) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return { valid: false, status: 400, message: 'ID inválido' };
  }

  return {
    valid: true,
    where: {
      id,
      ativo: true,
    },
  };
}
