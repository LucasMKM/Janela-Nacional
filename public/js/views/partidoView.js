// Página do partido (RF06)
import { api } from '../api.js';
import { esc } from '../utils/dom.js';
import { cartaoCandidato } from '../components/cartaoCandidato.js';
import { linhaFonte } from '../components/fonte.js';

export async function partidoView(raiz, params, sigla) {
  const p = await api.partido(sigla, params.get('uf'));
  raiz.innerHTML = `
    <div class="barra"><a class="voltar" href="javascript:history.back()">← Partido</a></div>
    <h1>${esc(p.nome)}</h1>
    <p class="subtitulo">Sigla ${esc(p.sigla)} · Número ${esc(p.numero)}</p>
    <h2>Principais diretrizes do programa</h2>
    <ul class="itens">${p.diretrizes.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
    ${linhaFonte(p.fonte.nome, p.atualizadoEm)}
    <h2>Candidatos${p.uf ? ` (nacionais e ${esc(p.uf)})` : ''}</h2>
    ${p.candidatosPorCargo.map((g) => `
      <div class="grupo-cargo">
        <h3>${esc(g.nomeCargo)}</h3>
        <ul class="lista">${g.candidatos.map(cartaoCandidato).join('')}</ul>
      </div>`).join('') || '<p>Nenhum candidato registrado.</p>'}`;
}
