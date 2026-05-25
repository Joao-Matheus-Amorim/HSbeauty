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

`frontend/src/services/agendamentos.js` ainda contém funções administrativas legadas que apontam para rotas protegidas fora de `/admin`. Essas funções não devem ser expandidas. A migração/remoção delas deve ocorrer em bloco separado, com validação de uso real no frontend.

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
- Reescrever serviços frontend.

## Próximo bloco recomendado

Migrar/remover funções administrativas legadas de `frontend/src/services/agendamentos.js` somente após confirmar imports reais e validar que o painel usa exclusivamente `frontend/src/services/admin.js`.
