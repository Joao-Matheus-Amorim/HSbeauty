import express from 'express';
import { buildAdminScheduleQuery } from './admin-schedule-query-rules.js';
import {
  validateAdminScheduleCreatePayload,
  validateAdminScheduleUpdatePayload,
} from './admin-schedule-mutation-rules.js';
import {
  validateAdminServiceCreatePayload,
  validateAdminServiceUpdatePayload,
} from './admin-service-mutation-rules.js';
import { buildAdminServiceQuery } from './admin-service-query-rules.js';
import { handlePrismaConflict, logError, sendError } from './http-response.js';

const router = express.Router();

// ─── Admin Serviços ───────────────────────────────────────────────────────────

/**
 * GET /admin/servicos
 * Lista todos os serviços com opção de filtro
 */
export function setupAdminServicos(prisma, authMiddleware) {
  router.get('/servicos', authMiddleware, async (req, res) => {
    try {
      const query = buildAdminServiceQuery(req.query);
      if (!query.valid) return sendError(res, query.status, query.message);

      const [servicos, total] = await Promise.all([
        prisma.servico.findMany({
          where: query.where,
          orderBy: { nome: 'asc' },
          skip: query.skip,
          take: query.limitNum,
        }),
        prisma.servico.count({ where: query.where }),
      ]);

      res.json({
        servicos,
        paginacao: {
          total,
          pagina: query.pageNum,
          limite: query.limitNum,
          totalPaginas: Math.ceil(total / query.limitNum),
        },
      });
    } catch (error) {
      logError('GET /admin/servicos', error, req);
      return sendError(res, 500, 'Erro ao buscar serviços');
    }
  });

  /**
   * GET /admin/servicos/:id
   * Busca um serviço específico
   */
  router.get('/servicos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const servico = await prisma.servico.findUnique({ where: { id } });
      if (!servico) return sendError(res, 404, 'Serviço não encontrado');

      res.json(servico);
    } catch (error) {
      logError('GET /admin/servicos/:id', error, req);
      return sendError(res, 500, 'Erro ao buscar serviço');
    }
  });

  /**
   * POST /admin/servicos
   * Cria um novo serviço
   */
  router.post('/servicos', authMiddleware, async (req, res) => {
    try {
      const validation = validateAdminServiceCreatePayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const novoServico = await prisma.servico.create({
        data: validation.data,
      });

      res.status(201).json(novoServico);
    } catch (error) {
      const conflictResponse = handlePrismaConflict(res, error, 'Serviço com este nome já existe');
      if (conflictResponse) return conflictResponse;
      logError('POST /admin/servicos', error, req);
      return sendError(res, 500, 'Erro ao criar serviço');
    }
  });

  /**
   * PUT /admin/servicos/:id
   * Atualiza um serviço existente
   */
  router.put('/servicos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const servicoExistente = await prisma.servico.findUnique({ where: { id } });
      if (!servicoExistente) return sendError(res, 404, 'Serviço não encontrado');

      const validation = validateAdminServiceUpdatePayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const servicoAtualizado = await prisma.servico.update({
        where: { id },
        data: validation.data,
      });

      res.json(servicoAtualizado);
    } catch (error) {
      const conflictResponse = handlePrismaConflict(res, error, 'Serviço com este nome já existe');
      if (conflictResponse) return conflictResponse;
      logError('PUT /admin/servicos/:id', error, req);
      return sendError(res, 500, 'Erro ao atualizar serviço');
    }
  });

  /**
   * DELETE /admin/servicos/:id
   * Desativa um serviço
   */
  router.delete('/servicos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const servicoExistente = await prisma.servico.findUnique({ where: { id } });
      if (!servicoExistente) return sendError(res, 404, 'Serviço não encontrado');

      const servicoDesativado = await prisma.servico.update({
        where: { id },
        data: { ativo: false },
      });

      res.json({
        mensagem: 'Serviço desativado com sucesso',
        servico: servicoDesativado,
      });
    } catch (error) {
      logError('DELETE /admin/servicos/:id', error, req);
      return sendError(res, 500, 'Erro ao desativar serviço');
    }
  });
}

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
