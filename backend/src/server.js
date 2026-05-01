import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import adminRouter, {
  setupAdminDashboard,
  setupAdminAgendamentos,
  setupAdminServicos,
  setupAdminHorarios,
} from './admin-routes.js';

const { PrismaClient } = pkg;

const app = express();
app.use(express.json());

const SERVICE_DURATION_MINUTES = 150; // 2h30
const BUSINESS_OPEN_HOUR = 9;
const BUSINESS_CLOSE_HOUR = 18;
const SLOT_STEP_MINUTES = 30;

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

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL é obrigatório');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET é obrigatório');

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function buildDateTime(baseDate, hours, minutes = 0) {
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function getHoraFromDate(date) {
  return date.toTimeString().slice(0, 5);
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function parseDateOnly(dateString) {
  if (!dateString || typeof dateString !== 'string') throw new Error('Data inválida');
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) throw new Error('Data inválida');
  return d;
}

function formatDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDayBounds(dateString) {
  const start = parseDateOnly(dateString);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getCurrentWeekBounds() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getCurrentWeekRange() {
  const { start, end } = getCurrentWeekBounds();
  return { inicio: formatDateOnly(start), fim: formatDateOnly(end) };
}

function isDateInCurrentWeek(date) {
  const { start, end } = getCurrentWeekBounds();
  const d = new Date(date);
  return d >= start && d <= end;
}

function isWithinBusinessHours(start, end) {
  const day = new Date(start);
  const open = buildDateTime(day, BUSINESS_OPEN_HOUR, 0);
  const close = buildDateTime(day, BUSINESS_CLOSE_HOUR, 0);
  return start >= open && end <= close;
}

function hasConflict(startA, endA, items) {
  return items.some((item) => overlaps(startA, endA, item.inicio, item.fim));
}

async function getDayOccupancy(dateString) {
  const { start: dayStart, end: dayEnd } = parseDayBounds(dateString);
  const [agendamentos, bloqueios] = await Promise.all([
    prisma.agendamento.findMany({
      where: { data: { gte: dayStart, lte: dayEnd } },
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
      const fim = addMinutes(inicio, SERVICE_DURATION_MINUTES);
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

  if (!isDateInCurrentWeek(baseDay)) {
    return {
      expediente: { inicio: '09:00', fim: '18:00' },
      semanaAtual,
      duracaoServicoMinutos: SERVICE_DURATION_MINUTES,
      total: 0,
      slotsDisponiveis: [],
      mensagem: 'Agendamentos disponíveis apenas para a semana atual.',
    };
  }

  const inicioExpediente = buildDateTime(baseDay, BUSINESS_OPEN_HOUR, 0);
  const fimExpediente = buildDateTime(baseDay, BUSINESS_CLOSE_HOUR, 0);
  const { ocupados } = await getDayOccupancy(dateString);
  const slotsDisponiveis = [];

  for (
    let cursor = new Date(inicioExpediente);
    addMinutes(cursor, SERVICE_DURATION_MINUTES) <= fimExpediente;
    cursor = addMinutes(cursor, SLOT_STEP_MINUTES)
  ) {
    const inicioSlot = new Date(cursor);
    const fimSlot = addMinutes(inicioSlot, SERVICE_DURATION_MINUTES);
    if (!hasConflict(inicioSlot, fimSlot, ocupados)) {
      slotsDisponiveis.push({
        horario: getHoraFromDate(inicioSlot),
        inicio: inicioSlot.toISOString(),
        fim: fimSlot.toISOString(),
      });
    }
  }

  return {
    expediente: { inicio: '09:00', fim: '18:00' },
    semanaAtual,
    duracaoServicoMinutos: SERVICE_DURATION_MINUTES,
    total: slotsDisponiveis.length,
    slotsDisponiveis,
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ erro: 'Token não fornecido' });
  try {
    req.admin = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', mensagem: 'API HSBeauty rodando' });
});

app.post('/auth/register', async (req, res) => {
  if (process.env.ALLOW_ADMIN_REGISTER !== 'true') return res.status(403).json({ erro: 'Registro de admin desativado' });

  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    const existe = await prisma.admin.findUnique({ where: { email } });
    if (existe) return res.status(409).json({ erro: 'Email já cadastrado' });
    const hash = await bcrypt.hash(senha, 10);
    const admin = await prisma.admin.create({ data: { email, senha: hash } });
    res.status(201).json({ id: admin.id, email: admin.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao registrar admin' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || admin.ativo === false) return res.status(401).json({ erro: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(senha, admin.senha);
    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });
    const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

app.get('/servicos', async (req, res) => {
  try {
    const { ativo } = req.query;
    const where = {};
    if (ativo === 'true') where.ativo = true;
    if (ativo === 'false') where.ativo = false;
    const servicos = await prisma.servico.findMany({ where, orderBy: { id: 'asc' } });
    res.json(servicos.map((s) => ({ ...s, duracao: SERVICE_DURATION_MINUTES })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar serviços' });
  }
});

app.get('/servicos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });
    const servico = await prisma.servico.findUnique({ where: { id } });
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });
    res.json({ ...servico, duracao: SERVICE_DURATION_MINUTES });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar serviço' });
  }
});

app.post('/servicos', authMiddleware, async (req, res) => {
  try {
    const { nome, preco, ativo } = req.body;
    if (!nome || typeof nome !== 'string' || !nome.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
    const precoNumero = Number(preco);
    if (Number.isNaN(precoNumero) || precoNumero <= 0) return res.status(400).json({ erro: 'Preço inválido' });
    const novoServico = await prisma.servico.create({
      data: { nome: nome.trim(), preco: precoNumero, duracao: SERVICE_DURATION_MINUTES, ...(typeof ativo === 'boolean' ? { ativo } : {}) },
    });
    res.status(201).json(novoServico);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar serviço' });
  }
});

app.put('/servicos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });
    const servicoExistente = await prisma.servico.findUnique({ where: { id } });
    if (!servicoExistente) return res.status(404).json({ erro: 'Serviço não encontrado' });
    const { nome, preco, ativo } = req.body;
    const data = { duracao: SERVICE_DURATION_MINUTES };
    if (nome !== undefined) {
      if (typeof nome !== 'string' || !nome.trim()) return res.status(400).json({ erro: 'Nome inválido' });
      data.nome = nome.trim();
    }
    if (preco !== undefined) {
      const precoNumero = Number(preco);
      if (Number.isNaN(precoNumero) || precoNumero <= 0) return res.status(400).json({ erro: 'Preço inválido' });
      data.preco = precoNumero;
    }
    if (ativo !== undefined) {
      if (typeof ativo !== 'boolean') return res.status(400).json({ erro: 'Ativo deve ser true ou false' });
      data.ativo = ativo;
    }
    const servicoAtualizado = await prisma.servico.update({ where: { id }, data });
    res.json(servicoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar serviço' });
  }
});

app.delete('/servicos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });
    const servicoExistente = await prisma.servico.findUnique({ where: { id } });
    if (!servicoExistente) return res.status(404).json({ erro: 'Serviço não encontrado' });
    const servicoDesativado = await prisma.servico.update({ where: { id }, data: { ativo: false } });
    res.json({ mensagem: 'Serviço desativado com sucesso', servico: servicoDesativado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao desativar serviço' });
  }
});

app.get('/agendamentos', authMiddleware, async (req, res) => {
  try {
    const agendamentos = await prisma.agendamento.findMany({ orderBy: { id: 'asc' }, include: { servico: true } });
    res.json(agendamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
  }
});

app.get('/agendamentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });
    const agendamento = await prisma.agendamento.findUnique({ where: { id }, include: { servico: true } });
    if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });
    res.json(agendamento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar agendamento' });
  }
});

app.post('/agendamentos', async (req, res) => {
  try {
    const { nomeCliente, telefone, data, servicoId, status } = req.body;
    if (!nomeCliente || typeof nomeCliente !== 'string' || !nomeCliente.trim()) return res.status(400).json({ erro: 'Nome do cliente é obrigatório' });
    if (!telefone || typeof telefone !== 'string' || !telefone.trim()) return res.status(400).json({ erro: 'Telefone é obrigatório' });
    if (!data) return res.status(400).json({ erro: 'Data é obrigatória' });

    const dataAgendamento = new Date(data);
    if (Number.isNaN(dataAgendamento.getTime())) return res.status(400).json({ erro: 'Data inválida' });
    if (!isDateInCurrentWeek(dataAgendamento)) return res.status(400).json({ erro: 'Agendamentos disponíveis apenas para a semana atual' });

    const servicoIdNumero = Number(servicoId);
    if (!Number.isInteger(servicoIdNumero) || servicoIdNumero <= 0) return res.status(400).json({ erro: 'Serviço inválido' });
    const servico = await prisma.servico.findUnique({ where: { id: servicoIdNumero } });
    if (!servico || servico.ativo === false) return res.status(404).json({ erro: 'Serviço não encontrado ou inativo' });

    const inicioSlot = new Date(dataAgendamento);
    const fimSlot = addMinutes(inicioSlot, SERVICE_DURATION_MINUTES);
    if (!isWithinBusinessHours(inicioSlot, fimSlot)) return res.status(400).json({ erro: 'Horário fora do expediente (09:00–18:00)' });

    const dataString = formatDateOnly(dataAgendamento);
    const { ocupados } = await getDayOccupancy(dataString);
    if (hasConflict(inicioSlot, fimSlot, ocupados)) return res.status(409).json({ erro: 'Horário indisponível' });

    const novoAgendamento = await prisma.agendamento.create({
      data: {
        nomeCliente: nomeCliente.trim(),
        telefone: telefone.trim(),
        data: dataAgendamento,
        hora: getHoraFromDate(dataAgendamento),
        servicoId: servicoIdNumero,
        ...(status ? { status } : {}),
      },
      include: { servico: true },
    });
    res.status(201).json(novoAgendamento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

app.put('/agendamentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });
    const agendamentoExistente = await prisma.agendamento.findUnique({ where: { id }, include: { servico: true } });
    if (!agendamentoExistente) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    const { nomeCliente, telefone, data, servicoId, status } = req.body;
    const payload = {};
    if (nomeCliente !== undefined) payload.nomeCliente = String(nomeCliente).trim();
    if (telefone !== undefined) payload.telefone = String(telefone).trim();

    let dataAtual = agendamentoExistente.data;
    if (data !== undefined) {
      const dataAgendamento = new Date(data);
      if (Number.isNaN(dataAgendamento.getTime())) return res.status(400).json({ erro: 'Data inválida' });
      if (!isDateInCurrentWeek(dataAgendamento)) return res.status(400).json({ erro: 'Agendamentos disponíveis apenas para a semana atual' });
      dataAtual = dataAgendamento;
      payload.data = dataAgendamento;
      payload.hora = getHoraFromDate(dataAgendamento);
    }

    if (servicoId !== undefined) {
      const servicoIdNumero = Number(servicoId);
      if (!Number.isInteger(servicoIdNumero) || servicoIdNumero <= 0) return res.status(400).json({ erro: 'Serviço inválido' });
      const servico = await prisma.servico.findUnique({ where: { id: servicoIdNumero } });
      if (!servico || servico.ativo === false) return res.status(404).json({ erro: 'Serviço não encontrado ou inativo' });
      payload.servicoId = servicoIdNumero;
    }

    if (status !== undefined) {
      const statusValidos = ['pendente', 'confirmado', 'cancelado', 'concluído'];
      if (!statusValidos.includes(status)) return res.status(400).json({ erro: 'Status inválido' });
      payload.status = status;
    }

    const inicioSlot = new Date(dataAtual);
    const fimSlot = addMinutes(inicioSlot, SERVICE_DURATION_MINUTES);
    if (!isWithinBusinessHours(inicioSlot, fimSlot)) return res.status(400).json({ erro: 'Horário fora do expediente (09:00–18:00)' });

    const { ocupados } = await getDayOccupancy(formatDateOnly(inicioSlot));
    const ocupadosSemAtual = ocupados.filter((item) => item.tipo !== 'agendamento' || item.id !== agendamentoExistente.id);
    if (hasConflict(inicioSlot, fimSlot, ocupadosSemAtual)) return res.status(409).json({ erro: 'Horário indisponível' });

    const agendamentoAtualizado = await prisma.agendamento.update({ where: { id }, data: payload, include: { servico: true } });
    res.json(agendamentoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar agendamento' });
  }
});

app.delete('/agendamentos/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });
    const existe = await prisma.agendamento.findUnique({ where: { id } });
    if (!existe) return res.status(404).json({ erro: 'Agendamento não encontrado' });
    await prisma.agendamento.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao remover agendamento' });
  }
});

app.post('/bloqueios', authMiddleware, async (req, res) => {
  try {
    const { inicio, fim, dataInicio, dataFim, motivo } = req.body;
    const rawInicio = dataInicio || inicio;
    const rawFim = dataFim || fim;
    if (!rawInicio || !rawFim) return res.status(400).json({ erro: 'Inicio e fim são obrigatórios' });
    const inicioDate = new Date(rawInicio);
    const fimDate = new Date(rawFim);
    if (Number.isNaN(inicioDate.getTime()) || Number.isNaN(fimDate.getTime())) return res.status(400).json({ erro: 'Datas inválidas' });
    if (fimDate <= inicioDate) return res.status(400).json({ erro: 'Fim deve ser maior que início' });
    const bloqueio = await prisma.bloqueioHorario.create({ data: { dataInicio: inicioDate, dataFim: fimDate, motivo } });
    res.status(201).json({ success: true, bloqueio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar bloqueio' });
  }
});

app.get('/bloqueios', authMiddleware, async (req, res) => {
  try {
    const bloqueios = await prisma.bloqueioHorario.findMany({ where: { ativo: true }, orderBy: { id: 'asc' } });
    res.json(bloqueios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao carregar bloqueios' });
  }
});

app.delete('/bloqueios/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido' });
    const existe = await prisma.bloqueioHorario.findUnique({ where: { id } });
    if (!existe) return res.status(404).json({ erro: 'Bloqueio não encontrado' });
    const bloqueio = await prisma.bloqueioHorario.update({ where: { id }, data: { ativo: false } });
    res.json({ mensagem: 'Bloqueio removido', bloqueio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao remover bloqueio' });
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
    if (!data) return res.status(400).json({ erro: 'Informe a data no formato YYYY-MM-DD' });
    if (!servicoId) return res.status(400).json({ erro: 'Informe o servicoId' });

    const servicoIdNumero = Number(servicoId);
    if (!Number.isInteger(servicoIdNumero) || servicoIdNumero <= 0) return res.status(400).json({ erro: 'servicoId inválido' });
    const servico = await prisma.servico.findUnique({ where: { id: servicoIdNumero } });
    if (!servico || servico.ativo === false) return res.status(404).json({ erro: 'Serviço não encontrado ou inativo' });

    const disponibilidade = await calculateAvailability(data, servico);
    res.json({
      data,
      servico: { id: servico.id, nome: servico.nome, duracao: SERVICE_DURATION_MINUTES },
      ...disponibilidade,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao calcular disponibilidade' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
