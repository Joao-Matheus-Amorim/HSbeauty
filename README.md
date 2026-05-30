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
- Hero editorial com foto da proprietária + tipografia premium (Bodoni Moda / Italiana / Inter Tight) — ver [`docs/editorial-design-system.md`](docs/editorial-design-system.md)
- Carrossel 3D tilt de **categorias** (Unhas, Cílios, Sobrancelhas, Depilação, Spa Labial — totalmente configurável pelo admin, com botão "Criar categorias padrão" no painel)
- Página dedicada por categoria em `/c/:categoriaId` com lista de sub-serviços (substituiu o antigo drawer — C-052) e estado vazio editorial "Em breve" com CTA WhatsApp
- Combos (pacotes de serviços) listados em seção própria
- Escolher dia dentro da janela pública de **3 semanas** (atual + 2 — ver [`docs/booking-window.md`](docs/booking-window.md)) e horário inline na mesma tela
- Expediente dinâmico via SiteConfig (`aberturaHora`, `fechamentoHora`, `diasFechados`) — admin altera no painel sem mexer no código
- Disponibilidade pré-buscada em paralelo: dias sem vaga aparecem riscados com badge "cheio"
- Máscara automática de telefone, validação de email e telefone por campo
- Email de confirmação automático ao cliente após agendamento (cadeia Brevo → Gmail → Resend, D011)

**Funcionalidades do painel admin:**
- Dashboard com KPIs do mês (total, status, receita, top serviços, total hoje)
- Listagem e gerenciamento de agendamentos com filtros, busca, export CSV, **reagendar** via modal (C-049)
- Badge numérico no nav com contagem de pendentes (polling 30s) + email de notificação ao admin a cada novo agendamento
- CRUD de **Categorias** (nome, imagem, ordem, ativo) com botão "Criar categorias padrão" (seed 1-clique, C-053) — categoria é obrigatória para serviço aparecer no carrossel público
- CRUD de **Serviços** com seleção de categoria via dropdown dinâmico e botão "+ Adicionar" inline
- CRUD de **Combos** com itens
- CRUD de **Site Config** (banner e logo via Cloudinary + expediente `aberturaHora`/`fechamentoHora` + `diasFechados` toggle por dia)
- Bloqueio de horários (férias, folga, manutenção)
- Visualização de agenda semanal (WeekCalendar) com toggle lista/calendário
- Drawer mobile com hamburger funcional no `AdminLayout`

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 19.x |
| Frontend | Vite | 8.x |
| Frontend | Tailwind CSS (admin) | 3.x |
| Frontend | React Router DOM | 7.x |
| Frontend | Recharts | 3.x |
| Frontend | Lucide React | 1.x |
| Backend | Node.js (ESM) | 22.x |
| Backend | Express | 5.x |
| Backend | Prisma ORM | 7.7-7.8 |
| Banco | PostgreSQL (Neon, sa-east-1 oficial) | 16.x |
| Auth | JWT + bcryptjs + refresh token rotativo | — |
| Email | Brevo (HTTP) → Gmail SMTP → Resend (fallback chain, D011) | — |
| Deploy frontend | Vercel (auto em `main`) | — |
| Deploy backend | Render (auto em `main`, `prisma migrate deploy` no boot) | — |

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
| `DATABASE_URL` | Sim | Connection string do PostgreSQL (Neon, sa-east-1 oficial) |
| `JWT_SECRET` | Sim | Segredo para assinar os tokens JWT (≥32 chars) |
| `FRONTEND_URL` | Sim | Origem(s) permitida(s) no CORS. Múltiplas separadas por vírgula |
| `PORT` | — | Porta do servidor (padrão: `3000`) |
| `TZ` | — | Timezone do servidor (padrão setado pelo `server.js`: `America/Sao_Paulo`) |

#### Email transacional (D011 — Brevo é o provider primário; Gmail e Resend são fallbacks em cadeia)

