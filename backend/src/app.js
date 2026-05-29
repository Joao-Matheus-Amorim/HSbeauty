import express from 'express';
import cors from 'cors';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { createAdminScheduleRouter } from './admin-routes.js';
import { createAdminAppointmentRouter } from './admin-appointment-routes.js';
import { createAdminDashboardRouter } from './admin-dashboard-routes.js';
import { createAdminServiceRouter } from './admin-service-routes.js';
import { createAdminCategoriaRouter } from './admin-categoria-routes.js';
import { createPublicCategoriaRouter } from './public-categoria-routes.js';
import { createAuthMiddleware } from './auth-middleware.js';
import { createAuthRouter } from './auth-routes.js';
import { createAvailabilityRouter } from './availability-routes.js';
import { buildAllowedOrigins, isOriginAllowed } from './cors-config-rules.js';
import { createPublicBookingRouter } from './public-booking-routes.js';
import { createPublicServiceRouter } from './public-service-routes.js';
import { createPublicComboRouter } from './public-combo-routes.js';
import { createAdminComboRouter } from './admin-combo-routes.js';
import { createPublicConfigRouter, createAdminConfigRouter } from './site-config-routes.js';
import { sendError, logError } from './http-response.js';

const { PrismaClient } = pkg;

export function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
}

export function createApp({ prisma } = {}) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(express.json({ limit: '2mb' }));

  const allowedOrigins = buildAllowedOrigins(process.env.FRONTEND_URL);
  app.use(
    cors({
      origin(origin, callback) {
        if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);
        // Nao lanca Error — apenas nega a origem. O browser bloqueia sem 500.
        return callback(null, false);
      },
    }),
  );

  const prismaInstance = prisma || createPrismaClient();
  const JWT_SECRET = process.env.JWT_SECRET;
  const authMiddleware = createAuthMiddleware({ jwtSecret: JWT_SECRET });

  app.get('/', (_req, res) => {
    res.json({ status: 'ok', mensagem: 'API HSBeauty rodando' });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/auth', createAuthRouter({ prisma: prismaInstance, jwtSecret: JWT_SECRET }));
  app.use('/servicos', createPublicServiceRouter({ prisma: prismaInstance }));
  app.use('/combos', createPublicComboRouter({ prisma: prismaInstance }));
  app.use('/categorias', createPublicCategoriaRouter({ prisma: prismaInstance }));
  app.use('/agendamentos', createPublicBookingRouter({ prisma: prismaInstance }));
  app.use('/disponibilidade', createAvailabilityRouter({ prisma: prismaInstance }));
  app.use('/config', createPublicConfigRouter({ prisma: prismaInstance }));

  app.use('/admin', createAdminDashboardRouter({ prisma: prismaInstance, authMiddleware }));
  app.use('/admin', createAdminAppointmentRouter({ prisma: prismaInstance, authMiddleware }));
  app.use('/admin', createAdminServiceRouter({ prisma: prismaInstance, authMiddleware }));
  app.use('/admin', createAdminCategoriaRouter({ prisma: prismaInstance, authMiddleware }));
  app.use('/admin', createAdminComboRouter({ prisma: prismaInstance, authMiddleware }));
  app.use('/admin', createAdminConfigRouter({ prisma: prismaInstance, authMiddleware }));
  app.use('/admin', createAdminScheduleRouter({ prisma: prismaInstance, authMiddleware }));

  // 404 catch-all para rotas nao mapeadas
  app.use((req, res) => sendError(res, 404, 'Rota nao encontrada'));

  // Error handler global — captura qualquer throw sincrono ou Promise rejeitada
  // que escape dos try/catch das rotas. Garante JSON consistente.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    logError(`${req.method} ${req.path}`, err, req);
    if (res.headersSent) return;
    sendError(res, 500, 'Erro interno');
  });

  return app;
}
