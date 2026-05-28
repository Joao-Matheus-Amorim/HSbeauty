import { BOOKING_STATUS, normalizeBookingStatus } from './admin-booking-rules.js';

function hasStatus(agendamento, status) {
  return normalizeBookingStatus(agendamento.status) === status;
}

export function buildStatusCount(agendamentos = []) {
  return {
    pendente: agendamentos.filter((agendamento) => hasStatus(agendamento, BOOKING_STATUS.PENDENTE)).length,
    confirmado: agendamentos.filter((agendamento) => hasStatus(agendamento, BOOKING_STATUS.CONFIRMADO)).length,
    cancelado: agendamentos.filter((agendamento) => hasStatus(agendamento, BOOKING_STATUS.CANCELADO)).length,
    concluido: agendamentos.filter((agendamento) => hasStatus(agendamento, BOOKING_STATUS.CONCLUIDO)).length,
  };
}

export function calculateRevenue(agendamentos = []) {
  const receita = agendamentos
    .filter((agendamento) => {
      const status = normalizeBookingStatus(agendamento.status);
      return status === BOOKING_STATUS.CONCLUIDO || status === BOOKING_STATUS.CONFIRMADO;
    })
    .reduce((total, agendamento) => total + (agendamento.servico?.preco ?? agendamento.combo?.preco ?? 0), 0);

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
