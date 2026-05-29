-- Unique parcial para garantir que nao existe mais de um agendamento
-- ativo (status != 'cancelado') no mesmo timestamp 'data'.
-- O advisory lock em public-booking-routes ja protege contra a corrida
-- da janela publica, mas o painel admin nao usa o lock e pode criar
-- conflito por engano.
-- Indice parcial: cancelados ficam fora, e nao impedem reuso do slot.
CREATE UNIQUE INDEX IF NOT EXISTS "Agendamento_data_ativo_uniq"
ON "Agendamento" ("data")
WHERE "status" <> 'cancelado';
