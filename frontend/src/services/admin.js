import { API_URL, authorizedFetch, handleAuthResponse } from './auth';

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const response = await authorizedFetch(`${API_URL}/admin/dashboard`);
  return handleAuthResponse(response);
}

// ─── Agendamentos ─────────────────────────────────────────────────────────────

export async function listarAgendamentosAdmin(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await authorizedFetch(`${API_URL}/admin/agendamentos?${query}`);
  return handleAuthResponse(response);
}

export async function atualizarAgendamentoAdmin(id, dados) {
  const response = await authorizedFetch(`${API_URL}/admin/agendamentos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

export async function exportarAgendamentosCSV(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await authorizedFetch(`${API_URL}/admin/agendamentos/export?${query}`);
  if (!response.ok) throw new Error('Erro ao exportar agendamentos');
  return response.blob();
}

export async function cancelarAgendamentoAdmin(id) {
  const response = await authorizedFetch(`${API_URL}/admin/agendamentos/${id}`, {
    method: 'DELETE',
  });
  return handleAuthResponse(response);
}

// ─── Serviços ─────────────────────────────────────────────────────────────────

export async function listarServicosAdmin(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await authorizedFetch(`${API_URL}/admin/servicos?${query}`);
  return handleAuthResponse(response);
}

export async function criarServicoAdmin(dados) {
  const response = await authorizedFetch(`${API_URL}/admin/servicos`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

export async function atualizarServicoAdmin(id, dados) {
  const response = await authorizedFetch(`${API_URL}/admin/servicos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

export async function desativarServicoAdmin(id) {
  const response = await authorizedFetch(`${API_URL}/admin/servicos/${id}`, {
    method: 'DELETE',
  });
  return handleAuthResponse(response);
}

// ─── Categorias ───────────────────────────────────────────────────────────────

export async function listarCategoriasAdmin(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await authorizedFetch(`${API_URL}/admin/categorias?${query}`);
  return handleAuthResponse(response);
}

export async function criarCategoriaAdmin(dados) {
  const response = await authorizedFetch(`${API_URL}/admin/categorias`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

export async function atualizarCategoriaAdmin(id, dados) {
  const response = await authorizedFetch(`${API_URL}/admin/categorias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

export async function desativarCategoriaAdmin(id) {
  const response = await authorizedFetch(`${API_URL}/admin/categorias/${id}`, {
    method: 'DELETE',
  });
  return handleAuthResponse(response);
}

// ─── Configurações do site ────────────────────────────────────────────────────

export async function getSiteConfigAdmin() {
  const response = await authorizedFetch(`${API_URL}/admin/config`);
  return handleAuthResponse(response);
}

export async function updateSiteConfigAdmin(dados) {
  const response = await authorizedFetch(`${API_URL}/admin/config`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

// ─── Combos ───────────────────────────────────────────────────────────────────

export async function listarCombosAdmin(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await authorizedFetch(`${API_URL}/admin/combos?${query}`);
  return handleAuthResponse(response);
}

export async function criarComboAdmin(dados) {
  const response = await authorizedFetch(`${API_URL}/admin/combos`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

export async function atualizarComboAdmin(id, dados) {
  const response = await authorizedFetch(`${API_URL}/admin/combos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

export async function desativarComboAdmin(id) {
  const response = await authorizedFetch(`${API_URL}/admin/combos/${id}`, {
    method: 'DELETE',
  });
  return handleAuthResponse(response);
}

// ─── Horários (Bloqueios) ─────────────────────────────────────────────────────

export async function listarHorariosAdmin(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await authorizedFetch(`${API_URL}/admin/horarios?${query}`);
  return handleAuthResponse(response);
}

export async function criarHorarioAdmin(dados) {
  const response = await authorizedFetch(`${API_URL}/admin/horarios`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

export async function atualizarHorarioAdmin(id, dados) {
  const response = await authorizedFetch(`${API_URL}/admin/horarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
  return handleAuthResponse(response);
}

export async function desativarHorarioAdmin(id) {
  const response = await authorizedFetch(`${API_URL}/admin/horarios/${id}`, {
    method: 'DELETE',
  });
  return handleAuthResponse(response);
}
