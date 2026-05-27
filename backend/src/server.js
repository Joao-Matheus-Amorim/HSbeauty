import 'dotenv/config';
import { createApp } from './app.js';
import { assertRequiredEnv } from './env-config-rules.js';

assertRequiredEnv(process.env);

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
