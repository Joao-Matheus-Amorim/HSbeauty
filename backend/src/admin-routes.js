import express from 'express';

const router = express.Router();

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

/**
 * GET /admin/dashboard
 * Retorna métricas e dados agregados para o dashboard administrativo
 */
export function setupAdminDashboard(prisma, authMiddleware) {
  router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      // Buscar agendamentos do mês
      const agendamentosMes = await prisma.agendamento.findMany({
        where: {
          data: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
        include: { servico: true },
      });

      // Buscar agendamentos de hoje
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);

      const agendamentosHoje = await prisma.agendamento.findMany({
        where: {
          data: {
            gte: inicioHoje,
            lt: fimHoje,
          },
        },
        include: { servico: true },
      });

      // Contar agendamentos por status
      const statusCount = {
        pendente: agendamentosMes.filter((a) => a.status === 'pendente').length,
        confirmado: agendamentosMes.filter((a) => a.status === 'confirmado').length,
        cancelado: agendamentosMes.filter((a) => a.status === 'cancelado').length,
        concluido: agendamentosMes.filter((a) => a.status === 'concluído').length,
      };

      // Calcular receita do mês
      const receitaMes = agendamentosMes
        .filter((a) => a.status === 'concluído' || a.status === 'confirmado')
        .reduce((total, a) => total + (a.servico?.preco || 0), 0);

      // Serviços mais populares
      const servicosPopulares = {};
      agendamentosMes.forEach((a) => {
        if (a.servico) {
          servicosPopulares[a.servico.nome] = (servicosPopulares[a.servico.nome] || 0) + 1;
        }
      });

      const topServicos = Object.entries(servicosPopulares)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nome, quantidade]) => ({ nome, quantidade }));

      // Total de serviços
      const totalServicos = await prisma.servico.count({ where: { ativo: true } });

      res.json({
        periodo: {
          mes: hoje.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
          dataInicio: inicioMes.toISOString(),
          dataFim: fimMes.toISOString(),
        },
        resumo: {
          totalAgendamentos: agendamentosMes.length,
          agendamentosHoje: agendamentosHoje.length,
          receitaMes: parseFloat(receitaMes.toFixed(2)),
          totalServicos,
        },
        statusCount,
        topServicos,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao buscar dados do dashboard' });
    }
  });
}

// ─── Admin Agendamentos ───────────────────────────────────────────────────────

/**
 * GET /admin/agendamentos
 * Lista todos os agendamentos com filtros opcionais
 */
export function setupAdminAgendamentos(prisma, authMiddleware) {
  router.get('/agendamentos', authMiddleware, async (req, res) => {
    try {
      const { status, dataInicio, dataFim, servicoId, page = 1, limit = 20 } = req.query;

      const where = {};

      // Filtro por status
      if (status) {
        where.status = status;
      }

      // Filtro por data
      if (dataInicio || dataFim) {
        where.data = {};
        if (dataInicio) {
          where.data.gte = new Date(dataInicio);
        }
        if (dataFim) {
          where.data.lte = new Date(dataFim);
        }
      }

      // Filtro por serviço
      if (servicoId) {
        where.servicoId = Number(servicoId);
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const [agendamentos, total] = await Promise.all([
        prisma.agendamento.findMany({
          where,
          include: { servico: true },
          orderBy: { data: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.agendamento.count({ where }),
      ]);

      res.json({
        agendamentos,
        paginacao: {
          total,
          pagina: pageNum,
          limite: limitNum,
          totalPaginas: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
    }
  });

  /**
   * GET /admin/agendamentos/:id
   * Busca um agendamento específico
   */
  router.get('/agendamentos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });

      const agendamento = await prisma.agendamento.findUnique({
        where: { id },
        include: { servico: true },
      });

      if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });

      res.json(agendamento);
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao buscar agendamento' });
    }
  });

  /**
   * PUT /admin/agendamentos/:id
   * Atualiza um agendamento (status, observações, etc.)
   */
  router.put('/agendamentos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });

      const agendamento = await prisma.agendamento.findUnique({ where: { id } });
      if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });

      const { status, observacoes, nomeCliente, telefone, email } = req.body;
      const data = {};

      if (status !== undefined) {
        const statusValidos = ['pendente', 'confirmado', 'cancelado', 'concluído'];
        if (!statusValidos.includes(status)) {
          return res.status(400).json({ erro: 'Status inválido' });
        }
        data.status = status;
      }

      if (observacoes !== undefined) {
        data.observacoes = observacoes;
      }

      if (nomeCliente !== undefined) {
        if (typeof nomeCliente !== 'string' || !nomeCliente.trim()) {
          return res.status(400).json({ erro: 'Nome do cliente inválido' });
        }
        data.nomeCliente = nomeCliente.trim();
      }

      if (telefone !== undefined) {
        if (typeof telefone !== 'string' || !telefone.trim()) {
          return res.status(400).json({ erro: 'Telefone inválido' });
        }
        data.telefone = telefone.trim();
      }

      if (email !== undefined) {
        data.email = email;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
      }

      const agendamentoAtualizado = await prisma.agendamento.update({
        where: { id },
        data,
        include: { servico: true },
      });

      res.json(agendamentoAtualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao atualizar agendamento' });
    }
  });

  /**
   * DELETE /admin/agendamentos/:id
   * Cancela um agendamento
   */
  router.delete('/agendamentos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });

      const agendamento = await prisma.agendamento.findUnique({ where: { id } });
      if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });

      // Ao invés de deletar, marcamos como cancelado
      const agendamentoAtualizado = await prisma.agendamento.update({
        where: { id },
        data: { status: 'cancelado' },
        include: { servico: true },
      });

      res.json({
        mensagem: 'Agendamento cancelado com sucesso',
        agendamento: agendamentoAtualizado,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao cancelar agendamento' });
    }
  });
}

