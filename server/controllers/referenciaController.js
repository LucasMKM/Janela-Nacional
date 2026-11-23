const { UFS } = require('../domain/ufs');
const { CARGOS } = require('../domain/cargos');

function criarReferenciaController() {
  return {
    ufs(req, res) {
      res.json(UFS);
    },
    cargos(req, res) {
      res.json(CARGOS.map(({ codigo, nome, abrangencia }) => ({ codigo, nome, abrangencia })));
    },
  };
}
module.exports = { criarReferenciaController };
