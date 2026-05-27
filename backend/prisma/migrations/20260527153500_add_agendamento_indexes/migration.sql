-- Add query indexes for the main appointment read paths.
CREATE INDEX IF NOT EXISTS "Agendamento_data_idx"
ON "Agendamento"("data");

CREATE INDEX IF NOT EXISTS "Agendamento_status_idx"
ON "Agendamento"("status");

CREATE INDEX IF NOT EXISTS "Agendamento_servicoId_idx"
ON "Agendamento"("servicoId");

CREATE INDEX IF NOT EXISTS "Agendamento_status_data_idx"
ON "Agendamento"("status", "data");
