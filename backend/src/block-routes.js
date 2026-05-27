import express from 'express';
import { logError, sendError } from './http-response.js';

export function createBlockRouter({ prisma, authMiddleware }) {
  const router = express.Router();

  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { inicio, fim, dataInicio, dataFim, motivo } = req.body;
      const rawInicio = dataInicio || inicio;
      const rawFim = dataFim || fim;
      if (!rawInicio || !rawFim) return sendError(res, 400, 'Inicio e fim são obrigatórios');
      const inicioDate = new Date(rawInicio);
      const fimDate = new Date(rawFim);
      if (Number.isNaN(inicioDate.getTime()) || Number.isNaN(fimDate.getTime())) return sendError(res, 400, 'Datas inválidas');
      if (fimDate <= inicioDate) return sendError(res, 400, 'Fim deve ser maior que início');
      const bloqueio = await prisma.bloqueioHorario.create({ data: { dataInicio: inicioDate, dataFim: fimDate, motivo } });
      res.status(201).json({ success: true, bloqueio });
    } catch (error) {
      logError('POST /bloqueios', error, req);
      return sendError(res, 500, 'Erro ao criar bloqueio');
    }
  });

  router.get('/', authMiddleware, async (req, res) => {
    try {
      const bloqueios = await prisma.bloqueioHorario.findMany({ where: { ativo: true }, orderBy: { id: 'asc' } });
      res.json(bloqueios);
    } catch (error) {
      logError('GET /bloqueios', error, req);
      return sendError(res, 500, 'Erro ao carregar bloqueios');
    }
  });

  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');
      const existe = await prisma.bloqueioHorario.findUnique({ where: { id } });
      if (!existe) return sendError(res, 404, 'Bloqueio não encontrado');
      const bloqueio = await prisma.bloqueioHorario.update({ where: { id }, data: { ativo: false } });
      res.json({ mensagem: 'Bloqueio removido', bloqueio });
    } catch (error) {
      logError('DELETE /bloqueios/:id', error, req);
      return sendError(res, 500, 'Erro ao remover bloqueio');
    }
  });

  return router;
}
