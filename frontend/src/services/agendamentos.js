const API_URL = import.meta.env.VITE_API_URL || 'https://hsbeauty.onrender.com';

function getAuthHeaders() {
  const token = sessionStorage.getItem('hs_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// ─── Público ──────────────────────────────────────────────────────────────────

export async function listarServicos({ ativo } = {}) {
  const params = new URLSearchParams();
  if (typeof ativo === 'boolean') params.set('ativo', String(ativo));
  const query = params.toString();
  const response = await fetch(`${API_URL}/servicos${query ? `?${query}` : ''}`);
  if (!response.ok) throw new Error('Erro ao carregar serviços');
  return response.json();
}

export async function buscarDisponibilidade(data, servicoId) {
  const params = new URLSearchParams({ data, servicoId: String(servicoId) });
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
  const json = await response.json();
  if (!response.ok) throw new Error(json.erro || 'Erro ao criar agendamento');
  return json;
}

// ─── Admin (requer token) ─────────────────────────────────────────────────────

export async function loginAdmin(email, senha) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.erro || 'Erro ao fazer login');
  return json;
}

export async function listarAgendamentos() {
  const response = await fetch(`${API_URL}/agendamentos`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Erro ao carregar agendamentos');
  return response.json();
}

export async function atualizarAgendamento(id, dados) {
  const response = await fetch(`${API_URL}/agendamentos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });
  if (!response.ok) throw new Error('Erro ao atualizar agendamento');
  return response.json();
}

export async function excluirAgendamento(id) {
  const response = await fetch(`${API_URL}/agendamentos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok && response.status !== 204) throw new Error('Erro ao excluir agendamento');
}

export async function listarServicosAdmin() {
  const response = await fetch(`${API_URL}/servicos`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Erro ao carregar serviços');
  return response.json();
}

export async function criarServico(dados) {
  const response = await fetch(`${API_URL}/servicos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.erro || 'Erro ao criar serviço');
  return json;
}

export async function atualizarServico(id, dados) {
  const response = await fetch(`${API_URL}/servicos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.erro || 'Erro ao atualizar serviço');
  return json;
}

export async function desativarServico(id) {
  const response = await fetch(`${API_URL}/servicos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.erro || 'Erro ao desativar serviço');
  return json;
}

export async function listarBloqueios() {
  const response = await fetch(`${API_URL}/bloqueios`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Erro ao carregar bloqueios');
  return response.json();
}

export async function criarBloqueio(dados) {
  const response = await fetch(`${API_URL}/bloqueios`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.erro || 'Erro ao criar bloqueio');
  return json;
}

export async function removerBloqueio(id) {
  const response = await fetch(`${API_URL}/bloqueios/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.erro || 'Erro ao remover bloqueio');
  return json;
}
