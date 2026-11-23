// Telas 4 e 5 — Perfil com abas Propostas / Histórico (RF04, RF05, RF06 · HU03)
import { api } from '../api.js';
import { esc, dataBr } from '../utils/dom.js';
import { avatar } from '../components/avatar.js';
import { linhaFonte } from '../components/fonte.js';

const NOMES_FONTE = { 'Câmara': 'Câmara dos Deputados', Senado: 'Senado Federal', TSE: 'TSE' };

function linkFonte(f) {
  return `<a class="link-fonte" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(f.nome)}<span class="sr-only"> (abre em nova aba)</span></a>`;
}

function abaPropostas(p) {
  if (p.propostas.itens.length === 0) {
    return `<p>Resumo das propostas não disponível na fonte oficial.</p>${linhaFonte('TSE — plano de governo', p.atualizadoEm)}`;
  }
  return `<ul class="itens">${p.propostas.itens.map((i) => `<li><strong>${esc(i.tema)}:</strong> ${esc(i.texto)}</li>`).join('')}</ul>
    ${linhaFonte(p.propostas.fonte.nome, p.propostas.atualizadoEm)}`;
}

function abaHistorico(p) {
  const { cargos, projetos, atualizadoEm } = p.historico;
  if (cargos.length === 0 && projetos.length === 0) {
    return `<p data-teste="sem-historico">Sem cargos ou projetos anteriores registrados.</p>`;
  }
  const fontes = [...new Set([...cargos, ...projetos].map((i) => NOMES_FONTE[i.fonte.nome] || i.fonte.nome))];
  return `
    <h2>Cargos ocupados</h2>
    ${cargos.length ? `<ul class="itens">${cargos.map((c) => `<li>${esc(c.descricao)} — ${esc(c.periodo)} ${linkFonte(c.fonte)}</li>`).join('')}</ul>` : '<p>Nenhum cargo anterior registrado.</p>'}
    <h2>Projetos aprovados</h2>
    ${projetos.length ? `<ul class="itens">${projetos.map((j) => `<li>${esc(j.identificacao)} — ${esc(j.ementa)} ${linkFonte(j.fonte)}</li>`).join('')}</ul>` : '<p>Nenhum projeto aprovado registrado.</p>'}
    <p class="fonte" data-teste="fonte">Fontes: ${esc(fontes.join(' e '))} · atualizado em ${esc(dataBr(atualizadoEm))}</p>`;
}

export async function perfilView(raiz, params, id) {
  const p = await api.candidato(id);
  let aba = params.get('aba') === 'historico' ? 'historico' : 'propostas';
  const local = p.uf === 'BR' ? 'Brasil' : p.uf;
  const voltar = new URLSearchParams({ cargo: p.cargo });
  if (p.uf !== 'BR') voltar.set('uf', p.uf);

  raiz.innerHTML = `
    <div class="barra"><a class="voltar" href="#/lista?${voltar}">← Candidato ${esc(p.nomeCargo)} · ${esc(local)}</a></div>
    <section class="perfil-cabecalho">
      ${avatar(p.nome, 96)}
      <h1>${esc(p.nome)}</h1>
      <p>Nº ${esc(p.numero)} · <a href="#/partido/${esc(p.siglaPartido)}${p.uf !== 'BR' ? `?uf=${esc(p.uf)}` : ''}" data-teste="link-partido">${esc(p.nomePartido)} (${esc(p.siglaPartido)})</a></p>
      <p class="detalhe">${esc(p.nomeCargo)} · ${esc(local)}${p.nomeCompleto !== p.nome ? ` · Nome completo: ${esc(p.nomeCompleto)}` : ''}</p>
    </section>
    <div class="abas" role="tablist" aria-label="Informações do candidato">
      <button role="tab" id="tab-propostas" aria-controls="painel" data-aba="propostas">Propostas</button>
      <button role="tab" id="tab-historico" aria-controls="painel" data-aba="historico">Histórico</button>
    </div>
    <section id="painel" role="tabpanel"></section>`;

  const painel = raiz.querySelector('#painel');
  function mostrar(nova) {
    aba = nova;
    raiz.querySelectorAll('[role="tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === aba)));
    painel.setAttribute('aria-labelledby', `tab-${aba}`);
    painel.innerHTML = aba === 'historico' ? abaHistorico(p) : abaPropostas(p);
    history.replaceState(null, '', `#/candidato/${encodeURIComponent(id)}${aba === 'historico' ? '?aba=historico' : ''}`);
  }
  raiz.querySelectorAll('[role="tab"]').forEach((b) => b.addEventListener('click', () => mostrar(b.dataset.aba)));
  mostrar(aba);
}
