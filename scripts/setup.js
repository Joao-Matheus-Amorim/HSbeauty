#!/usr/bin/env node
// scripts/setup.js — verifica .env, instala deps e gera Prisma Client
import { existsSync, readFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function run(cmd, cwd = root) {
  console.log(`\x1b[36m$ ${cmd}\x1b[0m`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// 1. Copia .env se nao existir
const files = [
  { src: 'backend/.env.example', dest: 'backend/.env' },
  { src: 'frontend/.env.example', dest: 'frontend/.env' },
];

let avisos = 0;

for (const { src, dest } of files) {
  const destPath = resolve(root, dest);
  const srcPath = resolve(root, src);
  if (!existsSync(destPath)) {
    copyFileSync(srcPath, destPath);
    console.log(`\x1b[33mAVISO: Criado ${dest} - edite as variaveis.\x1b[0m`);
    avisos++;
  } else {
    console.log(`\x1b[32mOK: ${dest} ja existe\x1b[0m`);
  }
}

// 2. Verifica DATABASE_URL
const backEnvPath = resolve(root, 'backend/.env');
let dbOk = false;
if (existsSync(backEnvPath)) {
  const content = readFileSync(backEnvPath, 'utf-8');
  const hasEmpty = content.includes('DATABASE_URL=""') || content.includes("DATABASE_URL=''") || !content.includes('DATABASE_URL');
  const hasExample = /DATABASE_URL=postgresql:\/\/user:password/.test(content);
  if (hasEmpty) {
    console.log('\x1b[31mERRO: DATABASE_URL esta vazia no backend/.env - preencha com sua string do Neon.\x1b[0m');
    avisos++;
  } else if (hasExample) {
    console.log('\x1b[31mERRO: DATABASE_URL ainda e o valor de exemplo - substitua pela sua string do Neon.\x1b[0m');
    avisos++;
  } else {
    dbOk = true;
    console.log('\x1b[32mOK: DATABASE_URL configurada\x1b[0m');
  }
}

// 3. Gera Prisma Client (necessario antes de rodar o backend)
console.log('\n\x1b[36m[Prisma] Gerando client...\x1b[0m');
try {
  run('npx prisma generate', resolve(root, 'backend'));
  console.log('\x1b[32mOK: Prisma Client gerado\x1b[0m');
} catch (e) {
  console.log('\x1b[31mERRO: Falha ao gerar Prisma Client - verifique o schema.prisma.\x1b[0m');
  avisos++;
}

// 4. Resumo
console.log('');
if (avisos === 0) {
  console.log('\x1b[32mOK: Setup completo. Rode: npm run dev\n\x1b[0m');
} else {
  console.log(`\x1b[33mAVISO: Setup concluido com ${avisos} aviso(s).\x1b[0m`);
  if (!dbOk) {
    console.log('\x1b[33m   1. Edite backend/.env e preencha DATABASE_URL com sua string do Neon\x1b[0m');
    console.log('\x1b[33m   2. Rode novamente: npm run setup\x1b[0m');
  } else {
    console.log('\x1b[33m   Corrija os avisos acima e rode: npm run dev\x1b[0m');
  }
  console.log('');
}
