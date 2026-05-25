# Consolidação das rotas administrativas

## Objetivo

Definir a superfície canônica das rotas administrativas do HSBeauty sem quebrar compatibilidade imediatamente.

## Decisão

As rotas sob `/admin/*` são o contrato canônico para o painel administrativo.

Rotas protegidas antigas fora de `/admin` continuam existindo apenas como compatibilidade temporária até que a aplicação esteja totalmente migrada e haja validação suficiente para remoção segura.

## Mapeamento atual

### Agendamentos

Contrato canônico:

- `GET /admin/agendamentos`
- `GET /admin/agendamentos/:id`
- `PUT /admin/agendamentos/:id`
- `DELETE /admin/agendamentos/:id`

Rotas legadas protegidas:

- `GET /agendamentos`
- `GET /agendamentos/:id`
- `PUT /agendamentos/:id`
- `DELETE /agendamentos/:id`

Rota pública preservada:

- `POST /agendamentos`

`POST /agendamentos` não é rota administrativa. Ela pertence ao fluxo público de reserva e deve continuar fora de `/admin`.

### Serviços

Contrato público preservado:

- `GET /servicos`
- `GET /servicos/:id`

Contrato canônico administrativo:

- `GET /admin/servicos`
- `GET /admin/servicos/:id`
- `POST /admin/servicos`
- `PUT /admin/servicos/:id`
- `DELETE /admin/servicos/:id`

Rotas legadas protegidas:

- `POST /servicos`
- `PUT /servicos/:id`
- `DELETE /servicos/:id`

As rotas públicas de leitura de serviços devem continuar disponíveis para landing/agendamento.

### Bloqueios / Horários

Contrato canônico administrativo:

- `GET /admin/horarios`
- `POST /admin/horarios`
- `PUT /admin/horarios/:id`
- `DELETE /admin/horarios/:id`

Rotas legadas protegidas:

- `GET /bloqueios`
- `POST /bloqueios`
- `DELETE /bloqueios/:id`

## Frontend

O painel administrativo novo deve usar `frontend/src/services/admin.js`, que aponta para `/admin/*`.

`frontend/src/services/agendamentos.js` deve ficar restrito ao fluxo público. Funções administrativas devem viver em `frontend/src/services/admin.js`.

## Headers de depreciação

Rotas administrativas legadas devem receber aviso HTTP não disruptivo enquanto continuarem disponíveis.

Headers esperados:

- `Deprecation: true`
- `Sunset: Wed, 30 Sep 2026 23:59:59 GMT`
- `X-HSBeauty-Deprecated-Route: Use the equivalent /admin route`

Esses headers não devem ser aplicados em rotas públicas reais, como `GET /servicos`, `GET /servicos/:id`, `POST /agendamentos` e `GET /disponibilidade`.

## Política de depreciação

1. Não remover rotas legadas sem confirmar que nenhum fluxo produtivo depende delas.
2. Não misturar remoção de rota com mudança de UI ou banco.
3. Preferir um bloco intermediário para adicionar aviso de depreciação não disruptivo nas respostas HTTP.
4. Só remover rotas legadas depois de documentação, PR dedicado e CI verde.

## Fora do escopo deste bloco

- Remover rotas legadas.
- Alterar UI.
- Alterar banco ou migrations.
- Alterar contrato público de agendamento.

## Próximo bloco recomendado

Remover rotas administrativas legadas somente depois de confirmar uso zero e manter um PR dedicado para remoção.
