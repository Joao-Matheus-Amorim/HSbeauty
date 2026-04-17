/*
  Warnings:

  - You are about to drop the column `data` on the `Agendamento` table. All the data in the column will be lost.
  - You are about to drop the column `nomeCliente` on the `Agendamento` table. All the data in the column will be lost.
  - You are about to drop the column `telefone` on the `Agendamento` table. All the data in the column will be lost.
  - Added the required column `clienteNome` to the `Agendamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataHora` to the `Agendamento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agendamento" DROP COLUMN "data",
DROP COLUMN "nomeCliente",
DROP COLUMN "telefone",
ADD COLUMN     "clienteNome" TEXT NOT NULL,
ADD COLUMN     "dataHora" TIMESTAMP(3) NOT NULL;
