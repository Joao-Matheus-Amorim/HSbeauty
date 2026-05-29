import express from 'express';
import { calculateAvailability } from './availability-service.js';
import {
  addMinutes,
  buildPublicBookingLockKey,
  formatDateOnly,
  getHoraFromDate,
  isClosedDay,
  isDateInCurrentWeek,
  isWithinBusinessHours,
  PUBLIC_BOOKING_INITIAL_STATUS,
  validatePublicBookingPayload,
} from './booking-rules.js';
import { logError, sendError } from './http-response.js';
import { sendAdminBookingNotification, sendBookingConfirmationEmail } from './email-service.js';

export function createPublicBookingRouter({ prisma }) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const validation = validatePublicBookingPayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const { nomeCliente, telefone, dataAgendamento, servicoIdNumero, comboIdNumero, observacoes, email } =
        validation.data;

      if (!isDateInCurrentWeek(dataAgendamento)) return sendError(res, 400, 'Agendamentos disponíveis apenas para a semana atual');

      const result = await prisma.$transaction(async (tx) => {
        const dataString = formatDateOnly(dataAgendamento);
        const lockKey = buildPublicBookingLockKey(dataAgendamento);

        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

        let duracaoMinutos;
        let nomeServico;

        if (servicoIdNumero) {
          const servico = await tx.servico.findUnique({ where: { id: servicoIdNumero } });
          if (!servico || servico.ativo === false) {
            return { erro: { status: 404, message: 'Serviço não encontrado ou inativo' } };
          }
          duracaoMinutos = servico.duracao;
          nomeServico = servico.nome;
        } else {
          const combo = await tx.combo.findUnique({
            where: { id: comboIdNumero },
            include: { itens: { include: { servico: { select: { duracao: true, nome: true } } } } },
          });
          if (!combo || combo.ativo === false) {
            return { erro: { status: 404, message: 'Combo não encontrado ou inativo' } };
          }
          duracaoMinutos = combo.itens.reduce((sum, item) => sum + item.servico.duracao, 0);
          nomeServico = combo.nome;
        }

        const config = await tx.siteConfig.findUnique({
          where: { id: 1 },
          select: { aberturaHora: true, fechamentoHora: true, diasFechados: true },
        });
        const aberturaHora = config?.aberturaHora ?? 9;
        const fechamentoHora = config?.fechamentoHora ?? 18;
        const diasFechados = config?.diasFechados ?? [];

        const inicioSlot = new Date(dataAgendamento);
        const fimSlot = addMinutes(inicioSlot, duracaoMinutos);
        if (isClosedDay(inicioSlot, diasFechados)) {
          return { erro: { status: 400, message: 'Não atendemos neste dia' } };
        }
        if (!isWithinBusinessHours(inicioSlot, fimSlot, aberturaHora, fechamentoHora)) {
          return {
            erro: {
              status: 400,
              message: `Horário fora do expediente (${String(aberturaHora).padStart(2, '0')}:00–${String(fechamentoHora).padStart(2, '0')}:00)`,
            },
          };
        }

        const disponibilidade = await calculateAvailability({
          prisma: tx,
          dateString: dataString,
          servico: { duracao: duracaoMinutos },
        });
        const slotDisponivel = disponibilidade.slotsDisponiveis.some(
          (slot) => new Date(slot.inicio).getTime() === inicioSlot.getTime(),
        );
        if (!slotDisponivel) {
          return { erro: { status: 409, message: 'Horário indisponível' } };
        }

        const agendamento = await tx.agendamento.create({
          data: {
            nomeCliente,
            telefone,
            data: dataAgendamento,
            hora: getHoraFromDate(dataAgendamento),
            ...(servicoIdNumero ? { servicoId: servicoIdNumero } : {}),
            ...(comboIdNumero ? { comboId: comboIdNumero } : {}),
            status: PUBLIC_BOOKING_INITIAL_STATUS,
            ...(observacoes ? { observacoes } : {}),
            ...(email ? { email } : {}),
          },
          include: {
            servico: true,
            combo: { include: { itens: { include: { servico: true } } } },
          },
        });

        return { agendamento, nomeServico };
      });

      if (result.erro) return sendError(res, result.erro.status, result.erro.message);

      const { agendamento, nomeServico } = result;
      res.status(201).json(agendamento);

      sendBookingConfirmationEmail({
        nomeCliente: agendamento.nomeCliente,
        email: agendamento.email,
        servico: nomeServico,
        data: agendamento.data,
        hora: agendamento.hora,
      }).catch((err) => logError('email/booking-confirmation', err, req));

      sendAdminBookingNotification({
        nomeCliente: agendamento.nomeCliente,
        telefone: agendamento.telefone,
        email: agendamento.email,
        servico: nomeServico,
        data: agendamento.data,
        hora: agendamento.hora,
        observacoes: agendamento.observacoes,
      }).catch((err) => logError('email/admin-notification', err, req));
    } catch (error) {
      logError('POST /agendamentos', error, req);
      return sendError(res, 500, 'Erro ao criar agendamento');
    }
  });

  return router;
}
