# Roadmap - HSBeauty

Atualizado em: 27/05/2026

---

## Fase 1 - Fundacao

Estado: concluida.

- [x] Estruturar repositorio com `frontend/`, `backend/` e `docs/`.
- [x] Inicializar frontend React/Vite.
- [x] Inicializar backend Node/Express.
- [x] Definir documentacao operacional inicial.

---

## Fase 2 - Banco de dados

Estado: concluida para MVP.

- [x] Modelar `Servico`.
- [x] Modelar `Agendamento`.
- [x] Modelar `BloqueioHorario`.
- [x] Modelar `Admin`.
- [x] Modelar `RefreshToken`.
- [x] Criar migrations Prisma.
- [x] Criar seed inicial de servicos.
- [x] Avaliar e aplicar indices para consultas por data, status e servico.

Pendencias futuras:

- [ ] Definir e provisionar ambiente de staging com banco isolado.

---

## Fase 3 - Backend

Estado: concluida.

- [x] Configurar Express com Prisma e Neon adapter.
- [x] Criar rotas publicas de servicos.
- [x] Criar rota publica de agendamento com lock transacional por dia.
- [x] Criar rota publica de disponibilidade: `GET /disponibilidade`.
- [x] Criar autenticacao admin com JWT e refresh token rotativo.
- [x] Criar rotas admin canonicas sob `/admin/*`.
- [x] Proteger criacao publica contra corrida por lock transacional por dia.
- [x] Cobrir regras principais com testes unitarios (101 testes) e de integracao (4 testes com skip automatico).
- [x] Criar testes de integracao: conflito de horario, lock concorrente e auth flow (A-013, C-032).
- [x] Remover rotas legadas fora de `/admin` (A-014, C-029).
- [x] Refatorar `server.js` em bootstrap puro; `app.js` criado como composition root com `createApp()` (A-015, C-033).
- [x] Atualizar `express-rate-limit` para v8 (`max` -> `limit`, `standardHeaders: 'draft-6'`) (A-006, C-031).

---

## Fase 4 - Frontend

Estado: concluida.

- [x] Criar site publico com landing page, grid de servicos e CTA.
- [x] Criar fluxo de agendamento publico (modal 3 passos) com campo de email opcional.
- [x] Integrar servicos e disponibilidade.
- [x] Criar painel admin com login JWT + refresh automatico.
- [x] Criar dashboard com 4 KPIs e chart Recharts.
- [x] Criar tabela de agendamentos com filtros, paginacao e acoes.
- [x] Criar CRUD de servicos.
- [x] Criar CRUD de horarios/bloqueios.
- [x] Separar bundle publico/admin por lazy loading.
- [x] Remover assets versionados sem uso e imagens pesadas.
- [x] Badge numerico de agendamentos pendentes no nav do painel (polling 30s) (A-016, C-027).
- [x] Email de confirmacao automatico ao cliente via Resend (campo opcional no formulario) (A-017, C-035).
- [x] Visualizacao de agenda semanal `WeekCalendar` com toggle lista/calendario (A-018, C-034).
- [x] Export de agendamentos para CSV com filtros ativos (A-019, C-028).

---

## Fase 5 - CI e qualidade

Estado: operacional.

- [x] CI roda em PR para `main` e em push para `main`.
- [x] Frontend executa audit, lint, test (81 testes) e build.
- [x] Backend executa audit, Prisma generate e testes (105 testes, 4 de integracao com skip automatico).
- [x] Script raiz `npm run quality` valida backend e frontend.
- [x] Dependabot habilitado com cadencia semanal controlada.
- [x] Quality gate E2E Playwright ativo no CI (job `frontend-e2e`, 10 testes visuais).
- [x] Contrato de snapshots visuais versionados por `SNAPSHOT_CHANNEL=product` (Linux/CI) e `windows` (dev local).
- [x] `forbidOnly: true` no CI para bloquear `test.only` acidental.
- [x] Workflow `update-snapshots.yml` para atualizacao de snapshots canonicos via GitHub Actions.

Pendencias futuras:

