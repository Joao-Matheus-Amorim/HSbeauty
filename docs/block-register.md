# Registro de blocos tecnicos

Atualizado em: 30/05/2026

---

## Backend

### Bootstrap e infraestrutura HTTP

- Arquivos:
  - `backend/src/server.js` — bootstrap puro (env check, bind de porta, sinais de shutdown, `TZ=America/Sao_Paulo` antes do app)
  - `backend/src/app.js` — composition root; exporta `createApp()` com Express, CORS, rate limit, headers de seguranca, error handler global e 404 catch-all
- Estado: operacional.
- Controle: separados por design (A-015, C-033); permite importar `createApp()` em testes sem bind de porta.
- Controle: helmet-like headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) aplicados globalmente (C-041).

### Auth admin

- Arquivos:
  - `backend/src/auth-routes.js`
  - `backend/src/auth-middleware.js` (guard contra Bearer vazio, C-041)
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
  - `GET /servicos` (filtro `ativo`)
  - `GET /servicos/:id`
- Estado: operacional.

### Categorias publicas

- Arquivos:
  - `backend/src/public-categoria-routes.js`
- Rotas:
  - `GET /categorias` (lista todas as categorias ativas, mesmo sem servicos — frontend exibe estado vazio editorial)
- Estado: operacional (C-038, C-052).

### Combos publicos

- Arquivos:
  - `backend/src/public-combo-routes.js`
- Rotas:
  - `GET /combos`
- Estado: operacional.

### Agendamento publico

- Arquivos:
  - `backend/src/public-booking-routes.js`
  - `backend/src/booking-rules.js`
  - `backend/src/availability-service.js`
  - `backend/src/availability-routes.js`
  - `backend/src/email-service.js`
- Rotas:
  - `POST /agendamentos`
  - `GET /disponibilidade`
- Estado: operacional.
- Controle: janela publica de agendamento e **semana atual + 2 (3 semanas total)** via `isDateInBookingWindow` (C-054, ver `docs/booking-window.md`).
- Controle: expediente dinamico via `SiteConfig.aberturaHora`/`fechamentoHora`/`diasFechados` (C-048) — substitui constantes 9-18 hardcoded.
- Controle: lock advisory PostgreSQL por dia (`pg_advisory_xact_lock`) + unique parcial `Agendamento(data) WHERE status <> 'cancelado'` (C-045) impedem corrida.
- Controle: campo `email` opcional; envio de confirmacao via cadeia Brevo → Gmail → Resend (D011).

### Servico de email

- Arquivo: `backend/src/email-service.js`
- Responsabilidade: enviar email de confirmacao ao cliente e notificacao ao admin via Brevo (HTTP nativo), com fallback Gmail SMTP e Resend (D011, C-037).
- Estado: operacional.
- Controle: skip silencioso quando o provider primario nao esta configurado; tenta proximo da cadeia.
- Controle: chamado em fire-and-forget apos `res.json()`; erros logados sem afetar resposta HTTP.
- Controle: HTML escapado em todas interpolacoes (anti-XSS, C-040).
- Controle: timeout de 15s por provider.

### Admin dashboard

- Arquivos:
  - `backend/src/admin-dashboard-routes.js`
  - `backend/src/admin-dashboard-rules.js`
- Rota:
  - `GET /admin/dashboard`
- Estado: operacional.
- Controle: status `concluido` usa valor canonico e aceita leitura de legado `concluído` (C-015).
- Controle: `select` minimo + `count` em vez de `include:true` — payload otimizado (C-043).

### Admin agendamentos

- Arquivos:
  - `backend/src/admin-appointment-routes.js`
  - `backend/src/admin-appointment-query-rules.js`
  - `backend/src/admin-booking-rules.js`
- Rotas:
  - `GET /admin/agendamentos`
  - `GET /admin/agendamentos/export` — CSV com filtros ativos (A-019, C-028)
  - `GET /admin/agendamentos/:id`
  - `PUT /admin/agendamentos/:id` — status/observacoes e **reagendamento via `data`** (C-049)
  - `DELETE /admin/agendamentos/:id`
- Estado: operacional.
- Controle: filtro de data recebe `dataInicio` e `dataFim`; frontend monta boundaries `T00:00:00.000` e `T23:59:59.999`.
- Controle: `validateAdminBookingUpdatePayload` aceita nova `data` (ISO + slot 30min) e atualiza `hora` para coerencia (C-049).

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
- Controle: `categoriaId` exigido para servico aparecer no carrossel publico.

### Admin categorias

