# Decisões do Projeto

## D001 — Tipo de produto
Decisão: construir uma aplicação web, e não um app nativo.
Motivo: custo zero, acesso por navegador e facilidade de distribuição por link.

## D002 — Stack principal
Decisão: usar React no front-end e Node.js + Express no back-end.
Motivo: mesma linguagem em toda a aplicação, boa produtividade e stack valorizada no mercado.

## D003 — Banco de dados
Decisão: usar PostgreSQL.
Motivo: banco relacional robusto, gratuito e adequado para agendamentos, serviços, clientes e horários.

## D004 — Estratégia de infraestrutura
Decisão original: usar Docker local para desenvolvimento.
Status atual: substituída operacionalmente por Neon/PostgreSQL em nuvem para o banco de desenvolvimento.
Motivo: simplificar setup local e manter custo baixo durante a fase atual.

## D005 — Restrições do projeto
Decisão: manter custo zero na versão inicial.
Motivo: requisito de negócio definido desde o início.

## D006 — Deploy Vercel manual por padrão (REVOGADA)

> **Status: revogada em 2026-05-29 pela D010.** O `vercel.json` está com `deploymentEnabled: true` e cada push em `main` publica automaticamente. Render também faz auto-deploy com `prisma migrate deploy` no boot. Veja D010 e `docs/adr/ADR-003-deploy.md` para a política em vigor.

Decisão original: desativar deployments automáticos da Vercel via integração Git.

Motivo original: preservar minutos de build e reduzir risco de consumir limites da conta durante desenvolvimento iterativo.

Por que foi revogada: o volume de pushes em `main` ficou baixo o suficiente para não impactar limites, e a fricção do checklist manual estava atrasando entregas operacionais. CI + cobertura de testes deu confiança suficiente para liberar automação.

## D007 — Politica de versionamento (A-011)

Decisao: adotar SemVer com versao de produto unica alinhada entre `package.json` raiz, backend e frontend.

Versao inicial de produto: `1.0.0` (MVP operacional).

Regras:
- **Patch** (`x.x.Z`): correcao de bug, ajuste de documentacao ou dependencia.
- **Minor** (`x.Y.0`): nova funcionalidade sem quebra de contrato de API ou UI.
- **Major** (`X.0.0`): mudanca de contrato de API, schema de banco ou arquitetura que exija migracao.

Implementacao:
- Os tres `package.json` (raiz, `backend/`, `frontend/`) devem ter a mesma versao a cada release.
- A versao e atualizada manualmente antes do merge de release; nao e automatizada.
- O commit de bump segue o padrao: `chore: bump version to X.Y.Z`.

## D008 — Politica de rotacao de credenciais (A-020)

Decisao: rotacao manual documentada com procedimento padrao. Nao ha rotacao automatica na fase atual.

### Credenciais sob controle

| Credencial | Onde fica | Como rotacionar |
|---|---|---|
| `JWT_SECRET` | Variavel de ambiente no servidor de backend (Render, Railway ou similar) | Ver procedimento abaixo |
| `DATABASE_URL` | Variavel de ambiente no servidor de backend + Vercel (se usado) | Ver procedimento abaixo |
| Token de deploy Vercel | Painel Vercel | Revogar e regenerar no painel Vercel → Settings → Tokens |

### Quando rotacionar

- Suspeita de comprometimento (vazamento de credencial, acesso nao autorizado).
- Saida de pessoa com acesso as variaveis de ambiente.
- Rotina preventiva: recomendado a cada 6 meses.

### Procedimento de rotacao do `JWT_SECRET`

1. Gerar novo segredo aleatorio seguro (minimo 64 caracteres): `openssl rand -hex 64`
2. Atualizar a variavel `JWT_SECRET` no painel do provedor de backend.
3. Reiniciar o servidor de backend para aplicar.
4. Efeito imediato: todos os tokens de acesso e refresh existentes ficam invalidos. Admins precisarao fazer login novamente.
5. Registrar a rotacao em `docs/action-register.md` com data e motivo.

### Procedimento de rotacao do `DATABASE_URL`

1. Acessar o painel Neon → Branch → Reset password (ou criar novo usuario).
2. Atualizar `DATABASE_URL` no painel do provedor de backend e no Vercel (se usado para migracao).
3. Reiniciar o servidor de backend.
4. Executar `npx prisma generate` localmente para confirmar conexao com novo DSN.
5. Registrar a rotacao em `docs/action-register.md` com data e motivo.

