# Design system editorial — site público

Atualizado em: 30/05/2026

> O site público do HSBeauty foi reescrito em C-051 abandonando o glassmorphism cafona em favor de uma proposta **editorial premium**. Este documento descreve a paleta, tipografia e componentes que sustentam isso. Não cobre o painel admin (que segue Tailwind utilitário).

## Paleta

CSS variables em `frontend/src/index.css` e `frontend/src/glassmorphism-site.css` (nome do arquivo é histórico — o conteúdo é editorial):

| Token | Hex | Uso |
|---|---|---|
| `--paper` | `#FBF6F0` | Fundo cream principal, texto claro |
| `--ink` | `#2A1B17` | Texto escuro, CTA filled, wordmarks |
| `--gold` | `#C19660` | Acentos dourados, sparkles, réguas ornamentais, border interna de CTA |
| `--gold-deep` | `#A87B47` | Eyebrows de seção |
| `--burgundy` | `#5C2B3A` | Italic "Cuidado", ícones lipstick/lash, drop-shadows |

Gradientes recorrentes:

- **Hero bg** (warm peach com halo rosê profundo onde a foto fica):
  ```css
  background:
    radial-gradient(ellipse 58% 62% at 28% 72%, rgba(132, 78, 70, 0.32) 0%, rgba(180, 124, 108, 0.18) 35%, transparent 65%),
    radial-gradient(ellipse 70% 65% at 80% 25%, #fbeadf 0%, transparent 60%),
    linear-gradient(180deg, #fbeee5 0%, #e9cdb6 100%);
  ```
- **Hero → serviços** (continuidade warm):
  ```css
  background: linear-gradient(180deg, #e9cdb6 0%, #f1ddc8 30%, var(--paper) 100%);
  ```

## Tipografia premium

Carregada em `frontend/index.html`:

```html
<link href="https://fonts.googleapis.com/css2?
  family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..600;1,6..96,400..600
  &family=Cormorant+Garamond:ital,wght@0,400..600;1,400..600
  &family=Inter+Tight:wght@300..700
  &family=Inter:wght@300..700
  &family=Italiana
  &display=swap" rel="stylesheet" />
```

| Família | Variante | Onde aparece |
|---|---|---|
| **Bodoni Moda** (variable, opsz 96) | Display | Hero title "Cuidado / que se sente.", section titles "Escolha o cuidado." / "Cada cuidado, um detalhe." / "Reserve seu cuidado.", word italic "beleza" de fundo |
| **Italiana** | Display caps | Wordmark "HS Beauty" no topbar |
| **Cormorant Garamond Italic** | Script accent | Palavra "Cuidado" em italic dentro do title (mistura com Bodoni cria contraste de hand-script) |
| **Inter Tight** | Body / UI | Eyebrows (`STUDIO · DESDE 2019`), sub (`Unhas, cílios...`), CTA `MARCAR HORÁRIO`, place (`PIABETÁ · MAGÉ`), rating |

Regras gerais:

- All-caps eyebrows com `letter-spacing: 0.32em – 0.40em`.
- Title editorial sempre `letter-spacing: -0.012em` para condensar e ganhar peso de revista.
- Bodoni Moda usa `font-variation-settings: "opsz" 96` no display para ativar o cut grande (mais contraste high/low).

## Componentes do hero (`.editorial-hero`)

Estrutura:

```
.editorial-hero
├── .editorial-hero-word        // "beleza" italic gigante atrás de tudo (z 0)
├── .editorial-hero-volume      // "VOL. I · 2026" rotacionado 90° (selo lateral)
├── .editorial-hero-image       // SVG da proprietária bottom-left, width 55%
│   ├── .editorial-hero-img
│   └── .editorial-hero-gradient // halo radial dourado atrás dela
├── .editorial-topbar           // HS Beauty (Italiana) + PIABETÁ · MAGÉ
├── .editorial-hero-content     // bottom-right: eyebrow + rule + title + sub + CTA + rating
└── .editorial-hero-icon × N    // sparkles dourados (4-point star) + lipstick + lash em SVG inline data-URI, com `heroIconFloat` 9-14s
```

Aspect ratio: 4/5 desktop, 3/4 em `<380px`.

### CTA premium (`.editorial-cta`)

- Filled `linear-gradient(135deg, #2A1B17, #3a2620)` + texto `--paper`.
- Inner border dourada via `box-shadow inset` 35% opacity.
- Glow externo ink + drop shadow.
- Hover: vira gold filled (`#C19660 → #d4a878`) com texto ink e glow dourado.
- `align-self: flex-end` + `white-space: nowrap` (não invade a foto da proprietária).

### Ícones animados

Definidos em CSS como `background-image: url("data:image/svg+xml;utf8,<svg>...</svg>")`:

- 4 sparkles dourados (`.spark.s-1` a `.s-4`) — tamanhos 9-16px.
- 1 lipstick outline burgundy (`.lipstick.lip-1`).
- 1 lash brush burgundy (`.lash.lash-1`).

Todos com `animation: heroIconFloat 9-14s ease-in-out infinite alternate` (translate + rotate suave, delays escalonados pra dessincronizar).

## Carrossel de categorias (`.cat-carousel`)

- Scroll horizontal tátil com tilt 3D (perspective + rotate via JS conforme distância do centro).
- Backdrop com 14 partículas SVG inline (lipstick, sparkle, lips, eye, nail, mascara, mirror, bottle, lash) — animações `cat-float-*` e `cat-twinkle`.
- Cards com `--tilt`, `--depth`, `--scale`, `--opacity`, `--shift` recalculados em `rAF` no scroll.
- Dots de navegação embaixo.

## Bento gallery (`.editorial-bento`)

Grid 2 colunas × 140px com tiles `is-tall` (span 2 linhas) e `is-wide` (span 2 colunas). Imagens em hover ganham `scale(1.04)` + `filter: grayscale(0)`. **Mobile:** captions só aparecem em `:focus-visible` — gap para implementar overlay sempre visível.

## Mobile-first

- Hero: aspect ratio cai pra `3/4` em `<380px`, foto sobe pra 58% de largura, paddings reduzidos.
- Carrossel é nativo touch.
- Modal de agendamento ocupa portrait.
- `AdminLayout` tem drawer com hamburger funcional.

## Onde cada coisa mora

| Arquivo | Conteúdo |
|---|---|
| `frontend/index.html` | Imports de fontes do Google Fonts |
| `frontend/src/index.css` | Reset + CSS variables (paleta) |
| `frontend/src/glassmorphism-site.css` | Tudo do site editorial (hero, sections, bento, CTA, footer) |
| `frontend/src/components/CategoryCarousel.css` | Carrossel + partículas de fundo |
| `frontend/src/pages/CategoriaPage.css` | Página de categoria + estado vazio editorial |
| `frontend/src/components/AgendamentoModal.css` | Modal de agendamento (estilo editorial) |
| `frontend/public/hero-maiara.svg` | SVG transparente da proprietária |

## Política de evolução

- Mudanças visuais no hero ou carousel **sempre** quebram o snapshot Playwright `public-home.png`. Use o workflow `update-snapshots.yml` para regerar.
- Trocar fontes ou paleta exige mudança coordenada em `index.html` (import) + variables (`index.css`) + componentes.
- Não adicionar uma terceira família de display sem motivo claro — manter contraste Bodoni × Cormorant × Inter Tight.
