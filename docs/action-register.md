# Registro de acoes tecnicas

Atualizado em: 30/05/2026

## Legenda

- P0: bloqueia operacao.
- P1: risco relevante ou documentacao desatualizada.
- P2: melhoria planejada.
- P3: oportunidade futura.

## Acoes abertas

| ID | Prioridade | Fase | Acao | Evidencia | Proximo passo |
|---|---|---|---|---|---|
| ~~A-006~~ | ~~P2~~ | ~~9~~ | ~~Avaliar upgrade major pendente de `express-rate-limit`.~~ | Concluido em C-031. | — |
| A-007 | P2 | 9 | Monitorar vulnerabilidade moderada indireta do Prisma tooling. | `npm audit` aponta `@hono/node-server` via Prisma. | Nao aplicar downgrade automatico; acompanhar release Prisma. |
| ~~A-011~~ | ~~P1~~ | ~~10~~ | ~~Definir politica de versionamento.~~ | Concluido em C-030. | — |
| A-012 | P2 | 9 | Provisionar ambiente de staging. | Apenas producao existe; testes de integracao exigem banco real isolado. | Criar branch Neon de staging e Vercel preview separado. |
| ~~A-013~~ | ~~P2~~ | ~~9~~ | ~~Criar testes de integracao com banco real.~~ | Concluido em C-032. | — |
| ~~A-014~~ | ~~P2~~ | ~~9~~ | ~~Remover rotas legadas fora de `/admin`.~~ | Concluido em C-029. | — |
| ~~A-015~~ | ~~P3~~ | ~~9~~ | ~~Refatorar `server.js` conforme BACKEND_REFACTOR_ROADMAP.~~ | Concluido em C-033. | — |
| ~~A-016~~ | ~~P2~~ | ~~7~~ | ~~Implementar notificacao ao admin para novo agendamento.~~ | Concluido em C-027 (polling 30s + badge) e reforcado em C-036 (notificacao por email transacional do admin). | — |
| ~~A-017~~ | ~~P2~~ | ~~7~~ | ~~Substituir link WhatsApp por confirmacao real ao cliente.~~ | Concluido em C-035. | — |
| ~~A-018~~ | ~~P3~~ | ~~8~~ | ~~Criar visualizacao de agenda semanal no painel admin.~~ | Concluido em C-034. | — |
| ~~A-019~~ | ~~P3~~ | ~~8~~ | ~~Adicionar export de agendamentos para CSV.~~ | Concluido em C-028. | — |
| ~~A-020~~ | ~~P1~~ | ~~9~~ | ~~Definir politica de rotacao de credenciais.~~ | Concluido em C-030. | — |

## Acoes concluidas recentes

