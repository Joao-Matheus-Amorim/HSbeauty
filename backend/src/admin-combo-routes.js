import express from 'express';
import { validateAdminComboPayload } from './admin-combo-rules.js';
import { handlePrismaConflict, logError, sendError } from './http-response.js';

const COMBO_INCLUDE = {
  itens: {
    orderBy: { ordem: 'asc' },
    include: { servico: { select: { id: true, nome: true, preco: true, duracao: true } } },
  },
};

export function createAdminComboRouter({ prisma, authMiddleware }) {
  const router = express.Router();

  router.get('/combos', authMiddleware, async (req, res) => {
    try {
      const { ativo } = req.query;
      const where = {};
      if (ativo !== undefined) where.ativo = ativo === 'true';

      const combos = await prisma.combo.findMany({
        where,
        include: COMBO_INCLUDE,
        orderBy: { nome: 'asc' },
      });
      res.json({ combos });
    } catch (error) {
      logError('GET /admin/combos', error, req);
      return sendError(res, 500, 'Erro ao buscar combos');
    }
  });

  router.get('/combos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const combo = await prisma.combo.findUnique({ where: { id }, include: COMBO_INCLUDE });
      if (!combo) return sendError(res, 404, 'Combo não encontrado');
      res.json(combo);
    } catch (error) {
      logError('GET /admin/combos/:id', error, req);
      return sendError(res, 500, 'Erro ao buscar combo');
    }
  });

  router.post('/combos', authMiddleware, async (req, res) => {
    try {
      const validation = validateAdminComboPayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const { nome, descricao, preco, servicoIds } = validation.data;

      const combo = await prisma.combo.create({
        data: {
          nome,
          descricao,
          preco,
          itens: {
            create: servicoIds.map((servicoId, ordem) => ({ servicoId, ordem })),
          },
        },
        include: COMBO_INCLUDE,
      });
      res.status(201).json(combo);
    } catch (error) {
      const conflictResponse = handlePrismaConflict(res, error, 'Combo com este nome já existe');
      if (conflictResponse) return conflictResponse;
      logError('POST /admin/combos', error, req);
      return sendError(res, 500, 'Erro ao criar combo');
    }
  });

  router.put('/combos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const existing = await prisma.combo.findUnique({ where: { id } });
      if (!existing) return sendError(res, 404, 'Combo não encontrado');

      const validation = validateAdminComboPayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const { nome, descricao, preco, servicoIds, ativo } = validation.data;

      // Replace items atomically inside a transaction
      const combo = await prisma.$transaction(async (tx) => {
        await tx.comboItem.deleteMany({ where: { comboId: id } });
        return tx.combo.update({
          where: { id },
          data: {
            nome,
            descricao,
            preco,
            ...(ativo !== undefined ? { ativo } : {}),
            itens: {
              create: servicoIds.map((servicoId, ordem) => ({ servicoId, ordem })),
            },
          },
          include: COMBO_INCLUDE,
        });
      });
      res.json(combo);
    } catch (error) {
      const conflictResponse = handlePrismaConflict(res, error, 'Combo com este nome já existe');
      if (conflictResponse) return conflictResponse;
      logError('PUT /admin/combos/:id', error, req);
      return sendError(res, 500, 'Erro ao atualizar combo');
    }
  });

  router.delete('/combos/:id', authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return sendError(res, 400, 'ID inválido');

      const existing = await prisma.combo.findUnique({ where: { id } });
      if (!existing) return sendError(res, 404, 'Combo não encontrado');

      const desativado = await prisma.combo.update({ where: { id }, data: { ativo: false } });
      res.json({ mensagem: 'Combo desativado com sucesso', combo: desativado });
    } catch (error) {
      logError('DELETE /admin/combos/:id', error, req);
      return sendError(res, 500, 'Erro ao desativar combo');
    }
  });

  return router;
}
