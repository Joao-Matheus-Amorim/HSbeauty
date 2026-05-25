const PRODUCTION_API_URL = 'https://hsbeauty.onrender.com';
const LOCAL_API_URL = 'http://localhost:3000';

function resolveApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  const isBrowser = typeof window !== 'undefined';
  const isLocalHost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (isLocalHost) {
    return envUrl || LOCAL_API_URL;
  }

  if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
    return PRODUCTION_API_URL;
  }

  return envUrl;
}

const API_URL = resolveApiUrl();

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
