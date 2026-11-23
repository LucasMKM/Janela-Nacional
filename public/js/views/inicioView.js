// Tela 1 — Início (RF01, RF02 · HU01)
import { api } from '../api.js';
import { esc } from '../utils/dom.js';
import { ufSalva, salvarUf } from '../estado.js';

export async function inicioView(raiz) {
  const [ufs, cargos] = await Promise.all([api.ufs(), api.cargos()]);
  const ufAtual = ufSalva() || '';

  raiz.innerHTML = `
    <h1>Conheça os candidatos</h1>
    <p class="subtitulo">Informações oficiais, organizadas de forma simples.</p>
    <form id="form-inicio" novalidate>
      <div class="campo">
        <label for="uf">Seu estado (UF)</label>
        <select id="uf" name="uf">
          <option value="">Selecione…</option>
          ${ufs.map((u) => `<option value="${esc(u.sigla)}" ${u.sigla === ufAtual ? 'selected' : ''}>${esc(u.nome)} (${esc(u.sigla)})</option>`).join('')}
        </select>
      </div>
      <fieldset class="campo">
        <legend>Cargo</legend>
        <div class="opcoes">
          ${cargos.map((c) => `
            <input type="radio" name="cargo" id="cargo-${esc(c.codigo)}" value="${esc(c.codigo)}" data-abrangencia="${esc(c.abrangencia)}">
            <label for="cargo-${esc(c.codigo)}">${esc(c.nome)}</label>`).join('')}
        </div>
      </fieldset>
      <p id="msg-form" class="erro" role="alert" hidden></p>
      <button type="submit" class="botao">Ver candidatos</button>
    </form>
    <p class="aviso">A Janela Nacional não recomenda candidatos. As listas são exibidas em ordem alfabética.</p>`;

  const form = raiz.querySelector('#form-inicio');
  const msg = raiz.querySelector('#msg-form');
  form.addEventListener('change', () => { msg.hidden = true; });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const uf = form.uf.value;
    const escolhido = form.querySelector('input[name="cargo"]:checked');
    let erro = '';
    if (!escolhido) erro = 'Escolha um cargo.';
    else if (escolhido.dataset.abrangencia === 'estadual' && !uf) erro = 'Selecione seu estado (UF) para ver este cargo.';
    if (erro) { msg.textContent = erro; msg.hidden = false; return; }
    if (uf) salvarUf(uf);
    const params = new URLSearchParams({ cargo: escolhido.value });
    if (escolhido.dataset.abrangencia === 'estadual') params.set('uf', uf);
    location.hash = `#/lista?${params}`;
  });
}
