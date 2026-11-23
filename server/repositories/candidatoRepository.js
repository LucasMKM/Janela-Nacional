// Acesso aos dados de candidatos. Só sabe ler e filtrar; regras ficam nos serviços.
function criarCandidatoRepository(dados) {
  const { candidatos, propostas, historico, metadados } = dados;

  return {
    listarTodos() {
      return candidatos.slice();
    },
    listarPorCargo(cargo, uf) {
      return candidatos.filter((c) => c.cargo === cargo && (uf ? c.uf === uf : true));
    },
    listarPorPartido(sigla) {
      return candidatos.filter((c) => c.siglaPartido === sigla);
    },
    obterPorId(id) {
      return candidatos.find((c) => c.id === String(id)) || null;
    },
    obterPropostas(id) {
      return propostas[id] || null;
    },
    obterHistorico(id) {
      return historico[id] || null;
    },
    obterMetadados() {
      return metadados;
    },
  };
}

module.exports = { criarCandidatoRepository };
