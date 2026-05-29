import { validateImagemUrl } from './url-rules.js';

const NOME_MAX = 60;

function validateNome(value, { required = false } = {}) {
  if (value === undefined) {
    if (required) return { valid: false, status: 400, message: 'Nome da categoria é obrigatório' };
    return { valid: true, value: undefined };
  }

  if (typeof value !== 'string' || !value.trim()) {
    return { valid: false, status: 400, message: required ? 'Nome da categoria é obrigatório' : 'Nome inválido' };
  }

  const nome = value.trim();
  if (nome.length > NOME_MAX) {
    return { valid: false, status: 400, message: `Nome excede ${NOME_MAX} caracteres` };
  }

  return { valid: true, value: nome };
}

function validateOrdem(value) {
  if (value === undefined) return { valid: true, value: undefined };
  const ordem = Number(value);
  if (!Number.isInteger(ordem) || ordem < 0) {
    return { valid: false, status: 400, message: 'Ordem deve ser inteiro >= 0' };
  }
  return { valid: true, value: ordem };
}

function validateAtivo(value) {
  if (value === undefined) return { valid: true, value: undefined };
  if (typeof value !== 'boolean') {
    return { valid: false, status: 400, message: 'Ativo deve ser true ou false' };
  }
  return { valid: true, value };
}

export function validateAdminCategoriaCreatePayload(payload = {}) {
  const data = {};

  const nomeResult = validateNome(payload.nome, { required: true });
  if (!nomeResult.valid) return nomeResult;
  data.nome = nomeResult.value;

  const imagemResult = validateImagemUrl(payload.imagemUrl);
  if (!imagemResult.valid) return imagemResult;
  if (imagemResult.value !== undefined) data.imagemUrl = imagemResult.value;

  const ordemResult = validateOrdem(payload.ordem);
  if (!ordemResult.valid) return ordemResult;
  data.ordem = ordemResult.value ?? 0;

  const ativoResult = validateAtivo(payload.ativo);
  if (!ativoResult.valid) return ativoResult;
  data.ativo = ativoResult.value ?? true;

  return { valid: true, data };
}

export function validateAdminCategoriaUpdatePayload(payload = {}) {
  const data = {};

  const nomeResult = validateNome(payload.nome);
  if (!nomeResult.valid) return nomeResult;
  if (nomeResult.value !== undefined) data.nome = nomeResult.value;

  const imagemResult = validateImagemUrl(payload.imagemUrl);
  if (!imagemResult.valid) return imagemResult;
  if (imagemResult.value !== undefined) data.imagemUrl = imagemResult.value;

  const ordemResult = validateOrdem(payload.ordem);
  if (!ordemResult.valid) return ordemResult;
  if (ordemResult.value !== undefined) data.ordem = ordemResult.value;

  const ativoResult = validateAtivo(payload.ativo);
  if (!ativoResult.valid) return ativoResult;
  if (ativoResult.value !== undefined) data.ativo = ativoResult.value;

  if (Object.keys(data).length === 0) {
    return { valid: false, status: 400, message: 'Nenhum campo para atualizar' };
  }

  return { valid: true, data };
}
