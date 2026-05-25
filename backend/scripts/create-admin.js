#!/usr/bin/env node
/**
 * Script CLI para criar um administrador com segurança.
 * Uso: node scripts/create-admin.js <email> <senha>
 * Nunca exponha este script via rota HTTP.
 */
import 'dotenv/config';
import pkg from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;

const [,, email, senha] = process.argv;

if (!email || !senha) {
  console.error('Uso: node scripts/create-admin.js <email> <senha>');
  console.error('Exemplo: node scripts/create-admin.js admin@salao.com MinhaSenh@Forte123');
  process.exit(1);
}

if (senha.length < 8) {
  console.error('Erro: a senha deve ter pelo menos 8 caracteres.');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Erro: DATABASE_URL não definida. Configure o arquivo .env');
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  const existe = await prisma.admin.findUnique({ where: { email } });
  if (existe) {
    console.error(`Erro: já existe um admin com o e-mail "${email}".`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(senha, 12);
  const admin = await prisma.admin.create({
    data: { email, senha: hash },
  });

  console.log(`✅ Admin criado com sucesso!`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   E-mail: ${admin.email}`);
} catch (err) {
  console.error('Erro ao criar admin:', err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
