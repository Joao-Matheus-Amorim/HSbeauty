# Registro de blocos tecnicos

Atualizado em: 27/05/2026

---

## Backend

### Bootstrap e infraestrutura HTTP

- Arquivos:
  - `backend/src/server.js` — bootstrap puro (bind de porta, sinais de shutdown)
  - `backend/src/app.js` — composition root; exporta `createApp()` com Express, CORS, rate limit e montagem de rotas
- Responsabilidade: inicializar Express, CORS, Prisma, auth middleware e montar rotas.
- Estado: operacional.
- Controle: `server.js` e `app.js` separados por design (A-015, C-033); permite importar `createApp()` em testes sem bind de porta.

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
- Controle: politica de rotacao de `JWT_SECRET` documentada em `docs/decisoes.md` (D008, A-020, C-030).

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
  - `backend/src/email-service.js`
- Rotas:
  - `POST /agendamentos`
  - `GET /disponibilidade`
- Estado: operacional.
- Controle: lock transacional PostgreSQL por dia de agendamento (evita corrida).
- Controle: campo `email` opcional no payload; validado se presente; persistido no `Agendamento`.
- Controle: email de confirmacao enviado via Resend apos resposta HTTP (fire-and-forget); falha nao afeta o agendamento (D009, C-035).
- Controle: suite de integracao cobre conflito de horario, lock concorrente e auth flow (A-013, C-032).

### Servico de email

- Arquivo: `backend/src/email-service.js`
- Responsabilidade: enviar email de confirmacao de agendamento ao cliente via Resend.
- Estado: operacional.
- Controle: skip silencioso quando `RESEND_API_KEY` ou `RESEND_FROM_EMAIL` ausentes; skip quando email do cliente ausente.
- Controle: chamado em fire-and-forget apos `res.json()` em `POST /agendamentos`; erros logados sem afetar resposta HTTP.
- Controle: email contem servico, data formatada em pt-BR (America/Sao_Paulo) e horario.

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
  - `GET /admin/agendamentos/export` — CSV com filtros ativos (A-019, C-028)
  - `GET /admin/agendamentos/:id`
  - `PUT /admin/agendamentos/:id`
  - `DELETE /admin/agendamentos/:id`
- Estado: operacional.
- Controle: filtro de data recebe `dataInicio` e `dataFim`; frontend monta boundaries `T00:00:00.000` e `T23:59:59.999`.
- Controle: export CSV respeita os mesmos filtros da listagem (status, data, busca).

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

- Estado: removidas (A-014, C-029).
- Arquivos removidos: `protected-appointment-routes.js`, `protected-service-routes.js`, `block-routes.js`, `legacy-route-deprecation.js`, `appointment-mutation-rules.js`.
- Todas as funcionalidades agora acessiveis exclusivamente via rotas admin canonicas (`/admin/*`).

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

### Modal de agendamento

- Arquivos:
  - `frontend/src/components/AgendamentoModal.jsx`
  - `frontend/src/components/AgendamentoModal.css`
- Estado: operacional. Fluxo 3 passos: selecao de servico/data → slot → confirmacao (nome/telefone/email).
- Controle: campo `email` opcional no passo 3; enviado no payload apenas quando preenchido.
- Controle: email de confirmacao enviado automaticamente pelo backend via Resend quando informado (D009, C-035).

### Admin UI

- Arquivos:
  - `frontend/src/pages/Admin.jsx`
  - `frontend/src/pages/AdminLogin.jsx`
  - `frontend/src/components/AdminLayout.jsx`
  - `frontend/src/components/Dashboard.jsx`
  - `frontend/src/components/AppointmentManager.jsx` — inclui toggle lista/WeekCalendar e export CSV
  - `frontend/src/components/WeekCalendar.jsx` — agenda semanal sem dependencias externas
  - `frontend/src/components/ServiceManager.jsx`
  - `frontend/src/components/ScheduleManager.jsx`
- Estado: operacional.
- Controle: badge numerico de agendamentos pendentes no nav; polling a cada 30s via `setInterval` (A-016, C-027).
- Controle: toggle lista/calendario em `AppointmentManager`; `WeekCalendar` renderiza slots da semana (A-018, C-034).
- Controle: botao de export CSV em `AppointmentManager`; respeita filtros ativos; chama `GET /admin/agendamentos/export` (A-019, C-028).

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
  - `backend`: audit high, Prisma generate, testes (105 casos — 4 integracao com skip sem `DATABASE_URL_INTEGRATION`).
  - `frontend-e2e`: install Chromium, Playwright test com `SNAPSHOT_CHANNEL=product` (10 testes visuais).
- Controle: Dependabot roda semanalmente (segunda, 08:00 BRT) com agrupamento minor/patch; majors ignorados.
- Controle: `forbidOnly: true` no Playwright config bloqueia `test.only` acidental em CI.
- Controle: workflow `update-snapshots.yml` (workflow_dispatch) gera snapshots Linux canonicos e commita com `[skip ci]`.
- Controle: canal `windows` disponivel para dev local (`npm run test:e2e:windows --prefix frontend`); CI usa apenas `product`.
- Gap: sem cache raiz para monorepo completo (apenas cache por escopo).
- Gap: testes de integracao nao executam em CI por falta de banco isolado (A-012).

---

## Deploy

- Arquivo: `vercel.json`
- Estado: manual/controlado.
- Controle: `git.deploymentEnabled: false` — commits nao disparam deploy automatico.
- Controle: deploy intencional via painel Vercel seguindo `docs/deploy-manual-checklist.md`.
- Gap: sem ambiente de staging formalizado (A-012).
