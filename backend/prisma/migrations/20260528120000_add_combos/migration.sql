-- CreateTable: Combo
CREATE TABLE "Combo" (
  "id" SERIAL NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "preco" DOUBLE PRECISION NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ComboItem
CREATE TABLE "ComboItem" (
  "id" SERIAL NOT NULL,
  "comboId" INTEGER NOT NULL,
  "servicoId" INTEGER NOT NULL,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex: Combo.nome
CREATE UNIQUE INDEX "Combo_nome_key" ON "Combo"("nome");

-- CreateUniqueIndex: ComboItem(comboId, servicoId)
CREATE UNIQUE INDEX "ComboItem_comboId_servicoId_key" ON "ComboItem"("comboId", "servicoId");

-- AlterTable: Agendamento — make servicoId nullable and add comboId
ALTER TABLE "Agendamento" ALTER COLUMN "servicoId" DROP NOT NULL;
ALTER TABLE "Agendamento" ADD COLUMN "comboId" INTEGER;

-- AddForeignKey: ComboItem -> Combo (cascade delete items when combo deleted)
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey"
  FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ComboItem -> Servico (restrict: can't delete service used in combo)
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_servicoId_fkey"
  FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Agendamento -> Combo (set null when combo deleted, preserves history)
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_comboId_fkey"
  FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterForeignKey: Agendamento -> Servico (change CASCADE to SET NULL for history preservation)
ALTER TABLE "Agendamento" DROP CONSTRAINT "Agendamento_servicoId_fkey";
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_servicoId_fkey"
  FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
