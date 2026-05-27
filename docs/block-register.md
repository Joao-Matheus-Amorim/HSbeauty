# Registro de blocos tecnicos

Atualizado em: 27/05/2026

---

## Backend

### Bootstrap e infraestrutura HTTP

- Arquivo principal: `backend/src/server.js`
- Responsabilidade: configurar Express, CORS, Prisma, auth middleware e montagem de rotas.
- Estado: operacional.
- Divida tecnica: `server.js` ainda concentra bootstrap, config, rate limit, JWT e montagem — ver `docs/BACKEND_REFACTOR_ROADMAP.md` para plano de extracao (A-015).

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
  - `ALL /auth/register` desativada (410 Gone).
- Estado: operacional.
- Controle: refresh token rotativo e serializacao de refresh no frontend (promise deduplication).
- Gap: sem politica documentada de rotacao de `JWT_SECRET` (A-020).

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
- Controle: lock transacional PostgreSQL por dia de agendamento (evita corrida).
- Gap: sem teste de integracao com banco real cobrindo lock em concorrencia (A-013).

### Admin dashboard

- Arquivos:
  - `backend/src/admin-dashboard-routes.js`
  - `backend/src/admin-dashboard-rules.js`
- Rota:
  - `GET /admin/dashboard`
- Estado: operacional.
- Controle: status `concluido` usa valor canonico e aceita leitura de legado `concluído`.

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
- Controle: filtro de data recebe `dataInicio` e `dataFim`; frontend monta boundaries `T00:00:00.000` e `T23:59:59.999`.

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

### Rotas legadas protegidas

- Arquivos:
  - `backend/src/protected-appointment-routes.js`
  - `backend/src/protected-service-routes.js`
  - `backend/src/block-routes.js`
  - `backend/src/legacy-route-deprecation.js`
- Estado: compatibilidade temporaria com headers de depreciacao.
- Gap: sem criterio ou data definida para remocao (A-014).

---

## Frontend

### Roteamento

- Arquivos:
  - `frontend/src/main.jsx`
  - `frontend/src/AppRoutes.jsx`
- Estado: operacional.
- Controle: painel admin carregado via lazy import (code splitting).

### Site publico

- Arquivo: `frontend/src/App.jsx`
- Estado: operacional.
- Controle: modal de agendamento carregado via lazy import.
- Controle: imagens pesadas removidas; apenas icones e favicons publicos permanecem.

### Constantes publicas

- Arquivo: `frontend/src/constants.js`
- Estado: operacional.
- Controle: WhatsApp usa `VITE_WHATSAPP` quando configurado; fallback versionado quando ausente.
- Gap: link WhatsApp e gerado manualmente; sem envio automatico ao cliente (A-017).

### Modal de agendamento

- Arquivos:
  - `frontend/src/components/AgendamentoModal.jsx`
  - `frontend/src/components/AgendamentoModal.css`
- Estado: operacional. Fluxo 3 passos: selecao de servico/data → slot → confirmacao (nome/telefone).
- Gap: sem confirmacao automatica ao cliente apos agendamento (A-017).

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
- Gap: sem notificacao de novo agendamento em tempo real (A-016).
- Gap: sem visualizacao de agenda semanal/calendario (A-018).
- Gap: sem export de agendamentos (A-019).

### Services API

- Arquivos:
  - `frontend/src/services/api.js` — resolucao de URL + `parseJsonResponse`
  - `frontend/src/services/auth.js` — login, refresh, logout, sessionStorage
  - `frontend/src/services/agendamentos.js` — servicos publicos, disponibilidade, criacao
  - `frontend/src/services/admin.js` — dashboard, agendamentos, servicos, horarios (admin)
- Estado: operacional.
- Controle: producao depende de `VITE_API_URL`; sem fallback hardcoded.
- Controle: `authorizedFetch` faz auto-refresh em 401 com promise deduplication.

---

## Banco de dados

- Arquivo: `backend/prisma/schema.prisma`
- Modelos: `Servico`, `Agendamento`, `BloqueioHorario`, `Admin`, `RefreshToken`.
- Estado: operacional.
- Controle: indices ativos em `Agendamento.data`, `Agendamento.status`, `Agendamento.servicoId` e composicao `status,data`.
- Gap: sem unique constraint de slot no banco; race condition mitigada por lock transacional, mas sem garantia a nivel de schema (A-013).

---

## CI/CD

- Arquivo: `.github/workflows/ci.yml`
- Estado: operacional.
- Jobs ativos:
  - `frontend`: audit high, lint, test (81 casos), build.
  - `backend`: audit high, Prisma generate, testes (117 casos).
  - `frontend-e2e`: install Chromium, Playwright test com `SNAPSHOT_CHANNEL=product`.
- Controle: Dependabot roda semanalmente (segunda, 08:00 BRT) com agrupamento minor/patch; majors ignorados.
- Controle: `forbidOnly: true` no Playwright config bloqueia `test.only` acidental em CI.
- Controle: atualizacao de snapshots bloqueada em CI; deve ser feita localmente via `npm run test:e2e:update`.
- Gap: sem cache raiz para monorepo completo (apenas cache por escopo).
- Gap: sem testes de integracao com banco real no CI (A-013).

---

## Deploy

- Arquivo: `vercel.json`
- Estado: manual/controlado.
- Controle: `git.deploymentEnabled: false` — commits nao disparam deploy automatico.
- Controle: deploy intencional via painel Vercel seguindo `docs/deploy-manual-checklist.md`.
- Gap: sem ambiente de staging formalizado (A-012).
