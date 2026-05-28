export function validateAdminComboPayload(body = {}) {
  const { nome, descricao, preco, servicoIds, ativo } = body;

  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return { valid: false, status: 400, message: 'Nome do combo é obrigatório' };
  }

  const precoNumero = Number(preco);
  if (!Number.isFinite(precoNumero) || precoNumero < 0) {
    return { valid: false, status: 400, message: 'Preço inválido' };
  }

  if (!Array.isArray(servicoIds) || servicoIds.length === 0) {
    return { valid: false, status: 400, message: 'Informe pelo menos um serviço no combo' };
  }

  const ids = servicoIds.map(Number);
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return { valid: false, status: 400, message: 'IDs de serviço inválidos' };
  }

  return {
    valid: true,
    data: {
      nome: nome.trim(),
      descricao: descricao && typeof descricao === 'string' ? descricao.trim() || null : null,
      preco: precoNumero,
      servicoIds: ids,
      ...(ativo !== undefined ? { ativo: Boolean(ativo) } : {}),
    },
  };
}
