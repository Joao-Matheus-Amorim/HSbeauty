import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.servico.createMany({
    data: [
      { nome: 'Corte feminino', preco: 60, duracao: 60 },
      { nome: 'Escova', preco: 45, duracao: 40 },
      { nome: 'Manicure', preco: 35, duracao: 50 }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });