import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const app = express();
app.use(express.json());

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ status: 'ok', mensagem: 'API HSBeauty rodando' });
});

app.get('/servicos', async (req, res) => {
  try {
    const { ativo } = req.query;
    const where = {};

    if (ativo === 'true') where.ativo = true;
    if (ativo === 'false') where.ativo = false;

    const servicos = await prisma.servico.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    res.json(servicos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar serviços' });
  }
});

app.get('/servicos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    const servico = await prisma.servico.findUnique({
      where: { id },
    });

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    res.json(servico);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar serviço' });
  }
});

app.post('/servicos', async (req, res) => {
  try {
    const { nome, preco, duracao, ativo } = req.body;

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
        preco: precoNumero,
        duracao: duracaoNumero,
        ...(typeof ativo === 'boolean' ? { ativo } : {}),
      },
    });

    res.status(201).json(novoServico);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar serviço' });
  }
});

app.put('/servicos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    const servicoExistente = await prisma.servico.findUnique({
      where: { id },
    });

    if (!servicoExistente) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    const { nome, preco, duracao, ativo } = req.body;
    const data = {};

    if (nome !== undefined) {
      if (typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).json({ erro: 'Nome inválido' });
      }
      data.nome = nome.trim();
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

    if (ativo !== undefined) {
      if (typeof ativo !== 'boolean') {
        return res.status(400).json({ erro: 'Ativo deve ser true ou false' });
      }
      data.ativo = ativo;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo enviado para atualização' });
    }

    const servicoAtualizado = await prisma.servico.update({
      where: { id },
      data,
    });

    res.json(servicoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar serviço' });
  }
});

app.delete('/servicos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    const servicoExistente = await prisma.servico.findUnique({
      where: { id },
    });

    if (!servicoExistente) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});