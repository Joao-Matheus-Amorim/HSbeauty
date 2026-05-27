import express from 'express';
import { calculateAvailability } from './availability-service.js';
import { logError, sendError } from './http-response.js';

export function createAvailabilityRouter({ prisma }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { data, servicoId } = req.query;
      if (!data) return sendError(res, 400, 'Informe a data no formato YYYY-MM-DD');
      if (!servicoId) return sendError(res, 400, 'Informe o servicoId');
      const servicoIdNumero = Number(servicoId);
      if (!Number.isInteger(servicoIdNumero) || servicoIdNumero <= 0) return sendError(res, 400, 'servicoId inválido');
      const servico = await prisma.servico.findUnique({ where: { id: servicoIdNumero } });
      if (!servico || servico.ativo === false) return sendError(res, 404, 'Serviço não encontrado ou inativo');
      const disponibilidade = await calculateAvailability({ prisma, dateString: data, servico });
      res.json({ data, servico: { id: servico.id, nome: servico.nome, duracao: servico.duracao }, ...disponibilidade });
    } catch (error) {
      logError('GET /disponibilidade', error, req);
      return sendError(res, 500, 'Erro ao calcular disponibilidade');
    }
  });

  return router;
}
