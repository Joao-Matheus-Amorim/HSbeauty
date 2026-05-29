-- CreateTable Categoria
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- AlterTable Servico: nova coluna categoriaId
ALTER TABLE "Servico" ADD COLUMN "categoriaId" INTEGER;

-- Backfill: criar Categoria para cada valor distinto não-vazio do antigo Servico.categoria
INSERT INTO "Categoria" ("nome", "atualizadoEm")
SELECT DISTINCT TRIM("categoria"), NOW()
FROM "Servico"
WHERE "categoria" IS NOT NULL AND TRIM("categoria") <> ''
ON CONFLICT ("nome") DO NOTHING;

-- Backfill: vincular Servico.categoriaId à Categoria correspondente
UPDATE "Servico" s
SET "categoriaId" = c."id"
FROM "Categoria" c
WHERE c."nome" = TRIM(s."categoria");

-- Drop coluna antiga (texto livre)
ALTER TABLE "Servico" DROP COLUMN "categoria";

-- Index
CREATE INDEX "Servico_categoriaId_idx" ON "Servico"("categoriaId");

-- FK
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_categoriaId_fkey"
FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
