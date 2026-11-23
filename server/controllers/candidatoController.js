// Traduz HTTP <-> serviço. Sem regra de negócio aqui.
function criarCandidatoController({ candidatoService }) {
  return {
    listar(req, res) {
      const { cargo, uf, q } = req.query;
      res.json(candidatoService.listar({ cargo, uf, q }));
    },
    obter(req, res) {
      res.json(candidatoService.obterPerfil(req.params.id));
    },
  };
}
module.exports = { criarCandidatoController };
