import { validateAdminBookingUpdatePayload } from './admin-booking-rules.js';
import { logError, sendError } from './http-response.js';

export function setupValidatedAdminBookingUpdate(app, prisma, authMiddleware) {
  app.put('/admin/agendamentos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const agendamento = await prisma.agendamento.findUnique({ where: { id } });
      if (!agendamento) return sendError(res, 404, 'Agendamento não encontrado');

      const validation = validateAdminBookingUpdatePayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const agendamentoAtualizado = await prisma.agendamento.update({
        where: { id },
        data: validation.data,
        include: { servico: true },
      });

      return res.json(agendamentoAtualizado);
    } catch (error) {
      logError('PUT /admin/agendamentos/:id', error, req);
      return sendError(res, 500, 'Erro ao atualizar agendamento');
    }
  });
}
