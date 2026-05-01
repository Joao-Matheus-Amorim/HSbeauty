const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthHeaders() {
  const token = sessionStorage.getItem('hs_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function handleResponse(response) {
  const json = await response.json();
  if (!response.ok) throw new Error(json.erro || 'Erro na requisição');
  return json;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const response = await fetch(`${API_URL}/admin/dashboard`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

// ─── Agendamentos ─────────────────────────────────────────────────────────────

export async function listarAgendamentosAdmin(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/admin/agendamentos?${query}`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

export async function atualizarAgendamentoAdmin(id, dados) {
  const response = await fetch(`${API_URL}/admin/agendamentos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

export async function cancelarAgendamentoAdmin(id) {
  const response = await fetch(`${API_URL}/admin/agendamentos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// ─── Serviços ─────────────────────────────────────────────────────────────────

export async function listarServicosAdmin(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/admin/servicos?${query}`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

export async function criarServicoAdmin(dados) {
  const response = await fetch(`${API_URL}/admin/servicos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

export async function atualizarServicoAdmin(id, dados) {
  const response = await fetch(`${API_URL}/admin/servicos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

export async function desativarServicoAdmin(id) {
  const response = await fetch(`${API_URL}/admin/servicos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// ─── Horários (Bloqueios) ─────────────────────────────────────────────────────

export async function listarHorariosAdmin(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/admin/horarios?${query}`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

export async function criarHorarioAdmin(dados) {
  const response = await fetch(`${API_URL}/admin/horarios`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

export async function atualizarHorarioAdmin(id, dados) {
  const response = await fetch(`${API_URL}/admin/horarios/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

export async function desativarHorarioAdmin(id) {
  const response = await fetch(`${API_URL}/admin/horarios/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}
