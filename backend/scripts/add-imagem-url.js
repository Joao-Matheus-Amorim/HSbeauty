import 'dotenv/config';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const { PrismaClient } = pkg;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

await prisma.$executeRawUnsafe(`ALTER TABLE "Servico" ADD COLUMN IF NOT EXISTS "imagemUrl" TEXT`);
console.log('OK: coluna imagemUrl adicionada na tabela Servico');

await prisma.$disconnect();
