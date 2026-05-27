# Governanca de CI e manutencao

Atualizado em: 27/05/2026

---

## Jobs ativos no CI

### Job `frontend`

Roda em: PR para `main` e push para `main`.

```
npm ci
npm audit --audit-level=high
npm run lint
npm test            # 81 testes Vitest
npm run build
```

### Job `backend`

Roda em: PR para `main` e push para `main`.

```
npm ci
npm audit --audit-level=high
npx prisma generate --schema=prisma/schema.prisma
npm test            # 117 testes Node.js native
```

### Job `frontend-e2e`

Roda em: PR para `main` e push para `main`.

```
npm ci
npx playwright install --with-deps chromium
npm run test:e2e    # 6 testes Playwright com SNAPSHOT_CHANNEL=product
```

---

## Contrato de snapshots visuais

- Snapshots versionados por canal via `SNAPSHOT_CHANNEL` (padrao: `product`).
- Nomes de arquivo: `{arg}-{channel}-{projectName}{ext}` (ex: `admin-login-product-chromium.png`).
- Atualizacao de snapshots bloqueada em CI (`CI=true` impede execucao do script).
- Para atualizar snapshots localmente: `npm run test:e2e:update` (em `frontend/`).
- Documentacao operacional: `docs/visual-regression-contract.md`.

---

## Politica de audit

- Nivel `high` bloqueia o CI: vulnerabilidades high e critical impedem merge.
- Vulnerabilidades moderate e low nao bloqueiam; devem ser avaliadas em PRs de manutencao.
- Dependabot monitora todos os escopos (raiz, backend, frontend, GitHub Actions).

---

## Politica de PR

- Escopo claro por PR: um objetivo funcional por vez.
- Infraestrutura e documentacao relacionada podem ficar juntas quando fazem parte do mesmo objetivo.
- Mudancas de runtime, API, banco ou UI devem ser separadas quando aumentam risco.
- Todo PR deve incluir no corpo: o que foi feito, como foi validado e qual teste cobre.

---

## Politica de Dependabot

- Cadencia: semanal, segunda-feira 08:00 America/Sao_Paulo.
- Escopos monitorados: raiz do monorepo, `backend`, `frontend`, GitHub Actions.
- Atualizacoes major de npm: ignoradas por padrao (PR manual).
- Atualizacoes minor/patch de npm: agrupadas por escopo.
- Cada PR do Dependabot passa pelos mesmos gates de CI antes de merge.

---

## Politica de testes

- `forbidOnly: true` no Playwright config bloqueia `test.only` acidental em CI.
- Testes de snapshot so podem ser atualizados localmente; CI rejeita `--update-snapshots`.
- Smoke tests existem para fluxo publico e admin no Vitest; E2E Playwright cobre regressao visual.

---

## Deploy e custos

- Deploy automatico Vercel permanece desabilitado para preservar limite de builds (decisao D006).
- Build de CI valida o codigo; nao e autorizacao automatica de deploy.
- Deploy intencional: seguir `docs/deploy-manual-checklist.md`.
