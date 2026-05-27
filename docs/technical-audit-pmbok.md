# Auditoria tecnica operacional - PMBOK

Atualizado em: 27/05/2026

## 1. Sumario executivo

O projeto HSBeauty esta em estado funcional de desenvolvimento avancado. A linha de base atual passa em qualidade local e CI no GitHub. As ultimas frentes reduziram risco operacional em CI, concorrencia de agendamento, configuracao de API e bundle inicial do frontend.

Resultado da validacao executada:

```text
npm run quality
backend tests: 105 passed
frontend lint: passed
frontend build: passed
frontend audit high: 0 high/critical
backend audit high: 0 high/critical
```

O backlog tecnico restante nao bloqueia desenvolvimento, mas deve ser tratado por frentes pequenas, rastreaveis e documentadas.

## 2. Escopo

Incluido nesta auditoria:

- Backend Express, Prisma, auth, rotas publicas e admin.
- Frontend React, rotas, services, bundle, assets e testes.
- Banco PostgreSQL/Neon via Prisma.
- CI GitHub Actions.
- Deploy manual Vercel/frontend e API via URL configurada.
- Documentacao operacional existente.
- Dependencias npm e vulnerabilidades conhecidas.

Fora de escopo nesta rodada:

- Testes contra banco real de producao.
- Auditoria de infraestrutura Neon/Vercel por console.
- Teste visual manual em navegador.
- Teste de carga.

## 3. Integracao

Estado de integracao:

- `main` remoto consolidado ate PR #132.
- CI verde nos merges recentes.
- Deploy automatico Vercel permanece desativado por decisao operacional.
- Fluxo recomendado permanece branch curta, PR, CI verde, merge manual.

Controle recomendado:

- Uma frente por PR.
- Nao misturar refactor, ajuste funcional e documentacao sem justificativa.
- Todo PR deve citar validacao executada.

## 4. Escopo funcional por bloco

| Bloco | Estado | Observacao |
|---|---|---|
| Agendamento publico | Funcional | Usa disponibilidade, validacao e lock transacional por dia. |
| Servicos publicos | Funcional | Listagem e detalhe por id. |
| Painel admin | Funcional | Dashboard, agendamentos, servicos e horarios. |
| Auth admin | Funcional | Login, refresh token rotativo e logout. |
| Bloqueios/horarios | Funcional | Rotas autenticadas e painel integrado. |
| CI | Funcional | Backend agora executa testes reais via `npm test`. |
| Deploy | Controlado | Vercel Git deploy desativado para preservar limite. |

## 5. Cronograma operacional

Prioridade P0:

- Nenhum item aberto identificado como bloqueador imediato.

Prioridade P1:

- Fechar documentacao divergente entre README, roadmap e rotas reais.
- Atualizar dependencias patch/minor seguras.
- Revisar issue #78 e fechar se o filtro de data ja estiver coberto.
- Revisar issue #80 e fechar se o tratamento de resposta de API ja estiver coberto.

Prioridade P2:

- Habilitar Dependabot com cadencia controlada.
- Criar referencia formal de API.
- Planejar testes de integracao com banco real/staging.
- Criar checklist de release/deploy manual.

## 6. Custos e restricoes

Restricoes conhecidas:

- Manter custo zero/baixo.
- Evitar deploy automatico por limite de build.
- Usar Neon/PostgreSQL.
- Evitar aumento de complexidade operacional prematuro.

Impacto:

- Deploy manual exige disciplina de checklist.
- Dependencias devem ser atualizadas em lotes pequenos para evitar regressao.

## 7. Qualidade

Gates atuais:

```text
npm test --prefix backend
npm test --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
npm audit --audit-level=high --prefix backend
npm audit --audit-level=high --prefix frontend
npx prisma generate --schema=backend/prisma/schema.prisma
```

Resultado atual:

- Backend: 105 testes.
- Frontend: 77 testes.
- Build frontend sem aviso de chunk acima de 500 KB.
- Backend audit possui 3 vulnerabilidades moderadas indiretas ligadas a Prisma dev tooling.
- Frontend audit sem vulnerabilidades.

Gap de qualidade:

- Nao ha testes E2E.
- Nao ha teste de integracao com banco real.
- Nao ha cobertura automatizada de fluxo completo cliente -> agendamento -> painel admin.

## 8. Recursos

Recursos tecnicos atuais:

- Node.js 22.
- React 19.
- Vite 8.
- Express 5.
- Prisma 7.
- PostgreSQL/Neon.
- Vercel para frontend estatico.

Necessidades:

- Definir ambiente staging.
- Definir responsavel por deploy manual.
- Definir processo de rotacao de `JWT_SECRET` e credenciais de banco.

## 9. Comunicacoes

Padrao recomendado:

- Toda frente deve ter branch, PR, validacao e resumo operacional.
- Toda decisao operacional deve ir para `docs/decisoes.md` ou `docs/adr/*`.
- Toda divida deve ir para `docs/action-register.md` ou issue no GitHub.

## 10. Riscos

| ID | Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---:|---:|---|
| R-001 | API de producao nao configurada no Vercel | Media | Alto | Exigir `VITE_API_URL` em ambiente publicado. |
| R-002 | Dependencias ficarem defasadas | Media | Medio | Atualizacoes em PRs pequenos e Dependabot controlado. |
| R-003 | Divergencia documental | Alta | Medio | Atualizar docs por bloco e revisar por PR. |
| R-004 | Falta de E2E | Media | Alto | Criar smoke test para fluxo publico e admin. |
| R-005 | Vulnerabilidade moderada indireta do Prisma tooling | Baixa | Baixo/Medio | Monitorar Prisma; nao aplicar downgrade automatico. |

## 11. Aquisicoes

Dependencias externas:

- GitHub Actions.
- Neon.
- Vercel.
- npm registry.
- Possivel backend hospedado fora da Vercel, definido por `VITE_API_URL`.

Controle:

- Nao assumir fornecedor de backend no frontend.
- Documentar URLs por ambiente fora do codigo, via variaveis.

## 12. Stakeholders

| Stakeholder | Interesse |
|---|---|
| Cliente final | Agendar sem friccao e sem erro de horario. |
| Administradora | Confirmar, cancelar e organizar agenda. |
| Desenvolvedor | Manter CI confiavel e entregas rastreaveis. |
| Operacao | Deploy controlado e baixo custo. |

## 13. Registro de decisoes desta auditoria

- O deploy automatico segue desativado por decisao consciente.
- Fallback hardcoded de API de producao nao deve voltar.
- PRs pequenos seguem sendo o mecanismo padrao de controle.
- Auditoria tecnica sera mantida por bloco, nao como texto solto.

