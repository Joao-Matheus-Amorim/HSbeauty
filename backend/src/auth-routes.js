import crypto from 'crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { validateLoginPayload, validateRefreshTokenPayload } from './auth-payload-rules.js';
import { logError, sendError } from './http-response.js';
import { buildLoginRateLimitConfig } from './rate-limit-config-rules.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export function createAuthRouter({ prisma, jwtSecret }) {
  const router = express.Router();

  const loginLimiter = rateLimit(buildLoginRateLimitConfig());

  function generateAccessToken(admin) {
    return jwt.sign({ id: admin.id, email: admin.email }, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  async function generateRefreshToken(adminId) {
    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    await prisma.refreshToken.create({ data: { token, adminId, expiresAt } });
    return token;
  }

  router.all('/register', (_req, res) => {
    return sendError(res, 410, 'Registro de admin via HTTP desativado. Use o script CLI backend/scripts/create-admin.js.');
  });

  router.post('/login', loginLimiter, async (req, res) => {
    try {
      const validation = validateLoginPayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const { email, senha } = validation.data;
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

  router.post('/refresh', async (req, res) => {
    try {
      const validation = validateRefreshTokenPayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const { refreshToken } = validation.data;
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

  router.post('/logout', async (req, res) => {
    try {
      const validation = validateRefreshTokenPayload(req.body);
      if (!validation.valid) return sendError(res, validation.status, validation.message);

      const { refreshToken } = validation.data;
      const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
      if (stored && !stored.revogado) await prisma.refreshToken.update({ where: { id: stored.id }, data: { revogado: true } });
      res.json({ mensagem: 'Logout realizado com sucesso' });
    } catch (error) {
      logError('POST /auth/logout', error, req);
      return sendError(res, 500, 'Erro ao fazer logout');
    }
  });

  return router;
}
