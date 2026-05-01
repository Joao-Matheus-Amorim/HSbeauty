# Roadmap — HSBeauty
> Atualizado em: 18/04/2026

## Fase 1 — Fundação
- [x] Estruturar repositório (frontend/, backend/, docs/)
- [x] Criar documentação inicial (`docs/roadmap.md`, `docs/decisoes.md`)
- [x] Inicializar frontend (React 19 + Vite)
- [x] Inicializar backend (Node.js + Express + Prisma + Neon PostgreSQL)
- [ ] Configurar banco local com Docker (opcional — usando Neon em nuvem)

## Fase 2 — Banco de dados
- [x] Modelar tabelas: `Servico`, `Agendamento`, `BloqueioHorario`
- [x] Migration inicial (`20260417182143_init`)
- [x] Migration de agendamentos (`20260417191546_add_agendamentos`)
- [x] Migration de bloqueios (`20260417233323_add_agendamento_bloqueios`)
- [x] Criar seed inicial com serviços (`backend/src/seed.js`)

## Fase 3 — Backend
- [x] Configurar servidor Express com Prisma + Neon adapter
- [x] CRUD completo de Serviços (`GET /servicos`, `POST`, `PUT`, `DELETE`)
- [x] CRUD completo de Agendamentos (`GET /agendamentos`, `POST`, `PUT`, `DELETE`)
- [x] Regras de negócio: horário comercial (09h–19h), conflito de horários, sobreposição
- [x] Cálculo de disponibilidade por dia e serviço (`GET /api/disponibilidade`)
- [x] CRUD de Bloqueios de Horário (`GET /api/bloqueios`, `POST /api/bloqueios`)
- [x] Arquivo de testes HTTP (`backend/src/testes.http`)
- [ ] Implementar autenticação (JWT / login para painel admin)

## Fase 4 — Frontend (Em andamento)
- [x] Definir paleta e identidade visual (blush, rosé, champagne, dourado)
- [x] Criar estrutura de pastas (`pages/`, `services/`, `agendamentos/`)
- [x] Criar página `Agendamentos.jsx` com listagem, confirmação, cancelamento e exclusão
- [x] Criar componente `AgendamentoCard.jsx`
- [x] Criar serviços de API (`services/agendamendos.js`)
- [ ] Preencher `index.css` com design system completo
- [ ] Criar Home mobile-first premium (hero, serviços, galeria, CTA)
- [ ] Criar fluxo de agendamento público (seleção de serviço → horário → confirmação)
- [ ] Integrar `GET /api/disponibilidade` no fluxo de agendamento
- [ ] Criar painel administrativo (gerenciar agendamentos, serviços e bloqueios)

## Fase 5 — Deploy
- [ ] Configurar variáveis de ambiente (`.env`) para produção
- [ ] Subir frontend (Vercel / Netlify)
- [ ] Subir backend (Railway / Render)
- [x] Banco já em nuvem (Neon PostgreSQL)
- [ ] Configurar domínio e HTTPS
- [ ] Testes finais de ponta a ponta