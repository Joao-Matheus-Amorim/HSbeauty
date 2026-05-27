# Contrato de regressao visual

Atualizado em: 27/05/2026

## Objetivo

Reduzir churn de snapshots Playwright sem perder cobertura de regressao visual.

## Canal canonico

- Canal canonico de produto: `SNAPSHOT_CHANNEL=product`.
- O CI executa apenas o canal `product`.
- Snapshots canonicos seguem o formato:
  - `frontend/e2e/<spec>-snapshots/<nome>-product-<browser>.png`

## Atualizacao permitida

Atualizar snapshots somente quando houver mudanca intencional de produto, UI ou contrato visual.

Comando local:

```powershell
npm run test:e2e:update --prefix frontend
```

Opcionalmente, para um canal paralelo:

```powershell
$env:SNAPSHOT_CHANNEL='experimento'; npm run test:e2e:update --prefix frontend
```

## Bloqueio em CI

Atualizacao de snapshots em CI e bloqueada pelo `playwright.config.js` e pelo script `frontend/scripts/update-e2e-snapshots.js`.

O CI deve falhar se uma alteracao visual nao vier acompanhada de snapshot versionado e revisado.

## Criterio de revisao

Antes de commitar snapshots:

- rodar `npm run test:e2e --prefix frontend`;
- conferir se os arquivos alterados representam mudanca visual esperada;
- registrar a frente no `docs/action-register.md` quando for item de backlog.
