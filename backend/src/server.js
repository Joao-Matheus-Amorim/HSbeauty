import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import adminRouter, {
  setupAdminAgendamentos,
  setupAdminServicos,
  setupAdminHorarios,
} from './admin-routes.js';
import { createAdminDashboardRouter } from './admin-dashboard-routes.js';
import { createAuthMiddleware } from './auth-middleware.js';
import { createAuthRouter } from './auth-routes.js';
import { createAvailabilityRouter } from './availability-routes.js';
import { createBlockRouter } from './block-routes.js';
import { buildAllowedOrigins, isOriginAllowed } from './cors-config-rules.js';
import { assertRequiredEnv } from './env-config-rules.js';
import { createProtectedAppointmentRouter } from './protected-appointment-routes.js';
import { createProtectedServiceRouter } from './protected-service-routes.js';
import { createPublicBookingRouter } from './public-booking-routes.js';
import { createPublicServiceRouter } from './public-service-routes.js';
import { legacyAdminRouteDeprecation } from './legacy-route-deprecation.js';

const { PrismaClient } = pkg;

const app = express();
app.use(express.json());

const allowedOrigins = buildAllowedOrigins(process.env.FRONTEND_URL);

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);
      return callback(new Error('Origem não permitida pelo CORS'));
    },
  })
);

app.use(legacyAdminRouteDeprecation);

assertRequiredEnv(process.env);

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const authMiddleware = createAuthMiddleware({ jwtSecret: JWT_SECRET });

// -- Rotas --

app.get('/', (req, res) => {
  res.json({ status: 'ok', mensagem: 'API HSBeauty rodando' });
});

app.use('/auth', createAuthRouter({ prisma, jwtSecret: JWT_SECRET }));
app.use('/servicos', createPublicServiceRouter({ prisma }));
app.use('/servicos', createProtectedServiceRouter({ prisma, authMiddleware }));
app.use('/agendamentos', createPublicBookingRouter({ prisma }));
app.use('/agendamentos', createProtectedAppointmentRouter({ prisma, authMiddleware }));
app.use('/disponibilidade', createAvailabilityRouter({ prisma }));
app.use('/bloqueios', createBlockRouter({ prisma, authMiddleware }));

app.use('/admin', createAdminDashboardRouter({ prisma, authMiddleware }));
setupAdminAgendamentos(prisma, authMiddleware);
setupAdminServicos(prisma, authMiddleware);
setupAdminHorarios(prisma, authMiddleware);
app.use('/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
