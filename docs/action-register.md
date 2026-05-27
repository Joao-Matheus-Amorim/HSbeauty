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
| A-005 | P1 | Banco | Avaliar indices em `Agendamento`. | Consultas filtram por data/status/servico. | Criar migration com indices apos revisar queries reais. |
| A-006 | P2 | Dependencias | Atualizar patch/minor seguros. | `npm outdated` aponta Vite, Tailwind, lucide, Prisma adapter e tipos. | PR por bloco: backend patch, frontend patch/minor. |
| A-007 | P2 | Seguranca | Monitorar vulnerabilidade moderada indireta do Prisma tooling. | `npm audit` aponta `@hono/node-server` via Prisma. | Nao aplicar downgrade automatico; acompanhar release Prisma. |
| A-008 | P2 | CI | Ativar Dependabot com frequencia controlada. | `.github/dependabot.yml` contem `updates: []`. | Criar configuracao semanal limitada. |
| A-009 | P2 | Qualidade | Criar smoke/E2E do fluxo publico e admin. | Nao ha E2E. | Escolher ferramenta e cobrir caminho principal. |
| A-010 | P2 | Deploy | Criar checklist de deploy manual. | Deploy automatico desativado por decisao. | Documentar preflight, envs, build e rollback. |
| A-011 | P3 | Frontend | Otimizar imagens remanescentes. | `principalmai.png` ~1.4 MB. | Converter/redimensionar com controle visual. |
| A-012 | P3 | Limpeza | Tratar issue #17 sobre emojis/caracteres especiais. | Emojis encontrados em UI, scripts e docs. | Decidir se remove da UI ou fecha como nao requisito. |
| A-013 | P2 | Prisma | Remover `previewFeatures = ["driverAdapters"]` quando confirmado seguro. | Prisma avisa que `driverAdapters` esta deprecated. | Criar PR pequeno com `prisma generate` e testes. |

## Acoes concluidas recentes

| ID | PR | Resultado |
|---|---|---|
| C-001 | #129 | CI backend passou a executar `npm test`. |
| C-002 | #130 | Criacao publica de agendamento usa transacao e lock por dia. |
| C-003 | #131 | Frontend nao tem fallback hardcoded de API de producao. |
| C-004 | #132 | Bundle publico reduzido e assets nao usados removidos. |
| C-005 | Esta frente | README, roadmap e testes HTTP alinhados ao contrato atual. |
| C-006 | Esta frente | Auditoria PMBOK, registro de blocos e ADR de deploy documentados. |
