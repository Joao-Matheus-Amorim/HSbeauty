# Registro de blocos tecnicos

Atualizado em: 27/05/2026

## Backend

### Bootstrap e infraestrutura HTTP

- Arquivo principal: `backend/src/server.js`
- Responsabilidade: configurar Express, CORS, Prisma, auth middleware e montagem de rotas.
- Estado: operacional.
- Gaps: sem healthcheck dedicado alem de `GET /`.

### Auth admin

- Arquivos:
  - `backend/src/auth-routes.js`
  - `backend/src/auth-middleware.js`
  - `backend/src/token-service.js`
  - `backend/src/auth-payload-rules.js`
- Rotas:
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `ALL /auth/register` desativada.
- Estado: operacional.
- Controle: refresh token rotativo e serializacao de refresh no frontend.
- Gaps: sem politica documentada de rotacao de `JWT_SECRET`.

### Servicos publicos

- Arquivos:
  - `backend/src/public-service-routes.js`
  - `backend/src/public-service-query-rules.js`
- Rotas:
  - `GET /servicos`
  - `GET /servicos/:id`
- Estado: operacional.

### Agendamento publico

- Arquivos:
  - `backend/src/public-booking-routes.js`
  - `backend/src/booking-rules.js`
  - `backend/src/availability-service.js`
- Rotas:
  - `POST /agendamentos`
  - `GET /disponibilidade`
- Estado: operacional.
- Controle: lock transacional PostgreSQL por dia de agendamento.
- Gaps: sem teste E2E concorrente com banco real.

### Admin dashboard

- Arquivos:
  - `backend/src/admin-dashboard-routes.js`
  - `backend/src/admin-dashboard-rules.js`
- Rota:
  - `GET /admin/dashboard`
- Estado: operacional.
- Controle: status concluido usa valor canonico `concluido` e aceita leitura de legado `concluído`.

### Admin agendamentos

- Arquivos:
  - `backend/src/admin-appointment-routes.js`
  - `backend/src/admin-appointment-query-rules.js`
  - `backend/src/admin-booking-rules.js`
- Rotas:
  - `GET /admin/agendamentos`
  - `GET /admin/agendamentos/:id`
  - `PUT /admin/agendamentos/:id`
  - `DELETE /admin/agendamentos/:id`
- Estado: operacional.
- Controle: filtro de data usa `dataInicio` e `dataFim`.
- Controle: mutacoes de status normalizam `concluído` legado para `concluido`.

### Admin servicos

- Arquivos:
  - `backend/src/admin-service-routes.js`
  - `backend/src/admin-service-query-rules.js`
  - `backend/src/admin-service-mutation-rules.js`
- Rotas:
  - `GET /admin/servicos`
  - `GET /admin/servicos/:id`
  - `POST /admin/servicos`
  - `PUT /admin/servicos/:id`
  - `DELETE /admin/servicos/:id`
- Estado: operacional.

### Admin horarios/bloqueios

- Arquivos:
  - `backend/src/admin-routes.js`
  - `backend/src/admin-schedule-query-rules.js`
  - `backend/src/admin-schedule-mutation-rules.js`
- Rotas:
  - `GET /admin/horarios`
  - `POST /admin/horarios`
  - `PUT /admin/horarios/:id`
  - `DELETE /admin/horarios/:id`
- Estado: operacional.
- Observacao: `admin-routes.js` ainda concentra horarios; pode ser extraido em frente futura.

### Rotas legadas protegidas

- Arquivos:
  - `backend/src/protected-appointment-routes.js`
  - `backend/src/protected-service-routes.js`
  - `backend/src/block-routes.js`
  - `backend/src/legacy-route-deprecation.js`
- Estado: compatibilidade temporaria.
- Gaps: definir data/criterio para remocao.

## Frontend

### Roteamento

- Arquivos:
  - `frontend/src/main.jsx`
  - `frontend/src/AppRoutes.jsx`
- Estado: operacional.
- Controle: admin carregado via lazy import.

### Site publico

- Arquivo: `frontend/src/App.jsx`
- Estado: operacional.
- Controle: modal de agendamento carregado via lazy import.
- Controle: imagens pesadas foram removidas do codigo publico; permanecem apenas icones/favicons publicos.

### Constantes publicas

- Arquivo: `frontend/src/constants.js`
- Estado: operacional.
- Controle: WhatsApp usa `VITE_WHATSAPP` quando configurado e fallback versionado quando ausente.

### Modal de agendamento

- Arquivos:
  - `frontend/src/components/AgendamentoModal.jsx`
  - `frontend/src/components/AgendamentoModal.css`
- Estado: operacional.
- Gaps: sem teste E2E do fluxo completo.

### Admin UI

- Arquivos:
  - `frontend/src/pages/Admin.jsx`
  - `frontend/src/pages/AdminLogin.jsx`
  - `frontend/src/components/AdminLayout.jsx`
  - `frontend/src/components/Dashboard.jsx`
  - `frontend/src/components/AppointmentManager.jsx`
  - `frontend/src/components/ServiceManager.jsx`
  - `frontend/src/components/ScheduleManager.jsx`
- Estado: operacional.
- Controle: chamadas admin usam `frontend/src/services/admin.js`.

### Services API

- Arquivos:
  - `frontend/src/services/api.js`
  - `frontend/src/services/auth.js`
  - `frontend/src/services/agendamentos.js`
  - `frontend/src/services/admin.js`
- Estado: operacional.
- Controle: producao depende de `VITE_API_URL`; localhost usa `http://localhost:3000`.

## Banco

- Arquivo: `backend/prisma/schema.prisma`
- Modelos:
  - `Servico`
  - `Agendamento`
  - `BloqueioHorario`
  - `Admin`
  - `RefreshToken`
- Estado: operacional.
- Gaps:
  - sem indices de consulta em `Agendamento.data`, `Agendamento.status`, `Agendamento.servicoId`;
  - sem constraint unica de slot, mitigada parcialmente por lock transacional.

## CI/CD

- Arquivo: `.github/workflows/ci.yml`
- Estado: operacional.
- Jobs:
  - frontend lint, test e build;
  - backend audit high, Prisma generate e testes.
- Controle: Dependabot roda semanalmente com agrupamento minor/patch e majors ignorados.
- Gaps:
  - sem job E2E;
  - sem cache raiz para monorepo completo.

## Deploy

- Arquivo: `vercel.json`
- Estado: manual/controlado.
- Controle: `git.deploymentEnabled` esta `false`.
- Gaps:
  - sem ambiente de staging formalizado.

