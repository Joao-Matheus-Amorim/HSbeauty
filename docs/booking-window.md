# Janela pública de agendamento

Atualizado em: 30/05/2026

## Regra

A janela pública de agendamento cobre **semana atual + 2 semanas seguintes = 3 semanas totais**.

A constante que governa isso é `BOOKING_WEEKS_AHEAD` em `backend/src/booking-rules.js`. Hoje vale `2`.

> Histórico: até C-053 a janela era de 1 semana (apenas semana atual). C-054 ampliou para 3 semanas porque o front já mostrava o sub-modal "+ Mais datas" e a regra de backend rejeitava as semanas seguintes, gerando a falsa sensação de "horário indisponível".

## Helpers

`backend/src/booking-rules.js`:

```js
export const BOOKING_WEEKS_AHEAD = 2; // semana atual + 2 = 3 semanas total

export function isDateInBookingWindow(date, referenceDate = new Date(), weeksAhead = BOOKING_WEEKS_AHEAD) {
  // ...
}

export function isDateInPublicBookingWindow(date) {
  return isDateInBookingWindow(date, new Date());
}
```

`getWeekBounds(referenceDate)` retorna o início da semana corrente (segunda-feira local) e `isDateInBookingWindow` adiciona `7 * (weeksAhead + 1) - 1` dias ao início para obter o fim da janela.

## Quem aplica a regra

- `backend/src/availability-service.js`: dia fora da janela vira `409 — Data fora da janela de agendamento.` no cálculo de slots.
- `backend/src/public-booking-routes.js`: `POST /agendamentos` rejeita data fora da janela com o mesmo erro.
- `frontend/src/components/AgendamentoModal.jsx`: o calendário expande até 3 semanas no sub-modal "+ Mais datas".

## Como mudar a janela

Se quiser ampliar (ex.: 4 semanas), alterar `BOOKING_WEEKS_AHEAD = 3`. A mudança propaga para backend e frontend (que importa a mesma constante via `frontend/src/constants.js`? — não; o frontend hoje gera as semanas localmente). Verificar o gerador de semanas no modal antes de alterar.

## Interação com outras regras

A janela só define **quais dias o cliente pode escolher**. Dentro da janela, outras regras continuam valendo (em ordem de aplicação):

1. `SiteConfig.diasFechados` — dia da semana bloqueado → `Fechado neste dia.`
2. `BloqueioHorario` — bloqueio ativo no intervalo → slot indisponível.
3. Conflito com agendamento não cancelado existente → slot ocupado.
4. Horário fora de `SiteConfig.aberturaHora`/`fechamentoHora` → slot inexistente.
5. Slot não alinhado ao grid de 30 minutos → 400.
6. Duração do serviço ultrapassa o fim do expediente → slot inexistente.

Detalhes em [`public-booking-integrity.md`](public-booking-integrity.md).

## Testes que protegem a regra

- `backend/test/booking-rules.test.js`: cobre `isDateInBookingWindow` com semana atual, semana +1, semana +2 e semana +3 (fora).
- `backend/test/availability-service.test.js`: cobre o cálculo de slots ao longo das 3 semanas + erro fora da janela.
