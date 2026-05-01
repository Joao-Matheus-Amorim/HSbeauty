import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DURACAO_PADRAO_SERVICO = 150; // 2h30

async function main() {
  // Serviços padrão
  const servicos = [
    { nome: 'Unhas', preco: 35, duracao: DURACAO_PADRAO_SERVICO },
    { nome: 'Cílios', preco: 140, duracao: DURACAO_PADRAO_SERVICO },
    { nome: 'Sobrancelhas', preco: 70, duracao: DURACAO_PADRAO_SERVICO },
    { nome: 'Depilação', preco: 50, duracao: DURACAO_PADRAO_SERVICO },
  ];

  for (const s of servicos) {
    await prisma.servico.upsert({
      where: { id: servicos.indexOf(s) + 1 },
      update: { duracao: DURACAO_PADRAO_SERVICO },
      create: s,
    });
  }

  // Admin padrão
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminSenha = process.env.ADMIN_SENHA;

  if (!adminEmail || !adminSenha) {
    console.log('ADMIN_EMAIL ou ADMIN_SENHA não configurado. Seed de admin ignorado.');
    console.log('Seed concluído.');
    return;
  }

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
