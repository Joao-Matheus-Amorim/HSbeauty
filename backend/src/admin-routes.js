import express from 'express';
import { buildAdminScheduleQuery } from './admin-schedule-query-rules.js';
import {
  validateAdminScheduleCreatePayload,
  validateAdminScheduleUpdatePayload,
} from './admin-schedule-mutation-rules.js';
import { logError, sendError } from './http-response.js';

const router = express.Router();

// ─── Admin Horários (Bloqueios) ───────────────────────────────────────────────

/**
 * GET /admin/horarios
 * Lista todos os bloqueios de horário
 */
export function setupAdminHorarios(prisma, authMiddleware) {
  router.get('/horarios', authMiddleware, async (req, res) => {
    try {
      const query = buildAdminScheduleQuery(req.query);
      if (!query.valid) return sendError(res, query.status, query.message);

      const [horarios, total] = await Promise.all([
        prisma.bloqueioHorario.findMany({
          where: query.where,
          orderBy: { dataInicio: 'desc' },
          skip: query.skip,
          take: query.limitNum,
        }),
        prisma.bloqueioHorario.count({ where: query.where }),
      ]);

      res.json({
        horarios,
        paginacao: {
          total,
          pagina: query.pageNum,
          limite: query.limitNum,
          totalPaginas: Math.ceil(total / query.limitNum),
        },
      });
    } catch (error) {
      logError('GET /admin/horarios', error, req);
      return sendError(res, 500, 'Erro ao buscar horários');
    }
  });

  /**
   * POST /admin/horarios
   * Cria um novo bloqueio de horário
   */
  router.post('/horarios', authMiddleware, async (req, res) => {
    try {
      const validation = validateAdminScheduleCreatePayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const novoBloqueio = await prisma.bloqueioHorario.create({
        data: validation.data,
      });

      res.status(201).json(novoBloqueio);
    } catch (error) {
      logError('POST /admin/horarios', error, req);
      return sendError(res, 500, 'Erro ao criar bloqueio de horário');
    }
  });

  /**
   * PUT /admin/horarios/:id
   * Atualiza um bloqueio de horário
   */
  router.put('/horarios/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const bloqueioExistente = await prisma.bloqueioHorario.findUnique({ where: { id } });
      if (!bloqueioExistente) return sendError(res, 404, 'Bloqueio não encontrado');

      const validation = validateAdminScheduleUpdatePayload(req.body, bloqueioExistente);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const bloqueioAtualizado = await prisma.bloqueioHorario.update({
        where: { id },
        data: validation.data,
      });

      res.json(bloqueioAtualizado);
    } catch (error) {
      logError('PUT /admin/horarios/:id', error, req);
      return sendError(res, 500, 'Erro ao atualizar bloqueio de horário');
    }
  });

  /**
   * DELETE /admin/horarios/:id
   * Desativa um bloqueio de horário
   */
  router.delete('/horarios/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const bloqueioExistente = await prisma.bloqueioHorario.findUnique({ where: { id } });
      if (!bloqueioExistente) return sendError(res, 404, 'Bloqueio não encontrado');

      const bloqueioDesativado = await prisma.bloqueioHorario.update({
        where: { id },
        data: { ativo: false },
      });

      res.json({
        mensagem: 'Bloqueio de horário desativado com sucesso',
        bloqueio: bloqueioDesativado,
      });
    } catch (error) {
      logError('DELETE /admin/horarios/:id', error, req);
      return sendError(res, 500, 'Erro ao desativar bloqueio de horário');
    }
  });
}

export default router;
