# Governanca de CI e manutencao

Este projeto usa CI para evitar falso verde e proteger a branch principal.

## Gates atuais

Frontend:

- npm ci
- npm audit --audit-level=high
- npm run lint
- npm run build

Backend:

- npm ci
- npm audit --audit-level=high
- npx prisma generate --schema=prisma/schema.prisma

## Politica de audit

O nivel high bloqueia vulnerabilidades high e critical.

Vulnerabilidades moderate e low nao bloqueiam o CI por padrao. Elas devem ser avaliadas em PRs de manutencao para evitar ruído e atualizacoes quebradas sem necessidade.

## Politica de PR

PRs devem ter escopo claro. Infraestrutura e documentacao relacionada podem ficar juntas quando fazem parte do mesmo objetivo.

Mudancas de runtime, API, banco ou UI devem ser separadas quando aumentam risco ou dificultam review.

## Deploy e custos

O deploy automatico da Vercel deve permanecer desabilitado para preservar limite de builds.

Build de CI valida o codigo, mas nao deve ser tratado como autorizacao automatica de deploy.