- [ ] Adicionar testes de integracao com banco real isolado no CI (requer ambiente de staging — A-012).

---

## Fase 6 - Deploy

Estado: manual/controlado.

- [x] Vercel configurado para build estatico do frontend.
- [x] Deploy automatico por Git desativado por decisao operacional (D006).
- [x] Frontend exige `VITE_API_URL` em ambiente publicado.
- [x] Banco em Neon/PostgreSQL.
- [x] Checklist de deploy manual documentado com preflight, publicacao, smoke check e rollback.

Pendencias futuras:

- [ ] Definir e provisionar ambiente de staging (Vercel preview + banco Neon isolado).

---

## Fase 7 - Notificacoes e comunicacao

Estado: parcialmente concluida.

Objetivo: fechar o ciclo de comunicacao com cliente e admin apos agendamento.

- [x] Notificar admin sobre agendamentos pendentes via polling 30s com badge numerico no nav (A-016, C-027).
- [x] Enviar email de confirmacao ao cliente via Resend (fire-and-forget, campo email opcional) (A-017, C-035, D009).
- [ ] Enviar mensagem WhatsApp real ao cliente apos agendamento confirmado (via API Twilio ou Z-API).
- [ ] Cobrir fluxo de notificacao via WhatsApp no CI.

Criterio de entrada para WhatsApp: decisao sobre provider (Twilio, Z-API ou outro) documentada em `docs/decisoes.md`.

---

## Fase 8 - UX avancada do painel admin

Estado: parcialmente concluida.

Objetivo: aumentar produtividade da administradora no uso diario do painel.

- [x] Visualizacao de agenda semanal `WeekCalendar` com toggle lista/calendario (A-018, C-034).
- [x] Export de agendamentos para CSV com filtros ativos (A-019, C-028).
- [x] Indicador visual de agendamento pendente via badge numerico no nav (polling 30s) (A-016, C-027).
- [ ] Filtro rapido por nome de cliente na listagem de agendamentos.

---

## Fase 9 - Infraestrutura e qualidade avancada

Estado: parcialmente concluida.

Objetivo: eliminar dividas tecnicas de infraestrutura e elevar cobertura de testes.

- [x] Criar testes de integracao com banco real: conflito de horario, lock concorrente e auth flow (A-013, C-032).
- [x] Refatorar `server.js` em bootstrap puro; `app.js` como composition root com `createApp()` (A-015, C-033).
- [x] Remover rotas legadas fora de `/admin` (A-014, C-029).
- [x] Documentar politica de rotacao de `JWT_SECRET` e credenciais de banco (A-020, C-030, D008).
- [x] Atualizar `express-rate-limit` para v8 (A-006, C-031).
- [ ] Provisionar ambiente de staging (banco Neon isolado + Vercel preview separado) (A-012).
- [ ] Monitorar vulnerabilidade moderada indireta do Prisma tooling; acompanhar release Prisma (A-007).

---

## Fase 10 - Release formal

Estado: parcialmente iniciada.

Objetivo: formalizar versao de produto e preparar para escala.

- [x] Definir politica de versionamento SemVer documentada (D007) (A-011, C-030).
- [x] Alinhar versoes nos `package.json` de produto, backend e frontend para `1.0.0`.
- [ ] Fechar ou arquivar issues GitHub abertas sem criterio pendente.
- [ ] Criar CHANGELOG.md inicial cobrindo as fases 1 a 9.
- [ ] Definir criterios de aceitacao para release publico.

---

## Resumo de estado atual

| Fase | Estado |
|---|---|
| 1 - Fundacao | Concluida |
| 2 - Banco de dados | Concluida para MVP |
| 3 - Backend | Concluida |
| 4 - Frontend | Concluida |
| 5 - CI e qualidade | Operacional |
| 6 - Deploy | Manual/controlado |
| 7 - Notificacoes | Parcialmente concluida |
| 8 - UX avancada | Parcialmente concluida |
| 9 - Infraestrutura | Parcialmente concluida |
| 10 - Release formal | Parcialmente iniciada |
