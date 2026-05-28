import { API_URL, parseJsonResponse } from './api';

// ─── Público ──────────────────────────────────────────────────────────────────

export async function listarServicos({ ativo } = {}) {
  const params = new URLSearchParams();
  if (typeof ativo === 'boolean') params.set('ativo', String(ativo));
  const query = params.toString();
  const response = await fetch(`${API_URL}/servicos${query ? `?${query}` : ''}`);
  if (!response.ok) throw new Error('Erro ao carregar serviços');
  return response.json();
}

export async function listarCombos() {
  const response = await fetch(`${API_URL}/combos`);
  if (!response.ok) throw new Error('Erro ao carregar combos');
  return response.json();
}

export async function buscarDisponibilidade(data, servicoId, comboId) {
  const params = new URLSearchParams({ data });
  if (servicoId) params.set('servicoId', String(servicoId));
  if (comboId) params.set('comboId', String(comboId));
  const response = await fetch(`${API_URL}/disponibilidade?${params}`);
  if (!response.ok) throw new Error('Erro ao buscar disponibilidade');
  return response.json();
}

export async function criarAgendamento(dados) {
  const response = await fetch(`${API_URL}/agendamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const json = await parseJsonResponse(response);
  if (!response.ok) throw new Error(json.erro || 'Erro ao criar agendamento');
  return json;
}
