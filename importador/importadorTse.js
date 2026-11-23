// Backlog #1 — importação dos dados abertos de candidaturas do TSE
// (arquivos "consulta_cand_AAAA_UF.csv": separador ";", campos entre aspas, codificação latin-1).
const { cargoPorCodigoTSE } = require('../server/domain/cargos');
const { formatarNomeProprio } = require('../server/utils/texto');

const NULO = '#NULO#';

/** Parser de CSV simples que respeita aspas e aspas escapadas (""). */
function lerCsv(texto, separador = ';') {
  const linhas = [];
  let campo = '';
  let linha = [];
  let entreAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (entreAspas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (ch === '"') entreAspas = false;
      else campo += ch;
    } else if (ch === '"') entreAspas = true;
    else if (ch === separador) { linha.push(campo); campo = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some((v) => v !== '')) linhas.push(linha);
      linha = [];
    } else campo += ch;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }

  const [cabecalho, ...dados] = linhas;
  return dados.map((valores) => Object.fromEntries(cabecalho.map((col, i) => [col.trim(), valores[i]])));
}

function valor(v) {
  const t = String(v ?? '').trim();
  return t === '' || t === NULO ? null : t;
}

/** "10/11/2026" -> "2026-11-10" */
function dataIso(dataBr) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dataBr || ''));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Converte uma linha do TSE para o modelo da Janela Nacional, ou explica por que ela foi ignorada. */
function mapearLinha(linha) {
  const cargo = cargoPorCodigoTSE(linha.CD_CARGO);
  if (!cargo) return { ignorado: 'cargo fora do escopo' };
  if (valor(linha.DS_SITUACAO_CANDIDATURA) !== 'APTO') return { ignorado: 'candidatura não apta' };
  const id = valor(linha.SQ_CANDIDATO);
  const numero = valor(linha.NR_CANDIDATO);
  const nomeUrna = valor(linha.NM_URNA_CANDIDATO);
  if (!id || !numero || !nomeUrna) return { ignorado: 'campos obrigatórios ausentes' };

  return {
    candidato: {
      id,
      nome: formatarNomeProprio(nomeUrna),
      nomeCompleto: formatarNomeProprio(valor(linha.NM_CANDIDATO) || nomeUrna),
      numero,
      siglaPartido: valor(linha.SG_PARTIDO),
      nomePartido: formatarNomeProprio(valor(linha.NM_PARTIDO)),
      cargo: cargo.codigo,
      uf: cargo.abrangencia === 'nacional' ? 'BR' : valor(linha.SG_UF),
    },
  };
}

/** Recebe o conteúdo bruto (Buffer latin-1) e devolve o JSON pronto + relatório. */
function importar(buffer, { arquivo = 'desconhecido', fonte = 'TSE — dados de candidaturas' } = {}) {
  const texto = Buffer.isBuffer(buffer) ? buffer.toString('latin1') : String(buffer);
  const linhas = lerCsv(texto);
  const vistos = new Set();
  const candidatos = [];
  const ignorados = {};

  for (const linha of linhas) {
    const r = mapearLinha(linha);
    if (r.ignorado) { ignorados[r.ignorado] = (ignorados[r.ignorado] || 0) + 1; continue; }
    if (vistos.has(r.candidato.id)) { ignorados.duplicado = (ignorados.duplicado || 0) + 1; continue; }
    vistos.add(r.candidato.id);
    candidatos.push(r.candidato);
  }

  const atualizadoEm = dataIso(linhas[0] && linhas[0].DT_GERACAO);
  return {
    dados: {
      metadados: { fonte, atualizadoEm, arquivoOrigem: arquivo, totalCandidatos: candidatos.length },
      candidatos,
    },
    relatorio: { linhasLidas: linhas.length, importados: candidatos.length, ignorados },
  };
}

module.exports = { lerCsv, mapearLinha, importar, dataIso };
