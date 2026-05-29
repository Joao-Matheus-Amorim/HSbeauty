import express from 'express';
import {
  validateAdminCategoriaCreatePayload,
  validateAdminCategoriaUpdatePayload,
} from './admin-categoria-mutation-rules.js';
import { buildAdminCategoriaQuery } from './admin-categoria-query-rules.js';
import { handlePrismaConflict, logError, sendError } from './http-response.js';

export function createAdminCategoriaRouter({ prisma, authMiddleware }) {
  const router = express.Router();

  router.get('/categorias', authMiddleware, async (req, res) => {
    try {
      const query = buildAdminCategoriaQuery(req.query);
      if (!query.valid) return sendError(res, query.status, query.message);

      const [categorias, total] = await Promise.all([
        prisma.categoria.findMany({
          where: query.where,
          orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
          skip: query.skip,
          take: query.limitNum,
          include: { _count: { select: { servicos: true } } },
        }),
        prisma.categoria.count({ where: query.where }),
      ]);

      res.json({
        categorias,
        paginacao: {
          total,
          pagina: query.pageNum,
          limite: query.limitNum,
          totalPaginas: Math.ceil(total / query.limitNum),
        },
      });
    } catch (error) {
      logError('GET /admin/categorias', error, req);
      return sendError(res, 500, 'Erro ao buscar categorias');
    }
  });

  router.get('/categorias/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const categoria = await prisma.categoria.findUnique({
        where: { id },
        include: { _count: { select: { servicos: true } } },
      });
      if (!categoria) return sendError(res, 404, 'Categoria não encontrada');

      res.json(categoria);
    } catch (error) {
      logError('GET /admin/categorias/:id', error, req);
      return sendError(res, 500, 'Erro ao buscar categoria');
    }
  });

  router.post('/categorias', authMiddleware, async (req, res) => {
    try {
      const validation = validateAdminCategoriaCreatePayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const novaCategoria = await prisma.categoria.create({ data: validation.data });
      res.status(201).json(novaCategoria);
    } catch (error) {
      const conflictResponse = handlePrismaConflict(res, error, 'Categoria com este nome já existe');
      if (conflictResponse) return conflictResponse;
      logError('POST /admin/categorias', error, req);
      return sendError(res, 500, 'Erro ao criar categoria');
    }
  });

  router.put('/categorias/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const existente = await prisma.categoria.findUnique({ where: { id } });
      if (!existente) return sendError(res, 404, 'Categoria não encontrada');

      const validation = validateAdminCategoriaUpdatePayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const atualizada = await prisma.categoria.update({
        where: { id },
        data: validation.data,
      });
      res.json(atualizada);
    } catch (error) {
      const conflictResponse = handlePrismaConflict(res, error, 'Categoria com este nome já existe');
      if (conflictResponse) return conflictResponse;
      logError('PUT /admin/categorias/:id', error, req);
      return sendError(res, 500, 'Erro ao atualizar categoria');
    }
  });

  // DELETE faz soft-delete (desativa). Se desejar remover de vez, primeiro
  // mova/exclua os servicos associados; o onDelete SetNull os desvincula.
  router.delete('/categorias/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const existente = await prisma.categoria.findUnique({ where: { id } });
      if (!existente) return sendError(res, 404, 'Categoria não encontrada');

      const desativada = await prisma.categoria.update({
        where: { id },
        data: { ativo: false },
      });
      res.json({ mensagem: 'Categoria desativada com sucesso', categoria: desativada });
    } catch (error) {
      logError('DELETE /admin/categorias/:id', error, req);
      return sendError(res, 500, 'Erro ao desativar categoria');
    }
  });

  return router;
}
