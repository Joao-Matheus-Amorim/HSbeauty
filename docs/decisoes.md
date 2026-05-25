# Decisões do Projeto

## D001 — Tipo de produto
Decisão: construir uma aplicação web, e não um app nativo.
Motivo: custo zero, acesso por navegador e facilidade de distribuição por link.

## D002 — Stack principal
Decisão: usar React no front-end e Node.js + Express no back-end.
Motivo: mesma linguagem em toda a aplicação, boa produtividade e stack valorizada no mercado.

## D003 — Banco de dados
Decisão: usar PostgreSQL.
Motivo: banco relacional robusto, gratuito e adequado para agendamentos, serviços, clientes e horários.

## D004 — Estratégia de infraestrutura
Decisão: usar Docker local para desenvolvimento.
Motivo: ambiente reproduzível, limpo e fácil de recriar.

## D005 — Restrições do projeto
Decisão: manter custo zero na versão inicial.
Motivo: requisito de negócio definido desde o início.

## D006 — Deploy Vercel manual por padrão
Decisão: desativar deployments automáticos da Vercel via integração Git.
Motivo: preservar minutos de build, evitar deploys desnecessários a cada commit/merge e reduzir risco de consumir limites da conta durante desenvolvimento iterativo.

Implementação:
- `vercel.json` define `git.deploymentEnabled` como `false`.
- Commits e merges no GitHub não devem disparar deploy automático.
- O build do frontend continua preservado no projeto por `installCommand`, `buildCommand`, `outputDirectory` e `framework`.

Política operacional:
- Validar alterações localmente e/ou por CI antes de publicar.
- Fazer deploy na Vercel apenas de forma intencional, quando houver uma versão candidata para produção.
- Não reativar deploy automático sem nova decisão documentada.

Como publicar manualmente quando necessário:
```bash
cd frontend
npm install
npm run build
```

Depois, publicar pela Vercel CLI ou painel da Vercel de forma manual e consciente.
