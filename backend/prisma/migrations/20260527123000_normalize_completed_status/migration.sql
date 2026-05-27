-- Normalize legacy completed appointment status to the canonical ASCII value.
UPDATE "Agendamento"
SET "status" = 'concluido'
WHERE "status" = 'concluído';
