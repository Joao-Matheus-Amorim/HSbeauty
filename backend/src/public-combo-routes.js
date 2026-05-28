import express from 'express';
import { logError, sendError } from './http-response.js';

export function createPublicComboRouter({ prisma }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const combos = await prisma.combo.findMany({
        where: { ativo: true },
        include: {
          itens: {
            orderBy: { ordem: 'asc' },
            include: { servico: { select: { id: true, nome: true, duracao: true } } },
          },
        },
        orderBy: { nome: 'asc' },
      });
      res.json(combos);
    } catch (error) {
      logError('GET /combos', error, req);
      return sendError(res, 500, 'Erro ao buscar combos');
    }
  });

  return router;
}
