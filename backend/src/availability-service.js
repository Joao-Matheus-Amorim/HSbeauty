import {
  addMinutes,
  buildDateTime,
  BUSINESS_CLOSE_HOUR,
  BUSINESS_OPEN_HOUR,
  getCurrentWeekRange,
  getHoraFromDate,
  hasConflict,
  isDateInWeek,
  parseDateOnly,
  parseDayBounds,
  SLOT_STEP_MINUTES,
} from './booking-rules.js';

export function buildAvailableSlots(baseDay, servico, ocupados) {
  const inicioExpediente = buildDateTime(baseDay, BUSINESS_OPEN_HOUR, 0);
  const fimExpediente = buildDateTime(baseDay, BUSINESS_CLOSE_HOUR, 0);
  const slotsDisponiveis = [];

  for (
    let cursor = new Date(inicioExpediente);
    addMinutes(cursor, servico.duracao) <= fimExpediente;
    cursor = addMinutes(cursor, SLOT_STEP_MINUTES)
  ) {
    const inicioSlot = new Date(cursor);
    const fimSlot = addMinutes(inicioSlot, servico.duracao);
    if (!hasConflict(inicioSlot, fimSlot, ocupados)) {
      slotsDisponiveis.push({
        horario: getHoraFromDate(inicioSlot),
        inicio: inicioSlot.toISOString(),
        fim: fimSlot.toISOString(),
      });
    }
  }

  return slotsDisponiveis;
}

export async function getDayOccupancy({ prisma, dateString }) {
  const { start: dayStart, end: dayEnd } = parseDayBounds(dateString);
  const [agendamentos, bloqueios] = await Promise.all([
    prisma.agendamento.findMany({
      // Exclui cancelados do calculo de conflitos
      where: { data: { gte: dayStart, lte: dayEnd }, status: { not: 'cancelado' } },
      include: {
        servico: { select: { duracao: true } },
        combo: { include: { itens: { include: { servico: { select: { duracao: true } } } } } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.bloqueioHorario.findMany({
      where: {
        ativo: true,
        AND: [{ dataInicio: { lte: dayEnd } }, { dataFim: { gte: dayStart } }],
      },
      orderBy: { id: 'asc' },
    }),
  ]);

  const ocupados = [
    ...agendamentos.map((a) => {
      const duracao =
        a.servico?.duracao ??
        (a.combo?.itens?.reduce((sum, item) => sum + item.servico.duracao, 0) ?? 60);
      const inicio = new Date(a.data);
      const fim = addMinutes(inicio, duracao);
      return { inicio, fim, tipo: 'agendamento', id: a.id };
    }),
    ...bloqueios.map((b) => ({
      inicio: new Date(b.dataInicio),
      fim: new Date(b.dataFim),
      tipo: 'bloqueio',
      id: b.id,
    })),
  ];

  return { dayStart, dayEnd, agendamentos, bloqueios, ocupados };
}

export async function calculateAvailability({ prisma, dateString, servico, referenceDate = new Date() }) {
  const baseDay = parseDateOnly(dateString);
  const semanaAtual = getCurrentWeekRange(referenceDate);
  const duracaoMinutos = servico.duracao;

  if (!isDateInWeek(baseDay, referenceDate)) {
    return {
      expediente: { inicio: '09:00', fim: '18:00' },
      semanaAtual,
      duracaoServicoMinutos: duracaoMinutos,
      total: 0,
      slotsDisponiveis: [],
      mensagem: 'Agendamentos disponíveis apenas para a semana atual.',
    };
  }

  const { ocupados } = await getDayOccupancy({ prisma, dateString });
  const slotsDisponiveis = buildAvailableSlots(baseDay, servico, ocupados);

  return {
    expediente: { inicio: '09:00', fim: '18:00' },
    semanaAtual,
    duracaoServicoMinutos: duracaoMinutos,
    total: slotsDisponiveis.length,
    slotsDisponiveis,
  };
}
