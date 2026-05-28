import express from 'express';
import { buildAdminAppointmentQuery } from './admin-appointment-query-rules.js';
import { validateAdminBookingUpdatePayload } from './admin-booking-rules.js';
import { logError, sendError } from './http-response.js';

export function createAdminAppointmentRouter({ prisma, authMiddleware }) {
  const router = express.Router();

  /**
   * GET /admin/agendamentos
   * Lista todos os agendamentos com filtros opcionais
   */
  router.get('/agendamentos', authMiddleware, async (req, res) => {
    try {
      const query = buildAdminAppointmentQuery(req.query);
      if (!query.valid) return sendError(res, query.status, query.message);

      const [agendamentos, total] = await Promise.all([
        prisma.agendamento.findMany({
          where: query.where,
          include: { servico: true, combo: true },
          orderBy: { data: 'desc' },
          skip: query.skip,
          take: query.limitNum,
        }),
        prisma.agendamento.count({ where: query.where }),
      ]);

      res.json({
        agendamentos,
        paginacao: {
          total,
          pagina: query.pageNum,
          limite: query.limitNum,
          totalPaginas: Math.ceil(total / query.limitNum),
        },
      });
    } catch (error) {
      logError('GET /admin/agendamentos', error, req);
      return sendError(res, 500, 'Erro ao buscar agendamentos');
    }
  });

  /**
   * GET /admin/agendamentos/export
   * Exporta agendamentos filtrados em CSV (máx 1000 registros)
   * Deve ficar antes de /:id para evitar conflito de rota
   */
  router.get('/agendamentos/export', authMiddleware, async (req, res) => {
    try {
      const query = buildAdminAppointmentQuery({ ...req.query, page: 1, limit: 1000 });
      if (!query.valid) return sendError(res, query.status, query.message);

      const agendamentos = await prisma.agendamento.findMany({
        where: query.where,
        include: { servico: true, combo: true },
        orderBy: { data: 'desc' },
        take: 1000,
      });

      const BOM = '﻿';
      const header = 'ID,Cliente,Telefone,Email,Data,Hora,Status,Serviço,Preço (R$)';

      const rows = agendamentos.map((a) => {
        const data = new Date(a.data).toLocaleDateString('pt-BR');
        const nomeServico = a.servico?.nome ?? (a.combo ? `[Combo] ${a.combo.nome}` : '');
        const preco = Number(a.servico?.preco ?? a.combo?.preco ?? 0).toFixed(2);
        const campos = [
          a.id,
          `"${(a.nomeCliente ?? '').replace(/"/g, '""')}"`,
          a.telefone ?? '',
          a.email ?? '',
          data,
          a.hora ?? '',
          a.status,
          `"${nomeServico.replace(/"/g, '""')}"`,
          preco,
        ];
        return campos.join(',');
      });

      const csv = BOM + [header, ...rows].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="agendamentos.csv"');
      res.send(csv);
    } catch (error) {
      logError('GET /admin/agendamentos/export', error, req);
      return sendError(res, 500, 'Erro ao exportar agendamentos');
    }
  });

  /**
   * GET /admin/agendamentos/:id
   * Busca um agendamento específico
   */
  router.get('/agendamentos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const agendamento = await prisma.agendamento.findUnique({
        where: { id },
        include: { servico: true, combo: true },
      });

      if (!agendamento) return sendError(res, 404, 'Agendamento não encontrado');

      res.json(agendamento);
    } catch (error) {
      logError('GET /admin/agendamentos/:id', error, req);
      return sendError(res, 500, 'Erro ao buscar agendamento');
    }
  });

  /**
   * PUT /admin/agendamentos/:id
   * Atualiza um agendamento (status, observações, etc.)
   */
  router.put('/agendamentos/:id', authMiddleware, async (req, res) => {
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
        include: { servico: true, combo: true },
      });

      res.json(agendamentoAtualizado);
    } catch (error) {
      logError('PUT /admin/agendamentos/:id', error, req);
      return sendError(res, 500, 'Erro ao atualizar agendamento');
    }
  });

  /**
   * DELETE /admin/agendamentos/:id
   * Cancela um agendamento
   */
  router.delete('/agendamentos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const agendamento = await prisma.agendamento.findUnique({ where: { id } });
      if (!agendamento) return sendError(res, 404, 'Agendamento não encontrado');

      // Ao invés de deletar, marcamos como cancelado
      const agendamentoAtualizado = await prisma.agendamento.update({
        where: { id },
        data: { status: 'cancelado' },
        include: { servico: true, combo: true },
      });

      res.json({
        mensagem: 'Agendamento cancelado com sucesso',
        agendamento: agendamentoAtualizado,
      });
    } catch (error) {
      logError('DELETE /admin/agendamentos/:id', error, req);
      return sendError(res, 500, 'Erro ao cancelar agendamento');
    }
  });

  return router;
}
