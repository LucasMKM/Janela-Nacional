// Tela 2 — Lista de candidatos e Tela 3 — Busca sem resultado (RF02, RF03, RNF01 · HU01, HU02)
import { api } from '../api.js';
import { esc, debounce } from '../utils/dom.js';
import { salvarUf } from '../estado.js';
import { cartaoCandidato } from '../components/cartaoCandidato.js';
import { linhaFonte } from '../components/fonte.js';
import { mensagemVazia } from '../components/mensagemVazia.js';

export async function listaView(raiz, params) {
  const cargo = params.get('cargo');
  const uf = params.get('uf');
  const [ufs, primeiro] = await Promise.all([api.ufs(), api.candidatos({ cargo, uf, q: params.get('q') })]);

  raiz.innerHTML = `
    <div class="barra">
      <a class="voltar" href="#/">← ${esc(primeiro.cargo.nome)}${primeiro.uf ? ` · ${esc(primeiro.uf)}` : ' · Brasil'}</a>
      ${primeiro.uf ? `<select id="troca-uf" aria-label="Trocar estado">
          ${ufs.map((u) => `<option value="${esc(u.sigla)}" ${u.sigla === primeiro.uf ? 'selected' : ''}>${esc(u.sigla)}</option>`).join('')}
        </select>` : ''}
    </div>
    <div class="campo">
      <input id="busca" type="search" placeholder="🔍 Buscar por nome, número ou partido" value="${esc(primeiro.termo)}" autocomplete="off" aria-label="Buscar por nome, número ou partido">
    </div>
    <div id="resultado" aria-live="polite"></div>`;

  const resultado = raiz.querySelector('#resultado');
  const busca = raiz.querySelector('#busca');

  function desenhar(dados) {
    if (dados.total === 0) {
      resultado.innerHTML = mensagemVazia({
        titulo: 'Nenhum candidato encontrado',
        texto: 'Confira a grafia ou tente buscar pelo número ou pelo partido.',
        acao: { id: 'nova-busca', rotulo: 'Nova busca' },
      });
      resultado.querySelector('[data-acao="nova-busca"]').addEventListener('click', () => {
        busca.value = '';
        buscar('');
        busca.focus();
      });
      return;
    }
    resultado.innerHTML = `
      <p class="contagem" data-teste="contagem">${dados.total} ${dados.total === 1 ? 'candidato' : 'candidatos'} · ordem alfabética</p>
      <ul class="lista">${dados.candidatos.map(cartaoCandidato).join('')}</ul>
      ${linhaFonte(dados.fonte, dados.atualizadoEm)}`;
  }

  async function buscar(q) {
    try {
      const dados = await api.candidatos({ cargo, uf, q });
      const novos = new URLSearchParams(params);
      if (q) novos.set('q', q); else novos.delete('q');
      history.replaceState(null, '', `#/lista?${novos}`);
      desenhar(dados);
    } catch (e) {
      resultado.innerHTML = `<p class="erro">${esc(e.message)}</p>`;
    }
  }

  desenhar(primeiro);
  busca.addEventListener('input', debounce(() => buscar(busca.value.trim()), 250));

  const trocaUf = raiz.querySelector('#troca-uf');
  if (trocaUf) {
    trocaUf.addEventListener('change', () => {
      salvarUf(trocaUf.value);
      location.hash = `#/lista?${new URLSearchParams({ cargo, uf: trocaUf.value })}`;
    });
  }
}
