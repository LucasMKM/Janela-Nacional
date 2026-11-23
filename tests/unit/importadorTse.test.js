const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { importar, lerCsv, dataIso } = require('../../importador/importadorTse');

const CAB = '"DT_GERACAO";"SG_UF";"CD_CARGO";"DS_CARGO";"SQ_CANDIDATO";"NR_CANDIDATO";"NM_CANDIDATO";"NM_URNA_CANDIDATO";"SG_PARTIDO";"NM_PARTIDO";"DS_SITUACAO_CANDIDATURA";"NM_EMAIL"';
const linha = (v) => v.map((x) => `"${x}"`).join(';');

function csvLatin1(linhas) {
  return Buffer.from([CAB, ...linhas.map(linha)].join('\r\n'), 'latin1');
}

describe('Importador de dados do TSE (Backlog #1)', () => {
  it('T04 — lê CSV latin-1 com ";" e aspas preservando acentos', () => {
    const buf = csvLatin1([['10/11/2026', 'RS', '5', 'SENADOR', '1', '633', 'JOÃO PEDRO SILVA', 'JOÃO PEDRO SILVA', 'PG', 'PARTIDO GAMA', 'APTO', '#NULO#']]);
    const { dados } = importar(buf);
    assert.equal(dados.candidatos[0].nome, 'João Pedro Silva');
    assert.equal(dados.candidatos[0].cargo, 'senador');
    assert.equal(dados.metadados.atualizadoEm, '2026-11-10');
  });

  it('T05 — descarta candidatura não apta, cargo fora do escopo e duplicados', () => {
    const buf = csvLatin1([
      ['10/11/2026', 'RS', '5', 'SENADOR', '1', '401', 'ANA', 'ANA', 'PA', 'PARTIDO ALFA', 'APTO', ''],
      ['10/11/2026', 'RS', '5', 'SENADOR', '1', '401', 'ANA', 'ANA', 'PA', 'PARTIDO ALFA', 'APTO', ''],
      ['10/11/2026', 'RS', '5', 'SENADOR', '2', '855', 'ZÉLIA', 'ZÉLIA', 'PE', 'PARTIDO ÉPSILON', 'INAPTO', ''],
      ['10/11/2026', 'RS', '11', 'PREFEITO', '3', '40', 'X', 'X', 'PA', 'PARTIDO ALFA', 'APTO', ''],
    ]);
    const { dados, relatorio } = importar(buf);
    assert.equal(dados.candidatos.length, 1);
    assert.deepEqual(relatorio.ignorados, { duplicado: 1, 'candidatura não apta': 1, 'cargo fora do escopo': 1 });
  });

  it('T06 — Presidente recebe UF "BR"; campos com aspas e ";" internos são lidos inteiros', () => {
    const [r] = lerCsv('"A";"B"\r\n"x;y";"diz ""oi"""');
    assert.deepEqual(r, { A: 'x;y', B: 'diz "oi"' });
    const buf = csvLatin1([['10/11/2026', 'BR', '1', 'PRESIDENTE', '9', '85', 'ÁLVARO T', 'ÁLVARO T', 'PE', 'PARTIDO ÉPSILON', 'APTO', '']]);
    assert.equal(importar(buf).dados.candidatos[0].uf, 'BR');
    assert.equal(dataIso('31/12/2026'), '2026-12-31');
  });

  it('T07 — arquivo de amostra do repositório importa 32 de 33 linhas', () => {
    const arq = path.join(__dirname, '..', '..', 'data', 'tse', 'consulta_cand_2026_amostra.csv');
    const { relatorio } = importar(fs.readFileSync(arq));
    assert.equal(relatorio.linhasLidas, 33);
    assert.equal(relatorio.importados, 32);
  });
});
