import { esc } from '../utils/dom.js';
import { avatar } from './avatar.js';

/** Cartão idêntico para todos os candidatos (RNF01 / CA01.2): sem selo, cor ou posição especial. */
export function cartaoCandidato(c) {
  return `<li>
    <a class="cartao" href="#/candidato/${esc(c.id)}" data-teste="cartao-candidato">
      ${avatar(c.nome)}
      <span>
        <span class="nome">${esc(c.nome)}</span>
        <span class="detalhe">Nº ${esc(c.numero)} · ${esc(c.nomePartido)} (${esc(c.siglaPartido)})</span>
      </span>
    </a>
  </li>`;
}
