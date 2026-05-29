-- CreateTable: SiteConfig (singleton, id sempre = 1)
-- Idempotente para tolerar drift onde a tabela ja existe em prod.
CREATE TABLE IF NOT EXISTS "SiteConfig" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "bannerUrl" TEXT,
  "logoUrl" TEXT,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row
INSERT INTO "SiteConfig" ("id", "atualizadoEm") VALUES (1, NOW())
ON CONFLICT ("id") DO NOTHING;
