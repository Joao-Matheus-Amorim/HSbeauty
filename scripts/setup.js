#!/usr/bin/env node
// scripts/setup.js — verifica .env e orienta o desenvolvedor
import { existsSync, readFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

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
    console.log(`\x1b[33m⚠ Criado ${dest} a partir de ${src} — edite as variáveis!\x1b[0m`);
    avisos++;
  } else {
    console.log(`\x1b[32m✓ ${dest} já existe\x1b[0m`);
  }
}

// Verifica DATABASE_URL no backend .env
const backEnvPath = resolve(root, 'backend/.env');
if (existsSync(backEnvPath)) {
  const content = readFileSync(backEnvPath, 'utf-8');
  if (content.includes('DATABASE_URL=""') || content.includes("DATABASE_URL=''") || !content.includes('DATABASE_URL')) {
    console.log('\x1b[31m✗ DATABASE_URL está vazia no backend/.env — preencha com sua string do Neon!\x1b[0m');
    avisos++;
  } else if (content.match(/DATABASE_URL=postgresql:\/\/user:password/)) {
    console.log('\x1b[31m✗ DATABASE_URL ainda é o valor de exemplo — substitua pela sua string do Neon!\x1b[0m');
    avisos++;
  }
}

if (avisos === 0) {
  console.log('\x1b[32m\n✓ Setup completo! Rode: npm run dev\n\x1b[0m');
} else {
  console.log(`\x1b[33m\n⚠ Setup concluído com ${avisos} aviso(s). Edite os .env antes de rodar npm run dev\n\x1b[0m`);
}