| ID | Referencia | Resultado |
|---|---|---|
| C-001 | PR #129 | CI backend passou a executar `npm test`. |
| C-002 | PR #130 | Criacao publica de agendamento usa transacao e lock por dia. |
| C-003 | PR #131 | Frontend nao tem fallback hardcoded de API de producao. |
| C-004 | PR #132 | Bundle publico reduzido e assets nao usados removidos. |
| C-005 | Esta frente | README, roadmap e testes HTTP alinhados ao contrato atual. |
| C-006 | Esta frente | Auditoria PMBOK, registro de blocos e ADR de deploy documentados. |
| C-007 | Esta frente | `VITE_WHATSAPP` conectado ao frontend com fallback para o numero atual. |
| C-008 | Esta frente | Flag deprecated `previewFeatures = ["driverAdapters"]` removida do Prisma schema. |
| C-009 | Esta frente | Dependabot ativado com agenda semanal, agrupamento minor/patch e majors ignorados. |
| C-010 | PR #135 | Dependencias patch/minor do backend atualizadas pelo Dependabot. |
| C-011 | `0b817d1` | Dependencias patch/minor do frontend aplicadas direto na main a partir do PR #136. |
| C-012 | Esta frente | Imagens pesadas removidas do frontend e substituidas por placeholders sem arquivo estatico. |
| C-013 | Esta frente | Emojis e icones decorativos removidos de UI, scripts e README. |
| C-014 | Esta frente | Checklist de deploy manual documentado sem alterar politica `deploymentEnabled: false`. |
| C-015 | Esta frente | Status `concluido` normalizado como contrato canonico entre frontend, backend e banco. |
| C-016 | Esta frente | README, roadmap, block-register e auditoria PMBOK alinhados ao estado atual. |
| C-017 | Esta frente | Indices de consulta em `Agendamento` adicionados via migration e schema Prisma alinhado. |
| C-018 | Esta frente | Smoke tests minimo (publico + admin) adicionados em `frontend/src/__tests__/smoke`. |
| C-019 | Esta frente | Smoke backend (health, auth e booking com cenarios de falha) adicionado e integrado ao CI. |
| C-020 | Esta frente | Job `frontend-e2e` com Playwright Chromium adicionado ao CI. |
| C-021 | Esta frente | E2E Playwright expandido com cenarios de erro (`login invalido` e `horario indisponivel`). |
| C-022 | Esta frente | Regressao visual basica Playwright adicionada para home publica e login admin com snapshots versionados. |
| C-023 | Esta frente | Regressao visual mobile-first do painel logado adicionada para tabs de agendamentos, servicos e horarios. |
| C-024 | Esta frente | Cobertura de regressao visual de dashboard para estado vazio (mobile + desktop) adicionada. |
| C-025 | Esta frente | Contrato `SNAPSHOT_CHANNEL=product` definido para snapshots Playwright, com bloqueio de update em CI e documentacao operacional. |
| C-026 | Esta frente | Issues #17, #78 e #80 confirmadas como ja fechadas; A-003, A-004 e A-010 removidas do registro. |
| C-027 | Esta frente | Polling de agendamentos pendentes a cada 30s com badge numerico no nav do painel admin (A-016). |
| C-028 | Esta frente | Export CSV de agendamentos com filtros ativos; rota `GET /admin/agendamentos/export` + botao no painel (A-019). |
| C-029 | Esta frente | Rotas legadas removidas: `protected-appointment-routes`, `protected-service-routes`, `block-routes`, `legacy-route-deprecation`, `appointment-mutation-rules` + 2 testes (A-014). |
| C-030 | Esta frente | Politica SemVer documentada (D007), frontend alinhado para 1.0.0, politica de rotacao de credenciais documentada (D008) em `docs/decisoes.md` (A-011, A-020). |
| C-031 | Esta frente | `express-rate-limit` atualizado para v8.5.2; `max` -> `limit`, `standardHeaders: true` -> `'draft-6'` (A-006). |
| C-032 | Esta frente | Suite de integracao criada: conflito de horario, lock concorrente e auth flow; skip automatico sem `DATABASE_URL_INTEGRATION` (A-013). |
| C-033 | Esta frente | `server.js` virou bootstrap puro; `app.js` criado como composition root com `createApp()` (A-015). |
| C-034 | Esta frente | `WeekCalendar` criado sem dependencias externas; toggle lista/calendario adicionado ao `AppointmentManager` (A-018). |
| C-035 | Esta frente | Email de confirmacao via Resend: `email-service.js`, campo email opcional no formulario publico, fire-and-forget pos-transacao, decisao D009 documentada (A-017). |
| C-036 | 2026-05-28 | Adicionada notificacao por email para o admin a cada novo agendamento (`sendAdminBookingNotification`); fecha A-016 do lado de notificacao real. |
| C-037 | 2026-05-28 | Brevo HTTP virou provider primario; Gmail/Resend ficam como fallback. Render Free bloqueia SMTP. (D011 documentado). |
| C-038 | 2026-05-29 | Categoria virou entidade propria (modelo Prisma com `nome unique`, `imagemUrl`, `ordem`); `Servico.categoriaId` FK; CRUD admin + public listing. Substitui o campo string livre. |
| C-039 | 2026-05-29 | Migrations idempotentes via `IF NOT EXISTS` e blocos `DO $$ ... $$`. `prisma migrate deploy` no `npm start` aplica pendentes no boot. |
| C-040 | 2026-05-29 | XSS no email-service mitigado: escape HTML em todas interpolacoes; antes payload no nome/observacao chegava bruto na caixa do admin (G1). |
| C-041 | 2026-05-29 | Endurecimento de seguranca da API: helmet-like headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), CORS callback(null,false), error handler global, 404 catch-all, validate URL no PUT /admin/config, auth middleware guard contra Bearer vazio. |
| C-042 | 2026-05-29 | `admin-routes.js` virou factory `createAdminScheduleRouter` — antes router module-level vazava handlers entre instancias em testes. |
| C-043 | 2026-05-29 | Listagens admin trocam `include:true` por `select` minimo; payload de `/admin/agendamentos` ~70% menor. Dashboard puxa apenas campos necessarios + count para agendamentos do dia. |
| C-044 | 2026-05-29 | `process.env.TZ = 'America/Sao_Paulo'` setado em server.js antes do app — corrige getDay()/setHours() rodando UTC no Render (sexta 23h BRT antes era sabado UTC). |
| C-045 | 2026-05-29 | Migration `20260529150000_agendamento_slot_unique` cria unique parcial em `Agendamento(data) WHERE status <> 'cancelado'`. Fecha gap historico de A-013 (restava reforco a nivel de DB). |
| C-046 | 2026-05-29 | Refator: helpers de formato (`utils/booking-format.js`) e hook `useDisponibilidadeCache.js` extraidos do AgendamentoModal; App.jsx unifica fetches publicos com `Promise.allSettled`. |
| C-047 | 2026-05-29 | Cobertura nova: `url-rules`, `email-service-escape` (anti-XSS), `booking-format`. Backend 135 + frontend 92. |
| C-048 | 2026-05-29 | SiteConfig ganha `aberturaHora`, `fechamentoHora` e `diasFechados`. `availability-service` e `public-booking-routes` passam a respeitar essas regras dinamicamente (substitui constantes hardcoded 9-18). Mensagem 'Fechado neste dia.' quando dia da semana esta na lista. |
| C-049 | 2026-05-29 | Admin pode reagendar via `PUT /admin/agendamentos/:id { data }`. `validateAdminBookingUpdatePayload` aceita nova data (ISO + slot 30min), atualiza `hora` para coerencia. Frontend: botao 'Reagendar' no card + modal datetime-local. |
| C-050 | 2026-05-29 | SiteConfigManager admin ganha 3 secoes novas: horario de abertura/fechamento (inputs numericos) e dias fechados (botoes toggle por dia). |
| C-051 | 2026-05-30 | Redesign editorial completo (paleta off-white/dourado escovado/borgonha + Cormorant Garamond italic + Inter). Hero, carrossel, galeria bento, CTA borgonha, rodape, AgendamentoModal — tudo reescrito sem glassmorphism cafona. |
| C-052 | 2026-05-30 | Categoria virou pagina dedicada (/c/:categoriaId, route + CategoriaPage.jsx) — substitui o CategoryDrawer que foi removido. URL passa a ser compartilhavel. |
| C-053 | 2026-05-30 | CategoriaManager admin ganha botao 'Criar categorias padrao' (1 clique) que faz seed de Unhas, Cilios, Sobrancelhas, Depilacao, Spa Labial. ServiceManager mostra aviso ambar quando dropdown de categorias esta vazio. |
| C-054 | 2026-05-30 | Janela publica de agendamento ampliada de 1 para 3 semanas (semana atual + 2). Backend: isDateInBookingWindow substitui isDateInWeek na availability-service e public-booking-routes. BOOKING_WEEKS_AHEAD=2. Tests cobrindo as 3 semanas + fora da janela. |
| C-055 | 2026-05-30 | Cleanup tecnico: removidos CategoryDrawer.jsx/.css orfaos; ~280 linhas de CSS legado (hero-art, topbar-overlay, gold-pill, meta-row, cta-button, results-section, gallery-strip, bottom-note, storyteller) dropadas. Frontend: API vazia agora sobrescreve fallback (App.jsx, CategoriaPage.jsx) para nao mostrar servicos fantasma. |
| C-056 | 2026-05-30 | Novos testes: pages/CategoriaPage.test.jsx (3 cenarios), booking-rules.test.js (isDateInBookingWindow), availability-service.test.js (janela 3 semanas). Total: backend 150 + frontend 95. |
