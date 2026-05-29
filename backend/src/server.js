import 'dotenv/config';

// Garante que todas as operacoes de Date no servidor (calculos de
// semana corrente, slots, expediente) operem em horario do Brasil.
// Render e Vercel rodam em UTC por padrao, o que causava sexta 23h
// BRT ser interpretado como sabado UTC pelo getDay()/setHours().
if (!process.env.TZ) {
  process.env.TZ = 'America/Sao_Paulo';
}

const { createApp } = await import('./app.js');
const { assertRequiredEnv } = await import('./env-config-rules.js');

assertRequiredEnv(process.env);

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
