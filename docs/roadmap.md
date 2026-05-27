# Roadmap - HSBeauty

Atualizado em: 27/05/2026

## Fase 1 - Fundacao

Estado: concluida.

- [x] Estruturar repositorio com `frontend/`, `backend/` e `docs/`.
- [x] Inicializar frontend React/Vite.
- [x] Inicializar backend Node/Express.
- [x] Definir documentacao operacional inicial.

## Fase 2 - Banco de dados

Estado: concluida para MVP.

- [x] Modelar `Servico`.
- [x] Modelar `Agendamento`.
- [x] Modelar `BloqueioHorario`.
- [x] Modelar `Admin`.
- [x] Modelar `RefreshToken`.
- [x] Criar migrations Prisma.
- [x] Criar seed inicial de servicos.

Pendencias futuras:

- [ ] Avaliar indices para consultas por data, status e servico.
- [ ] Definir ambiente de staging.

## Fase 3 - Backend

Estado: operacional.

- [x] Configurar Express com Prisma e Neon adapter.
- [x] Criar rotas publicas de servicos.
- [x] Criar rota publica de agendamento.
- [x] Criar rota publica de disponibilidade: `GET /disponibilidade`.
- [x] Criar autenticacao admin com JWT e refresh token rotativo.
- [x] Criar rotas admin canonicas sob `/admin/*`.
- [x] Manter rotas protegidas legadas com headers de depreciacao.
- [x] Proteger criacao publica contra corrida por lock transacional por dia.
- [x] Cobrir regras principais com testes unitarios.

Pendencias futuras:

- [ ] Criar testes de integracao com banco real/staging.
- [ ] Definir criterio para remover rotas legadas fora de `/admin`.

## Fase 4 - Frontend

Estado: operacional.

- [x] Criar site publico.
- [x] Criar fluxo de agendamento publico.
- [x] Integrar servicos e disponibilidade.
- [x] Criar painel admin.
- [x] Criar login admin.
- [x] Criar dashboard, agenda, servicos e horarios.
- [x] Separar bundle publico/admin por lazy loading.
- [x] Remover assets versionados sem uso.

Pendencias futuras:

- [ ] Criar teste E2E do fluxo publico.
- [ ] Criar teste E2E do fluxo admin.
- [ ] Otimizar imagens remanescentes.

## Fase 5 - CI e qualidade

Estado: operacional.

- [x] CI roda em PR para `main`.
- [x] CI roda em push para `main`.
- [x] Frontend executa audit, lint, test e build.
- [x] Backend executa audit, Prisma generate e testes reais.
- [x] Script raiz `npm run quality` valida backend e frontend.

Pendencias futuras:

- [ ] Habilitar Dependabot com cadencia controlada.
- [ ] Criar quality gate E2E.

## Fase 6 - Deploy

Estado: manual/controlado.

- [x] Vercel configurado para build estatico do frontend.
- [x] Deploy automatico por Git desativado por decisao operacional.
- [x] Frontend exige `VITE_API_URL` em ambiente publicado.
- [x] Banco em Neon/PostgreSQL.

Pendencias futuras:

- [ ] Criar checklist de release manual.
- [ ] Definir ambiente staging.
- [ ] Documentar rollback.

