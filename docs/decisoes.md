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

## D006 — Deploy Vercel manual por padrão
Decisão: desativar deployments automáticos da Vercel via integração Git.
Motivo: preservar minutos de build, evitar deploys desnecessários a cada commit/merge e reduzir risco de consumir limites da conta durante desenvolvimento iterativo.

Implementação:
- `vercel.json` define `git.deploymentEnabled` como `false`.
- Commits e merges no GitHub não devem disparar deploy automático.
- O build do frontend continua preservado no projeto por `installCommand`, `buildCommand`, `outputDirectory` e `framework`.

Política operacional:
- Validar alterações localmente e/ou por CI antes de publicar.
- Fazer deploy na Vercel apenas de forma intencional, quando houver uma versão candidata para produção.
- Não reativar deploy automático sem nova decisão documentada.

Como publicar manualmente quando necessário:
```bash
cd frontend
npm install
npm run build
```

Depois, publicar pela Vercel CLI ou painel da Vercel de forma manual e consciente.

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
