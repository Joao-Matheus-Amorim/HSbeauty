# Auditoria tecnica operacional - PMBOK

Atualizado em: 27/05/2026

---

## 1. Sumario executivo

O projeto HSBeauty esta em estado funcional de MVP operacional. O nucleo de negocio (agendamento, painel admin, auth) esta implementado, testado e com CI confiavel. As proximas frentes sao melhorias planejadas e dividas tecnicas de infraestrutura — nenhuma e bloqueadora para o uso atual.

Estado dos gates de qualidade:

```
npm run quality (raiz)
  backend: 117 testes passando
  frontend: 81 testes passando
  frontend lint: passou
  frontend build: passou
  frontend audit high: 0 vulnerabilidades high/critical
  backend audit high: 0 vulnerabilidades high/critical
  E2E Playwright: 6 testes com snapshots visuais (SNAPSHOT_CHANNEL=product)
```

---

## 2. Escopo

### Incluido no escopo atual

- Backend Express 5 + Prisma 7 + Neon/PostgreSQL.
- Frontend React 19 + Vite 8 + Tailwind + Recharts.
- Auth admin com JWT + refresh token rotativo.
- Banco de dados com 5 modelos e indices de consulta.
- CI GitHub Actions com 3 jobs (frontend, backend, E2E).
- Deploy manual Vercel/frontend.
- Documentacao operacional completa.
- Dependencias npm e vulnerabilidades auditadas.

### Fora do escopo MVP

- Ambiente staging (Fase 9).
- Notificacoes automaticas ao cliente e admin (Fase 7).
- Visualizacao de calendario no painel admin (Fase 8).
- Export de agendamentos (Fase 8).
- Testes de integracao com banco real (Fase 9).
- Auditoria de infraestrutura Neon/Vercel por console.
- Testes de carga.

---

## 3. Estado de integracao

- Branch `main` e o estado de referencia para CI e deploy.
- CI verde em todas as frentes ativas.
- Deploy automatico Vercel permanece desativado (decisao D006).
- Fluxo recomendado: frente pequena → validacao local → CI verde → merge.

Controle:

- Um objetivo por PR; nao misturar runtime, refactor e documentacao sem justificativa clara.
- Todo PR deve citar a validacao executada no corpo da descricao.

---

## 4. Escopo funcional por bloco

| Bloco | Estado | Referencia |
|---|---|---|
| Agendamento publico | Operacional | `public-booking-routes.js`, `availability-service.js` |
| Servicos publicos | Operacional | `public-service-routes.js` |
| Disponibilidade | Operacional | `GET /disponibilidade` com calculo de slots |
| Painel admin — login | Operacional | JWT + refresh rotativo, sessionStorage |
| Painel admin — dashboard | Operacional | 4 KPIs, chart Recharts, estado vazio coberto |
| Painel admin — agendamentos | Operacional | Filtros, paginacao, confirmar/cancelar |
| Painel admin — servicos | Operacional | CRUD completo |
| Painel admin — horarios | Operacional | CRUD de bloqueios |
| CI | Operacional | 3 jobs: frontend, backend, E2E com snapshots |
| Deploy | Controlado | Manual via Vercel, checklist documentado |
| Notificacoes | Nao iniciado | Ver Fase 7 no roadmap |
| Calendario visual | Nao iniciado | Ver Fase 8 no roadmap |
| Export | Nao iniciado | Ver Fase 8 no roadmap |

---

## 5. Cronograma operacional

### P0 — Bloqueadores

Nenhum item identificado como bloqueador operacional atual.

### P1 — Risco relevante ou divida critica

| ID | Item |
|---|---|
| A-011 | Definir politica de versionamento (packages com versoes desalinhadas). |
| A-020 | Documentar politica de rotacao de `JWT_SECRET` e credenciais de banco. |

### P2 — Melhorias planejadas

| ID | Fase | Item |
|---|---|---|
| A-006 | 9 | Upgrade major `express-rate-limit` para versao 8.x. |
| A-007 | 9 | Monitorar vulnerabilidade moderada indireta do Prisma tooling. |
| A-012 | 9 | Provisionar ambiente de staging. |
| A-013 | 9 | Criar testes de integracao com banco real. |
| A-014 | 9 | Definir criterio e remover rotas legadas fora de `/admin`. |
| A-016 | 7 | Notificacao ao admin para novo agendamento. |
| A-017 | 7 | Confirmacao automatica ao cliente apos agendamento. |

### P3 — Oportunidades futuras

| ID | Fase | Item |
|---|---|---|
| A-015 | 9 | Refatorar `server.js` (app factory, organizacao por pastas). |
| A-018 | 8 | Visualizacao de agenda semanal no painel admin. |
| A-019 | 8 | Export de agendamentos para CSV. |

---

## 6. Custos e restricoes

| Restricao | Detalhe | Impacto |
|---|---|---|
| Custo zero/baixo | Neon free tier, Vercel hobby, GitHub Actions free. | Deploy manual obrigatorio; limites de build a monitorar. |
| Deploy automatico desativado | `git.deploymentEnabled: false` em `vercel.json`. | Requer disciplina de checklist a cada release. |
| Banco unico (sem staging) | Apenas banco de producao no Neon. | Testes de integracao reais exigem banco isolado (A-012). |
| Dependencias controladas | Majors ignorados no Dependabot; atualizacoes manuais. | Risco de defasagem acumulada em majors. |

---

## 7. Qualidade

### Gates ativos no CI

