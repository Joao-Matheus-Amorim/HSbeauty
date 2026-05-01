import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const { PrismaClient } = pkg;

// JWT_SECRET é obrigatório — não há fallback inseguro
if (!process.env.JWT_SECRET) {
  console.error('ERRO: A variável de ambiente JWT_SECRET não está definida. Defina-a antes de iniciar o servidor.');
  process.exit(1);
}

const app = express();
app.use(express.json());

// CORS restritivo: usa CORS_ORIGIN do .env; em dev aceita localhost:5173
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite chamadas sem origin (ex: Postman, curl, mobile)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origem não permitida — ${origin}`));
    },
    credentials: true,
  })
);

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function buildDateTime(baseDate, hours, minutes) {
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
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

function parseDayBounds(dateString) {
  if (!dateString || typeof dateString !== 'string')
    throw new Error('Data inválida para parseDayBounds');
  const start = new Date(`${dateString}T00:00:00`);
  const end = new Date(`${dateString}T23:59:59.999`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    throw new Error('Data gerou Invalid Date');
  return { start, end };
}

function isWithinBusinessHours(start, end) {
  const day = new Date(start);
  const open = buildDateTime(day, 9, 0);
  const close = buildDateTime(day, 19, 0);
  return start >= open && end <= close;
}

function hasConflict(startA, endA, items) {
  return items.some((item) => overlaps(startA, endA, item.inicio, item.fim));
}

async function getDayOccupancy(dateString, fallbackDuracao) {
  const { start: dayStart, end: dayEnd } = parseDayBounds(dateString);
  const [agendamentos, bloqueios] = await Promise.all([
    prisma.agendamento.findMany({
      where: { data: { gte: dayStart, lte: dayEnd } },
      include: { servico: true },
      orderBy: { id: 'asc' },
    }),
    prisma.bloqueioHorario.findMany({
      where: { ativo: true, AND: [{ inicio: { lte: dayEnd } }, { fim: { gte: dayStart } }] },
      orderBy: { id: 'asc' },
    }),
  ]);
  const ocupados = [
    ...agendamentos.map((a) => {
      const duracao = a.servico?.duracao ?? fallbackDuracao;
      const inicio = new Date(a.data);
      const fim = addMinutes(inicio, duracao);
      return { inicio, fim, tipo: 'agendamento', id: a.id };
    }),
    ...bloqueios.map((b) => ({
      inicio: new Date(b.inicio),
      fim: new Date(b.fim),
      tipo: 'bloqueio',
      id: b.id,
    })),
  ];
  return { dayStart, dayEnd, agendamentos, bloqueios, ocupados };
}

async function calculateAvailability(dateString, servico) {
  const duracaoServico = Number(servico.duracao);
  const passo = 15;
  const baseDay = parseDateOnly(dateString);
  const inicioExpediente = buildDateTime(baseDay, 9, 0);
  const fimExpediente = buildDateTime(baseDay, 19, 0);
  const { ocupados } = await getDayOccupancy(dateString, duracaoServico);
  const slotsDisponiveis = [];
  for (
    let cursor = new Date(inicioExpediente);
    addMinutes(cursor, duracaoServico) <= fimExpediente;
    cursor = addMinutes(cursor, passo)
  ) {
    const inicioSlot = new Date(cursor);
    const fimSlot = addMinutes(inicioSlot, duracaoServico);
    if (!hasConflict(inicioSlot, fimSlot, ocupados)) {
      slotsDisponiveis.push({
        horario: inicioSlot.toTimeString().slice(0, 5),
        inicio: inicioSlot.toISOString(),
        fim: fimSlot.toISOString(),
      });
    }
  }
  return { expediente: { inicio: '09:00', fim: '19:00' }, total: slotsDisponiveis.length, slotsDisponiveis };
}

// ─── Auth middleware ───────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }
  try {
    const token = header.split(' ')[1];
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 'ok', mensagem: 'API HSBeauty rodando' });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/auth/register', async (req, res) => {
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
    if (!admin) return res.status(401).json({ erro: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(senha, admin.senha);
    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });
    const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// ─── Serviços ─────────────────────────────────────────────────────────────────

app.get('/servicos', async (req, res) => {
  try {
    const { ativo } = req.query;
    const where = {};
    if (ativo === 'true') where.ativo = true;
    if (ativo === 'false') where.ativo = false;
    const servicos = await prisma.servico.findMany({ where, orderBy: { id: 'asc' } });
    res.json(servicos);
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
    res.json(servico);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar serviço' });
  }
});

app.post('/servicos', authMiddleware, async (req, res) => {
  try {
    const { nome, preco, duracao, ativo } = req.body;
    if (!nome || typeof nome !== 'string' || !nome.trim())
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    const precoNumero = Number(preco);
    if (Number.isNaN(precoNumero) || precoNumero <= 0)
      return res.status(400).json({ erro: 'Preço inválido' });
    const duracaoNumero = Number(duracao);
    if (!Number.isInteger(duracaoNumero) || duracaoNumero <= 0)
      return res.status(400).json({ erro: 'Duração inválida' });
    const novoServico = await prisma.servico.create({
      data: { nome: nome.trim(), preco: precoNumero, duracao: duracaoNumero, ...(typeof ativo === 'boolean' ? { ativo } : {}) },
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
    const { nome, preco, duracao, ativo } = req.body;
    const data = {};
    if (nome !== undefined) {
      if (typeof nome !== 'string' || !nome.trim()) return res.status(400).json({ erro: 'Nome inválido' });
      data.nome = nome.trim();
    }
    if (preco !== undefined) {
      const precoNumero = Number(preco);
      if (Number.isNaN(precoNumero) || precoNumero <= 0) return res.status(400).json({ erro: 'Preço inválido' });
      data.preco = precoNumero;
    }
    if (duracao !== undefined) {
      const duracaoNumero = Number(duracao);
      if (!Number.isInteger(duracaoNumero) || duracaoNumero <= 0) return res.status(400).json({ erro: 'Duração inválida' });
      data.duracao = duracaoNumero;
    }
    if (ativo !== undefined) {
      if (typeof ativo !== 'boolean') return res.status(400).json({ erro: 'Ativo deve ser true ou false' });
      data.ativo = ativo;
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ erro: 'Nenhum campo enviado' });
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

// ─── Agendamentos ─────────────────────────────────────────────────────────────

// Suporte a paginação via ?page=1&limit=50
app.get('/agendamentos', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [agendamentos, total] = await Promise.all([
      prisma.agendamento.findMany({
        orderBy: { data: 'desc' },
        include: { servico: true },
        skip,
        take: limit,
      }),
      prisma.agendamento.count(),
    ]);

    res.json({
      data: agendamentos,
      paginacao: {
        total,
        pagina: page,
        limite: limit,
        totalPaginas: Math.ceil(total / limit),
      },
    });
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
    if (!nomeCliente || typeof nomeCliente !== 'string' || !nomeCliente.trim())
      return res.status(400).json({ erro: 'Nome do cliente é obrigatório' });
    if (!telefone || typeof telefone !== 'string' || !telefone.trim())
      return res.status(400).json({ erro: 'Telefone é obrigatório' });
    if (!data) return res.status(400).json({ erro: 'Data é obrigatória' });
    const dataAgendamento = new Date(data);
    if (Number.isNaN(dataAgendamento.getTime())) return res.status(400).json({ erro: 'Data inválida' });
    const servicoIdNumero = Number(servicoId);
    if (!Number.isInteger(servicoIdNumero) || servicoIdNumero <= 0)
      return res.status(400).json({ erro: 'Serviço inválido' });
    const servico = await prisma.servico.findUnique({ where: { id: servicoIdNumero } });
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });
    if (!servico.ativo) return res.status(400).json({ erro: 'Este serviço não está disponível no momento' });
    const inicioSlot = new Date(dataAgendamento);
    const fimSlot = addMinutes(inicioSlot, Number(servico.duracao));
    if (!isWithinBusinessHours(inicioSlot, fimSlot))
      return res.status(400).json({ erro: 'Horário fora do expediente (09:00–19:00)' });
    const dataString = dataAgendamento.toISOString().slice(0, 10);
    const { ocupados } = await getDayOccupancy(dataString, servico.duracao);
    const conflito = ocupados.some((item) => overlaps(inicioSlot, fimSlot, item.inicio, item.fim));
    if (conflito) return res.status(409).json({ erro: 'Este horário não está mais disponível. Por favor, escolha outro.' });
    const novoAgendamento = await prisma.agendamento.create({
      data: {
        nomeCliente: nomeCliente.trim(),
        telefone: telefone.trim(),
        data: dataAgendamento,
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
    if (nomeCliente !== undefined) {
      if (typeof nomeCliente !== 'string' || !nomeCliente.trim())
        return res.status(400).json({ erro: 'Nome do cliente inválido' });
      payload.nomeCliente = nomeCliente.trim();
    }
    if (telefone !== undefined) {
      if (typeof telefone !== 'string' || !telefone.trim())
        return res.status(400).json({ erro: 'Telefone inválido' });
      payload.telefone = telefone.trim();
    }
    let dataAtual = agendamentoExistente.data;
    let servicoAtual = agendamentoExistente.servico;
    if (data !== undefined) {
      const dataAgendamento = new Date(data);
      if (Number.isNaN(dataAgendamento.getTime())) return res.status(400).json({ erro: 'Data inválida' });
      dataAtual = dataAgendamento;
      payload.data = dataAgendamento;
    }
    if (servicoId !== undefined) {
      const servicoIdNumero = Number(servicoId);
      if (!Number.isInteger(servicoIdNumero) || servicoIdNumero <= 0)
        return res.status(400).json({ erro: 'Serviço inválido' });
      const servico = await prisma.servico.findUnique({ where: { id: servicoIdNumero } });
      if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });
      servicoAtual = servico;
      payload.servicoId = servicoIdNumero;
    }
    if (status !== undefined) {
      if (typeof status !== 'string' || !status.trim()) return res.status(400).json({ erro: 'Status inválido' });
      payload.status = status.trim();
    }
    const inicioSlot = new Date(dataAtual);
    const fimSlot = addMinutes(inicioSlot, Number(servicoAtual.duracao));
    if (!isWithinBusinessHours(inicioSlot, fimSlot))
      return res.status(400).json({ erro: 'Horário fora do expediente' });
    const dataDisponibilidade = inicioSlot.toISOString().slice(0, 10);
    const { ocupados } = await getDayOccupancy(dataDisponibilidade, Number(servicoAtual.duracao));
    const ocupadosSemAtual = ocupados.filter((item) => item.tipo !== 'agendamento' || item.id !== agendamentoExistente.id);
    if (hasConflict(inicioSlot, fimSlot, ocupadosSemAtual))
      return res.status(409).json({ erro: 'Horário indisponível' });
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

// ─── Bloqueios ─────────────────────────────────────────────────────────────────

app.post('/bloqueios', authMiddleware, async (req, res) => {
  try {
    const { inicio, fim, motivo } = req.body;
    if (!inicio || !fim) return res.status(400).json({ erro: 'Inicio e fim são obrigatórios' });
    const inicioDate = new Date(inicio);
    const fimDate = new Date(fim);
    if (Number.isNaN(inicioDate.getTime()) || Number.isNaN(fimDate.getTime()))
      return res.status(400).json({ erro: 'Datas inválidas' });
    if (fimDate <= inicioDate) return res.status(400).json({ erro: 'Fim deve ser maior que início' });
    const bloqueio = await prisma.bloqueioHorario.create({ data: { inicio: inicioDate, fim: fimDate, motivo } });
    res.status(201).json({ success: true, bloqueio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: error.message });
  }
});

app.get('/bloqueios', authMiddleware, async (req, res) => {
  try {
    const bloqueios = await prisma.bloqueioHorario.findMany({ where: { ativo: true }, orderBy: { id: 'asc' } });
    res.json(bloqueios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: error.message });
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
    res.status(500).json({ erro: error.message });
  }
});

// ─── Disponibilidade ──────────────────────────────────────────────────────────

app.get('/disponibilidade', async (req, res) => {
  try {
    const { data, servicoId } = req.query;
    if (!data) return res.status(400).json({ erro: 'Informe a data no formato YYYY-MM-DD' });
    if (!servicoId) return res.status(400).json({ erro: 'Informe o servicoId' });
    const servicoIdNumero = Number(servicoId);
    if (!Number.isInteger(servicoIdNumero) || servicoIdNumero <= 0)
      return res.status(400).json({ erro: 'servicoId inválido' });
    const servico = await prisma.servico.findUnique({ where: { id: servicoIdNumero } });
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });
    const disponibilidade = await calculateAvailability(data, servico);
    res.json({ data, servico: { id: servico.id, nome: servico.nome, duracao: servico.duracao }, ...disponibilidade });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao calcular disponibilidade' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
