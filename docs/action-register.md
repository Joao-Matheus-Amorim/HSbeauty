# Registro de acoes tecnicas

Atualizado em: 27/05/2026

## Legenda

- P0: bloqueia operacao.
- P1: risco relevante ou documentacao desatualizada.
- P2: melhoria planejada.
- P3: oportunidade futura.

## Acoes abertas

| ID | Prioridade | Fase | Acao | Evidencia | Proximo passo |
|---|---|---|---|---|---|
| A-006 | P2 | 9 | Avaliar upgrade major pendente de `express-rate-limit`. | Patch/minor backend e frontend ja aplicados; resta major 8.x. | Planejar PR dedicado com validacao de compatibilidade do middleware. |
| A-007 | P2 | 9 | Monitorar vulnerabilidade moderada indireta do Prisma tooling. | `npm audit` aponta `@hono/node-server` via Prisma. | Nao aplicar downgrade automatico; acompanhar release Prisma. |
| A-011 | P1 | 10 | Definir politica de versionamento. | README removido de versao solta; packages ainda usam versoes internas distintas. | Decidir versao de produto (SemVer ou CalVer) e regra para packages privados. |
| A-012 | P2 | 9 | Provisionar ambiente de staging. | Apenas producao existe; testes de integracao exigem banco real isolado. | Criar branch Neon de staging e Vercel preview separado. |
| A-013 | P2 | 9 | Criar testes de integracao com banco real. | Backend tem 117 testes unitarios; nenhum bate no banco real. | Criar suite de integracao cobrindo: agendamento com lock, conflito de horario, auth flow. |
| ~~A-014~~ | ~~P2~~ | ~~9~~ | ~~Remover rotas legadas fora de `/admin`.~~ | Concluido em C-029. | — |
| A-015 | P3 | 9 | Refatorar `server.js` conforme BACKEND_REFACTOR_ROADMAP. | `server.js` concentra bootstrap, config, CORS, rate limit, JWT e montagem de rotas. | Seguir ordem de PRs documentada em `docs/BACKEND_REFACTOR_ROADMAP.md`. |
| A-016 | P2 | 7 | Implementar notificacao ao admin para novo agendamento. | Frontend nao notifica; admin descobre apenas ao recarregar a pagina. | Decidir mecanismo (polling, WebSocket ou webhook) e registrar em `docs/decisoes.md`. |
| A-017 | P2 | 7 | Substituir link WhatsApp por confirmacao real ao cliente. | Apos agendar, frontend gera link WhatsApp manual; nao ha envio automatico. | Avaliar Z-API ou Twilio; registrar decisao de provider em `docs/decisoes.md`. |
| A-018 | P3 | 8 | Criar visualizacao de agenda semanal no painel admin. | Tabela paginada existe; sem visao de calendario. | Avaliar biblioteca (FullCalendar ou implementacao propria) e prototipar. |
| ~~A-019~~ | ~~P3~~ | ~~8~~ | ~~Adicionar export de agendamentos para CSV.~~ | Concluido em C-028. | — |
| A-020 | P1 | 9 | Definir politica de rotacao de `JWT_SECRET` e credenciais de banco. | Nenhuma politica documentada; rotacao manual em caso de comprometimento. | Documentar procedimento de rotacao e onde as credenciais ficam armazenadas. |

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
