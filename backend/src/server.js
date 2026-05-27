import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import adminRouter, {
  setupAdminDashboard,
  setupAdminAgendamentos,
  setupAdminServicos,
  setupAdminHorarios,
} from './admin-routes.js';
import { validateAppointmentUpdatePayload } from './appointment-mutation-rules.js';
import { createAuthRouter } from './auth-routes.js';
import { calculateAvailability, getDayOccupancy } from './availability-service.js';
import { buildAllowedOrigins, isOriginAllowed } from './cors-config-rules.js';
import { assertRequiredEnv } from './env-config-rules.js';
import { createPublicBookingRouter } from './public-booking-routes.js';
import { createPublicServiceRouter } from './public-service-routes.js';
import { legacyAdminRouteDeprecation } from './legacy-route-deprecation.js';
import { logError, sendError } from './http-response.js';
import {
  addMinutes,
  formatDateOnly,
  hasConflict,
  isDateInCurrentWeek,
  isWithinBusinessHours,
} from './booking-rules.js';

const { PrismaClient } = pkg;

const app = express();
app.use(express.json());

const allowedOrigins = buildAllowedOrigins(process.env.FRONTEND_URL);

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);
      return callback(new Error('Origem não permitida pelo CORS'));
    },
  })
);

app.use(legacyAdminRouteDeprecation);

assertRequiredEnv(process.env);

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// -- Auth middleware --

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return sendError(res, 401, 'Token não fornecido');
  try {
    req.admin = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return sendError(res, 401, 'Token inválido ou expirado');
  }
}

// -- Rotas --

app.get('/', (req, res) => {
  res.json({ status: 'ok', mensagem: 'API HSBeauty rodando' });
});

app.use('/auth', createAuthRouter({ prisma, jwtSecret: JWT_SECRET }));
app.use('/servicos', createPublicServiceRouter({ prisma }));
app.use('/agendamentos', createPublicBookingRouter({ prisma }));

app.post('/servicos', authMiddleware, async (req, res) => {
  try {
    const { nome, preco, duracao, ativo } = req.body;
    if (!nome || typeof nome !== 'string' || !nome.trim()) return sendError(res, 400, 'Nome é obrigatório');
    const precoNumero = Number(preco);
    if (Number.isNaN(precoNumero) || precoNumero <= 0) return sendError(res, 400, 'Preço inválido');
    const duracaoNumero = Number(duracao);
    if (!Number.isInteger(duracaoNumero) || duracaoNumero <= 0) return sendError(res, 400, 'Duração inválida (em minutos, inteiro positivo)');
    const novoServico = await prisma.servico.create({
      data: { nome: nome.trim(), preco: precoNumero, duracao: duracaoNumero, ...(typeof ativo === 'boolean' ? { ativo } : {}) },
    });
    res.status(201).json(novoServico);
  } catch (error) {
    logError('POST /servicos', error, req);
    return sendError(res, 500, 'Erro ao criar serviço');
  }
});

app.put('/servicos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');
    const servicoExistente = await prisma.servico.findUnique({ where: { id } });
    if (!servicoExistente) return sendError(res, 404, 'Serviço não encontrado');
    const { nome, preco, duracao, ativo } = req.body;
    const data = {};
    if (nome !== undefined) {
      if (typeof nome !== 'string' || !nome.trim()) return sendError(res, 400, 'Nome inválido');
      data.nome = nome.trim();
    }
    if (preco !== undefined) {
      const precoNumero = Number(preco);
      if (Number.isNaN(precoNumero) || precoNumero <= 0) return sendError(res, 400, 'Preço inválido');
      data.preco = precoNumero;
    }
    if (duracao !== undefined) {
      const duracaoNumero = Number(duracao);
      if (!Number.isInteger(duracaoNumero) || duracaoNumero <= 0) return sendError(res, 400, 'Duração inválida (em minutos, inteiro positivo)');
      data.duracao = duracaoNumero;
    }
    if (ativo !== undefined) {
      if (typeof ativo !== 'boolean') return sendError(res, 400, 'Ativo deve ser true ou false');
      data.ativo = ativo;
    }
    const servicoAtualizado = await prisma.servico.update({ where: { id }, data });
    res.json(servicoAtualizado);
  } catch (error) {
    logError('PUT /servicos/:id', error, req);
    return sendError(res, 500, 'Erro ao atualizar serviço');
  }
});

