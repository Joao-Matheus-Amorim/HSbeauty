import express from 'express';
import { logError, sendError } from './http-response.js';
import { validateImagemUrl } from './url-rules.js';

const SINGLETON_ID = 1;

async function getOrCreateConfig(prisma) {
  return prisma.siteConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export function createPublicConfigRouter({ prisma }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const config = await getOrCreateConfig(prisma);
      res.json({ bannerUrl: config.bannerUrl, logoUrl: config.logoUrl });
    } catch (error) {
      logError('GET /config', error, req);
      return sendError(res, 500, 'Erro ao buscar configuracao');
    }
  });

  return router;
}

export function createAdminConfigRouter({ prisma, authMiddleware }) {
  const router = express.Router();

  router.get('/config', authMiddleware, async (req, res) => {
    try {
      const config = await getOrCreateConfig(prisma);
      res.json(config);
    } catch (error) {
      logError('GET /admin/config', error, req);
      return sendError(res, 500, 'Erro ao buscar configuracao');
    }
  });

  router.put('/config', authMiddleware, async (req, res) => {
    try {
      const { bannerUrl, logoUrl, aberturaHora, fechamentoHora, diasFechados } = req.body || {};

      const data = {};
      if (bannerUrl !== undefined) {
        const r = validateImagemUrl(bannerUrl);
        if (!r.valid) return sendError(res, r.status, `bannerUrl: ${r.message}`);
        data.bannerUrl = r.value ?? null;
      }
      if (logoUrl !== undefined) {
        const r = validateImagemUrl(logoUrl);
        if (!r.valid) return sendError(res, r.status, `logoUrl: ${r.message}`);
        data.logoUrl = r.value ?? null;
      }
      if (aberturaHora !== undefined) {
        const n = Number(aberturaHora);
        if (!Number.isInteger(n) || n < 0 || n > 23) return sendError(res, 400, 'aberturaHora deve ser inteiro entre 0 e 23');
        data.aberturaHora = n;
      }
      if (fechamentoHora !== undefined) {
        const n = Number(fechamentoHora);
        if (!Number.isInteger(n) || n < 1 || n > 24) return sendError(res, 400, 'fechamentoHora deve ser inteiro entre 1 e 24');
        data.fechamentoHora = n;
      }
      if (data.aberturaHora !== undefined && data.fechamentoHora !== undefined && data.fechamentoHora <= data.aberturaHora) {
        return sendError(res, 400, 'fechamentoHora deve ser maior que aberturaHora');
      }
      if (diasFechados !== undefined) {
        if (!Array.isArray(diasFechados)) return sendError(res, 400, 'diasFechados deve ser uma lista de inteiros 0-6');
        const dias = [];
        for (const d of diasFechados) {
          const n = Number(d);
          if (!Number.isInteger(n) || n < 0 || n > 6) return sendError(res, 400, 'diasFechados deve conter inteiros 0-6 (0=domingo)');
          if (!dias.includes(n)) dias.push(n);
        }
        data.diasFechados = dias.sort((a, b) => a - b);
      }

      if (Object.keys(data).length === 0) {
        return sendError(res, 400, 'Nenhum campo informado');
      }

      const config = await prisma.siteConfig.upsert({
        where: { id: SINGLETON_ID },
        update: data,
        create: { id: SINGLETON_ID, ...data },
      });

      res.json(config);
    } catch (error) {
      logError('PUT /admin/config', error, req);
      return sendError(res, 500, 'Erro ao atualizar configuracao');
    }
  });

  return router;
}
