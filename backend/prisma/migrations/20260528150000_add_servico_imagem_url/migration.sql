-- AlterTable: adicionar coluna imagemUrl em Servico
-- Idempotente: a coluna pode ja existir em ambientes onde ela foi
-- adicionada manualmente antes desta migration ser registrada.
ALTER TABLE "Servico" ADD COLUMN IF NOT EXISTS "imagemUrl" TEXT;
