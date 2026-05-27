# ADR-003 - Deploy manual controlado

Status: aceito

Data: 27/05/2026

## Contexto

O projeto usa Vercel para publicar o frontend estatico gerado pelo Vite. O backend e acessado pelo frontend via `VITE_API_URL`, sem fallback hardcoded para provedor especifico.

O arquivo `vercel.json` mantem:

```json
"git": {
  "deploymentEnabled": false
}
```

Essa configuracao evita deploy automatico a cada push ou merge.

## Decisao

Manter deploy automatico desativado durante a fase de desenvolvimento controlado.

Publicacoes devem ser manuais e intencionais, apos CI verde e validacao local quando aplicavel.

## Consequencias

Beneficios:

- Reduz consumo de limite de deploy/build.
- Evita publicacao acidental de branches ou merges intermediarios.
- Mantem controle operacional sobre versoes candidatas.

Custos:

- Exige checklist manual de release.
- Exige disciplina para configurar `VITE_API_URL` no ambiente publicado.

## Politica operacional

Antes de publicar:

```powershell
npm run quality
```

Conferir variaveis:

- `VITE_API_URL`
- `VITE_WHATSAPP`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`

Publicar somente versoes aprovadas em `main`.

