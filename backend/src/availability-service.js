import {
  addMinutes,
  buildDateTime,
  BUSINESS_CLOSE_HOUR,
  BUSINESS_OPEN_HOUR,
  getCurrentWeekRange,
  getHoraFromDate,
  hasConflict,
  isClosedDay,
  isDateInBookingWindow,
  parseDateOnly,
  parseDayBounds,
  SLOT_STEP_MINUTES,
} from './booking-rules.js';

export function buildAvailableSlots(baseDay, servico, ocupados, now = null, opts = {}) {
  const openHour = opts.aberturaHora ?? BUSINESS_OPEN_HOUR;
  const closeHour = opts.fechamentoHora ?? BUSINESS_CLOSE_HOUR;
  const inicioExpediente = buildDateTime(baseDay, openHour, 0);
  const fimExpediente = buildDateTime(baseDay, closeHour, 0);
  const slotsDisponiveis = [];

  for (
    let cursor = new Date(inicioExpediente);
    addMinutes(cursor, servico.duracao) <= fimExpediente;
    cursor = addMinutes(cursor, SLOT_STEP_MINUTES)
  ) {
    const inicioSlot = new Date(cursor);
    const fimSlot = addMinutes(inicioSlot, servico.duracao);
    if (now && inicioSlot <= now) continue;
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

async function loadBusinessConfig(prisma) {
  try {
    const cfg = await prisma.siteConfig.findUnique({
      where: { id: 1 },
      select: { aberturaHora: true, fechamentoHora: true, diasFechados: true },
    });
    if (!cfg) return { aberturaHora: 9, fechamentoHora: 18, diasFechados: [] };
    return {
      aberturaHora: cfg.aberturaHora ?? 9,
      fechamentoHora: cfg.fechamentoHora ?? 18,
      diasFechados: cfg.diasFechados ?? [],
    };
  } catch {
    return { aberturaHora: 9, fechamentoHora: 18, diasFechados: [] };
  }
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export async function calculateAvailability({ prisma, dateString, servico, referenceDate = new Date() }) {
  const baseDay = parseDateOnly(dateString);
  const semanaAtual = getCurrentWeekRange(referenceDate);
  const duracaoMinutos = servico.duracao;
  const config = await loadBusinessConfig(prisma);
  const expediente = { inicio: `${pad2(config.aberturaHora)}:00`, fim: `${pad2(config.fechamentoHora)}:00` };

  if (!isDateInBookingWindow(baseDay, referenceDate)) {
    return {
      expediente,
      semanaAtual,
      duracaoServicoMinutos: duracaoMinutos,
      total: 0,
      slotsDisponiveis: [],
      mensagem: 'Data fora da janela de agendamento.',
    };
  }

  if (isClosedDay(baseDay, config.diasFechados)) {
    return {
      expediente,
      semanaAtual,
      duracaoServicoMinutos: duracaoMinutos,
      total: 0,
      slotsDisponiveis: [],
      mensagem: 'Fechado neste dia.',
    };
  }

  const { ocupados } = await getDayOccupancy({ prisma, dateString });
  const slotsDisponiveis = buildAvailableSlots(baseDay, servico, ocupados, referenceDate, {
    aberturaHora: config.aberturaHora,
    fechamentoHora: config.fechamentoHora,
  });

  return {
    expediente,
    semanaAtual,
    duracaoServicoMinutos: duracaoMinutos,
    total: slotsDisponiveis.length,
    slotsDisponiveis,
  };
}