## D009 — Provider de email para confirmacao de agendamento (A-017)

Decisao: usar **Resend** como provider de email transacional para confirmacao de agendamento ao cliente.

Motivo: plano gratuito de 3.000 emails/mes e 100/dia e suficiente para o volume atual; SDK oficial para Node.js; API simples sem configuracao de SMTP; dominio verificado via DNS permite sender customizado.

### Variaveis de ambiente necessarias no backend

| Variavel | Exemplo | Descricao |
|---|---|---|
| `RESEND_API_KEY` | `re_abc123...` | Chave de API gerada no painel Resend |
| `RESEND_FROM_EMAIL` | `agendamentos@seudominio.com` | Endereco remetente verificado no Resend |

### Comportamento

- O campo **email** e opcional no formulario de agendamento publico.
- Se o cliente nao fornecer email, ou se as variaveis de ambiente nao estiverem configuradas, o envio e silenciosamente ignorado — o agendamento e criado normalmente.
- O envio e fire-and-forget: falha no envio do email nao afeta a resposta HTTP do agendamento.
- O email enviado contem: servico, data formatada em pt-BR (America/Sao_Paulo) e horario.

### Como ativar em producao

1. Criar conta em resend.com (plano gratuito).
2. Verificar dominio no painel Resend → Domains.
3. Gerar API Key em Resend → API Keys.
4. Configurar `RESEND_API_KEY` e `RESEND_FROM_EMAIL` como variaveis de ambiente no provedor de backend.

## D010 — Auto-deploy frontend e backend a partir de main (2026-05-29)

Decisao: ativar auto-deploy em ambas as plataformas a partir da branch `main`. Revoga D006.

Implementacao:
- `vercel.json`: `git.deploymentEnabled: true`. Push em `main` publica producao. Branches diferentes geram Preview Deployments.
- Render (backend): auto-deploy ligado. `npm start` foi alterado para `prisma migrate deploy && node src/server.js`, aplicando migrations pendentes antes de subir.
- Migrations sao idempotentes (uso de `IF NOT EXISTS` e blocos `DO $$ ... $$`) para tolerar drift em ambientes onde foram aplicadas manualmente.

Como pausar publicacoes em incidente:
- Vercel: editar `vercel.json` para `deploymentEnabled: false` e fazer push.
- Render: pausar o servico no painel.

Detalhes operacionais em `docs/adr/ADR-003-deploy.md`.

## D011 — Provider de email: Brevo (revisao de D009) (2026-05-29)

Decisao: trocar **Resend** por **Brevo** como provider primario de email transacional, com Gmail SMTP e Resend como fallbacks em cadeia.

Motivo: Render Free Tier bloqueia trafego SMTP em algumas portas, o que impedia o Gmail/SMTP de funcionar de forma confiavel. Brevo oferece API HTTP nativa (POST `/v3/smtp/email`) que passa pelo Render sem problema, plano gratuito de 300 emails/dia (suficiente para o volume atual) e SDK nao obrigatorio (basta `fetch`).

Cadeia de fallback (definida em `backend/src/email-service.js`):

1. `BREVO_API_KEY` + `BREVO_FROM_EMAIL` → primeira tentativa.
2. `GMAIL_USER` + `GMAIL_APP_PASSWORD` → fallback para ambientes sem bloqueio SMTP.
3. `RESEND_API_KEY` + `RESEND_FROM_EMAIL` → fallback final.

Cada provider tem timeout de 15s para nao travar a request do agendamento.

### Variaveis em producao (Render)

| Variavel | Obrigatoria? | Descricao |
|---|---|---|
| `BREVO_API_KEY` | Sim (provider primario) | Chave gerada em Brevo → SMTP & API |
| `BREVO_FROM_EMAIL` | Sim | Endereco remetente verificado no Brevo |
| `BREVO_FROM_NAME` | Nao | Nome de exibicao (default: `HSBeauty Studio`) |
| `ADMIN_NOTIFICATION_EMAIL` | Sim | Email do admin que recebe notificacao de novo agendamento |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Opcional | Fallback SMTP |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Opcional | Fallback secundario |

D009 fica em registro historico — Resend continua suportado como fallback mas nao e mais o primario.
