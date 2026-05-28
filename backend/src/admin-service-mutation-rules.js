function validateOptionalText(data, payload, fieldName) {
  if (payload[fieldName] === undefined) return null;

  const value = payload[fieldName];
  if (value === null || value === '') {
    data[fieldName] = null;
    return null;
  }

  if (typeof value !== 'string') {
    return { valid: false, status: 400, message: `${fieldName} deve ser texto` };
  }

  data[fieldName] = value.trim();
  return null;
}

function validateNome(value, { required = false } = {}) {
  if (value === undefined) {
    if (required) return { valid: false, status: 400, message: 'Nome é obrigatório' };
    return { valid: true, value: undefined };
  }

  if (typeof value !== 'string' || !value.trim()) {
    return { valid: false, status: 400, message: required ? 'Nome é obrigatório' : 'Nome inválido' };
  }

  return { valid: true, value: value.trim() };
}

function validatePreco(value, { required = false } = {}) {
  if (value === undefined) {
    if (required) return { valid: false, status: 400, message: 'Preço é obrigatório' };
    return { valid: true, value: undefined };
  }

  const precoNumero = Number(value);
  if (Number.isNaN(precoNumero) || precoNumero <= 0) {
    return { valid: false, status: 400, message: 'Preço inválido' };
  }

  return { valid: true, value: precoNumero };
}

function validateDuracao(value, { required = false } = {}) {
  if (value === undefined) {
    if (required) return { valid: false, status: 400, message: 'Duração é obrigatória' };
    return { valid: true, value: undefined };
  }

  const duracaoNumero = Number(value);
  if (!Number.isInteger(duracaoNumero) || duracaoNumero <= 0) {
    return { valid: false, status: 400, message: 'Duração inválida' };
  }

  return { valid: true, value: duracaoNumero };
}

function validateAtivo(value) {
  if (value === undefined) return { valid: true, value: undefined };

  if (typeof value !== 'boolean') {
    return { valid: false, status: 400, message: 'Ativo deve ser true ou false' };
  }

  return { valid: true, value };
}

export function validateAdminServiceCreatePayload(payload = {}) {
  const data = {};

  const nomeResult = validateNome(payload.nome, { required: true });
  if (!nomeResult.valid) return nomeResult;
  data.nome = nomeResult.value;

  const precoResult = validatePreco(payload.preco, { required: true });
  if (!precoResult.valid) return precoResult;
  data.preco = precoResult.value;

  const duracaoResult = validateDuracao(payload.duracao, { required: true });
  if (!duracaoResult.valid) return duracaoResult;
  data.duracao = duracaoResult.value;

  for (const field of ['descricao', 'categoria', 'imagemUrl']) {
    const error = validateOptionalText(data, payload, field);
    if (error) return error;
  }

  const ativoResult = validateAtivo(payload.ativo);
  if (!ativoResult.valid) return ativoResult;
  data.ativo = ativoResult.value ?? true;

  return { valid: true, data };
}

export function validateAdminServiceUpdatePayload(payload = {}) {
  const data = {};

  const nomeResult = validateNome(payload.nome);
  if (!nomeResult.valid) return nomeResult;
  if (nomeResult.value !== undefined) data.nome = nomeResult.value;

  const precoResult = validatePreco(payload.preco);
  if (!precoResult.valid) return precoResult;
  if (precoResult.value !== undefined) data.preco = precoResult.value;

  const duracaoResult = validateDuracao(payload.duracao);
  if (!duracaoResult.valid) return duracaoResult;
  if (duracaoResult.value !== undefined) data.duracao = duracaoResult.value;

  for (const field of ['descricao', 'categoria', 'imagemUrl']) {
    const error = validateOptionalText(data, payload, field);
    if (error) return error;
  }

  const ativoResult = validateAtivo(payload.ativo);
  if (!ativoResult.valid) return ativoResult;
  if (ativoResult.value !== undefined) data.ativo = ativoResult.value;

  if (Object.keys(data).length === 0) {
    return { valid: false, status: 400, message: 'Nenhum campo para atualizar' };
  }

  return { valid: true, data };
}
