# Contrato de regressao visual

Atualizado em: 27/05/2026

## Objetivo

Reduzir churn de snapshots Playwright sem perder cobertura de regressao visual.

## Canais de snapshot

O contrato usa dois canais distintos para isolar diferencas de renderizacao entre plataformas:

| Canal | Ambiente | Scripts |
|---|---|---|
| `product` | Linux/CI (canonical) | `npm run test:e2e --prefix frontend` |
| `windows` | Windows (dev local) | `npm run test:e2e:windows --prefix frontend` |

Snapshots seguem o formato:
- `frontend/e2e/<spec>-snapshots/<nome>-<canal>-<browser>.png`

Exemplos:
- `visual-regression.spec.js-snapshots/home-product-chromium.png` (CI)
- `visual-regression.spec.js-snapshots/home-windows-chromium.png` (Windows local)

## Canal canonico de produto

- Canal `product` e o canal oficial versionado no repositorio.
- O CI executa apenas o canal `product`.
- Snapshots `product` sao gerados em Linux e representam o estado visual de referencia.
- Nao misturar snapshots de canais diferentes no mesmo commit.

## Canal Windows (dev local)

Chromium no Windows renderiza fontes e subpixels de forma diferente do Linux/CI.
Para evitar falhas locais, desenvolvedores Windows devem usar o canal `windows`:

```powershell
# Executar testes E2E no Windows
npm run test:e2e:windows --prefix frontend

# Atualizar snapshots Windows
npm run test:e2e:update-windows --prefix frontend
```

Os arquivos `*-windows-chromium.png` sao versionados e ignorados pelo CI.

## Atualizacao de snapshots canonicos (product)

Atualizar snapshots `product` somente quando houver mudanca intencional de produto, UI ou contrato visual.

### Opcao 1 — Via workflow GitHub Actions (recomendado)

Disparar o workflow `update-snapshots.yml` manualmente no GitHub Actions (workflow_dispatch).
O workflow gera os snapshots em Linux e commita com `[skip ci]` diretamente em `main`.

### Opcao 2 — Localmente em Linux/macOS

```bash
npm run test:e2e:update --prefix frontend
```

## Bloqueio em CI

Atualizacao de snapshots em CI e bloqueada pelo `playwright.config.js` e pelo script `frontend/scripts/update-e2e-snapshots.js`.

O CI deve falhar se uma alteracao visual nao vier acompanhada de snapshot versionado e revisado.

## Criterio de revisao

Antes de commitar snapshots:

- rodar os testes E2E no canal correspondente;
- conferir se os arquivos alterados representam mudanca visual esperada;
- registrar a frente no `docs/action-register.md` quando for item de backlog.
