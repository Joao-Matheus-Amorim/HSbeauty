# Auditoria tecnica operacional - PMBOK

Atualizado em: 30/05/2026

---

## 1. Sumario executivo

O projeto HSBeauty esta em estado funcional de MVP operacional. O nucleo de negocio (agendamento, painel admin, auth) esta implementado, testado e com CI confiavel. As proximas frentes sao melhorias planejadas e dividas tecnicas de infraestrutura — nenhuma e bloqueadora para o uso atual.

Estado dos gates de qualidade:

```
npm run quality (raiz)
  backend: 150 testes passando (146 unitarios + 4 integracao com skip automatico)
  frontend: 95 testes passando
  frontend lint: passou
  frontend build: passou
  frontend audit high: 0 vulnerabilidades high/critical
  backend audit high: 0 vulnerabilidades high/critical
  E2E Playwright: snapshots visuais (SNAPSHOT_CHANNEL=product)
```

---

## 2. Escopo

### Incluido no escopo atual

- Backend Express 5 + Prisma 7 + Neon/PostgreSQL.
- Frontend React 19 + Vite 8 + Tailwind + Recharts.
- Auth admin com JWT + refresh token rotativo.
- Banco de dados com 9 modelos e indices de consulta (Servico, Categoria, Combo, ComboItem, Agendamento, BloqueioHorario, SiteConfig, Admin, RefreshToken).
- CI GitHub Actions com 3 jobs (frontend, backend, E2E).
- Deploy automatico em main (Vercel frontend + Render backend) desde D010.
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
- Deploy automatico em main em Vercel (frontend) e Render (backend) desde D010 (revoga D006).
- Fluxo recomendado: frente pequena → CI verde → merge → producao.

Controle:

- Um objetivo por PR; nao misturar runtime, refactor e documentacao sem justificativa clara.
- Todo PR deve citar a validacao executada no corpo da descricao.

---

## 4. Escopo funcional por bloco

| Bloco | Estado | Referencia |
|---|---|---|
| Agendamento publico | Operacional | `public-booking-routes.js`, `availability-service.js`, janela 3 semanas (C-054), email opcional |
| Servicos publicos | Operacional | `public-service-routes.js` |
| Categorias publicas | Operacional | `public-categoria-routes.js` (C-038, C-052) |
| Combos publicos | Operacional | `public-combo-routes.js` |
| Disponibilidade | Operacional | `GET /disponibilidade` com calculo de slots e expediente dinamico (C-048) |
| Email | Operacional | `email-service.js`, cadeia Brevo → Gmail → Resend (D011), notificacao admin + cliente |
| Painel admin — login | Operacional | JWT + refresh rotativo, sessionStorage |
| Painel admin — dashboard | Operacional | 4 KPIs, chart Recharts, estado vazio coberto |
| Painel admin — agendamentos | Operacional | Filtros, paginacao, confirmar/cancelar, export CSV, reagendar (C-049) |
| Painel admin — badge pendentes | Operacional | Polling 30s, badge numerico no nav |
| Painel admin — calendario | Operacional | `WeekCalendar`, toggle lista/calendario |
| Painel admin — servicos | Operacional | CRUD completo + dropdown de categoria |
| Painel admin — categorias | Operacional | CRUD + botao "Criar categorias padrao" (C-053) |
| Painel admin — combos | Operacional | CRUD com itens |
| Painel admin — horarios | Operacional | CRUD de bloqueios |
| Painel admin — site config | Operacional | Banner, logo, expediente, dias fechados (C-050) |
| Pagina de categoria publica | Operacional | `/c/:categoriaId` substitui o antigo drawer (C-052) |
| Hero editorial | Operacional | SVG da proprietaria + tipografia Bodoni Moda/Italiana/Inter Tight + paleta paper/ink/gold/burgundy |
| CI | Operacional | 3 jobs: frontend (95 testes), backend (150 testes), E2E Playwright |
| Deploy | Automatico em main | Vercel (frontend) + Render (backend), D010 |
| Notificacoes WhatsApp ao cliente | Nao iniciado | Depende de decisao de provider (Fase 7) |

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
| Custo zero/baixo | Neon free tier, Vercel hobby, Render free, GitHub Actions free. | Render Free Tier bloqueia SMTP (mitigado por Brevo HTTP, D011). |
| Deploy automatico ativo | `git.deploymentEnabled: true` (Vercel) + auto-deploy Render. | Bug que passe pelo CI vai pra producao em segundos; mitigado por cobertura de testes alta. |
| Banco unico (sem staging) | Apenas banco de producao no Neon. | Testes de integracao reais exigem banco isolado (A-012). |
| Dependencias controladas | Majors ignorados no Dependabot; atualizacoes manuais. | Risco de defasagem acumulada em majors. |

---

## 7. Qualidade

### Gates ativos no CI

