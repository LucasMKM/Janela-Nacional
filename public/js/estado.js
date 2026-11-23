// Guarda a UF escolhida no navegador (caminho "[UF já definida]" do diagrama de atividades).
const CHAVE = 'janela-nacional:uf';

export function ufSalva() {
  try { return localStorage.getItem(CHAVE); } catch { return null; }
}

export function salvarUf(uf) {
  try { localStorage.setItem(CHAVE, uf); } catch { /* navegação privada: segue sem salvar */ }
}
