# Integridade do agendamento público

## Objetivo

Garantir que clientes públicos possam solicitar horários sem controlar campos administrativos do agendamento e sem criar reservas fora das regras operacionais.

## Regra principal

Todo agendamento criado pela rota pública `POST /agendamentos` deve nascer com status `pendente`.

O cliente público não pode definir status como `confirmado`, `cancelado` ou `concluído` no corpo da requisição.

## Contrato público de criação

`POST /agendamentos` aceita apenas os campos públicos necessários:

- `nomeCliente`: texto obrigatório, não vazio.
- `telefone`: texto obrigatório em formato brasileiro válido, como `(11) 98765-4321`, `11987654321`, `11 98765-4321` ou `+5511987654321`.
- `data`: data e hora obrigatórias em formato parseável por JavaScript/ISO, representando exatamente o início do horário escolhido.
- `servicoId`: identificador numérico inteiro positivo de serviço ativo.
- `observacoes`: texto opcional com limite de 500 caracteres.

Campos administrativos enviados pelo cliente público devem ser ignorados pela criação pública. O status criado pelo backend é sempre `pendente`.

## Regras de validação de horário

A criação pública deve respeitar as mesmas regras usadas por `GET /disponibilidade`:

1. O serviço precisa existir e estar ativo.
2. A data deve pertencer à semana atual calculada pelo backend.
3. O horário deve estar dentro do expediente configurado: `09:00` até `18:00`.
4. O início do horário deve estar alinhado ao grid operacional de 30 minutos.
5. A duração do serviço não pode ultrapassar o fim do expediente.
6. O horário não pode conflitar com agendamentos não cancelados nem bloqueios ativos.

## Fluxo esperado

1. Cliente escolhe serviço, data e horário disponível.
2. Frontend envia nome, telefone, data, servicoId e observações opcionais.
3. Backend valida telefone, semana atual, serviço ativo, grid de horário, horário comercial e conflito de agenda.
4. Backend cria o agendamento com status `pendente`.
5. Admin autenticado altera o status depois pelo painel.

## Campos administrativos

Mudanças de status são responsabilidade de rotas autenticadas, como `PUT /agendamentos/:id` ou rotas `/admin` equivalentes.

## Fora do escopo atual

- Pagamento online.
- Confirmação automática por WhatsApp.
- Aprovação automática por regra de negócio.
- Notificações ao cliente/admin.
- Alteração de banco ou migration.
- Mudança visual no frontend.
