#!/usr/bin/env node
import 'dotenv/config';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;

const [,, email, novaSenha] = process.argv;

if (!email || !novaSenha) {
  console.error('Uso: node scripts/reset-admin-password.js <email> <nova-senha>');
  process.exit(1);
}

if (novaSenha.length < 8) {
  console.error('Erro: a senha deve ter pelo menos 8 caracteres.');
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    console.error(`Erro: admin "${email}" nao encontrado.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(novaSenha, 12);
  await prisma.admin.update({ where: { email }, data: { senha: hash } });
  console.log(`OK: Senha do admin "${email}" atualizada com sucesso.`);
} catch (err) {
  console.error('Erro:', err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
