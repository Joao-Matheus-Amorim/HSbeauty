import express from 'express';
import { logError, sendError } from './http-response.js';

export function createProtectedServiceRouter({ prisma, authMiddleware }) {
  const router = express.Router();

  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { nome, preco, duracao, ativo } = req.body;

      if (!nome || typeof nome !== 'string' || !nome.trim()) {
        return sendError(res, 400, 'Nome é obrigatório');
      }

      const precoNumero = Number(preco);
      if (Number.isNaN(precoNumero) || precoNumero <= 0) {
        return sendError(res, 400, 'Preço inválido');
      }

      const duracaoNumero = Number(duracao);
      if (!Number.isInteger(duracaoNumero) || duracaoNumero <= 0) {
        return sendError(res, 400, 'Duração inválida (em minutos, inteiro positivo)');
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
      logError('POST /servicos', error, req);
      return sendError(res, 500, 'Erro ao criar serviço');
    }
  });

  router.put('/:id', authMiddleware, async (req, res) => {
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
        if (!Number.isInteger(duracaoNumero) || duracaoNumero <= 0) {
          return sendError(res, 400, 'Duração inválida (em minutos, inteiro positivo)');
        }
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

  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const servicoExistente = await prisma.servico.findUnique({ where: { id } });
      if (!servicoExistente) return sendError(res, 404, 'Serviço não encontrado');

      const servicoDesativado = await prisma.servico.update({
        where: { id },
        data: { ativo: false },
      });

      res.json({ mensagem: 'Serviço desativado com sucesso', servico: servicoDesativado });
    } catch (error) {
      logError('DELETE /servicos/:id', error, req);
      return sendError(res, 500, 'Erro ao desativar serviço');
    }
  });

  return router;
}