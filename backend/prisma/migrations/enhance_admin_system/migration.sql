-- AlterTable
ALTER TABLE "Servico" ADD COLUMN "descricao" TEXT,
ADD COLUMN "categoria" TEXT,
ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Agendamento" ADD COLUMN "email" TEXT,
ADD COLUMN "hora" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN "observacoes" TEXT,
ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "BloqueioHorario" RENAME COLUMN "inicio" TO "dataInicio";
ALTER TABLE "BloqueioHorario" RENAME COLUMN "fim" TO "dataFim";
ALTER TABLE "BloqueioHorario" ADD COLUMN "horaInicio" TEXT,
ADD COLUMN "horaFim" TEXT,
ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "nome" TEXT,
ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Servico_nome_key" ON "Servico"("nome");
