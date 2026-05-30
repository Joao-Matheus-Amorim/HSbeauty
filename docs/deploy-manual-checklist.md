# Procedimento de pausa emergencial e rollback

Atualizado em: 30/05/2026

> **Estado atual: deploy é AUTOMÁTICO em `main`** desde D010 (2026-05-29). Este documento cobre apenas pausa emergencial e rollback. Para o checklist operacional histórico, ver o git log deste arquivo antes de 2026-05-29.

## Estado canônico de deploy

- **Frontend** publicado em Vercel — push em `main` publica produção. Branches diferentes geram Preview Deployments.
- **Backend** hospedado em Render — push em `main` redeploya. `npm start` roda `prisma migrate deploy && node src/server.js`, aplicando migrations pendentes no boot.
- **Banco** Neon/PostgreSQL (sa-east-1 oficial).
- Política completa em [`adr/ADR-003-deploy.md`](adr/ADR-003-deploy.md) e [`decisoes.md`](decisoes.md#d010--auto-deploy-frontend-e-backend-a-partir-de-main-2026-05-29).

## Antes de mergear em `main`

CI valida automaticamente. Se quiser validar local:

```powershell
npm run quality
```

Variáveis obrigatórias em produção:

- **Vercel (frontend):** `VITE_API_URL`, `VITE_WHATSAPP`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`
- **Render (backend):** `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`

## Smoke check pós-deploy

Quando quiser validar manualmente que o deploy entrou bem:

- [ ] Site público abre sem erro.
- [ ] Carrossel de categorias carrega.
- [ ] Fluxo público de agendamento (selecionar serviço → dia → horário → enviar) funciona.
- [ ] Login admin funciona.
- [ ] Listagem de agendamentos no admin carrega.
- [ ] Endpoint backend responde (`GET /servicos` na origem publicada).

## Pausa emergencial (incidente em andamento)

### Vercel (frontend)

Editar `vercel.json`:

```json
"git": {
  "deploymentEnabled": false
}
```

Commit + push. A partir desse push, novos commits em `main` não publicam.

Reabilitar revertendo o ajuste para `true`.

### Render (backend)

Pausar o serviço pelo painel Render (Settings → Suspend Service) ou desconectar o GitHub temporariamente.

## Rollback rápido

### Vercel

1. Painel Vercel → Deployments → escolher último deployment estável.
2. Menu (⋯) → **Promote to Production**.
3. Validar smoke check.

### Render

1. Painel Render → Service → Deploys.
2. Escolher último deploy estável → **Redeploy this deploy**.
3. `prisma migrate deploy` roda automaticamente; reverter migration manualmente se for o caso.
4. Validar smoke check.

## Encerramento do incidente

- [ ] Registrar causa, impacto e ação corretiva em [`action-register.md`](action-register.md).
- [ ] Se houver mudança de estado de bloco, atualizar [`block-register.md`](block-register.md).
- [ ] Se houver mudança de fase, atualizar [`roadmap.md`](roadmap.md).
