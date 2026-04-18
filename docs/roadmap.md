# Roadmap — HSBeauty
> Atualizado em: 18/04/2026

## Fase 1 — Fundação ✅
- [x] Estruturar repositório
- [x] Criar documentação inicial (`docs/roadmap.md`, `docs/decisoes.md`)
- [x] Inicializar frontend (React + Vite)
- [x] Inicializar backend (Node.js + Express + Prisma)
- [ ] Configurar banco local com Docker

## Fase 2 — Banco de dados ✅
- [x] Modelar tabelas (`prisma/schema.prisma`)
- [x] Criar migrations (`_init`, `_add_agendamentos`, `_add_agendamento_bloqueios`)
- [x] Criar seed inicial (`backend/src/seed.js`)

## Fase 3 — Backend ✅
- [x] Configurar servidor Express (`backend/src/server.js`)
- [x] Criar rotas de agendamentos
- [x] Implementar regras de agendamento
- [x] Criar arquivo de testes HTTP (`backend/src/testes.http`)
- [ ] Implementar autenticação (JWT / login)

## Fase 4 — Frontend 🚧 Em andamento
- [x] Definir paleta e identidade visual (blush, rosé, champagne, dourado)
- [x] Criar estrutura de pastas (`pages/`, `services/`, `agendamentos/`)
- [x] Criar página `Agendamentos.jsx` com listagem, confirmação, cancelamento e exclusão
- [x] Criar componente `AgendamentoCard.jsx`
- [x] Criar serviços de API (`services/agendamendos.js`)
- [ ] Preencher `index.css` com design system completo
- [ ] Criar Home mobile-first premium (hero, serviços, galeria, CTA)
- [ ] Criar fluxo de agendamento (formulário, seleção de serviço/horário)
- [ ] Criar painel administrativo

## Fase 5 — Deploy
- [ ] Subir frontend (Vercel / Netlify)
- [ ] Subir backend (Railway / Render)
- [ ] Configurar banco em produção
