import { esc, dataBr } from '../utils/dom.js';

/** Toda informação mostra a fonte oficial e a data de atualização (RNF01). */
export function linhaFonte(fonte, atualizadoEm) {
  return `<p class="fonte" data-teste="fonte">Fonte: ${esc(fonte)} · atualizado em ${esc(dataBr(atualizadoEm))}</p>`;
}
