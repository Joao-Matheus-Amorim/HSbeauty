export function buildStatusCount(agendamentos = []) {
  return {
    pendente: agendamentos.filter((agendamento) => agendamento.status === 'pendente').length,
    confirmado: agendamentos.filter((agendamento) => agendamento.status === 'confirmado').length,
    cancelado: agendamentos.filter((agendamento) => agendamento.status === 'cancelado').length,
    concluido: agendamentos.filter((agendamento) => agendamento.status === 'concluído').length,
  };
}

export function calculateRevenue(agendamentos = []) {
  const receita = agendamentos
    .filter((agendamento) => agendamento.status === 'concluído' || agendamento.status === 'confirmado')
    .reduce((total, agendamento) => total + (agendamento.servico?.preco || 0), 0);

  return parseFloat(receita.toFixed(2));
}

export function buildTopServices(agendamentos = [], limit = 5) {
  const servicosPopulares = {};

  agendamentos.forEach((agendamento) => {
    if (agendamento.servico) {
      servicosPopulares[agendamento.servico.nome] = (servicosPopulares[agendamento.servico.nome] || 0) + 1;
    }
  });

  return Object.entries(servicosPopulares)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([nome, quantidade]) => ({ nome, quantidade }));
}

export function buildDashboardSummary({ agendamentosMes = [], agendamentosHoje = [], totalServicos = 0 } = {}) {
  return {
    totalAgendamentos: agendamentosMes.length,
    agendamentosHoje: agendamentosHoje.length,
    receitaMes: calculateRevenue(agendamentosMes),
    totalServicos,
  };
}
