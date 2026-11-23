// Cargos cobertos pela versão atual (escopo da Entrega 1).
// "abrangencia" define se o cargo depende da UF selecionada (RF01/RF02).
const CARGOS = [
  { codigo: 'presidente', nome: 'Presidente', abrangencia: 'nacional', codigoTSE: 1 },
  { codigo: 'governador', nome: 'Governador', abrangencia: 'estadual', codigoTSE: 3 },
  { codigo: 'senador', nome: 'Senador', abrangencia: 'estadual', codigoTSE: 5 },
  { codigo: 'deputado-federal', nome: 'Deputado Federal', abrangencia: 'estadual', codigoTSE: 6 },
  { codigo: 'deputado-estadual', nome: 'Deputado Estadual', abrangencia: 'estadual', codigoTSE: 7 },
];

function buscarCargo(codigo) {
  return CARGOS.find((c) => c.codigo === codigo) || null;
}

function cargoPorCodigoTSE(codigoTSE) {
  return CARGOS.find((c) => c.codigoTSE === Number(codigoTSE)) || null;
}

module.exports = { CARGOS, buscarCargo, cargoPorCodigoTSE };
