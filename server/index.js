const { criarApp } = require('./app');

const PORTA = Number(process.env.PORT) || 3000;
criarApp().listen(PORTA, () => {
  console.log(`Janela Nacional rodando em http://localhost:${PORTA}`);
});
