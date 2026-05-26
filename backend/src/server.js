import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import adminRouter, {
  setupAdminDashboard,
  setupAdminAgendamentos,
  setupAdminServicos,
  setupAdminHorarios,
} from './admin-routes.js';
import { validateAppointmentUpdatePayload } from './appointment-mutation-rules.js';
import { legacyAdminRouteDeprecation } from './legacy-route-deprecation.js';
import { logError, sendError } from './http-response.js';
import {
  addMinutes,
  buildDateTime,
  BUSINESS_CLOSE_HOUR,
  BUSINESS_OPEN_HOUR,
  formatDateOnly,
  getCurrentWeekRange,
  getHoraFromDate,
  hasConflict,
  isDateInCurrentWeek,
  isWithinBusinessHours,
  parseDateOnly,
  parseDayBounds,
  PUBLIC_BOOKING_INITIAL_STATUS,
  SLOT_STEP_MINUTES,
  validatePublicBookingPayload,
} from './booking-rules.js';

const { PrismaClient } = pkg;

const app = express();
app.use(express.json());

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origem não permitida pelo CORS'));
    },
  })
);

app.use(legacyAdminRouteDeprecation);

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL é obrigatório');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET é obrigatório');

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

// -- Helpers de data --

function buildAvailableSlots(baseDay, servico, ocupados) {
  const inicioExpediente = buildDateTime(baseDay, BUSINESS_OPEN_HOUR, 0);
  const fimExpediente = buildDateTime(baseDay, BUSINESS_CLOSE_HOUR, 0);
  const slotsDisponiveis = [];

  for (
    let cursor = new Date(inicioExpediente);
    addMinutes(cursor, servico.duracao) <= fimExpediente;
    cursor = addMinutes(cursor, SLOT_STEP_MINUTES)
  ) {
    const inicioSlot = new Date(cursor);
    const fimSlot = addMinutes(inicioSlot, servico.duracao);
    if (!hasConflict(inicioSlot, fimSlot, ocupados)) {
      slotsDisponiveis.push({
        horario: getHoraFromDate(inicioSlot),
        inicio: inicioSlot.toISOString(),
        fim: fimSlot.toISOString(),
      });
    }
  }

  return slotsDisponiveis;
}

// -- Helpers de token --

function generateAccessToken(admin) {
  return jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

async function generateRefreshToken(adminId) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  await prisma.refreshToken.create({ data: { token, adminId, expiresAt } });
  return token;
}

// -- Ocupancy helpers --

async function getDayOccupancy(dateString) {
  const { start: dayStart, end: dayEnd } = parseDayBounds(dateString);
  const [agendamentos, bloqueios] = await Promise.all([
    prisma.agendamento.findMany({
      // Exclui cancelados do calculo de conflitos
      where: { data: { gte: dayStart, lte: dayEnd }, status: { not: 'cancelado' } },
      include: { servico: true },
      orderBy: { id: 'asc' },
    }),
    prisma.bloqueioHorario.findMany({
      where: {
        ativo: true,
        AND: [{ dataInicio: { lte: dayEnd } }, { dataFim: { gte: dayStart } }],
      },
      orderBy: { id: 'asc' },
    }),
  ]);

  const ocupados = [
    ...agendamentos.map((a) => {
      const inicio = new Date(a.data);
      const fim = addMinutes(inicio, a.servico.duracao);
      return { inicio, fim, tipo: 'agendamento', id: a.id };
    }),
    ...bloqueios.map((b) => ({
      inicio: new Date(b.dataInicio),
      fim: new Date(b.dataFim),
      tipo: 'bloqueio',
      id: b.id,
    })),
  ];

  return { dayStart, dayEnd, agendamentos, bloqueios, ocupados };
}

async function calculateAvailability(dateString, servico) {
  const baseDay = parseDateOnly(dateString);
  const semanaAtual = getCurrentWeekRange();
  const duracaoMinutos = servico.duracao;

  if (!isDateInCurrentWeek(baseDay)) {
    return {
      expediente: { inicio: '09:00', fim: '18:00' },
      semanaAtual,
      duracaoServicoMinutos: duracaoMinutos,
      total: 0,
      slotsDisponiveis: [],
      mensagem: 'Agendamentos disponíveis apenas para a semana atual.',
    };
  }

  const { ocupados } = await getDayOccupancy(dateString);
  const slotsDisponiveis = buildAvailableSlots(baseDay, servico, ocupados);

  return {
    expediente: { inicio: '09:00', fim: '18:00' },
    semanaAtual,
    duracaoServicoMinutos: duracaoMinutos,
    total: slotsDisponiveis.length,
    slotsDisponiveis,
  };
}

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

app.all('/auth/register', (_req, res) => {
  return sendError(res, 410, 'Registro de admin via HTTP desativado. Use o script CLI backend/scripts/create-admin.js.');
});

