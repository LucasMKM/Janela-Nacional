const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { carregarDados } = require('../../server/repositories/fonteDados');
const { criarCandidatoRepository } = require('../../server/repositories/candidatoRepository');
const { criarPartidoRepository } = require('../../server/repositories/partidoRepository');
const { criarCandidatoService } = require('../../server/services/candidatoService');
const { criarPartidoService } = require('../../server/services/partidoService');

const dados = carregarDados();
const candidatoRepository = criarCandidatoRepository(dados);
const partidoRepository = criarPartidoRepository(dados);
const servico = criarCandidatoService({ candidatoRepository, partidoRepository });
const partidos = criarPartidoService({ partidoRepository, candidatoRepository, candidatoService: servico });
const nomes = (r) => r.candidatos.map((c) => c.nome);

describe('HU01 — Ver candidatos do meu estado', () => {
  it('T08 — CA01.1: UF "RS" + "Senador" lista apenas senadores do RS', () => {
    const r = servico.listar({ cargo: 'senador', uf: 'RS' });
    assert.equal(r.total, 4);
    assert.ok(r.candidatos.every((c) => c.cargo === 'senador' && c.uf === 'RS'));
    assert.ok(!nomes(r).includes('Wagner Brito'), 'senador de SP não aparece');
  });

  it('T09 — CA01.2: lista em ordem alfabética e todos os cartões com o mesmo formato', () => {
    const r = servico.listar({ cargo: 'presidente' });
    assert.deepEqual(nomes(r), ['Álvaro Teixeira', 'Helena Duarte', 'Lúcia Ferraz', 'Roberto Almeida', 'Sérgio Nogueira']);
    const campos = Object.keys(r.candidatos[0]).sort().join();
    assert.ok(r.candidatos.every((c) => Object.keys(c).sort().join() === campos));
    assert.ok(!/destaque|ranking|recomend|patrocin/i.test(JSON.stringify(r)));
  });

  it('T10 — cargo estadual sem UF e cargo inexistente são recusados', () => {
    assert.throws(() => servico.listar({ cargo: 'senador' }), { status: 400 });
    assert.throws(() => servico.listar({ cargo: 'prefeito', uf: 'RS' }), { status: 400 });
  });
});

describe('HU02 — Buscar um candidato', () => {
  it('T11 — CA02.1: parte do nome ("Silva"), sem acento ("joao") e em minúsculas', () => {
    assert.deepEqual(nomes(servico.listar({ cargo: 'senador', uf: 'RS', q: 'Silva' })), ['João Pedro Silva']);
    assert.deepEqual(nomes(servico.listar({ cargo: 'senador', uf: 'RS', q: 'joao' })), ['João Pedro Silva']);
    assert.deepEqual(nomes(servico.listar({ cargo: 'deputado-federal', uf: 'RS', q: 'silva' })), ['Rafael Tavares Silva']);
  });

  it('T12 — CA02.1: número exato e sigla do partido', () => {
    assert.deepEqual(nomes(servico.listar({ cargo: 'senador', uf: 'RS', q: '633' })), ['João Pedro Silva']);
    assert.equal(servico.listar({ cargo: 'senador', uf: 'RS', q: '63' }).total, 0, 'número parcial não casa');
    assert.deepEqual(nomes(servico.listar({ cargo: 'senador', uf: 'RS', q: 'pg' })), ['João Pedro Silva']);
  });

  it('T13 — CA02.2: busca sem correspondência retorna lista vazia', () => {
    const r = servico.listar({ cargo: 'senador', uf: 'RS', q: 'Ferreira' });
    assert.equal(r.total, 0);
    assert.deepEqual(r.candidatos, []);
  });
});

describe('HU03 — Conhecer propostas e trajetória', () => {
  it('T14 — CA03.1: perfil traz nome, número, partido, cargo, propostas, fonte e data', () => {
    const p = servico.obterPerfil('260000000012');
    assert.equal(p.nome, 'João Pedro Silva');
    assert.equal(p.numero, '633');
    assert.equal(p.nomePartido, 'Partido Gama');
    assert.equal(p.nomeCargo, 'Senador');
    assert.equal(p.propostas.itens.length, 3);
    assert.ok(p.propostas.fonte.nome && p.propostas.atualizadoEm);
    assert.ok(p.fonte && p.atualizadoEm);
  });

  it('T15 — CA03.2: histórico com cargos e projetos, cada item com link oficial', () => {
    const { historico } = servico.obterPerfil('260000000012');
    assert.equal(historico.cargos.length, 2);
    assert.equal(historico.projetos.length, 2);
    const oficiais = /^https:\/\/(www\.camara\.leg\.br|www25\.senado\.leg\.br|divulgacandcontas\.tse\.jus\.br)\//;
    [...historico.cargos, ...historico.projetos].forEach((i) => assert.match(i.fonte.url, oficiais));
    assert.ok(historico.atualizadoEm);
  });

  it('T16 — CA03.2: candidato sem histórico retorna listas vazias (tela mostra mensagem)', () => {
    const { historico } = servico.obterPerfil('260000000011');
    assert.deepEqual([historico.cargos, historico.projetos], [[], []]);
  });

  it('T17 — id inexistente gera erro 404', () => {
    assert.throws(() => servico.obterPerfil('999'), { status: 404 });
  });

  it('T18 — RF06: página do partido com diretrizes e candidatos nacionais + da UF', () => {
    const p = partidos.obterPartido('pg', 'RS');
    assert.equal(p.nome, 'Partido Gama');
    assert.equal(p.diretrizes.length, 3);
    const todos = p.candidatosPorCargo.flatMap((g) => g.candidatos);
    assert.ok(todos.every((c) => c.uf === 'BR' || c.uf === 'RS'));
    assert.deepEqual(p.candidatosPorCargo.map((g) => g.cargo), ['presidente', 'governador', 'senador', 'deputado-federal', 'deputado-estadual']);
  });
});
