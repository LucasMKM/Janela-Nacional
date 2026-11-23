// Funções de texto usadas pela busca (RF03) e pela ordenação neutra (RNF01).

/** Remove acentos e caixa: "João" -> "joao". */
function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const colador = new Intl.Collator('pt-BR', { sensitivity: 'base' });

/** Ordem alfabética correta em português ("Álvaro" vem antes de "Bruno"). */
function compararNomes(a, b) {
  return colador.compare(a, b);
}

const MINUSCULAS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

/** O TSE publica nomes em maiúsculas: "JOÃO PEDRO DA SILVA" -> "João Pedro da Silva". */
function formatarNomeProprio(texto) {
  return String(texto ?? '')
    .toLocaleLowerCase('pt-BR')
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i > 0 && MINUSCULAS.has(p) ? p : p.charAt(0).toLocaleUpperCase('pt-BR') + p.slice(1)))
    .join(' ');
}

module.exports = { normalizar, compararNomes, formatarNomeProprio };