app.delete('/servicos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');
    const servicoExistente = await prisma.servico.findUnique({ where: { id } });
    if (!servicoExistente) return sendError(res, 404, 'Serviço não encontrado');
    const servicoDesativado = await prisma.servico.update({ where: { id }, data: { ativo: false } });
    res.json({ mensagem: 'Serviço desativado com sucesso', servico: servicoDesativado });
  } catch (error) {
    logError('DELETE /servicos/:id', error, req);
    return sendError(res, 500, 'Erro ao desativar serviço');
  }
});

app.get('/agendamentos', authMiddleware, async (req, res) => {
  try {
    const agendamentos = await prisma.agendamento.findMany({ orderBy: { id: 'asc' }, include: { servico: true } });
    res.json(agendamentos);
  } catch (error) {
    logError('GET /agendamentos', error, req);
    return sendError(res, 500, 'Erro ao buscar agendamentos');
  }
});

app.get('/agendamentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');
    const agendamento = await prisma.agendamento.findUnique({ where: { id }, include: { servico: true } });
    if (!agendamento) return sendError(res, 404, 'Agendamento não encontrado');
    res.json(agendamento);
  } catch (error) {
    logError('GET /agendamentos/:id', error, req);
    return sendError(res, 500, 'Erro ao buscar agendamento');
  }
});

app.put('/agendamentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');
    const agendamentoExistente = await prisma.agendamento.findUnique({ where: { id }, include: { servico: true } });
    if (!agendamentoExistente) return sendError(res, 404, 'Agendamento não encontrado');

    const validation = validateAppointmentUpdatePayload(req.body);
    if (!validation.valid) return sendError(res, validation.status, validation.message);

    const payload = { ...validation.data };
    const dataAtual = validation.dataAgendamento ?? agendamentoExistente.data;
    let servicoAtual = agendamentoExistente.servico;

    if (validation.dataAgendamento && !isDateInCurrentWeek(validation.dataAgendamento)) {
      return sendError(res, 400, 'Agendamentos disponíveis apenas para a semana atual');
    }

    if (validation.servicoIdNumero !== undefined) {
      const novoServico = await prisma.servico.findUnique({ where: { id: validation.servicoIdNumero } });
      if (!novoServico || novoServico.ativo === false) return sendError(res, 404, 'Serviço não encontrado ou inativo');
      servicoAtual = novoServico;
      payload.servicoId = validation.servicoIdNumero;
    }

    const inicioSlot = new Date(dataAtual);
    const fimSlot = addMinutes(inicioSlot, servicoAtual.duracao);
    if (!isWithinBusinessHours(inicioSlot, fimSlot)) return sendError(res, 400, 'Horário fora do expediente (09:00–18:00)');
    const { ocupados } = await getDayOccupancy({ prisma, dateString: formatDateOnly(inicioSlot) });
    const ocupadosSemAtual = ocupados.filter((item) => item.tipo !== 'agendamento' || item.id !== agendamentoExistente.id);
    if (hasConflict(inicioSlot, fimSlot, ocupadosSemAtual)) return sendError(res, 409, 'Horário indisponível');
    const agendamentoAtualizado = await prisma.agendamento.update({ where: { id }, data: payload, include: { servico: true } });
    res.json(agendamentoAtualizado);
  } catch (error) {
    logError('PUT /agendamentos/:id', error, req);
    return sendError(res, 500, 'Erro ao atualizar agendamento');
  }
});

// Soft delete: marca como cancelado em vez de apagar do banco
app.delete('/agendamentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');
    const existe = await prisma.agendamento.findUnique({ where: { id } });
    if (!existe) return sendError(res, 404, 'Agendamento não encontrado');
    const agendamento = await prisma.agendamento.update({ where: { id }, data: { status: 'cancelado' }, include: { servico: true } });
    res.json({ mensagem: 'Agendamento cancelado com sucesso', agendamento });
  } catch (error) {
    logError('DELETE /agendamentos/:id', error, req);
    return sendError(res, 500, 'Erro ao cancelar agendamento');
  }
});

app.post('/bloqueios', authMiddleware, async (req, res) => {
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

app.get('/bloqueios', authMiddleware, async (req, res) => {
  try {
    const bloqueios = await prisma.bloqueioHorario.findMany({ where: { ativo: true }, orderBy: { id: 'asc' } });
    res.json(bloqueios);
  } catch (error) {
    logError('GET /bloqueios', error, req);
    return sendError(res, 500, 'Erro ao carregar bloqueios');
  }
});

app.delete('/bloqueios/:id', authMiddleware, async (req, res) => {
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

setupAdminDashboard(prisma, authMiddleware);
setupAdminAgendamentos(prisma, authMiddleware);
setupAdminServicos(prisma, authMiddleware);
setupAdminHorarios(prisma, authMiddleware);
app.use('/admin', adminRouter);

app.get('/disponibilidade', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
