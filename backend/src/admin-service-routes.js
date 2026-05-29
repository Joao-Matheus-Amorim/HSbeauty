import express from 'express';
import {
  validateAdminServiceCreatePayload,
  validateAdminServiceUpdatePayload,
} from './admin-service-mutation-rules.js';
import { buildAdminServiceQuery } from './admin-service-query-rules.js';
import { handlePrismaConflict, logError, sendError } from './http-response.js';

export function createAdminServiceRouter({ prisma, authMiddleware }) {
  const router = express.Router();

  /**
   * GET /admin/servicos
   * Lista todos os serviços com opção de filtro
   */
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
          include: { categoria: { select: { id: true, nome: true, imagemUrl: true } } },
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

      const servico = await prisma.servico.findUnique({
        where: { id },
        include: { categoria: { select: { id: true, nome: true, imagemUrl: true } } },
      });
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
        include: { categoria: { select: { id: true, nome: true, imagemUrl: true } } },
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
        include: { categoria: { select: { id: true, nome: true, imagemUrl: true } } },
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

  return router;
}
