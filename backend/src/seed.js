import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Serviços padrão
  const servicos = [
    { nome: 'Unhas', preco: 35, duracao: 60 },
    { nome: 'Cílios', preco: 140, duracao: 90 },
    { nome: 'Sobrancelhas', preco: 70, duracao: 45 },
    { nome: 'Depilação', preco: 50, duracao: 45 },
  ];

  for (const s of servicos) {
    await prisma.servico.upsert({
      where: { id: servicos.indexOf(s) + 1 },
      update: {},
      create: s,
    });
  }

  // Admin padrão
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hsbeauty.com';
  const adminSenha = process.env.ADMIN_SENHA || 'hsbeauty123';
  const existe = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!existe) {
    const hash = await bcrypt.hash(adminSenha, 10);
    await prisma.admin.create({ data: { email: adminEmail, senha: hash } });
    console.log(`Admin criado: ${adminEmail}`);
  } else {
    console.log(`Admin já existe: ${adminEmail}`);
  }

  console.log('Seed concluído.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
