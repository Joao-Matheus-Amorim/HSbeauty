import express from 'express';
import { validateAppointmentUpdatePayload } from './appointment-mutation-rules.js';
import { getDayOccupancy } from './availability-service.js';
import {
  addMinutes,
  formatDateOnly,
  hasConflict,
  isDateInCurrentWeek,
  isWithinBusinessHours,
} from './booking-rules.js';
import { logError, sendError } from './http-response.js';

export function createProtectedAppointmentRouter({ prisma, authMiddleware }) {
  const router = express.Router();

  router.get('/', authMiddleware, async (req, res) => {
    try {
      const agendamentos = await prisma.agendamento.findMany({
        orderBy: { id: 'asc' },
        include: { servico: true },
      });

      res.json(agendamentos);
    } catch (error) {
      logError('GET /agendamentos', error, req);
      return sendError(res, 500, 'Erro ao buscar agendamentos');
    }
  });

  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const agendamento = await prisma.agendamento.findUnique({
        where: { id },
        include: { servico: true },
      });

      if (!agendamento) return sendError(res, 404, 'Agendamento não encontrado');

      res.json(agendamento);
    } catch (error) {
      logError('GET /agendamentos/:id', error, req);
      return sendError(res, 500, 'Erro ao buscar agendamento');
    }
  });

  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const agendamentoExistente = await prisma.agendamento.findUnique({
        where: { id },
        include: { servico: true },
      });

      if (!agendamentoExistente) return sendError(res, 404, 'Agendamento não encontrado');

      const validation = validateAppointmentUpdatePayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const payload = { ...validation.data };
      const dataAtual = validation.dataAgendamento ?? agendamentoExistente.data;
      let servicoAtual = agendamentoExistente.servico;

      if (validation.dataAgendamento && !isDateInCurrentWeek(validation.dataAgendamento)) {
        return sendError(res, 400, 'Agendamentos disponíveis apenas para a semana atual');
      }

      if (validation.servicoIdNumero !== undefined) {
        const novoServico = await prisma.servico.findUnique({
          where: { id: validation.servicoIdNumero },
        });

        if (!novoServico || novoServico.ativo === false) {
          return sendError(res, 404, 'Serviço não encontrado ou inativo');
        }

        servicoAtual = novoServico;
        payload.servicoId = validation.servicoIdNumero;
      }

      const inicioSlot = new Date(dataAtual);
      const fimSlot = addMinutes(inicioSlot, servicoAtual.duracao);

      if (!isWithinBusinessHours(inicioSlot, fimSlot)) {
        return sendError(res, 400, 'Horário fora do expediente (09:00–18:00)');
      }

      const { ocupados } = await getDayOccupancy({
        prisma,
        dateString: formatDateOnly(inicioSlot),
      });

      const ocupadosSemAtual = ocupados.filter(
        (item) => item.tipo !== 'agendamento' || item.id !== agendamentoExistente.id,
      );

      if (hasConflict(inicioSlot, fimSlot, ocupadosSemAtual)) {
        return sendError(res, 409, 'Horário indisponível');
      }

      const agendamentoAtualizado = await prisma.agendamento.update({
        where: { id },
        data: payload,
        include: { servico: true },
      });

      res.json(agendamentoAtualizado);
    } catch (error) {
      logError('PUT /agendamentos/:id', error, req);
      return sendError(res, 500, 'Erro ao atualizar agendamento');
    }
  });

  // Soft delete: marca como cancelado em vez de apagar do banco
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const existe = await prisma.agendamento.findUnique({ where: { id } });
      if (!existe) return sendError(res, 404, 'Agendamento não encontrado');

      const agendamento = await prisma.agendamento.update({
        where: { id },
        data: { status: 'cancelado' },
        include: { servico: true },
      });

      res.json({ mensagem: 'Agendamento cancelado com sucesso', agendamento });
    } catch (error) {
      logError('DELETE /agendamentos/:id', error, req);
      return sendError(res, 500, 'Erro ao cancelar agendamento');
    }
  });

  return router;
}
