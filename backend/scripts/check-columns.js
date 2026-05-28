import 'dotenv/config';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const { PrismaClient } = pkg;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const servico = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Servico' ORDER BY column_name`;
console.log('Colunas em Servico:');
servico.forEach((c) => console.log(' -', c.column_name));

const agendamento = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Agendamento' ORDER BY column_name`;
console.log('\nColunas em Agendamento:');
agendamento.forEach((c) => console.log(' -', c.column_name));

await prisma.$disconnect();
