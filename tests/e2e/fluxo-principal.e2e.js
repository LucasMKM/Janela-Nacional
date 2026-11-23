// Testes ponta a ponta do fluxo "Consultar candidato" no navegador (Playwright).
// Uso: npm run test:e2e   (requer "npx playwright install chromium" ou CHROME_PATH apontando para um Chrome/Chromium)
// Gera capturas em docs/evidencias/ e o resumo em docs/evidencias/resultados-e2e.json.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { criarApp } = require('../../server/app');

const SAIDA = path.join(__dirname, '..', '..', 'docs', 'evidencias');
const CELULAR = { width: 390, height: 844 };
const resultados = [];

async function cenario(id, nome, esperado, fn) {
  try {
    const obtido = await fn();
    resultados.push({ id, nome, esperado, obtido, ok: true });
    console.log(`✔ ${id} — ${nome}\n    obtido: ${obtido}`);
  } catch (e) {
    resultados.push({ id, nome, esperado, obtido: e.message.split('\n')[0], ok: false });
    console.log(`✖ ${id} — ${nome}\n    ${e.message}`);
  }
}

function confere(cond, msg) { if (!cond) throw new Error(msg); }

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const servidor = await new Promise((ok) => { const s = criarApp().listen(0, () => ok(s)); });
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const navegador = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const contexto = await navegador.newContext({ viewport: CELULAR, deviceScaleFactor: 2, locale: 'pt-BR' });
  const pg = await contexto.newPage();
  const errosConsole = [];
  pg.on('pageerror', (e) => errosConsole.push(e.message));
  const foto = (nome) => pg.screenshot({ path: path.join(SAIDA, `${nome}.png`), fullPage: true });
  const nomesNaLista = () => pg.locator('[data-teste="cartao-candidato"] .nome').allInnerTexts();

  await cenario('E01', 'Validação da tela inicial sem cargo', 'Mensagem "Escolha um cargo." e permanece na Tela 1', async () => {
    await pg.goto(`${base}/#/`);
    await pg.getByRole('button', { name: 'Ver candidatos' }).click();
    const msg = await pg.getByRole('alert').innerText();
    confere(msg === 'Escolha um cargo.', `mensagem: ${msg}`);
    return `mensagem "${msg}" exibida; URL continua ${new URL(pg.url()).hash}`;
  });

  await cenario('E02', 'HU01 / CA01.1 — Selecionar RS + Senador', 'Somente os 4 senadores do RS', async () => {
    await pg.getByLabel('Seu estado (UF)').selectOption('RS');
    await pg.getByText('Senador', { exact: true }).click();
    await foto('tela1-inicio');
    await pg.getByRole('button', { name: 'Ver candidatos' }).click();
    await pg.waitForSelector('[data-teste="cartao-candidato"]');
    const nomes = await nomesNaLista();
    confere(nomes.length === 4 && !nomes.includes('Wagner Brito'), `lista: ${nomes}`);
    await foto('tela2-lista');
    return `${nomes.length} candidatos: ${nomes.join(', ')}`;
  });

  await cenario('E03', 'HU01 / CA01.2 — Ordem alfabética, mesmo formato, fonte e data', 'Ordem A→Z, cartões iguais, linha de fonte', async () => {
    const nomes = await nomesNaLista();
    const ordenados = nomes.slice().sort((a, b) => a.localeCompare(b, 'pt-BR'));
    confere(JSON.stringify(nomes) === JSON.stringify(ordenados), 'fora de ordem');
    const classes = await pg.locator('[data-teste="cartao-candidato"]').evaluateAll((els) => [...new Set(els.map((e) => e.className))]);
    confere(classes.length === 1, `classes diferentes: ${classes}`);
    const fonte = await pg.locator('[data-teste="fonte"]').innerText();
    confere(/atualizado em \d{2}\/\d{2}\/\d{4}/.test(fonte), fonte);
    return `ordem A→Z; 1 único estilo de cartão; "${fonte}"`;
  });

  await cenario('E04', 'HU02 / CA02.1 — Buscar pelo número "633"', 'Somente João Pedro Silva em até 2 s', async () => {
    const t0 = Date.now();
    await pg.getByLabel('Buscar por nome, número ou partido').fill('633');
    await pg.waitForFunction(() => document.querySelectorAll('[data-teste="cartao-candidato"]').length === 1);
    const ms = Date.now() - t0;
    const nomes = await nomesNaLista();
    confere(nomes[0] === 'João Pedro Silva' && ms < 2000, `${nomes} em ${ms} ms`);
    return `1 resultado (João Pedro Silva) em ${ms} ms (inclui 250 ms de espera da digitação)`;
  });

  await cenario('E05', 'HU02 / CA02.2 — Buscar "Ferreira" sem resultado', '"Nenhum candidato encontrado" + botão Nova busca', async () => {
    await pg.getByLabel('Buscar por nome, número ou partido').fill('Ferreira');
    await pg.getByText('Nenhum candidato encontrado').waitFor();
    await foto('tela3-busca-sem-resultado');
    await pg.getByRole('button', { name: 'Nova busca' }).click();
    await pg.waitForFunction(() => document.querySelectorAll('[data-teste="cartao-candidato"]').length === 4);
    const vazio = await pg.getByLabel('Buscar por nome, número ou partido').inputValue();
    confere(vazio === '', 'campo não foi limpo');
    return 'mensagem exibida; "Nova busca" limpou o campo e voltou a listar 4 candidatos';
  });

  await cenario('E06', 'HU03 / CA03.1 — Abrir perfil (aba Propostas)', 'Nome, número, partido com link, cargo e propostas com fonte', async () => {
    await pg.getByText('João Pedro Silva').click();
    await pg.getByRole('heading', { level: 1, name: 'João Pedro Silva' }).waitFor();
    const link = await pg.locator('[data-teste="link-partido"]').getAttribute('href');
    const itens = await pg.locator('#painel .itens li').count();
    const fonte = await pg.locator('#painel [data-teste="fonte"]').innerText();
    confere(link.startsWith('#/partido/PG') && itens === 3, `${link} / ${itens}`);
    await foto('tela4-perfil-propostas');
    return `perfil com link ${link}, ${itens} propostas e "${fonte}"`;
  });

  await cenario('E07', 'HU03 / CA03.2 — Aba Histórico com links oficiais', 'Cargos e projetos, cada um com link oficial e data', async () => {
    await pg.getByRole('tab', { name: 'Histórico' }).click();
    const hrefs = await pg.locator('#painel a.link-fonte').evaluateAll((as) => as.map((a) => a.href));
    confere(hrefs.length === 4 && hrefs.every((h) => /camara\.leg\.br|senado\.leg\.br|tse\.jus\.br/.test(h)), hrefs.join());
    const sel = await pg.getByRole('tab', { name: 'Histórico' }).getAttribute('aria-selected');
    confere(sel === 'true', 'aba não marcada');
    await foto('tela5-perfil-historico');
    return `${hrefs.length} itens com links para Câmara/TSE; aba marcada (aria-selected=true)`;
  });

  await cenario('E08', 'RF06 — Página do partido a partir do perfil', 'Nome, sigla, número, diretrizes e candidatos', async () => {
    await pg.getByRole('tab', { name: 'Propostas' }).click();
    await pg.locator('[data-teste="link-partido"]').click();
    await pg.getByRole('heading', { level: 1, name: 'Partido Gama' }).waitFor();
    const grupos = await pg.locator('.grupo-cargo h3').allInnerTexts();
    confere(grupos.length === 5, grupos.join());
    await foto('tela6-partido');
    return `página do Partido Gama com diretrizes e ${grupos.length} grupos de cargo (${grupos.join(', ')})`;
  });

  await cenario('E09', 'CA03.2 — Candidato sem histórico', 'Mensagem "Sem cargos ou projetos anteriores registrados"', async () => {
    await pg.goto(`${base}/#/candidato/260000000011?aba=historico`);
    const txt = await pg.locator('[data-teste="sem-historico"]').innerText();
    confere(txt.startsWith('Sem cargos ou projetos anteriores registrados'), txt);
    await foto('tela7-sem-historico');
    return `"${txt}"`;
  });

  await cenario('E10', 'Diagrama de atividades — [UF já definida]', 'Ao voltar ao início, RS já vem selecionado', async () => {
    await pg.goto(`${base}/#/`);
    await pg.reload();
    const uf = await pg.getByLabel('Seu estado (UF)').inputValue();
    confere(uf === 'RS', `UF = ${uf}`);
    return 'UF "RS" mantida no navegador após recarregar a página';
  });

  await cenario('E11', 'RNF02 — Responsividade (320 px e 1280 px)', 'Sem rolagem horizontal; 2 colunas no computador', async () => {
    await pg.setViewportSize({ width: 320, height: 700 });
    await pg.goto(`${base}/#/lista?cargo=deputado-federal&uf=RS`);
    await pg.waitForSelector('[data-teste="cartao-candidato"]');
    const transborda = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    confere(!transborda, 'há rolagem horizontal em 320 px');
    await pg.setViewportSize({ width: 1280, height: 800 });
    const colunas = await pg.locator('.lista').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    confere(colunas === 2, `colunas: ${colunas}`);
    await pg.screenshot({ path: path.join(SAIDA, 'desktop-lista.png') });
    return 'sem rolagem horizontal em 320 px; 2 colunas em 1280 px';
  });

  await cenario('E12', 'RNF02 — Acessibilidade básica', 'lang, nomes acessíveis em campos/fotos, sem erros de JS', async () => {
    await pg.setViewportSize(CELULAR);
    await pg.goto(`${base}/#/lista?cargo=presidente`);
    await pg.waitForSelector('[data-teste="cartao-candidato"]');
    const lang = await pg.getAttribute('html', 'lang');
    const semRotulo = await pg.locator('.avatar:not([aria-label]), input:not([aria-label]):not([id]), img:not([alt])').count();
    confere(lang === 'pt-BR' && semRotulo === 0 && errosConsole.length === 0, `${lang} ${semRotulo} ${errosConsole}`);
    return 'lang="pt-BR"; todas as fotos e campos com nome acessível; 0 erros de JavaScript';
  });

  await navegador.close();
  servidor.close();
  fs.writeFileSync(path.join(SAIDA, 'resultados-e2e.json'), JSON.stringify(resultados, null, 2));
  const falhas = resultados.filter((r) => !r.ok).length;
  console.log(`\n${resultados.length - falhas}/${resultados.length} cenários ok`);
  process.exit(falhas ? 1 : 0);
})();
