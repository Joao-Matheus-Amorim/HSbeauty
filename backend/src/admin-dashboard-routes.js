import express from 'express';
import {
  buildDashboardSummary,
  buildStatusCount,
  buildTopServices,
} from './admin-dashboard-rules.js';
import { logError, sendError } from './http-response.js';

export function createAdminDashboardRouter({ prisma, authMiddleware }) {
  const router = express.Router();

  /**
   * GET /admin/dashboard
   * Retorna métricas e dados agregados para o dashboard administrativo
   */
  router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);

      const mesWhere = { data: { gte: inicioMes, lte: fimMes } };
      const hojeWhere = { data: { gte: inicioHoje, lt: fimHoje } };

      // Buscamos apenas o estritamente necessario:
      // - status para statusCount
      // - servico.nome para topServices (rank por contagem)
      // - servico.preco / combo.preco para calculo de receita
      const [agendamentosMes, agendamentosHoje, totalServicos] = await Promise.all([
        prisma.agendamento.findMany({
          where: mesWhere,
          select: {
            status: true,
            servico: { select: { nome: true, preco: true } },
            combo: { select: { nome: true, preco: true } },
          },
        }),
        prisma.agendamento.count({ where: hojeWhere }),
        prisma.servico.count({ where: { ativo: true } }),
      ]);

      res.json({
        periodo: {
          mes: hoje.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
          dataInicio: inicioMes.toISOString(),
          dataFim: fimMes.toISOString(),
        },
        resumo: buildDashboardSummary({ agendamentosMes, agendamentosHoje, totalServicos }),
        statusCount: buildStatusCount(agendamentosMes),
        topServicos: buildTopServices(agendamentosMes),
      });
    } catch (error) {
      logError('GET /admin/dashboard', error, req);
      return sendError(res, 500, 'Erro ao buscar dados do dashboard');
    }
  });

  return router;
}
