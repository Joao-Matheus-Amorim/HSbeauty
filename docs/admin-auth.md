# Contrato de autenticação admin

## Objetivo

Padronizar a sessão administrativa entre frontend e backend para evitar token salvo incorretamente, sessão zumbi e logout sem revogação.

## Endpoints

### Login

`POST /auth/login`

Body:

```json
{
  "email": "admin@example.com",
  "senha": "senha"
}
```

Resposta de sucesso:

```json
{
  "accessToken": "jwt",
  "refreshToken": "token-opaco",
  "expiresIn": 900,
  "admin": {
    "id": 1,
    "email": "admin@example.com"
  }
}
```

O frontend deve salvar `accessToken` em `hs_token`, `refreshToken` em `hs_refresh_token` e o admin em `hs_admin`.

### Refresh

`POST /auth/refresh`

Body:

```json
{
  "refreshToken": "token-opaco"
}
```

Resposta de sucesso:

```json
{
  "accessToken": "novo-jwt",
  "refreshToken": "novo-token-opaco",
  "expiresIn": 900
}
```

O backend revoga o refresh token anterior e emite outro. O frontend deve substituir os tokens salvos.

### Logout

`POST /auth/logout`

Body:

```json
{
  "refreshToken": "token-opaco"
}
```

O backend revoga o refresh token. O frontend deve limpar `hs_token`, `hs_refresh_token` e `hs_admin` mesmo se a chamada de logout falhar.

## Comportamento esperado no frontend

- Todas as chamadas admin devem usar `authorizedFetch`.
- Ao receber `401`, o frontend tenta renovar a sessão uma vez.
- Se o refresh falhar, a sessão local é limpa.
- Logout sempre tenta revogar o refresh token antes de limpar a sessão local.

## Armazenamento atual

A sessão continua em `sessionStorage`, portanto é apagada ao fechar a aba/sessão do navegador.

## Fora do escopo atual

- Cookies HttpOnly.
- CSRF token.
- Rotação por device/session metadata.
- Tela de expiração de sessão.

Esses itens podem entrar em um bloco futuro de hardening avançado.
