import express from 'express';
import { logError, sendError } from './http-response.js';

export function createPublicCategoriaRouter({ prisma }) {
  const router = express.Router();

  /**
   * GET /categorias
   * Retorna apenas categorias ativas que possuem ao menos um servico ativo.
   * Public — sem auth.
   */
  router.get('/', async (req, res) => {
    try {
      const categorias = await prisma.categoria.findMany({
        where: {
          ativo: true,
          servicos: { some: { ativo: true } },
        },
        orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
        select: {
          id: true,
          nome: true,
          imagemUrl: true,
          ordem: true,
        },
      });
      res.json(categorias);
    } catch (error) {
      logError('GET /categorias', error, req);
      return sendError(res, 500, 'Erro ao buscar categorias');
    }
  });

  return router;
}
