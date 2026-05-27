# Checklist de deploy manual

Atualizado em: 27/05/2026

## 1) Preflight

- [ ] Branch `main` sincronizada localmente:
  - `git switch main`
  - `git pull --ff-only origin main`
- [ ] CI do commit alvo em verde no GitHub Actions.
- [ ] Validacao local executada:
  - `npm test --prefix backend`
  - `npm test --prefix frontend`
  - `npm run lint --prefix frontend`
  - `npm run build --prefix frontend`
- [ ] Variaveis de ambiente conferidas:
  - `VITE_API_URL`
  - `VITE_WHATSAPP`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `FRONTEND_URL`
  - `RESEND_API_KEY` (opcional — necessario para email de confirmacao)
  - `RESEND_FROM_EMAIL` (opcional — necessario para email de confirmacao)

## 2) Publicacao no frontend (Vercel)

- [ ] Confirmar que `git.deploymentEnabled` permanece `false` em `vercel.json`.
- [ ] Iniciar deploy manual da versao candidata no painel da Vercel.
- [ ] Registrar no log operacional:
  - SHA publicado
  - data/hora do deploy
  - responsavel

## 3) Smoke check pos-deploy

- [ ] Site publico abre sem erro de carregamento.
- [ ] Fluxo minimo de agendamento:
  - selecionar servico
  - selecionar dia/horario
  - concluir envio
- [ ] Login admin funciona.
- [ ] Lista de agendamentos no admin carrega sem erro.
- [ ] Endpoint de API responde para origem publicada.

## 4) Rollback

- [ ] Identificar ultimo SHA estavel em `main`.
- [ ] Reimplantar manualmente o SHA estavel na Vercel.
- [ ] Validar smoke check novamente.
- [ ] Registrar causa, impacto e acao corretiva em `docs/action-register.md`.

## 5) Encerramento

- [ ] Atualizar `docs/roadmap.md` e `docs/action-register.md` quando houver mudanca de status.
- [ ] Se houver incidente, abrir item especifico no backlog tecnico.
