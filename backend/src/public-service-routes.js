import express from 'express';
import { logError, sendError } from './http-response.js';
import { buildPublicServiceByIdQuery, buildPublicServiceQuery } from './public-service-query-rules.js';

export function createPublicServiceRouter({ prisma }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const query = buildPublicServiceQuery(req.query);
      if (!query.valid) return sendError(res, query.status, query.message);

      const servicos = await prisma.servico.findMany({
        where: { ...query.where, categoria: { ativo: true } },
        orderBy: { id: 'asc' },
        include: { categoria: { select: { id: true, nome: true, imagemUrl: true, ordem: true } } },
      });
      res.json(servicos);
    } catch (error) {
      logError('GET /servicos', error, req);
      return sendError(res, 500, 'Erro ao buscar serviços');
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const query = buildPublicServiceByIdQuery(req.params.id);
      if (!query.valid) return sendError(res, query.status, query.message);

      const servico = await prisma.servico.findFirst({
        where: { ...query.where, categoria: { ativo: true } },
        include: { categoria: { select: { id: true, nome: true, imagemUrl: true, ordem: true } } },
      });
      if (!servico) return sendError(res, 404, 'Serviço não encontrado');
      res.json(servico);
    } catch (error) {
      logError('GET /servicos/:id', error, req);
      return sendError(res, 500, 'Erro ao buscar serviço');
    }
  });

  return router;
}
