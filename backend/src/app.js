import express from 'express';
import cors from 'cors';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import adminRouter, { setupAdminHorarios } from './admin-routes.js';
import { createAdminAppointmentRouter } from './admin-appointment-routes.js';
import { createAdminDashboardRouter } from './admin-dashboard-routes.js';
import { createAdminServiceRouter } from './admin-service-routes.js';
import { createAuthMiddleware } from './auth-middleware.js';
import { createAuthRouter } from './auth-routes.js';
import { createAvailabilityRouter } from './availability-routes.js';
import { buildAllowedOrigins, isOriginAllowed } from './cors-config-rules.js';
import { createPublicBookingRouter } from './public-booking-routes.js';
import { createPublicServiceRouter } from './public-service-routes.js';
import { createPublicComboRouter } from './public-combo-routes.js';
import { createAdminComboRouter } from './admin-combo-routes.js';

const { PrismaClient } = pkg;

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());

  const allowedOrigins = buildAllowedOrigins(process.env.FRONTEND_URL);
  app.use(
    cors({
      origin(origin, callback) {
        if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);
        return callback(new Error('Origem não permitida pelo CORS'));
      },
    }),
  );

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const JWT_SECRET = process.env.JWT_SECRET;
  const authMiddleware = createAuthMiddleware({ jwtSecret: JWT_SECRET });

  app.get('/', (_req, res) => {
    res.json({ status: 'ok', mensagem: 'API HSBeauty rodando' });
  });

  app.use('/auth', createAuthRouter({ prisma, jwtSecret: JWT_SECRET }));
  app.use('/servicos', createPublicServiceRouter({ prisma }));
  app.use('/combos', createPublicComboRouter({ prisma }));
  app.use('/agendamentos', createPublicBookingRouter({ prisma }));
  app.use('/disponibilidade', createAvailabilityRouter({ prisma }));

  app.use('/admin', createAdminDashboardRouter({ prisma, authMiddleware }));
  app.use('/admin', createAdminAppointmentRouter({ prisma, authMiddleware }));
  app.use('/admin', createAdminServiceRouter({ prisma, authMiddleware }));
  app.use('/admin', createAdminComboRouter({ prisma, authMiddleware }));
  setupAdminHorarios(prisma, authMiddleware);
  app.use('/admin', adminRouter);

  return app;
}