- Arquivos:
  - `backend/src/admin-categoria-routes.js`
  - `backend/src/admin-categoria-query-rules.js`
  - `backend/src/admin-categoria-mutation-rules.js`
- Rotas:
  - `GET /admin/categorias`
  - `POST /admin/categorias`
  - `PUT /admin/categorias/:id`
  - `DELETE /admin/categorias/:id`
- Estado: operacional (C-038).
- Controle: `nome unique`; campos `imagemUrl`, `ordem`, `ativo`.

### Admin combos

- Arquivos:
  - `backend/src/admin-combo-routes.js`
  - `backend/src/admin-combo-rules.js`
- Rotas:
  - `GET /admin/combos`
  - `POST /admin/combos`
  - `PUT /admin/combos/:id`
  - `DELETE /admin/combos/:id`
- Estado: operacional.

### Admin horarios/bloqueios

- Arquivos:
  - `backend/src/admin-routes.js` — factory `createAdminScheduleRouter` (C-042)
  - `backend/src/admin-schedule-query-rules.js`
  - `backend/src/admin-schedule-mutation-rules.js`
- Rotas:
  - `GET /admin/horarios`
  - `POST /admin/horarios`
  - `PUT /admin/horarios/:id`
  - `DELETE /admin/horarios/:id`
- Estado: operacional.

### SiteConfig (publico + admin)

- Arquivos:
  - `backend/src/site-config-routes.js`
  - `backend/src/url-rules.js` (validacao de URL no PUT, C-041)
- Rotas:
  - `GET /site/config` (publico — banner, logo, horarios, dias fechados)
  - `GET /admin/config`
  - `PUT /admin/config`
- Estado: operacional.
- Controle: singleton id=1; campos `bannerUrl`, `logoUrl`, `aberturaHora`, `fechamentoHora`, `diasFechados` (C-048).

### Rotas legadas protegidas

- Estado: removidas (A-014, C-029). Sem janela de depreciacao ativa.
- Arquivos removidos: `protected-appointment-routes.js`, `protected-service-routes.js`, `block-routes.js`, `legacy-route-deprecation.js`, `appointment-mutation-rules.js`.

---

## Frontend

### Roteamento

- Arquivos:
  - `frontend/src/main.jsx`
  - `frontend/src/AppRoutes.jsx`
- Rotas:
  - `/` — site publico (`App.jsx`)
  - `/c/:categoriaId` — pagina de categoria (`pages/CategoriaPage.jsx`, lazy) — substitui o antigo `CategoryDrawer` (C-052)
  - `/admin` — painel admin (`pages/Admin.jsx`, lazy)
  - `*` — redirect para `/`
- Estado: operacional.

### Site publico (editorial)

- Arquivo: `frontend/src/App.jsx`
- Estado: operacional.
- Controle: modal de agendamento carregado via lazy import.
- Controle: tipografia premium (Bodoni Moda + Italiana + Inter Tight + Cormorant Garamond italic). Paleta `paper #FBF6F0`, `ink #2A1B17`, `gold #C19660`, `burgundy #5C2B3A`. Mais detalhes em `docs/editorial-design-system.md`.
- Controle: hero usa SVG transparente da proprietaria em `/hero-maiara.svg` sobre gradient warm peach com sparkles dourados e icones de lipstick/lash em SVG inline animados.

### Carrossel de categorias

- Arquivos:
  - `frontend/src/components/CategoryCarousel.jsx`
  - `frontend/src/components/CategoryCarousel.css`
- Estado: operacional (C-051).
- Controle: scroll horizontal tatil com tilt 3D, dots de navegacao, particulas de fundo (lipstick, sparkle, lips, eye, nail, mascara, mirror, bottle, lash) inline SVG.
- Controle: clique na categoria navega para `/c/:categoriaId`.

### Pagina de categoria

- Arquivos:
  - `frontend/src/pages/CategoriaPage.jsx`
  - `frontend/src/pages/CategoriaPage.css`
- Estado: operacional (C-052).
- Controle: URL compartilhavel substitui o antigo drawer.
- Controle: estado vazio editorial ("Em breve") com CTA WhatsApp quando categoria nao tem servicos.

### Modal de agendamento

- Arquivos:
  - `frontend/src/components/AgendamentoModal.jsx`
  - `frontend/src/components/AgendamentoModal.css`
  - `frontend/src/utils/booking-format.js` (C-046)
  - `frontend/src/hooks/useDisponibilidadeCache.js` (C-046)
- Estado: operacional. Fluxo 3 passos.
- Controle: campo `email` opcional no passo 3.
- Controle: janela de 3 semanas (`BOOKING_WEEKS_AHEAD=2`); calendario respeita expediente do SiteConfig.