| Variável | Obrigatório | Descrição |
|---|---|---|
| `BREVO_API_KEY` | Sim (provider primário) | Chave API gerada em Brevo → SMTP & API |
| `BREVO_FROM_EMAIL` | Sim | Remetente verificado no Brevo |
| `BREVO_FROM_NAME` | — | Nome de exibição (default: `HSBeauty Studio`) |
| `ADMIN_NOTIFICATION_EMAIL` | Sim | Email do admin que recebe cada novo agendamento |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | — | Fallback SMTP (Render Free bloqueia SMTP, então geralmente fica vazio) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | — | Fallback secundário |

### Frontend (`frontend/.env`)

| Variável | Obrigatório | Descrição |
|---|---|---|
| `VITE_API_URL` | Sim | URL base da API backend |
| `VITE_WHATSAPP` | — | Número WhatsApp da proprietária (formato: `5521999999999`) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Sim no admin | Cloud name do Cloudinary para upload de imagens (categoria, serviço, banner, logo) |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Sim no admin | Upload preset não autenticado configurado no Cloudinary |

---

## Deploy

- **Frontend** publicado no **Vercel** (`hsbeauty.vercel.app`) — auto-deploy ativo a cada push em `main`.
- **Backend** hospedado no **Render** — auto-deploy ativo; `npm start` roda `prisma migrate deploy && node src/server.js`.
- Branches diferentes de `main` geram Preview Deployments na Vercel; produção só muda quando `main` muda.

Consulte [`docs/adr/ADR-003-deploy.md`](docs/adr/ADR-003-deploy.md) para a decisão atualizada e [`docs/deploy-manual-checklist.md`](docs/deploy-manual-checklist.md) para pausa emergencial e rollback.

---

## Documentação

| Documento | Descrição |
|---|---|
| [`docs/roadmap.md`](docs/roadmap.md) | Fases, entregas e status atual |
| [`docs/technical-audit-pmbok.md`](docs/technical-audit-pmbok.md) | Auditoria técnica operacional em formato PMBOK |
| [`docs/block-register.md`](docs/block-register.md) | Registro dos blocos técnicos e seus contratos |
| [`docs/action-register.md`](docs/action-register.md) | Registro priorizado de ações técnicas (P0–P3) |
| [`docs/decisoes.md`](docs/decisoes.md) | Decisões de produto e contexto (D001–D011) |
| [`docs/booking-window.md`](docs/booking-window.md) | Regra da janela pública de 3 semanas (atual + 2) |
| [`docs/public-booking-integrity.md`](docs/public-booking-integrity.md) | Contrato do agendamento público |
| [`docs/admin-route-consolidation.md`](docs/admin-route-consolidation.md) | Superfície canônica `/admin/*` |
| [`docs/admin-auth.md`](docs/admin-auth.md) | Contrato de auth admin (login/refresh/logout) |
| [`docs/error-handling.md`](docs/error-handling.md) | Padrão de erros e logging do backend |
| [`docs/editorial-design-system.md`](docs/editorial-design-system.md) | Paleta, tipografia e componentes editoriais do site público |
| [`docs/BACKEND_GOVERNANCE.md`](docs/BACKEND_GOVERNANCE.md) | Governança do backend (DoR/DoD, gates) |
| [`docs/BACKEND_REFACTOR_ROADMAP.md`](docs/BACKEND_REFACTOR_ROADMAP.md) | Histórico do refactor `server.js` → `app.js` |
| [`docs/ci-governance.md`](docs/ci-governance.md) | Jobs ativos, política de audit, snapshots |
| [`docs/visual-regression-contract.md`](docs/visual-regression-contract.md) | Canais `product` / `windows` de snapshots Playwright |
| [`docs/deploy-manual-checklist.md`](docs/deploy-manual-checklist.md) | Procedimento de pausa emergencial e rollback |
| [`docs/adr/ADR-003-deploy.md`](docs/adr/ADR-003-deploy.md) | ADR da estratégia de deploy (auto em `main`) |
| [`docs/plano_arquitetura_admin.md`](docs/plano_arquitetura_admin.md) | Histórico de planejamento do painel admin |

---

## Status do projeto

**Estado:** MVP operacional — versao `1.0.0` (SemVer, politica D007).
Consulte [`docs/roadmap.md`](docs/roadmap.md) para o status detalhado de cada fase.

---

*Desenvolvido por [Joao Matheus Amorim](https://github.com/Joao-Matheus-Amorim)*
