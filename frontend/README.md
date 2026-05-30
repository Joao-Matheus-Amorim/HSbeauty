# HSBeauty — Frontend

Aplicação React 19 + Vite 8 que cobre o site público e o painel administrativo do HS Beauty Studio.

## Setup

```bash
npm install
cp .env.example .env
# editar .env conforme abaixo
npm run dev
```

Dev server sobe em `http://localhost:5173`. Hot reload via Vite.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Build estático para `dist/` |
| `npm run preview` | Servir o build local |
| `npm run lint` | ESLint |
| `npm test` | Vitest (run) |
| `npm run test:smoke` | Apenas testes smoke público + admin |
| `npm run test:watch` | Vitest em watch |
| `npm run coverage` | Cobertura V8 |
| `npm run test:e2e` | Playwright (`SNAPSHOT_CHANNEL=product`, Linux/CI) |
| `npm run test:e2e:windows` | Playwright Windows local |
| `npm run test:e2e:update` | Atualizar snapshots (Linux/macOS) |
| `npm run test:e2e:update-windows` | Atualizar snapshots Windows |

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_API_URL` | Sim | URL base do backend |
| `VITE_WHATSAPP` | — | Número WhatsApp da proprietária (`5521999999999`) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Sim no admin | Cloud name para upload (categoria, serviço, banner, logo) |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Sim no admin | Upload preset não autenticado |

## Estrutura

```
src/
├── App.jsx                    # Site público (hero editorial + carrossel + galeria)
├── AppRoutes.jsx              # Rotas: /, /c/:categoriaId, /admin
├── main.jsx
├── constants.js               # WHATSAPP, fallbacks de servico/categoria
├── glassmorphism-site.css     # CSS editorial do site publico
├── index.css                  # Reset + variaveis globais (paper, ink, gold, burgundy)
├── components/
│   ├── AgendamentoModal.jsx   # Modal publico 3 passos (servico → dia/hora → confirmacao)
│   ├── CategoryCarousel.jsx   # Carrossel 3D tilt com particulas de fundo
│   ├── AdminLayout.jsx        # Layout do painel com drawer mobile (hamburger funcional)
│   ├── Dashboard.jsx          # KPIs + chart Recharts + estado vazio
│   ├── AppointmentManager.jsx # Listagem, filtros, export CSV, toggle calendario, reagendar
│   ├── WeekCalendar.jsx       # Agenda semanal sem dependencias externas
│   ├── ServiceManager.jsx     # CRUD servicos (com categoria dropdown)
│   ├── CategoriaManager.jsx   # CRUD categorias + botao "Criar categorias padrao"
│   ├── ComboManager.jsx       # CRUD combos
│   ├── ScheduleManager.jsx    # CRUD bloqueios de horario
│   └── SiteConfigManager.jsx  # Banner, logo, expediente (abertura/fechamento), dias fechados
├── pages/
│   ├── Admin.jsx              # Painel admin (lazy)
│   ├── AdminLogin.jsx
│   └── CategoriaPage.jsx      # /c/:id - substitui o antigo CategoryDrawer (C-052)
├── services/
│   ├── api.js                 # URL resolver + parseJsonResponse
│   ├── auth.js                # login, refresh, logout (sessionStorage)
│   ├── agendamentos.js        # publico: servicos, categorias, combos, disponibilidade, agendamento
│   └── admin.js               # admin: dashboard, agendamentos, servicos, categorias, combos, horarios, config
├── hooks/
│   └── useDisponibilidadeCache.js
├── utils/
│   └── booking-format.js
└── __tests__/smoke/           # Testes smoke publico + admin
```

## Design system editorial

Documentado em [`../docs/editorial-design-system.md`](../docs/editorial-design-system.md). Resumo:

- **Tipografia premium:** Bodoni Moda (display variable, opsz 96), Italiana (wordmark), Inter Tight (body/UI), Cormorant Garamond italic (script accent).
- **Paleta:** `--paper #FBF6F0`, `--ink #2A1B17`, `--gold #C19660`, `--burgundy #5C2B3A`.
- **Hero:** SVG transparente da proprietária à esquerda + texto à direita + word italic "beleza" gigante de fundo + sparkles dourados/lipstick/lash em SVG inline animados.
- **CTA premium:** pill filled ink → hover gold, com gold inner border e drop-shadow.

## Testes de regressão visual

Snapshots versionados por canal (`product` Linux/CI vs `windows` dev local). Detalhes em [`../docs/visual-regression-contract.md`](../docs/visual-regression-contract.md).

## Mobile-first

Tudo no site público é mobile-first responsivo:

- Phone-frame envelope no `App.jsx`.
- Hero com aspect 4/5 desktop / 3/4 mobile <380px.
- Carrossel touch-drag.
- AdminLayout com drawer mobile via hamburger.
- AgendamentoModal em viewport portrait.