```
# Job frontend
npm audit --audit-level=high
npm run lint
npm test            # 81 testes Vitest
npm run build

# Job backend
npm audit --audit-level=high
npx prisma generate
npm test            # 117 testes Node.js native

# Job frontend-e2e
npx playwright install chromium
npm run test:e2e    # 6 testes Playwright com SNAPSHOT_CHANNEL=product
```

### Cobertura atual

| Camada | Ferramenta | Testes | Estado |
|---|---|---|---|
| Backend — regras de negocio | Node.js native test | 117 | Cobrindo booking, auth, admin queries/mutations, cors, env, tokens |
| Frontend — componentes | Vitest + Testing Library | 81 | Cobrindo agendamento, admin components, services, utils |
| Frontend — smoke | Vitest | 2 suites | Fluxo publico e admin com mocks |
| E2E — visual regression | Playwright Chromium | 6 testes | Home publica, login, mobile tabs, dashboard empty (desktop + mobile) |

### Gaps de qualidade conhecidos

- Sem testes de integracao com banco real (lock transacional, conflito de horario).
- Sem cobertura de notificacoes (funcionalidade nao implementada).
- Sem teste de carga ou stress do endpoint de agendamento concorrente.

---

## 8. Recursos tecnicos

| Componente | Versao atual |
|---|---|
| Node.js | 22 |
| React | 19.2.4 |
| Vite | 8.0.14 |
| Express | 5.2.1 |
| Prisma | 7.7.0 |
| Playwright | 1.54.2 |
| Vitest | 3.2.4 |
| PostgreSQL | Neon (gerenciado) |
| Deploy frontend | Vercel (manual) |
| CI | GitHub Actions |

### Necessidades futuras

- Provider de mensagens (Twilio, Z-API ou outro) para Fase 7.
- Banco Neon isolado para staging (Fase 9).
- Definicao de responsavel por deploy manual e por rotacao de credenciais.

---

## 9. Comunicacoes

Padrao operacional:

- Toda frente: branch, PR, validacao documentada no corpo do PR, merge para `main`.
- Toda decisao operacional: `docs/decisoes.md` ou `docs/adr/`.
- Toda divida tecnica: `docs/action-register.md` com ID, prioridade e fase.
- Toda mudanca de estado de bloco: `docs/block-register.md`.
- Toda conclusao de fase: `docs/roadmap.md`.

---

## 10. Riscos

| ID | Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|---|
| R-001 | API de producao nao configurada no Vercel | Media | Alto | `VITE_API_URL` obrigatoria; checklist de deploy exige verificacao. |
| R-002 | Dependencias ficarem defasadas | Media | Medio | Dependabot semanal; majors avaliados manualmente. |
| R-003 | Divergencia documental | Media | Medio | Docs atualizados por frente; bloco-register como fonte de verdade tecnica. |
| R-004 | Race condition em agendamento concorrente | Baixa | Alto | Lock transacional ativo; sem constraint unica de slot no schema (mitigado, nao eliminado). |
| R-005 | Vulnerabilidade moderada indireta via Prisma tooling | Baixa | Medio | Monitorar releases Prisma; nao aplicar downgrade automatico (A-007). |
| R-006 | Comprometimento de `JWT_SECRET` | Baixa | Alto | Sem politica de rotacao documentada; dependente de acesso manual ao Neon/Vercel (A-020). |
| R-007 | Limite de build Vercel atingido | Baixa | Medio | Deploy automatico desativado; builds manuais e controlados. |
| R-008 | Notificacao ausente causa perda de agendamento | Media | Alto | Admin precisa recarregar pagina; risco ate Fase 7 ser implementada (A-016). |

---

## 11. Aquisicoes e dependencias externas

| Servico | Uso | Controle |
|---|---|---|
| GitHub Actions | CI | Gates definidos em `.github/workflows/ci.yml` |
| Neon | Banco PostgreSQL gerenciado | `DATABASE_URL` por variavel de ambiente |
| Vercel | Hosting frontend estatico | Deploy manual; `VITE_API_URL` obrigatoria |
| npm registry | Dependencias | Dependabot + audit high no CI |
| Provider mensagens (futuro) | Notificacoes Fase 7 | Decisao pendente (A-017) |

---

## 12. Stakeholders

| Stakeholder | Interesse | Expectativa atual |
|---|---|---|
| Cliente final | Agendar sem friccao e sem conflito de horario. | Fluxo publico funcional e disponibilidade correta. |
| Administradora | Confirmar, cancelar e organizar agenda com visibilidade. | Painel funcional; notificacao de novo agendamento pendente (A-016). |
| Desenvolvedor | Manter CI confiavel, entregas rastreaveis e dividas documentadas. | Roadmap claro e action register sem itens surpresa. |
| Operacao | Deploy controlado e custo baixo. | Checklist de deploy respeitado; sem custos imprevistos. |

---

## 13. Decisoes de referencia

| Decisao | Documento | Resumo |
|---|---|---|
| D001 | `docs/decisoes.md` | Produto web, nao app nativo. |
| D002 | `docs/decisoes.md` | Stack React + Node.js. |
| D003 | `docs/decisoes.md` | PostgreSQL como banco relacional. |
| D004 | `docs/decisoes.md` | Neon substituiu Docker local. |
| D005 | `docs/decisoes.md` | Custo zero na versao inicial. |
| D006 | `docs/decisoes.md` + `docs/adr/ADR-003-deploy.md` | Deploy automatico desativado. |
| — | `docs/decisoes.md` (pendente) | Provider de mensagens para Fase 7 (A-017). |
| — | `docs/decisoes.md` (pendente) | Politica de versionamento de produto (A-011). |
