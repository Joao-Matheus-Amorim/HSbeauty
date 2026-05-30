# Backend Governance

Este documento define como evoluir o backend do HSBeauty sem criar gaps tecnicos, dividas ocultas ou entregas pela metade.

## Principios

1. Toda mudanca deve ter escopo claro antes da implementacao.
2. Nenhum PR deve ser aberto com helper sem uso, rota parcialmente migrada ou codigo morto.
3. Toda alteracao funcional deve ter teste automatizado proporcional ao risco.
4. Todo PR deve preservar contratos publicos existentes, exceto quando a mudanca de contrato for explicita e documentada.
5. Mudancas estruturais devem ser pequenas, revisaveis e reversiveis.
6. A branch `main` deve permanecer sempre integravel.

## Definition of Ready

Antes de iniciar um PR, precisamos ter:

- objetivo do PR;
- arquivos esperados;
- rotas ou funcoes impactadas;
- comportamento que deve permanecer igual;
- comportamento que deve mudar;
- plano de validacao;
- plano de rollback.

## Definition of Done

Um PR so esta pronto quando:

- escopo foi cumprido integralmente;
- nao existem arquivos soltos sem uso;
- nao existem helpers criados sem chamada real;
- testes locais ou CI passaram;
- diff foi revisado contra o objetivo do PR;
- branch de trabalho pode ser removida apos merge;
- `main` permanece limpa.

## Gates de qualidade

Checklist minimo por PR, executado a partir da raiz do repositorio:

```powershell
npm run quality
```

O script agregado executa:

```powershell
npm ci --prefix backend
npm audit --audit-level=high --prefix backend
npm test --prefix backend
npm run prisma:generate

npm ci --prefix frontend
npm audit --audit-level=high --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

Tambem deve permanecer verde no GitHub Actions:

- Backend Prisma validation
- Frontend lint and build

Observacoes:

- A raiz possui o script `quality`, que agrega os gates de backend e frontend.
- A raiz possui o script `quality:backend`, que instala dependencias, audita vulnerabilidades high, executa testes do backend e gera o Prisma Client.
- A raiz possui o script `quality:frontend`, que instala dependencias, audita vulnerabilidades high, executa lint e build do frontend.
- A raiz possui o script `prisma:generate`, que aponta para `backend/prisma/schema.prisma`.
- Nao usar `npm test`, `npm run lint`, `npm run build` ou `npx prisma generate --schema=prisma/schema.prisma` diretamente da raiz, porque esses comandos nao representam a estrutura atual do monorepo.

## Gestao de riscos

| Risco | Mitigacao |
| --- | --- |
| Alteracao grande em `server.js` | Quebrar em PRs menores ou aplicar localmente em branch isolada |
| Branch parcial | Nao abrir PR; resetar ou deletar branch |
| Mudanca de contrato sem perceber | Documentar contrato antes e depois |
| Falha de CI | Corrigir na branch antes de merge |
| Main local suja | Usar `git fetch` + `git reset --hard origin/main` antes de iniciar bloco |

## Padrao seguro de branch local

Nunca puxar uma branch remota em cima da `main` com `git pull origin nome-da-branch`.

Padrao correto:

```powershell
cd E:\HSBeauty\HSbeauty

git fetch origin
git switch main
git reset --hard origin/main

git switch -c nome-da-branch origin/nome-da-branch
```

Se a branch local ja existir:

```powershell
cd E:\HSBeauty\HSbeauty

git fetch origin
git switch nome-da-branch
git reset --hard origin/nome-da-branch
```

## Papel de lideranca tecnica

O lider tecnico deve:

- proteger a `main`;
- evitar PR incompleto;
- priorizar entregas pequenas e completas;
- manter rastreabilidade tecnica;
- apontar riscos antes de implementar;
- rejeitar atalhos que criem divida tecnica.
