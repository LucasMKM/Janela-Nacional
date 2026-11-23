// Roteador por hash: escolhe a tela de acordo com a URL.
import { inicioView } from './views/inicioView.js';
import { listaView } from './views/listaView.js';
import { perfilView } from './views/perfilView.js';
import { partidoView } from './views/partidoView.js';
import { esc } from './utils/dom.js';

const rotas = [
  { padrao: /^\/$/, view: inicioView, titulo: 'Início' },
  { padrao: /^\/lista$/, view: listaView, titulo: 'Lista de candidatos' },
  { padrao: /^\/candidato\/([^/]+)$/, view: perfilView, titulo: 'Perfil do candidato' },
  { padrao: /^\/partido\/([^/]+)$/, view: partidoView, titulo: 'Partido' },
];

async function navegar() {
  const raiz = document.getElementById('conteudo');
  const [caminho, query = ''] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query);
  const rota = rotas.find((r) => r.padrao.test(caminho));
  if (!rota) { location.hash = '#/'; return; }
  const [, arg] = caminho.match(rota.padrao);
  document.title = `${rota.titulo} — Janela Nacional`;
  raiz.innerHTML = '<p class="contagem">Carregando…</p>';
  try {
    await rota.view(raiz, params, arg && decodeURIComponent(arg));
  } catch (e) {
    raiz.innerHTML = `<p class="erro">${esc(e.message)}</p><p><a href="#/">Voltar ao início</a></p>`;
  }
  raiz.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', navegar);
navegar();
