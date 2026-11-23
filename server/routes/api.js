const express = require('express');

function criarRotasApi({ candidatoController, partidoController, referenciaController }) {
  const router = express.Router();
  router.get('/ufs', referenciaController.ufs);
  router.get('/cargos', referenciaController.cargos);
  router.get('/candidatos', candidatoController.listar);
  router.get('/candidatos/:id', candidatoController.obter);
  router.get('/partidos', partidoController.listar);
  router.get('/partidos/:sigla', partidoController.obter);
  return router;
}
module.exports = { criarRotasApi };
