const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { criarApp } = require('../../server/app');

function subir(app) {
  return new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
}

describe('API REST (integração)', () => {
  let servidor; let base;
  before(async () => { servidor = await subir(criarApp()); base = `http://127.0.0.1:${servidor.address().port}`; });
  after(() => servidor.close());

  it('T19 — GET /api/candidatos?cargo=senador&uf=RS responde 200 com fonte e data (RNF01)', async () => {
    const r = await fetch(`${base}/api/candidatos?cargo=senador&uf=RS`);
    assert.equal(r.status, 200);
    const corpo = await r.json();
    assert.equal(corpo.total, 4);
    assert.ok(corpo.fonte.startsWith('TSE'));
    assert.equal(corpo.atualizadoEm, '2026-11-10');
  });

  it('T20 — erros retornam JSON com status correto (400 e 404)', async () => {
    assert.equal((await fetch(`${base}/api/candidatos?cargo=senador`)).status, 400);
    const r = await fetch(`${base}/api/candidatos/000`);
    assert.equal(r.status, 404);
    assert.equal((await r.json()).erro, 'Candidato não encontrado.');
    assert.equal((await fetch(`${base}/api/partidos/XYZ`)).status, 404);
    assert.equal((await fetch(`${base}/api/inexistente`)).status, 404);
  });

  it('T21 — front-end é servido na raiz', async () => {
    const r = await fetch(`${base}/`);
    assert.equal(r.status, 200);
    assert.match(await r.text(), /<html lang="pt-BR">/);
  });
});

describe('Desempenho da busca (RNF02 / CA02.1 — até 2 s)', () => {
  let servidor; let base; let dir;
  before(async () => {
    // Base sintética com 30.000 candidaturas (ordem de grandeza de uma eleição geral real).
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jn-carga-'));
    const ufs = ['RS', 'SP', 'MG', 'BA', 'PR'];
    const cargos = ['governador', 'senador', 'deputado-federal', 'deputado-estadual'];
    const candidatos = Array.from({ length: 30000 }, (_, i) => ({
      id: String(i + 1), nome: `Candidato ${i} Silva`, nomeCompleto: `Candidato ${i} Silva`, numero: String(10000 + i),
      siglaPartido: 'PA', nomePartido: 'Partido Alfa', cargo: cargos[i % 4], uf: ufs[i % 5],
    }));
    fs.writeFileSync(path.join(dir, 'candidatos.json'), JSON.stringify({ metadados: { fonte: 'TSE', atualizadoEm: '2026-11-10' }, candidatos }));
    fs.copyFileSync(path.join(__dirname, '..', '..', 'data', 'partidos.json'), path.join(dir, 'partidos.json'));
    servidor = await subir(criarApp({ diretorioDados: dir }));
    base = `http://127.0.0.1:${servidor.address().port}`;
  });
  after(() => { servidor.close(); fs.rmSync(dir, { recursive: true }); });

  it('T22 — busca por nome parcial em 30.000 candidaturas responde em menos de 2 s', async () => {
    const inicio = performance.now();
    const r = await fetch(`${base}/api/candidatos?cargo=deputado-estadual&uf=RS&q=silva`);
    const ms = performance.now() - inicio;
    const corpo = await r.json();
    assert.equal(r.status, 200);
    assert.ok(corpo.total > 1000);
    console.log(`    tempo medido: ${ms.toFixed(1)} ms para ${corpo.total} resultados`);
    assert.ok(ms < 2000, `levou ${ms} ms`);
  });
});