### Admin UI

- Arquivos:
  - `frontend/src/pages/Admin.jsx`
  - `frontend/src/pages/AdminLogin.jsx`
  - `frontend/src/components/AdminLayout.jsx` (drawer mobile com hamburger funcional)
  - `frontend/src/components/Dashboard.jsx`
  - `frontend/src/components/AppointmentManager.jsx` (toggle lista/WeekCalendar, export CSV, reagendar modal)
  - `frontend/src/components/WeekCalendar.jsx` (agenda semanal sem dependencias externas)
  - `frontend/src/components/ServiceManager.jsx`
  - `frontend/src/components/CategoriaManager.jsx` (botao "Criar categorias padrao" — seed 1-click, C-053)
  - `frontend/src/components/ComboManager.jsx`
  - `frontend/src/components/ScheduleManager.jsx`
  - `frontend/src/components/SiteConfigManager.jsx` (banner, logo, expediente, dias fechados, C-050)
- Estado: operacional.
- Controle: badge numerico de agendamentos pendentes no nav; polling 30s (A-016, C-027).
- Controle: drawer mobile com hamburger funcional (substitui menu sem onClick antigo).

### Services API

- Arquivos:
  - `frontend/src/services/api.js` — resolucao de URL + `parseJsonResponse`
  - `frontend/src/services/auth.js` — login, refresh, logout, sessionStorage
  - `frontend/src/services/agendamentos.js` — servicos, categorias, combos, disponibilidade, criacao de agendamento, site-config publico
  - `frontend/src/services/admin.js` — dashboard, agendamentos, servicos, categorias, combos, horarios, config (admin)
- Estado: operacional.
- Controle: producao depende de `VITE_API_URL`; sem fallback hardcoded.
- Controle: `authorizedFetch` faz auto-refresh em 401 com promise deduplication.

---

## Banco de dados

- Arquivo: `backend/prisma/schema.prisma`
- Modelos (9):
  - `Servico` (com `categoriaId` FK e `imagemUrl`).
  - `Categoria` (`nome unique`, `imagemUrl`, `ordem`, `ativo`).
  - `Combo` + `ComboItem` (unique em `comboId+servicoId`).
  - `Agendamento` (com `servicoId` ou `comboId`, `email` opcional).
  - `BloqueioHorario`.
  - `SiteConfig` (singleton id=1, com `bannerUrl`, `logoUrl`, `aberturaHora`, `fechamentoHora`, `diasFechados`).
  - `Admin`, `RefreshToken`.
- Estado: operacional.
- Controle: indices ativos em `Agendamento.data`, `Agendamento.status`, `Agendamento.servicoId`, composicao `status,data` e `Servico.categoriaId`.
- Controle: unique parcial `Agendamento_data_ativo_uniq ON Agendamento(data) WHERE status <> 'cancelado'` (C-045).
- Controle: todas as migrations sao idempotentes (`IF NOT EXISTS`, blocos `DO $$ ... $$`) (C-039).

---

## CI/CD

- Arquivo: `.github/workflows/ci.yml`
- Estado: operacional.
- Jobs ativos:
  - `frontend`: audit high, lint, test (95 casos), build.
  - `backend`: audit high, Prisma generate, testes (150 casos — 4 integracao com skip sem `DATABASE_URL_INTEGRATION`).
  - `frontend-e2e`: install Chromium, Playwright test com `SNAPSHOT_CHANNEL=product`.
- Controle: Dependabot roda semanalmente (segunda, 08:00 BRT) com agrupamento minor/patch; majors ignorados.
- Controle: `forbidOnly: true` no Playwright config bloqueia `test.only` acidental em CI.
- Controle: workflow `update-snapshots.yml` (workflow_dispatch) gera snapshots Linux canonicos e commita com `[skip ci]`.
- Gap: sem cache raiz para monorepo completo (apenas cache por escopo).
- Gap: testes de integracao nao executam em CI por falta de banco isolado (A-012).

---

## Deploy

- Arquivo: `vercel.json`
- Estado: automatico em `main` (D010, revoga D006).
- Controle: `git.deploymentEnabled: true`. Push em `main` publica producao; branches geram Preview Deployments.
- Controle: backend em Render — `npm start` roda `prisma migrate deploy && node src/server.js`.
- Controle: procedimento de pausa emergencial e rollback em `docs/deploy-manual-checklist.md` + `docs/adr/ADR-003-deploy.md`.
- Gap: sem ambiente de staging formalizado (A-012).