```
# Job frontend
npm audit --audit-level=high
npm run lint
npm test            # 95 testes Vitest
npm run build

# Job backend
npm audit --audit-level=high
npx prisma generate
npm test            # 150 testes Node.js native (4 integracao com skip sem DATABASE_URL_INTEGRATION)

# Job frontend-e2e
npx playwright install chromium
npm run test:e2e    # Playwright com SNAPSHOT_CHANNEL=product
```

### Cobertura atual

| Camada | Ferramenta | Testes | Estado |
|---|---|---|---|
| Backend — regras de negocio | Node.js native test | 146 | Cobrindo booking, auth, admin queries/mutations, categoria, combo, site-config, cors, env, tokens, email, anti-XSS (C-040, C-047) |
| Backend — integracao | Node.js native test | 4 (skip sem DB) | Conflito de horario, lock concorrente, auth flow com banco real |
| Frontend — componentes | Vitest + Testing Library | 95 | Cobrindo agendamento, admin components, CategoriaPage, services, utils, booking-format |
| Frontend — smoke | Vitest | 2 suites | Fluxo publico e admin com mocks |
| E2E — visual regression | Playwright Chromium | Snapshots `product` | Home, login, mobile tabs, dashboard empty, agenda semanal, CSV export |

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
| Prisma | 7.7-7.8 |
| Playwright | 1.54.2 |
| Vitest | 3.2.4 |
| PostgreSQL | Neon (gerenciado) |
| Deploy frontend | Vercel (auto em main) |
| Deploy backend | Render (auto em main, `prisma migrate deploy` no start) |
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
| R-001 | API de producao nao configurada no Vercel/Render | Media | Alto | `VITE_API_URL`, `DATABASE_URL`, `JWT_SECRET`, `BREVO_API_KEY` obrigatorias por ambiente. |
| R-002 | Dependencias ficarem defasadas | Media | Medio | Dependabot semanal; majors avaliados manualmente. |
| R-003 | Divergencia documental | Media | Medio | Sweep periodico de docs vs codigo; block-register como fonte de verdade tecnica. |
| R-004 | Race condition em agendamento concorrente | Baixa | Alto | Lock advisory PostgreSQL + unique parcial `Agendamento(data) WHERE status <> 'cancelado'` (C-045). |
| R-005 | Vulnerabilidade moderada indireta via Prisma tooling | Baixa | Medio | Monitorar releases Prisma; nao aplicar downgrade automatico (A-007). |
| R-006 | Comprometimento de `JWT_SECRET` | Baixa | Alto | Politica de rotacao documentada (D008); procedimento padrao em `docs/decisoes.md`. |
| R-007 | Bug em main vai pra producao em segundos | Baixa | Alto | Cobertura alta (150 backend + 95 frontend + E2E); pausa emergencial documentada em `docs/deploy-manual-checklist.md`. |
| R-008 | Agendamento nao percebido pelo admin | Baixa | Medio | Badge de pendentes com polling 30s (A-016) + email de notificacao ao admin a cada agendamento (C-036). |
| R-009 | Render Free Tier bloqueando SMTP | Realizada | Mitigada | Brevo HTTP nativo como primario; Gmail e Resend ficam de fallback (D011). |

---

## 11. Aquisicoes e dependencias externas

| Servico | Uso | Controle |
|---|---|---|
| GitHub Actions | CI | Gates definidos em `.github/workflows/ci.yml` |
| Neon | Banco PostgreSQL gerenciado (sa-east-1 oficial) | `DATABASE_URL` por variavel de ambiente |
| Vercel | Hosting frontend (auto-deploy em main) | `VITE_API_URL`, `VITE_WHATSAPP`, `VITE_CLOUDINARY_*` obrigatorias |
| Render | Hosting backend (auto-deploy em main) | `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL` |
| Cloudinary | Upload de imagens (categoria, servico, banner, logo) | Cloud name + upload preset nao autenticado no frontend |
| Brevo | Email transacional primario (HTTP nativo) | `BREVO_API_KEY` + `BREVO_FROM_EMAIL` (D011) |
| Gmail SMTP | Fallback de email | `GMAIL_USER` + `GMAIL_APP_PASSWORD` (bloqueado em Render Free) |
| Resend | Fallback secundario de email | `RESEND_API_KEY` + `RESEND_FROM_EMAIL` |
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
| D006 | `docs/decisoes.md` | Deploy automatico desativado. **REVOGADA por D010.** |
| D007 | `docs/decisoes.md` | Politica SemVer; versao 1.0.0 alinhada em todos os packages (A-011). |
| D008 | `docs/decisoes.md` | Politica de rotacao manual de credenciais com procedimento documentado (A-020). |
| D009 | `docs/decisoes.md` | Resend como provider de email transacional. **Substituido como primario por D011** (mantido como fallback). |
| D010 | `docs/decisoes.md` + `docs/adr/ADR-003-deploy.md` | Auto-deploy frontend (Vercel) e backend (Render) a partir de main. Revoga D006 (2026-05-29). |
| D011 | `docs/decisoes.md` | Brevo como provider primario de email transacional (HTTP nativo). Gmail SMTP e Resend ficam de fallback. Render Free bloqueia SMTP (2026-05-29). |
