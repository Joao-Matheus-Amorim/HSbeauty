# Registro de acoes tecnicas

Atualizado em: 27/05/2026

## Legenda

- P0: bloqueia operacao.
- P1: risco relevante ou documentacao desatualizada.
- P2: melhoria planejada.
- P3: oportunidade futura.

## Acoes abertas

| ID | Prioridade | Bloco | Acao | Evidencia | Proximo passo |
|---|---|---|---|---|---|
| A-003 | P1 | Frontend | Fechar ou atualizar issue #80. | `parseJsonResponse` ja existe e tem teste. | Validar criterios da issue e fechar se coberto. |
| A-004 | P1 | Admin | Fechar ou atualizar issue #78. | Filtro de data usa inicio/fim do dia e backend tem testes. | Reproduzir fluxo no painel; fechar se resolvido. |
| A-006 | P2 | Dependencias | Avaliar upgrade major pendente de `express-rate-limit`. | Patch/minor backend e frontend ja aplicados; resta major 8.x. | Planejar PR dedicado com validacao de compatibilidade do middleware. |
| A-007 | P2 | Seguranca | Monitorar vulnerabilidade moderada indireta do Prisma tooling. | `npm audit` aponta `@hono/node-server` via Prisma. | Nao aplicar downgrade automatico; acompanhar release Prisma. |
| A-009 | P2 | Qualidade | Smoke minimo de frontend e backend ativo no CI. | Frontend: `frontend/src/__tests__/smoke/*`; Backend: `backend/test/smoke-routes.test.js`; CI: jobs com `npm run test:smoke`. | Evoluir para E2E browser real (Playwright) em etapa separada de pipeline. |
| A-010 | P1 | GitHub | Fechar ou atualizar issue #17. | Varredura local nao encontrou emojis decorativos remanescentes. | Fechar issue com evidencia ou reabrir item se houver criterio faltante. |
| A-011 | P1 | Release | Definir politica de versionamento. | README removido de versao solta; packages ainda usam versoes internas distintas. | Decidir versao de produto e regra para packages privados. |

## Acoes concluidas recentes

| ID | PR | Resultado |
|---|---|---|
| C-001 | #129 | CI backend passou a executar `npm test`. |
| C-002 | #130 | Criacao publica de agendamento usa transacao e lock por dia. |
| C-003 | #131 | Frontend nao tem fallback hardcoded de API de producao. |
| C-004 | #132 | Bundle publico reduzido e assets nao usados removidos. |
| C-005 | Esta frente | README, roadmap e testes HTTP alinhados ao contrato atual. |
| C-006 | Esta frente | Auditoria PMBOK, registro de blocos e ADR de deploy documentados. |
| C-007 | Esta frente | `VITE_WHATSAPP` conectado ao frontend com fallback para o numero atual. |
| C-008 | Esta frente | Flag deprecated `previewFeatures = ["driverAdapters"]` removida do Prisma schema. |
| C-009 | Esta frente | Dependabot ativado com agenda semanal, agrupamento minor/patch e majors ignorados. |
| C-010 | #135 | Dependencias patch/minor do backend atualizadas pelo Dependabot. |
| C-011 | `0b817d1` | Dependencias patch/minor do frontend aplicadas direto na main a partir do PR #136. |
| C-012 | Esta frente | Imagens pesadas removidas do frontend e substituidas por placeholders sem arquivo estatico. |
| C-013 | Esta frente | Emojis e icones decorativos removidos de UI, scripts e README. |
| C-014 | Esta frente | Checklist de deploy manual documentado sem alterar politica `deploymentEnabled: false`. |
| C-015 | Esta frente | Status `concluido` normalizado como contrato canonico entre frontend, backend e banco. |
| C-016 | Esta frente | README, roadmap, block-register e auditoria PMBOK alinhados ao estado atual de Dependabot, assets, rollback e versao de produto. |
| C-017 | Esta frente | Indices de consulta em `Agendamento` adicionados via migration e schema Prisma alinhado. |
| C-018 | Esta frente | Smoke tests minimo (publico + admin) adicionados em `frontend/src/__tests__/smoke`. |
| C-019 | Esta frente | Smoke backend (health, auth e booking com cenarios de falha) adicionado e integrado ao CI. |


