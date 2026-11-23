const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizar, compararNomes, formatarNomeProprio } = require('../../server/utils/texto');

describe('Utilitários de texto', () => {
  it('T01 — normalizar remove acentos e diferença de maiúsculas', () => {
    assert.equal(normalizar('  JOÃO Pedro '), 'joao pedro');
    assert.equal(normalizar('Kátia'), 'katia');
  });

  it('T02 — ordenação alfabética em português trata acentos corretamente (RNF01)', () => {
    const nomes = ['Sérgio', 'Helena', 'Álvaro', 'Lúcia', 'Roberto'];
    assert.deepEqual(nomes.slice().sort(), ['Helena', 'Lúcia', 'Roberto', 'Sérgio', 'Álvaro'], 'sort() padrão erra');
    assert.deepEqual(nomes.slice().sort(compararNomes), ['Álvaro', 'Helena', 'Lúcia', 'Roberto', 'Sérgio']);
  });

  it('T03 — nomes do TSE (maiúsculas) viram nome próprio', () => {
    assert.equal(formatarNomeProprio('CARLOS MENDES DA CUNHA'), 'Carlos Mendes da Cunha');
    assert.equal(formatarNomeProprio('JOÃO PEDRO SILVA'), 'João Pedro Silva');
  });
});
