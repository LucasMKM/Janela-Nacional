function criarPartidoRepository(dados) {
  const { partidos } = dados;
  return {
    listarTodos() {
      return partidos.slice();
    },
    obterPorSigla(sigla) {
      return partidos.find((p) => p.sigla === String(sigla || '').toUpperCase()) || null;
    },
  };
}

module.exports = { criarPartidoRepository };
