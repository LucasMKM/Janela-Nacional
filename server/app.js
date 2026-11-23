// Composição da aplicação: monta repositórios -> serviços -> controladores -> rotas.
const path = require('path');
const express = require('express');
const { carregarDados } = require('./repositories/fonteDados');
const { criarCandidatoRepository } = require('./repositories/candidatoRepository');
const { criarPartidoRepository } = require('./repositories/partidoRepository');
const { criarCandidatoService } = require('./services/candidatoService');
const { criarPartidoService } = require('./services/partidoService');
const { criarCandidatoController } = require('./controllers/candidatoController');
const { criarPartidoController } = require('./controllers/partidoController');
const { criarReferenciaController } = require('./controllers/referenciaController');
const { criarRotasApi } = require('./routes/api');

function criarApp({ diretorioDados } = {}) {
  const dados = carregarDados(diretorioDados);

  const candidatoRepository = criarCandidatoRepository(dados);
  const partidoRepository = criarPartidoRepository(dados);
  const candidatoService = criarCandidatoService({ candidatoRepository, partidoRepository });
  const partidoService = criarPartidoService({ partidoRepository, candidatoRepository, candidatoService });

  const app = express();
  app.disable('x-powered-by');

  app.use('/api', criarRotasApi({
    candidatoController: criarCandidatoController({ candidatoService }),
    partidoController: criarPartidoController({ partidoService }),
    referenciaController: criarReferenciaController(),
  }));
  app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Tratamento centralizado de erros: 400/404 de domínio, 500 para o resto.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ erro: status === 500 ? 'Erro interno.' : err.message });
  });

  return app;
}

module.exports = { criarApp };