app.post('/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return sendError(res, 400, 'Email e senha são obrigatórios');
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || admin.ativo === false) return sendError(res, 401, 'Credenciais inválidas');
    const ok = await bcrypt.compare(senha, admin.senha);
    if (!ok) return sendError(res, 401, 'Credenciais inválidas');
    const accessToken = generateAccessToken(admin);
    const refreshToken = await generateRefreshToken(admin.id);
    res.json({ accessToken, refreshToken, expiresIn: 900, admin: { id: admin.id, email: admin.email } });
  } catch (error) {
    logError('POST /auth/login', error, req);
    return sendError(res, 500, 'Erro ao fazer login');
  }
});

app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 400, 'refreshToken é obrigatório');
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { admin: true } });
    if (!stored || stored.revogado || stored.expiresAt < new Date()) return sendError(res, 401, 'Refresh token inválido ou expirado');
    if (!stored.admin || stored.admin.ativo === false) return sendError(res, 401, 'Usuário inativo');
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revogado: true } });
    const newAccessToken = generateAccessToken(stored.admin);
    const newRefreshToken = await generateRefreshToken(stored.admin.id);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 });
  } catch (error) {
    logError('POST /auth/refresh', error, req);
    return sendError(res, 500, 'Erro ao renovar token');
  }
});

app.post('/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 400, 'refreshToken é obrigatório');
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (stored && !stored.revogado) await prisma.refreshToken.update({ where: { id: stored.id }, data: { revogado: true } });
    res.json({ mensagem: 'Logout realizado com sucesso' });
  } catch (error) {
    logError('POST /auth/logout', error, req);
    return sendError(res, 500, 'Erro ao fazer logout');
  }
});

app.get('/servicos', async (req, res) => {
  try {
    const { ativo } = req.query;
    const where = {};
    if (ativo === 'true') where.ativo = true;
    if (ativo === 'false') where.ativo = false;
    const servicos = await prisma.servico.findMany({ where, orderBy: { id: 'asc' } });
    res.json(servicos);
  } catch (error) {
    logError('GET /servicos', error, req);
    return sendError(res, 500, 'Erro ao buscar serviços');
  }
});

app.get('/servicos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');
    const servico = await prisma.servico.findUnique({ where: { id } });
    if (!servico) return sendError(res, 404, 'Serviço não encontrado');
    res.json(servico);
  } catch (error) {
    logError('GET /servicos/:id', error, req);
    return sendError(res, 500, 'Erro ao buscar serviço');
  }
});

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

app.post('/agendamentos', async (req, res) => {
  try {
    const validation = validatePublicBookingPayload(req.body);
    if (!validation.valid) return sendError(res, validation.status, validation.message);

    const { nomeCliente, telefone, dataAgendamento, servicoIdNumero, observacoes } = validation.data;

    if (!isDateInCurrentWeek(dataAgendamento)) return sendError(res, 400, 'Agendamentos disponíveis apenas para a semana atual');
    const servico = await prisma.servico.findUnique({ where: { id: servicoIdNumero } });
    if (!servico || servico.ativo === false) return sendError(res, 404, 'Serviço não encontrado ou inativo');
    const inicioSlot = new Date(dataAgendamento);
    const fimSlot = addMinutes(inicioSlot, servico.duracao);
    if (!isWithinBusinessHours(inicioSlot, fimSlot)) return sendError(res, 400, 'Horário fora do expediente (09:00–18:00)');
    const dataString = formatDateOnly(dataAgendamento);
    const disponibilidade = await calculateAvailability(dataString, servico);
    const slotDisponivel = disponibilidade.slotsDisponiveis.some((slot) => new Date(slot.inicio).getTime() === inicioSlot.getTime());
    if (!slotDisponivel) return sendError(res, 409, 'Horário indisponível');
    const novoAgendamento = await prisma.agendamento.create({
      data: {
        nomeCliente,
        telefone,
        data: dataAgendamento,
        hora: getHoraFromDate(dataAgendamento),
        servicoId: servicoIdNumero,
        status: PUBLIC_BOOKING_INITIAL_STATUS,
        ...(observacoes ? { observacoes } : {}),
      },
      include: { servico: true },
    });
    res.status(201).json(novoAgendamento);
  } catch (error) {
    logError('POST /agendamentos', error, req);
    return sendError(res, 500, 'Erro ao criar agendamento');
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
    const { ocupados } = await getDayOccupancy(formatDateOnly(inicioSlot));
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
    const disponibilidade = await calculateAvailability(data, servico);
    res.json({ data, servico: { id: servico.id, nome: servico.nome, duracao: servico.duracao }, ...disponibilidade });
  } catch (error) {
    logError('GET /disponibilidade', error, req);
    return sendError(res, 500, 'Erro ao calcular disponibilidade');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
