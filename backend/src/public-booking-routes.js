import express from 'express';
import { calculateAvailability } from './availability-service.js';
import {
  addMinutes,
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
      const servico = await prisma.servico.findUnique({ where: { id: servicoIdNumero } });
      if (!servico || servico.ativo === false) return sendError(res, 404, 'Serviço não encontrado ou inativo');
      const inicioSlot = new Date(dataAgendamento);
      const fimSlot = addMinutes(inicioSlot, servico.duracao);
      if (!isWithinBusinessHours(inicioSlot, fimSlot)) return sendError(res, 400, 'Horário fora do expediente (09:00–18:00)');
      const dataString = formatDateOnly(dataAgendamento);
      const disponibilidade = await calculateAvailability({ prisma, dateString: dataString, servico });
      const slotDisponivel = disponibilidade.slotsDisponiveis.some((slot) => new Date(slot.inicio).getTime() === inicioSlot.getTime());
      if (!slotDisponivel) return sendError(res, 409, 'Horário indisponível');
      const novoAgendamento = await prisma.agendamento.create({
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
      res.status(201).json(novoAgendamento);
    } catch (error) {
      logError('POST /agendamentos', error, req);
      return sendError(res, 500, 'Erro ao criar agendamento');
    }
  });

  return router;
}
