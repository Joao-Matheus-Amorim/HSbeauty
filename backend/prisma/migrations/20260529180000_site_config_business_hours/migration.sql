-- Adiciona campos de horario configuravel ao SiteConfig.
-- Idempotentes pra tolerar drift.
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "aberturaHora" INTEGER NOT NULL DEFAULT 9;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "fechamentoHora" INTEGER NOT NULL DEFAULT 18;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "diasFechados" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
