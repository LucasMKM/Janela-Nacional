import { esc } from '../utils/dom.js';

/** Foto substituta neutra (mesma cor para todos). O protótipo usa dados fictícios, sem fotos reais. */
export function avatar(nome, tamanho = 48) {
  const iniciais = String(nome).split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return `<span class="avatar" role="img" aria-label="Foto indisponível de ${esc(nome)}"
    style="width:${tamanho}px;height:${tamanho}px;font-size:${Math.round(tamanho / 2.6)}px">${esc(iniciais)}</span>`;
}
