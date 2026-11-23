function criarPartidoController({ partidoService }) {
  return {
    listar(req, res) {
      res.json(partidoService.listar());
    },
    obter(req, res) {
      res.json(partidoService.obterPartido(req.params.sigla, req.query.uf));
    },
  };
}
module.exports = { criarPartidoController };
