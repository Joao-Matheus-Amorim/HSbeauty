const API_URL = 'http://localhost:3000';

export async function listarServicos({ ativo } = {}) {
  const params = new URLSearchParams();

  if (typeof ativo === 'boolean') {
    params.set('ativo', String(ativo));
  }

  const query = params.toString();
  const response = await fetch(`${API_URL}/servicos${query ? `?${query}` : ''}`);

  if (!response.ok) {
    throw new Error('Erro ao carregar serviços');
  }

  return response.json();
}

export async function listarAgendamentos() {
  const response = await fetch(`${API_URL}/agendamentos`);

  if (!response.ok) {
    throw new Error('Erro ao carregar agendamentos');
  }

  return response.json();
}

export async function atualizarAgendamento(id, dados) {
  const response = await fetch(`${API_URL}/agendamentos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    throw new Error('Erro ao atualizar agendamento');
  }

  return response.json();
}

export async function excluirAgendamento(id) {
  const response = await fetch(`${API_URL}/agendamentos/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Erro ao excluir agendamento');
  }
}

export async function buscarAgendamentoPorId(id) {
  const response = await fetch(`${API_URL}/agendamentos/${id}`);

  if (!response.ok) {
    throw new Error('Erro ao buscar agendamento');
  }

  return response.json();
}