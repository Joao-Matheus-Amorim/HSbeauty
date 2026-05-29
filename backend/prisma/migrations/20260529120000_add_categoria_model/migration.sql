-- CreateTable Categoria (idempotente)
CREATE TABLE IF NOT EXISTS "Categoria" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Categoria_nome_key" ON "Categoria"("nome");

-- AlterTable Servico: nova coluna categoriaId (idempotente)
ALTER TABLE "Servico" ADD COLUMN IF NOT EXISTS "categoriaId" INTEGER;

-- Backfill: criar Categoria para cada valor distinto não-vazio do antigo Servico.categoria.
-- Pulado se a coluna ja foi dropada num ambiente onde o operador aplicou manualmente.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Servico' AND column_name = 'categoria'
  ) THEN
    INSERT INTO "Categoria" ("nome", "atualizadoEm")
    SELECT DISTINCT TRIM("categoria"), NOW()
    FROM "Servico"
    WHERE "categoria" IS NOT NULL AND TRIM("categoria") <> ''
    ON CONFLICT ("nome") DO NOTHING;

    UPDATE "Servico" s
    SET "categoriaId" = c."id"
    FROM "Categoria" c
    WHERE s."categoriaId" IS NULL AND c."nome" = TRIM(s."categoria");

    ALTER TABLE "Servico" DROP COLUMN "categoria";
  END IF;
END$$;

-- Index (idempotente)
CREATE INDEX IF NOT EXISTS "Servico_categoriaId_idx" ON "Servico"("categoriaId");

-- FK (so adiciona se ainda nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Servico' AND constraint_name = 'Servico_categoriaId_fkey'
  ) THEN
    ALTER TABLE "Servico" ADD CONSTRAINT "Servico_categoriaId_fkey"
    FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
