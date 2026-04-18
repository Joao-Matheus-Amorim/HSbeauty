import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.servico.createMany({
    data: [
      { nome: 'Unhas', preco: 35, duracao: 60 },
      { nome: 'Cílios', preco: 140, duracao: 90 },
      { nome: 'Sobrancelhas', preco: 70, duracao: 45 },
      { nome: 'Depilação', preco: 50, duracao: 45 }
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