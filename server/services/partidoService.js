// RF06: página do partido com diretrizes e lista de candidatos (ordem alfabética por cargo).
const { CARGOS } = require('../domain/cargos');
const { ufValida } = require('../domain/ufs');
const { ErroNaoEncontrado } = require('../domain/erros');
const { compararNomes } = require('../utils/texto');

function criarPartidoService({ partidoRepository, candidatoRepository, candidatoService }) {
  return {
    listar() {
      return partidoRepository
        .listarTodos()
        .map(({ sigla, nome, numero }) => ({ sigla, nome, numero }))
        .sort((a, b) => compararNomes(a.nome, b.nome));
    },

    /** Se a UF for informada, mostra candidatos nacionais + os daquela UF. */
    obterPartido(sigla, uf) {
      const partido = partidoRepository.obterPorSigla(sigla);
      if (!partido) throw new ErroNaoEncontrado('Partido não encontrado.');
      const filtroUf = ufValida(uf) ? String(uf).toUpperCase() : null;

      const candidatos = candidatoRepository
        .listarPorPartido(partido.sigla)
        .filter((c) => !filtroUf || c.uf === 'BR' || c.uf === filtroUf);

      const porCargo = CARGOS.map((cargo) => ({
        cargo: cargo.codigo,
        nomeCargo: cargo.nome,
        candidatos: candidatoService.ordenarAlfabeticamente(
          candidatos.filter((c) => c.cargo === cargo.codigo)
        ).map(candidatoService.resumir),
      })).filter((g) => g.candidatos.length > 0);

      return { ...partido, uf: filtroUf, candidatosPorCargo: porCargo };
    },
  };
}

module.exports = { criarPartidoService, compararNomes };
