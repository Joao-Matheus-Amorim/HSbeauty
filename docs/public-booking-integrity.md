# Integridade do agendamento público

## Objetivo

Garantir que clientes públicos possam solicitar horários sem controlar campos administrativos do agendamento.

## Regra principal

Todo agendamento criado pela rota pública `POST /agendamentos` deve nascer com status `pendente`.

O cliente público não pode definir status como `confirmado`, `cancelado` ou `concluído` no corpo da requisição.

## Fluxo esperado

1. Cliente escolhe serviço, data e horário disponível.
2. Frontend envia nome, telefone, data, servicoId e observações opcionais.
3. Backend valida telefone, semana atual, serviço ativo, horário comercial e conflito de agenda.
4. Backend cria o agendamento com status `pendente`.
5. Admin autenticado altera o status depois pelo painel.

## Campos administrativos

Mudanças de status são responsabilidade de rotas autenticadas, como `PUT /agendamentos/:id` ou rotas `/admin` equivalentes.

## Fora do escopo atual

- Pagamento online.
- Confirmação automática por WhatsApp.
- Aprovação automática por regra de negócio.
- Notificações ao cliente/admin.
