# Backend Refactor Roadmap

Este roadmap organiza a evolucao do backend do HSBeauty com entregas pequenas, seguras e testaveis.

## Estado atual

O backend ja possui helpers testaveis para varias regras:

- booking rules publicas;
- mutacoes de agendamento;
- queries administrativas;
- servicos administrativos;
- horarios administrativos;
- dashboard administrativo;
- CORS;
- env config;
- payloads de auth;
- respostas HTTP.

O principal gargalo restante e o `backend/src/server.js`, que ainda concentra muitas responsabilidades.

## Problema central

`server.js` ainda mistura:

- bootstrap do Express;
- env/config;
- CORS;
- rate limit;
- JWT;
- refresh token;
- auth middleware;
- rotas auth;
- rotas publicas de servicos;
- rotas publicas de agendamento;
- disponibilidade;
- rotas legadas;
- montagem do admin router;
- `app.listen`.

Isso torna mudancas pequenas mais arriscadas e dificulta revisao.

## Arquitetura alvo

Estrutura desejada:

```text
backend/src/
  server.js
  app.js
  prisma-client.js
  config/
    cors.js
    env.js
    rate-limit.js
  middleware/
    auth.js
  routes/
    auth-routes.js
    public-service-routes.js
    public-booking-routes.js
    availability-routes.js
    legacy-routes.js
  services/
    token-service.js
    availability-service.js
  rules/
    *.js
```

Observacao: a migracao pode manter temporariamente os arquivos atuais no raiz de `src/` para reduzir risco. A reorganizacao em pastas deve acontecer somente quando as dependencias estiverem claras.

## Fase 0 — Governanca e documentacao

Objetivo:

- documentar processo;
- documentar arquitetura alvo;
- documentar ordem de execucao;
- impedir PRs incompletos.

Entregas:

- `docs/BACKEND_GOVERNANCE.md`
- `docs/BACKEND_REFACTOR_ROADMAP.md`

Criterio de aceite:

- documentacao mergeada;
- nenhum codigo funcional alterado;
- branch parcial antiga descartada.

## Fase 1 — Preparar extracao de auth

Objetivo:

- reduzir risco antes de mover rotas auth.

Entregas recomendadas:

- extrair rate limit config para helper usado;
- extrair token service se necessario;
- criar testes de contrato para helper de token quando viavel.

Criterio de aceite:

- comportamento de `/auth/login`, `/auth/refresh`, `/auth/logout` permanece igual;
- nenhum helper fica sem uso.

## Fase 2 — Extrair rotas auth

Objetivo:

- mover `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` para modulo dedicado.

Arquivo alvo inicial:

```text
backend/src/auth-routes.js
```

Formato esperado:

```js
export function createAuthRouter({ prisma, jwtSecret }) {
  // retorna express.Router()
}
```

Alteracao esperada no `server.js`:

```js
import { createAuthRouter } from './auth-routes.js';

app.use('/auth', createAuthRouter({ prisma, jwtSecret: JWT_SECRET }));
```

Criterio de aceite:

- `server.js` perde o bloco inline de auth;
- rotas continuam com os mesmos caminhos publicos;
- testes existentes passam;
- CI verde.

## Fase 3 — Extrair rotas publicas de servicos

Objetivo:

- mover `GET /servicos` e `GET /servicos/:id` para modulo dedicado.

Arquivo alvo inicial:

```text
backend/src/public-service-routes.js
```

Criterio de aceite:

- filtros `ativo` continuam validados;
- servico inativo por ID continua retornando 404;
- contrato publico preservado.

## Fase 4 — Extrair disponibilidade e agendamento publico

Objetivo:

- separar calculo de disponibilidade das rotas.

Arquivos alvo:

```text
backend/src/availability-service.js
backend/src/public-booking-routes.js
backend/src/availability-routes.js
```

Criterio de aceite:

- slots continuam respeitando expediente;
- conflitos continuam considerando agendamentos e bloqueios;
- agendamento permanece restrito a semana atual;
- testes de regras continuam passando.

## Fase 5 — Extrair middleware auth

Objetivo:

- mover `authMiddleware` para modulo proprio.

Arquivo alvo:

```text
backend/src/auth-middleware.js
```

Criterio de aceite:

- rotas protegidas continuam exigindo Bearer token;
- mensagens `Token não fornecido` e `Token inválido ou expirado` preservadas.

## Fase 6 — Criar app factory

Objetivo:

- separar montagem do app do `listen`.

Arquivos alvo:

```text
backend/src/app.js
backend/src/server.js
```

`server.js` final esperado:

```js
import 'dotenv/config';
import { createApp } from './app.js';
import { assertRequiredEnv } from './env-config-rules.js';

assertRequiredEnv(process.env);

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

Criterio de aceite:

- `server.js` vira bootstrap;
- `app.js` vira composition root;
- testes podem importar app sem abrir porta.

## Ordem recomendada dos proximos PRs

1. `docs: add backend governance and refactor roadmap`
2. `refactor: extract auth routes`
3. `refactor: extract public service routes`
4. `refactor: extract availability service`
5. `refactor: extract public booking routes`
6. `refactor: extract auth middleware`
7. `refactor: introduce app factory`

## Politica de rollback

Para cada PR:

- usar squash merge;
- manter escopo pequeno;
- se CI falhar, corrigir na branch;
- se comportamento divergir, reverter o PR inteiro;
- nunca empilhar PR novo sobre branch quebrada.

## Branches descartaveis conhecidas

Branches parciais ou experimentais nao devem ser usadas como base:

- `refactor-auth-routes`, caso exista com arquivo `auth-routes.js` sem uso real;
- `extract-login-rate-limit-config`, caso exista com helper sem uso real.

Essas branches devem ser apagadas antes de seguir com a refatoracao funcional.
