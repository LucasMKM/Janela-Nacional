// Regras de negócio da consulta de candidatos (RF01–RF05, RNF01).
const { buscarCargo, CARGOS } = require('../domain/cargos');
const { ufValida } = require('../domain/ufs');
const { ErroValidacao, ErroNaoEncontrado } = require('../domain/erros');
const { normalizar, compararNomes } = require('../utils/texto');

function criarCandidatoService({ candidatoRepository, partidoRepository }) {
  /** Formato único de cartão para todos os candidatos: nenhum campo de destaque (RNF01). */
  function resumir(c) {
    const partido = partidoRepository.obterPorSigla(c.siglaPartido);
    const cargo = buscarCargo(c.cargo);
    return {
      id: c.id,
      nome: c.nome,
      numero: c.numero,
      siglaPartido: c.siglaPartido,
      nomePartido: partido ? partido.nome : c.nomePartido,
      cargo: c.cargo,
      nomeCargo: cargo ? cargo.nome : c.cargo,
      uf: c.uf,
    };
  }

  function ordenarAlfabeticamente(lista) {
    return lista.slice().sort((a, b) => compararNomes(a.nome, b.nome));
  }

  /** RF03: nome completo ou parcial (sem diferenciar acentos), número exato ou sigla do partido. */
  function correspondeBusca(c, termo) {
    const t = normalizar(termo);
    if (!t) return true;
    if (/^\d+$/.test(t)) return c.numero === t;
    return (
      normalizar(c.nome).includes(t) ||
      normalizar(c.nomeCompleto).includes(t) ||
      normalizar(c.siglaPartido) === t
    );
  }

  function validarFiltro(codigoCargo, uf) {
    const cargo = buscarCargo(codigoCargo);
    if (!cargo) {
      throw new ErroValidacao(`Cargo inválido. Use um destes: ${CARGOS.map((c) => c.codigo).join(', ')}.`);
    }
    if (cargo.abrangencia === 'estadual' && !ufValida(uf)) {
      throw new ErroValidacao('Selecione um estado (UF) válido para este cargo.');
    }
    return { cargo, uf: cargo.abrangencia === 'estadual' ? String(uf).toUpperCase() : null };
  }

  function fonte() {
    const m = candidatoRepository.obterMetadados();
    return { fonte: m.fonte, atualizadoEm: m.atualizadoEm };
  }

  return {
    /** RF01 + RF02 + RF03: lista do cargo/UF, opcionalmente filtrada pela busca. */
    listar({ cargo: codigoCargo, uf, q } = {}) {
      const { cargo, uf: ufFiltro } = validarFiltro(codigoCargo, uf);
      const termo = String(q ?? '').trim();
      const encontrados = candidatoRepository
        .listarPorCargo(cargo.codigo, ufFiltro)
        .filter((c) => correspondeBusca(c, termo));
      const candidatos = ordenarAlfabeticamente(encontrados).map(resumir);
      return {
        cargo: { codigo: cargo.codigo, nome: cargo.nome },
        uf: ufFiltro,
        termo,
        total: candidatos.length,
        ordenacao: 'alfabetica',
        candidatos,
        ...fonte(),
      };
    },

    /** RF04 + RF05: perfil completo com propostas e histórico, sempre com fonte e data. */
    obterPerfil(id) {
      const c = candidatoRepository.obterPorId(id);
      if (!c) throw new ErroNaoEncontrado('Candidato não encontrado.');
      const propostas = candidatoRepository.obterPropostas(c.id);
      const historico = candidatoRepository.obterHistorico(c.id);
      return {
        ...resumir(c),
        nomeCompleto: c.nomeCompleto,
        propostas: {
          itens: propostas ? propostas.itens : [],
          fonte: propostas ? propostas.fonte : null,
          atualizadoEm: propostas ? propostas.atualizadoEm : null,
        },
        historico: {
          cargos: historico ? historico.cargos : [],
          projetos: historico ? historico.projetos : [],
          atualizadoEm: historico ? historico.atualizadoEm : null,
        },
        ...fonte(),
      };
    },

    resumir,
    ordenarAlfabeticamente,
  };
}

module.exports = { criarCandidatoService };
