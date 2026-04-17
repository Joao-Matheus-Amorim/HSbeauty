require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT) || 3333;

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
