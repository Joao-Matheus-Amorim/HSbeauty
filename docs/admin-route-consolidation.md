# Consolidação das rotas administrativas

Atualizado em: 30/05/2026

## Estado atual

As rotas sob `/admin/*` são o **contrato exclusivo** do painel administrativo. As rotas legadas protegidas fora de `/admin` foram **removidas em C-029 / A-014**.

## Superfície canônica

### Agendamentos

- `GET /admin/agendamentos`
- `GET /admin/agendamentos/export` (CSV com filtros ativos)
- `GET /admin/agendamentos/:id`
- `PUT /admin/agendamentos/:id` (status, observações ou reagendamento via `data`)
- `DELETE /admin/agendamentos/:id`

Rota pública preservada (não admin):

- `POST /agendamentos`

### Serviços

Pública (preservada):

- `GET /servicos`
- `GET /servicos/:id`

Admin:

- `GET /admin/servicos`
- `GET /admin/servicos/:id`
- `POST /admin/servicos`
- `PUT /admin/servicos/:id`
- `DELETE /admin/servicos/:id`

### Categorias

Pública:

- `GET /categorias`

Admin:

- `GET /admin/categorias`
- `POST /admin/categorias`
- `PUT /admin/categorias/:id`
- `DELETE /admin/categorias/:id`

### Combos

Pública:

- `GET /combos`

Admin:

- `GET /admin/combos`
- `POST /admin/combos`
- `PUT /admin/combos/:id`
- `DELETE /admin/combos/:id`

### Bloqueios / Horários

- `GET /admin/horarios`
- `POST /admin/horarios`
- `PUT /admin/horarios/:id`
- `DELETE /admin/horarios/:id`

### SiteConfig

Pública:

- `GET /site/config` (banner, logo, horários, dias fechados)

Admin:

- `GET /admin/config`
- `PUT /admin/config`

### Dashboard admin

- `GET /admin/dashboard`

## Frontend

- `frontend/src/services/admin.js`: chamadas autenticadas para `/admin/*`.
- `frontend/src/services/agendamentos.js`: chamadas públicas (`/servicos`, `/categorias`, `/combos`, `/agendamentos`, `/disponibilidade`, `/site/config`).
- `frontend/src/services/auth.js`: `POST /auth/login`, `/auth/refresh`, `/auth/logout`.

## Rotas legadas

Removidas em C-029 / A-014 junto com:

- `protected-appointment-routes.js`
- `protected-service-routes.js`
- `block-routes.js`
- `legacy-route-deprecation.js`
- `appointment-mutation-rules.js`

Sem janela de depreciação ativa. Qualquer cliente externo que ainda chame uma rota legada recebe 404.
