#!/usr/bin/env node
// Uso: node scripts/importar-tse.js [arquivo.csv ...]
// Junta um ou mais CSVs do TSE em data/candidatos.json.
const fs = require('fs');
const path = require('path');
const { importar } = require('../importador/importadorTse');

const arquivos = process.argv.slice(2);
if (arquivos.length === 0) arquivos.push(path.join(__dirname, '..', 'data', 'tse', 'consulta_cand_2026_amostra.csv'));

const todos = [];
let metadados = null;
for (const arq of arquivos) {
  const { dados, relatorio } = importar(fs.readFileSync(arq), {
    arquivo: path.basename(arq),
    fonte: 'TSE — dados de candidaturas (amostra fictícia do protótipo)',
  });
  console.log(`${path.basename(arq)}: ${relatorio.linhasLidas} linhas, ${relatorio.importados} importadas`, relatorio.ignorados);
  todos.push(...dados.candidatos);
  metadados = dados.metadados;
}

const destino = path.join(__dirname, '..', 'data', 'candidatos.json');
metadados.totalCandidatos = todos.length;
fs.writeFileSync(destino, JSON.stringify({ metadados, candidatos: todos }, null, 2));
console.log(`Gravado ${destino} (${todos.length} candidatos).`);
