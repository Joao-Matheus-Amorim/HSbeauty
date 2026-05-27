import express from 'express';
import { calculateAvailability } from './availability-service.js';
import {
  addMinutes,
  buildPublicBookingLockKey,
  formatDateOnly,
  getHoraFromDate,
  isDateInCurrentWeek,
  isWithinBusinessHours,
  PUBLIC_BOOKING_INITIAL_STATUS,
  validatePublicBookingPayload,
} from './booking-rules.js';
import { logError, sendError } from './http-response.js';

export function createPublicBookingRouter({ prisma }) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const validation = validatePublicBookingPayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const { nomeCliente, telefone, dataAgendamento, servicoIdNumero, observacoes } = validation.data;

      if (!isDateInCurrentWeek(dataAgendamento)) return sendError(res, 400, 'Agendamentos disponíveis apenas para a semana atual');

      const result = await prisma.$transaction(async (tx) => {
        const dataString = formatDateOnly(dataAgendamento);
        const lockKey = buildPublicBookingLockKey(dataAgendamento);

        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

        const servico = await tx.servico.findUnique({ where: { id: servicoIdNumero } });
        if (!servico || servico.ativo === false) {
          return { erro: { status: 404, message: 'Serviço não encontrado ou inativo' } };
        }

        const inicioSlot = new Date(dataAgendamento);
        const fimSlot = addMinutes(inicioSlot, servico.duracao);
        if (!isWithinBusinessHours(inicioSlot, fimSlot)) {
          return { erro: { status: 400, message: 'Horário fora do expediente (09:00–18:00)' } };
        }

        const disponibilidade = await calculateAvailability({ prisma: tx, dateString: dataString, servico });
        const slotDisponivel = disponibilidade.slotsDisponiveis.some((slot) => new Date(slot.inicio).getTime() === inicioSlot.getTime());
        if (!slotDisponivel) {
          return { erro: { status: 409, message: 'Horário indisponível' } };
        }

        const agendamento = await tx.agendamento.create({
          data: {
            nomeCliente,
            telefone,
            data: dataAgendamento,
            hora: getHoraFromDate(dataAgendamento),
            servicoId: servicoIdNumero,
            status: PUBLIC_BOOKING_INITIAL_STATUS,
            ...(observacoes ? { observacoes } : {}),
          },
          include: { servico: true },
        });

        return { agendamento };
      });

      if (result.erro) return sendError(res, result.erro.status, result.erro.message);
      res.status(201).json(result.agendamento);
    } catch (error) {
      logError('POST /agendamentos', error, req);
      return sendError(res, 500, 'Erro ao criar agendamento');
    }
  });

  return router;
}
