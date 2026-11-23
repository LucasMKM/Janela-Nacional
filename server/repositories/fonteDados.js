// Carrega os arquivos JSON gerados pelo script de importação e pela curadoria.
// Os dados são somente leitura nesta versão, por isso ficam em memória.
const fs = require('fs');
const path = require('path');

const DIRETORIO_PADRAO = path.join(__dirname, '..', '..', 'data');

function lerJson(caminho, padrao) {
  if (!fs.existsSync(caminho)) return padrao;
  return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
}

function carregarDados(diretorio = DIRETORIO_PADRAO) {
  const base = lerJson(path.join(diretorio, 'candidatos.json'), null);
  if (!base) {
    throw new Error(`Arquivo candidatos.json não encontrado em ${diretorio}. Rode "npm run importar" primeiro.`);
  }
  return {
    candidatos: base.candidatos,
    metadados: base.metadados,
    propostas: lerJson(path.join(diretorio, 'curadoria', 'propostas.json'), {}),
    historico: lerJson(path.join(diretorio, 'curadoria', 'historico.json'), {}),
    partidos: lerJson(path.join(diretorio, 'partidos.json'), []),
  };
}

module.exports = { carregarDados, DIRETORIO_PADRAO };
