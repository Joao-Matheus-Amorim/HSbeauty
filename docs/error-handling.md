# Padrão de erros e logging do backend

## Objetivo

Padronizar como o backend responde erros HTTP e registra falhas internas sem alterar o contrato público atual.

## Contrato de resposta

O contrato público de erro permanece:

```json
{ "erro": "Mensagem pública" }
```

Esse formato deve ser mantido para não quebrar frontend ou clientes existentes.

## Status HTTP

- `400`: payload inválido, parâmetro inválido ou campo obrigatório ausente.
- `401`: autenticação ausente, inválida ou expirada.
- `404`: recurso inexistente ou indisponível para aquela operação.
- `409`: conflito de regra de negócio ou restrição conhecida, como horário indisponível ou duplicidade.
- `410`: endpoint intencionalmente desativado.
- `500`: erro interno inesperado.

## Mensagens públicas

Mensagens retornadas ao cliente devem ser claras, mas não devem vazar stack trace, SQL, detalhes internos do Prisma, tokens, secrets ou credenciais.

## Logging interno

Falhas internas devem ser registradas por `logError` ou `handleInternalError`, com contexto mínimo:

- operação/rota lógica;
- método HTTP;
- path requisitado;
- mensagem do erro;
- código técnico quando existir.

Stack trace só deve aparecer fora de produção.

## Helpers

Arquivo: `backend/src/http-response.js`

- `sendError(res, status, message)`: responde `{ erro: message }` com o status informado.
- `logError(context, error, req)`: registra erro interno com contexto.
- `handleInternalError(res, error, context, publicMessage, req)`: registra e responde `500` com mensagem pública.
- `handlePrismaConflict(res, error, conflictMessage)`: converte erro Prisma `P2002` em `409` conhecido.

## Regras do projeto

1. Não mascarar erro: erro interno deve ser logado com contexto.
2. Não vazar detalhe sensível para o cliente.
3. Não alterar status HTTP sem motivo explícito.
4. Não mudar mensagens públicas existentes sem necessidade.
5. Não criar framework de observabilidade maior que a necessidade atual.
