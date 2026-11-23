import { esc } from '../utils/dom.js';

export function mensagemVazia({ titulo, texto, acao }) {
  return `<div class="vazio" role="status">
    <div class="icone" aria-hidden="true">∅</div>
    <h2>${esc(titulo)}</h2>
    ${texto ? `<p>${esc(texto)}</p>` : ''}
    ${acao ? `<button type="button" class="botao secundario" data-acao="${esc(acao.id)}">${esc(acao.rotulo)}</button>` : ''}
  </div>`;
}
