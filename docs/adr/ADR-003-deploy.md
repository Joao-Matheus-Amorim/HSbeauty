# ADR-003 - Estrategia de deploy

Status: aceito (revisao 2026-05-29)

Data original: 27/05/2026
Revisao: 29/05/2026 - reativacao do auto-deploy

## Contexto

O projeto usa Vercel para publicar o frontend estatico gerado pelo Vite e Render para hospedar o backend Express. O frontend acessa o backend via `VITE_API_URL`, sem fallback hardcoded.

Configuracao atual em `vercel.json`:

```json
"git": {
  "deploymentEnabled": true
}
```

Configuracao backend (Render): auto-deploy ligado no servico Web (push em `main` redeploya). O script `npm start` agora roda `prisma migrate deploy` antes de subir o servidor, aplicando migrations pendentes automaticamente.

## Decisao

Manter **auto-deploy ativo** em ambas as plataformas a partir de `main`:

- **Vercel (frontend)** publica em `hsbeauty.vercel.app` a cada push em `main`.
- **Render (backend)** redeploya o servico Web a cada push em `main` e aplica migrations Prisma no boot.

Branches diferentes de `main` geram apenas Preview Deployments na Vercel, sem afetar producao.

Revisao da decisao anterior (deploy manual): o volume de pushes em `main` ficou baixo o suficiente para nao impactar limites, e a friccao do checklist manual estava atrasando entregas operacionais.

## Consequencias

Beneficios:

- Toda mudanca aprovada em `main` chega no ar sem passos manuais.
- Migrations Prisma aplicam-se sozinhas no redeploy do backend.
- Bem alinhado com o CI: PR -> CI verde -> merge -> producao.

Custos / riscos:

- Bug que passe pelo CI vai pra producao em segundos. Mitigacao: cobertura de testes (108 backend, 81 frontend, e2e Playwright) deve estar verde antes de merge.
- Variaveis de ambiente em producao (Vercel + Render) precisam ficar em dia.

## Politica operacional

Antes de mergear em `main`:

```powershell
npm run quality
```

Variaveis obrigatorias em producao:

- Vercel (frontend): `VITE_API_URL`, `VITE_WHATSAPP`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`
- Render (backend): `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `BREVO_API_KEY` (opcional, para email), `BREVO_FROM_EMAIL`

Rollback rapido: na Vercel, promover deployment anterior na UI. No Render, redeploy de um commit anterior.

## Como pausar o auto-deploy temporariamente

Se for preciso congelar publicacoes (ex.: incidente em andamento):

- Vercel: `"deploymentEnabled": false` em `vercel.json` e push.
- Render: pausar o servico no painel ou desconectar o GitHub temporariamente.

Reabilitar revertendo o ajuste.
