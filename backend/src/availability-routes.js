import express from 'express';
import { calculateAvailability } from './availability-service.js';
import { logError, sendError } from './http-response.js';

export function createAvailabilityRouter({ prisma }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { data, servicoId, comboId } = req.query;
      if (!data) return sendError(res, 400, 'Informe a data no formato YYYY-MM-DD');
      if (!servicoId && !comboId) return sendError(res, 400, 'Informe servicoId ou comboId');

      let servicoInfo;

      if (servicoId) {
        const id = Number(servicoId);
        if (!Number.isInteger(id) || id <= 0) return sendError(res, 400, 'servicoId inválido');
        const servico = await prisma.servico.findUnique({ where: { id } });
        if (!servico || servico.ativo === false) return sendError(res, 404, 'Serviço não encontrado ou inativo');
        servicoInfo = { id: servico.id, nome: servico.nome, duracao: servico.duracao };
      } else {
        const id = Number(comboId);
        if (!Number.isInteger(id) || id <= 0) return sendError(res, 400, 'comboId inválido');
        const combo = await prisma.combo.findUnique({
          where: { id },
          include: { itens: { include: { servico: { select: { duracao: true } } } } },
        });
        if (!combo || combo.ativo === false) return sendError(res, 404, 'Combo não encontrado ou inativo');
        const duracao = combo.itens.reduce((sum, item) => sum + item.servico.duracao, 0);
        servicoInfo = { id: combo.id, nome: combo.nome, duracao, isCombo: true };
      }

      const disponibilidade = await calculateAvailability({ prisma, dateString: data, servico: servicoInfo });
      res.json({ data, servico: servicoInfo, ...disponibilidade });
    } catch (error) {
      logError('GET /disponibilidade', error, req);
      return sendError(res, 500, 'Erro ao calcular disponibilidade');
    }
  });

  return router;
}