// ─── Admin Serviços ───────────────────────────────────────────────────────────

/**
 * GET /admin/servicos
 * Lista todos os serviços com opção de filtro
 */
export function setupAdminServicos(prisma, authMiddleware) {
  router.get('/servicos', authMiddleware, async (req, res) => {
    try {
      const { ativo, page = 1, limit = 20 } = req.query;

      const where = {};
      if (ativo === 'true') where.ativo = true;
      if (ativo === 'false') where.ativo = false;

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const [servicos, total] = await Promise.all([
        prisma.servico.findMany({
          where,
          orderBy: { nome: 'asc' },
          skip,
          take: limitNum,
        }),
        prisma.servico.count({ where }),
      ]);

      res.json({
        servicos,
        paginacao: {
          total,
          pagina: pageNum,
          limite: limitNum,
          totalPaginas: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao buscar serviços' });
    }
  });

  /**
   * GET /admin/servicos/:id
   * Busca um serviço específico
   */
  router.get('/servicos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });

      const servico = await prisma.servico.findUnique({ where: { id } });
      if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });

      res.json(servico);
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao buscar serviço' });
    }
  });

  /**
   * POST /admin/servicos
   * Cria um novo serviço
   */
  router.post('/servicos', authMiddleware, async (req, res) => {
    try {
      const { nome, descricao, preco, duracao, categoria, ativo } = req.body;

      // Validações
      if (!nome || typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).json({ erro: 'Nome é obrigatório' });
      }

      const precoNumero = Number(preco);
      if (Number.isNaN(precoNumero) || precoNumero <= 0) {
        return res.status(400).json({ erro: 'Preço inválido' });
      }

      const duracaoNumero = Number(duracao);
      if (!Number.isInteger(duracaoNumero) || duracaoNumero <= 0) {
        return res.status(400).json({ erro: 'Duração inválida' });
      }

      const novoServico = await prisma.servico.create({
        data: {
          nome: nome.trim(),
          descricao: descricao || null,
          preco: precoNumero,
          duracao: duracaoNumero,
          categoria: categoria || null,
          ativo: typeof ativo === 'boolean' ? ativo : true,
        },
      });

      res.status(201).json(novoServico);
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002') {
        return res.status(409).json({ erro: 'Serviço com este nome já existe' });
      }
      res.status(500).json({ erro: 'Erro ao criar serviço' });
    }
  });

  /**
   * PUT /admin/servicos/:id
   * Atualiza um serviço existente
   */
  router.put('/servicos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });

      const servicoExistente = await prisma.servico.findUnique({ where: { id } });
      if (!servicoExistente) return res.status(404).json({ erro: 'Serviço não encontrado' });

      const { nome, descricao, preco, duracao, categoria, ativo } = req.body;
      const data = {};

      if (nome !== undefined) {
        if (typeof nome !== 'string' || !nome.trim()) {
          return res.status(400).json({ erro: 'Nome inválido' });
        }
        data.nome = nome.trim();
      }

      if (descricao !== undefined) {
        data.descricao = descricao;
      }

      if (preco !== undefined) {
        const precoNumero = Number(preco);
        if (Number.isNaN(precoNumero) || precoNumero <= 0) {
          return res.status(400).json({ erro: 'Preço inválido' });
        }
        data.preco = precoNumero;
      }

      if (duracao !== undefined) {
        const duracaoNumero = Number(duracao);
        if (!Number.isInteger(duracaoNumero) || duracaoNumero <= 0) {
          return res.status(400).json({ erro: 'Duração inválida' });
        }
        data.duracao = duracaoNumero;
      }

      if (categoria !== undefined) {
        data.categoria = categoria;
      }

      if (ativo !== undefined) {
        if (typeof ativo !== 'boolean') {
          return res.status(400).json({ erro: 'Ativo deve ser true ou false' });
        }
        data.ativo = ativo;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
      }

      const servicoAtualizado = await prisma.servico.update({
        where: { id },
        data,
      });

      res.json(servicoAtualizado);
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002') {
        return res.status(409).json({ erro: 'Serviço com este nome já existe' });
      }
      res.status(500).json({ erro: 'Erro ao atualizar serviço' });
    }
  });

  /**
   * DELETE /admin/servicos/:id
   * Desativa um serviço
   */
  router.delete('/servicos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });

      const servicoExistente = await prisma.servico.findUnique({ where: { id } });
      if (!servicoExistente) return res.status(404).json({ erro: 'Serviço não encontrado' });

      const servicoDesativado = await prisma.servico.update({
        where: { id },
        data: { ativo: false },
      });

      res.json({
        mensagem: 'Serviço desativado com sucesso',
        servico: servicoDesativado,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao desativar serviço' });
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
      const { ativo = 'true', page = 1, limit = 20 } = req.query;

      const where = {};
      if (ativo === 'true') where.ativo = true;
      if (ativo === 'false') where.ativo = false;

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const [horarios, total] = await Promise.all([
        prisma.bloqueioHorario.findMany({
          where,
          orderBy: { dataInicio: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.bloqueioHorario.count({ where }),
      ]);

      res.json({
        horarios,
        paginacao: {
          total,
          pagina: pageNum,
          limite: limitNum,
          totalPaginas: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao buscar horários' });
    }
  });

  /**
   * POST /admin/horarios
   * Cria um novo bloqueio de horário
   */
  router.post('/horarios', authMiddleware, async (req, res) => {
    try {
      const { dataInicio, dataFim, horaInicio, horaFim, motivo } = req.body;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({ erro: 'Data de início e fim são obrigatórias' });
      }

      const dataInicioDate = new Date(dataInicio);
      const dataFimDate = new Date(dataFim);

      if (Number.isNaN(dataInicioDate.getTime()) || Number.isNaN(dataFimDate.getTime())) {
        return res.status(400).json({ erro: 'Datas inválidas' });
      }

      if (dataFimDate <= dataInicioDate) {
        return res.status(400).json({ erro: 'Data de fim deve ser posterior à data de início' });
      }

      const novoBloqueio = await prisma.bloqueioHorario.create({
        data: {
          dataInicio: dataInicioDate,
          dataFim: dataFimDate,
          horaInicio: horaInicio || null,
          horaFim: horaFim || null,
          motivo: motivo || null,
        },
      });

      res.status(201).json(novoBloqueio);
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao criar bloqueio de horário' });
    }
  });

  /**
   * PUT /admin/horarios/:id
   * Atualiza um bloqueio de horário
   */
  router.put('/horarios/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });

      const bloqueioExistente = await prisma.bloqueioHorario.findUnique({ where: { id } });
      if (!bloqueioExistente) return res.status(404).json({ erro: 'Bloqueio não encontrado' });

      const { dataInicio, dataFim, horaInicio, horaFim, motivo, ativo } = req.body;
      const data = {};

      if (dataInicio !== undefined) {
        const dataInicioDate = new Date(dataInicio);
        if (Number.isNaN(dataInicioDate.getTime())) {
          return res.status(400).json({ erro: 'Data de início inválida' });
        }
        data.dataInicio = dataInicioDate;
      }

      if (dataFim !== undefined) {
        const dataFimDate = new Date(dataFim);
        if (Number.isNaN(dataFimDate.getTime())) {
          return res.status(400).json({ erro: 'Data de fim inválida' });
        }
        data.dataFim = dataFimDate;
      }

      if (horaInicio !== undefined) {
        data.horaInicio = horaInicio;
      }

      if (horaFim !== undefined) {
        data.horaFim = horaFim;
      }

      if (motivo !== undefined) {
        data.motivo = motivo;
      }

      if (ativo !== undefined) {
        if (typeof ativo !== 'boolean') {
          return res.status(400).json({ erro: 'Ativo deve ser true ou false' });
        }
        data.ativo = ativo;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
      }

      const bloqueioAtualizado = await prisma.bloqueioHorario.update({
        where: { id },
        data,
      });

      res.json(bloqueioAtualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao atualizar bloqueio de horário' });
    }
  });

  /**
   * DELETE /admin/horarios/:id
   * Desativa um bloqueio de horário
   */
  router.delete('/horarios/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });

      const bloqueioExistente = await prisma.bloqueioHorario.findUnique({ where: { id } });
      if (!bloqueioExistente) return res.status(404).json({ erro: 'Bloqueio não encontrado' });

      const bloqueioDesativado = await prisma.bloqueioHorario.update({
        where: { id },
        data: { ativo: false },
      });

      res.json({
        mensagem: 'Bloqueio de horário desativado com sucesso',
        bloqueio: bloqueioDesativado,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao desativar bloqueio de horário' });
    }
  });
}

export default router;
