# HS Beauty — Sistema de Agendamento

Sistema web de agendamento para salões de beleza, studios e profissionais autônomos.
Desenvolvido para a **HS Beauty Studio** (Piabetá, Magé — RJ).

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Rodando localmente](#rodando-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)
- [Documentação](#documentação)
- [Status do projeto](#status-do-projeto)

---

## Visão geral

Clientes agendam serviços pelo navegador sem instalar nada — basta um link.
A proprietária gerencia agendamentos, serviços e bloqueios de horário via painel administrativo protegido por JWT.

**Funcionalidades do cliente:**
- Ver serviços disponíveis com preço e duração
- Escolher data, horário e serviço
- Confirmar agendamento informando nome, telefone e email (opcional)
- Receber email de confirmação automático após agendamento (quando email informado)

**Funcionalidades do painel admin:**
- Dashboard com KPIs da semana (total, pendentes, confirmados, receita)
- Listagem e gerenciamento de agendamentos com filtros e busca
- Badge numérico no nav com contagem de agendamentos pendentes (atualizado a cada 30s)
- Export de agendamentos para CSV com filtros ativos
- CRUD completo de serviços (nome, preço, ativo/inativo)
- Bloqueio de horários (férias, folga, manutenção)
- Visualização de agenda semanal (WeekCalendar) com toggle lista/calendário

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 19.x |
| Frontend | Vite | 8.x |
| Frontend | Tailwind CSS | 3.x |
| Frontend | React Router DOM | 7.x |
| Frontend | Recharts | 3.x |
| Frontend | Lucide React | 1.x |
| Backend | Node.js (ESM) | 22.x |
| Backend | Express | 5.x |
| Backend | Prisma ORM | 7.x |
| Banco | PostgreSQL (Neon) | 16.x |
| Auth | JWT + bcryptjs | — |
| Deploy | Vercel (frontend + API) | — |

---

## Estrutura do projeto

```
HSbeauty/
├── frontend/                  # Interface web (React + Vite)
│   ├── public/                # Favicons e icones publicos
│   └── src/
│       ├── components/        # Componentes reutilizaveis
│       ├── pages/             # Paginas da aplicacao
│       ├── services/          # Chamadas para a API
│       └── utils/             # Utilitarios compartilhados
├── backend/                   # API REST (Node.js + Express)
│   ├── prisma/                # Schema e migrations do banco
│   ├── scripts/               # Scripts operacionais seguros
│   ├── src/                   # Rotas, regras e bootstrap da API
│   └── test/                  # Testes unitarios de regras e contratos
├── docs/                      # Documentacao tecnica operacional
│   ├── action-register.md     # Backlog tecnico priorizado
│   ├── block-register.md      # Registro dos blocos tecnicos
│   ├── roadmap.md             # Fases e status de entrega
│   ├── technical-audit-pmbok.md
│   ├── deploy-manual-checklist.md
│   └── adr/
│       └── ADR-003-deploy.md
├── scripts/                   # Scripts utilitarios
├── dev.sh                     # Inicia frontend + backend (Linux/macOS)
├── dev.bat                    # Inicia frontend + backend (Windows)
├── package.json               # Scripts raiz do monorepo
└── vercel.json                # Configuracao de deploy Vercel
```

---

## Pré-requisitos

- **Node.js** 22.x ou superior
- **npm** 10.x ou superior
- Conta no [Neon](https://neon.tech) (banco PostgreSQL gratuito)
- Conta no [Vercel](https://vercel.com) para deploy (opcional)

---

## Rodando localmente

### 1. Clone o repositório

```bash
git clone https://github.com/Joao-Matheus-Amorim/HSbeauty.git
cd HSbeauty
```

### 2. Configure as variáveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env
# Edite backend/.env com suas credenciais (veja seção abaixo)

# Frontend
cp frontend/.env.example frontend/.env
# Edite frontend/.env com a URL do backend
```

### 3. Instale as dependências, migre o banco e crie o admin

```bash
# Instala dependências de ambos os lados
npm run install:all

# Roda as migrations do Prisma
cd backend && npx prisma migrate deploy

# Popula o banco com serviços iniciais (opcional)
node src/seed.js

# Cria o usuário administrador inicial via CLI segura
npm run create-admin -- admin@salao.com "SENHA_FORTE_AQUI"
```

> A API não permite criação de administrador por rota HTTP. A rota `/auth/register` é desativada por padrão e retorna erro permanente. Use apenas o script CLI `backend/scripts/create-admin.js` para criar administradores.

### 4. Inicie os servidores

```bash
# Linux / macOS
./dev.sh

# Windows
dev.bat

# Ou manualmente
cd backend && npm run dev   # http://localhost:3000
cd frontend && npm run dev  # http://localhost:5173
```

---

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Obrigatório | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string do PostgreSQL (Neon) |
| `JWT_SECRET` | Sim | Segredo para assinar os tokens JWT (≥32 chars) |
| `FRONTEND_URL` | Sim | Origem(s) permitida(s) no CORS. Múltiplas separadas por vírgula |
| `PORT` | — | Porta do servidor (padrão: `3000`) |
| `RESEND_API_KEY` | — | Chave de API do Resend para envio de email de confirmação |
| `RESEND_FROM_EMAIL` | — | Endereço remetente verificado no Resend (ex: `agendamentos@seudominio.com`) |

### Frontend (`frontend/.env`)

| Variável | Obrigatório | Descrição |
|---|---|---|
| `VITE_API_URL` | Sim | URL base da API backend |
| `VITE_WHATSAPP` | — | Número WhatsApp da proprietária (formato: `5521999999999`) |

---

## Deploy

O frontend é publicado no **Vercel** como site estático gerado pelo Vite.

- **Frontend**: build do Vite publicado como site estático
- **Backend/API**: URL definida por ambiente via `VITE_API_URL`
- **Deploy automático Git/Vercel**: desativado por decisão operacional para preservar limite de deploy

Consulte [`docs/adr/ADR-003-deploy.md`](docs/adr/ADR-003-deploy.md) para a decisão de arquitetura de deploy.

---

## Documentação

| Documento | Descrição |
|---|---|
| [`docs/roadmap.md`](docs/roadmap.md) | Fases, entregas e status atual |
| [`docs/technical-audit-pmbok.md`](docs/technical-audit-pmbok.md) | Auditoria técnica operacional em formato PMBOK |
| [`docs/block-register.md`](docs/block-register.md) | Registro dos blocos técnicos e seus contratos |
| [`docs/action-register.md`](docs/action-register.md) | Registro priorizado de ações técnicas |
| [`docs/deploy-manual-checklist.md`](docs/deploy-manual-checklist.md) | Checklist operacional de deploy manual |
| [`docs/decisoes.md`](docs/decisoes.md) | Decisões de produto e contexto |
| [`docs/adr/`](docs/adr/) | Architecture Decision Records |

---

## Status do projeto

**Estado:** MVP operacional — versao `1.0.0` (SemVer, politica D007).
Consulte [`docs/roadmap.md`](docs/roadmap.md) para o status detalhado de cada fase.

---

*Desenvolvido por [Joao Matheus Amorim](https://github.com/Joao-Matheus-Amorim)*
