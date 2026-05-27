# Auditoria tecnica operacional - PMBOK

Atualizado em: 27/05/2026

---

## 1. Sumario executivo

O projeto HSBeauty esta em estado funcional de MVP operacional. O nucleo de negocio (agendamento, painel admin, auth) esta implementado, testado e com CI confiavel. As proximas frentes sao melhorias planejadas e dividas tecnicas de infraestrutura — nenhuma e bloqueadora para o uso atual.

Estado dos gates de qualidade:

```
npm run quality (raiz)
  backend: 105 testes passando (101 unitarios + 4 integracao com skip automatico)
  frontend: 81 testes passando
  frontend lint: passou
  frontend build: passou
  frontend audit high: 0 vulnerabilidades high/critical
  backend audit high: 0 vulnerabilidades high/critical
  E2E Playwright: 10 testes com snapshots visuais (SNAPSHOT_CHANNEL=product)
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

### Fora do escopo MVP atual

- Ambiente staging (A-012, Fase 9).
- Notificacoes via WhatsApp real ao cliente (Fase 7 — pendente decisao de provider).
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
| Agendamento publico | Operacional | `public-booking-routes.js`, `availability-service.js`, campo email opcional |
| Servicos publicos | Operacional | `public-service-routes.js` |
| Disponibilidade | Operacional | `GET /disponibilidade` com calculo de slots |
| Email de confirmacao | Operacional | `email-service.js`, Resend, fire-and-forget pos-transacao (D009) |
| Painel admin — login | Operacional | JWT + refresh rotativo, sessionStorage |
| Painel admin — dashboard | Operacional | 4 KPIs, chart Recharts, estado vazio coberto |
| Painel admin — agendamentos | Operacional | Filtros, paginacao, confirmar/cancelar, export CSV |
| Painel admin — badge pendentes | Operacional | Polling 30s, badge numerico no nav |
| Painel admin — calendario | Operacional | `WeekCalendar`, toggle lista/calendario |
| Painel admin — servicos | Operacional | CRUD completo |
| Painel admin — horarios | Operacional | CRUD de bloqueios |
| CI | Operacional | 3 jobs: frontend (81 testes), backend (105 testes), E2E (10 snapshots) |
| Deploy | Controlado | Manual via Vercel, checklist documentado |
| Notificacoes WhatsApp | Nao iniciado | Depende de decisao de provider (Fase 7) |

---

## 5. Cronograma operacional

### P0 — Bloqueadores

Nenhum item identificado como bloqueador operacional atual.

### P1 — Risco relevante ou divida critica

Nenhum item P1 aberto.

### P2 — Melhorias planejadas

| ID | Fase | Item |
|---|---|---|
| A-007 | 9 | Monitorar vulnerabilidade moderada indireta do Prisma tooling; acompanhar release Prisma. |
| A-012 | 9 | Provisionar ambiente de staging (banco Neon isolado + Vercel preview separado). |

### P3 — Oportunidades futuras

Nenhum item P3 aberto.

### Concluidos neste ciclo

| ID | Referencia | Item |
|---|---|---|
| A-006 | C-031 | `express-rate-limit` atualizado para v8.5.2. |
| A-011 | C-030 | Politica SemVer documentada (D007), versoes alinhadas para 1.0.0. |
| A-013 | C-032 | Suite de integracao criada com skip automatico. |
| A-014 | C-029 | Rotas legadas removidas. |
| A-015 | C-033 | `server.js` virou bootstrap puro; `app.js` criado. |
| A-016 | C-027 | Badge de pendentes + polling 30s no painel admin. |
| A-017 | C-035 | Email de confirmacao via Resend (D009). |
| A-018 | C-034 | `WeekCalendar` com toggle lista/calendario. |
| A-019 | C-028 | Export CSV de agendamentos. |
| A-020 | C-030 | Politica de rotacao de credenciais documentada (D008). |

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
npm test            # 105 testes Node.js native (4 integracao com skip sem DATABASE_URL_INTEGRATION)

# Job frontend-e2e
npx playwright install chromium
npm run test:e2e    # 10 testes Playwright com SNAPSHOT_CHANNEL=product
```

### Cobertura atual

| Camada | Ferramenta | Testes | Estado |
|---|---|---|---|
| Backend — regras de negocio | Node.js native test | 101 | Cobrindo booking, auth, admin queries/mutations, cors, env, tokens, email |
| Backend — integracao | Node.js native test | 4 (skip sem DB) | Conflito de horario, lock concorrente, auth flow com banco real |
| Frontend — componentes | Vitest + Testing Library | 81 | Cobrindo agendamento, admin components, services, utils |
| Frontend — smoke | Vitest | 2 suites | Fluxo publico e admin com mocks |
| E2E — visual regression | Playwright Chromium | 10 testes | Home, login, mobile tabs, dashboard empty, agenda semanal, CSV export |

### Gaps de qualidade conhecidos

- Testes de integracao executam apenas com `DATABASE_URL_INTEGRATION` configurado (banco real de staging).
- Sem cobertura de notificacao via WhatsApp (funcionalidade nao implementada).
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

- Provider de mensagens WhatsApp (Twilio, Z-API ou outro) para Fase 7.
- Banco Neon isolado para staging (A-012, Fase 9).

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
| R-006 | Comprometimento de `JWT_SECRET` | Baixa | Alto | Politica de rotacao documentada (D008); procedimento padrao em `docs/decisoes.md`. |
| R-007 | Limite de build Vercel atingido | Baixa | Medio | Deploy automatico desativado; builds manuais e controlados. |
| R-008 | Agendamento nao percebido pelo admin | Baixa | Medio | Badge de pendentes com polling 30s implementado (A-016); notificacao push nao implementada. |

---

## 11. Aquisicoes e dependencias externas

| Servico | Uso | Controle |
|---|---|---|
| GitHub Actions | CI | Gates definidos em `.github/workflows/ci.yml` |
| Neon | Banco PostgreSQL gerenciado | `DATABASE_URL` por variavel de ambiente |
| Vercel | Hosting frontend estatico | Deploy manual; `VITE_API_URL` obrigatoria |
| Resend | Email transacional de confirmacao | `RESEND_API_KEY` e `RESEND_FROM_EMAIL`; ausencia pula envio silenciosamente (D009) |
| npm registry | Dependencias | Dependabot + audit high no CI |
| Provider WhatsApp (futuro) | Notificacoes Fase 7 | Decisao de provider pendente |

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
| D007 | `docs/decisoes.md` | Politica SemVer; versao 1.0.0 alinhada em todos os packages (A-011). |
| D008 | `docs/decisoes.md` | Politica de rotacao manual de credenciais com procedimento documentado (A-020). |
| D009 | `docs/decisoes.md` | Resend como provider de email transacional; fire-and-forget, campo email opcional (A-017). |
