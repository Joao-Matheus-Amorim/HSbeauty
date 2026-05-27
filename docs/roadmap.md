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

Estado: operacional.

- [x] Configurar Express com Prisma e Neon adapter.
- [x] Criar rotas publicas de servicos.
- [x] Criar rota publica de agendamento com lock transacional por dia.
- [x] Criar rota publica de disponibilidade: `GET /disponibilidade`.
- [x] Criar autenticacao admin com JWT e refresh token rotativo.
- [x] Criar rotas admin canonicas sob `/admin/*`.
- [x] Manter rotas protegidas legadas com headers de depreciacao.
- [x] Proteger criacao publica contra corrida por lock transacional por dia.
- [x] Cobrir regras principais com testes unitarios (117 testes).

Pendencias futuras:

- [ ] Criar testes de integracao com banco real/staging.
- [ ] Definir criterio e executar remocao das rotas legadas fora de `/admin`.
- [ ] Refatorar `server.js`: extrair `app.js`, organizar rotas por pasta (ver `docs/BACKEND_REFACTOR_ROADMAP.md`).

---

## Fase 4 - Frontend

Estado: operacional.

- [x] Criar site publico com landing page, grid de servicos e CTA.
- [x] Criar fluxo de agendamento publico (modal 3 passos).
- [x] Integrar servicos e disponibilidade.
- [x] Criar painel admin com login JWT + refresh automatico.
- [x] Criar dashboard com 4 KPIs e chart Recharts.
- [x] Criar tabela de agendamentos com filtros, paginacao e acoes.
- [x] Criar CRUD de servicos.
- [x] Criar CRUD de horarios/bloqueios.
- [x] Separar bundle publico/admin por lazy loading.
- [x] Remover assets versionados sem uso e imagens pesadas.

Pendencias futuras:

- [ ] Adicionar notificacao ao admin quando novo agendamento e criado.
- [ ] Substituir link WhatsApp por confirmacao real ao cliente apos agendamento.
- [ ] Criar visualizacao de agenda semanal/calendario no painel admin.
- [ ] Adicionar export de agendamentos (CSV).

---

## Fase 5 - CI e qualidade

Estado: operacional.

- [x] CI roda em PR para `main` e em push para `main`.
- [x] Frontend executa audit, lint, test e build.
- [x] Backend executa audit, Prisma generate e testes reais (117 testes).
- [x] Script raiz `npm run quality` valida backend e frontend.
- [x] Dependabot habilitado com cadencia semanal controlada.
- [x] Quality gate E2E Playwright ativo no CI (job `frontend-e2e`).
- [x] Contrato de snapshots visuais versionados por `SNAPSHOT_CHANNEL=product`.
- [x] `forbidOnly: true` no CI para bloquear `test.only` acidental.

Pendencias futuras:

- [ ] Adicionar testes de integracao ponta a ponta com banco real no CI.

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

Estado: nao iniciada.

Objetivo: fechar o ciclo de comunicacao com cliente e admin apos agendamento.

- [ ] Enviar mensagem WhatsApp real ao cliente apos agendamento confirmado (via API Twilio ou Z-API).
- [ ] Notificar admin em tempo real quando novo agendamento chegar (push, email ou webhook).
- [ ] Configurar variaveis de ambiente para provider de mensagens.
- [ ] Adicionar testes unitarios para o servico de notificacao.
- [ ] Cobrir fluxo de notificacao no CI.

Criterio de entrada: decisao sobre provider de mensagem (Twilio, Z-API ou outro) documentada em `docs/decisoes.md`.

---

## Fase 8 - UX avancada do painel admin

Estado: nao iniciada.

Objetivo: aumentar produtividade da administradora no uso diario do painel.

- [ ] Visualizacao de agenda semanal/calendario (substituir ou complementar tabela paginada).
- [ ] Export de agendamentos para CSV por intervalo de data.
- [ ] Filtro rapido por nome de cliente na listagem de agendamentos.
- [ ] Indicador visual de novo agendamento pendente sem recarregar pagina (polling ou WebSocket).

Criterio de entrada: Fase 7 concluida ou aprovacao explicita de escopo independente.

---

## Fase 9 - Infraestrutura e qualidade avancada

Estado: nao iniciada.

Objetivo: eliminar dividas tecnicas de infraestrutura e elevar cobertura de testes.

- [ ] Provisionar ambiente de staging (banco Neon isolado + Vercel preview separado).
- [ ] Criar testes de integracao com banco real cobrindo: criacao de agendamento, conflito de horario e lock transacional.
- [ ] Executar refatoracao do `server.js` conforme `docs/BACKEND_REFACTOR_ROADMAP.md` (app factory, organizacao por pasta).
- [ ] Remover rotas legadas fora de `/admin` apos confirmacao de desuso.
- [ ] Definir politica de rotacao de `JWT_SECRET` e credenciais de banco.

Criterio de entrada: MVP em producao estavel por pelo menos um ciclo de uso real.

---

## Fase 10 - Release formal

Estado: nao iniciada.

Objetivo: formalizar versao de produto e preparar para escala.

- [ ] Definir politica de versionamento entre produto, backend e frontend (SemVer ou CalVer).
- [ ] Alinhar versoes nos `package.json` de produto, backend e frontend.
- [ ] Fechar ou arquivar issues GitHub abertas sem criterio pendente.
- [ ] Criar CHANGELOG.md inicial cobrindo as fases 1 a 9.
- [ ] Definir criterios de aceitacao para release publico.

---

## Resumo de estado atual

| Fase | Estado |
|---|---|
| 1 - Fundacao | Concluida |
| 2 - Banco de dados | Concluida para MVP |
| 3 - Backend | Operacional |
| 4 - Frontend | Operacional |
| 5 - CI e qualidade | Operacional |
| 6 - Deploy | Manual/controlado |
| 7 - Notificacoes | Nao iniciada |
| 8 - UX avancada | Nao iniciada |
| 9 - Infraestrutura | Nao iniciada |
| 10 - Release formal | Nao iniciada |
