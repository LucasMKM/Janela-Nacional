// Cliente da API REST do back-end. Único ponto do front-end que faz requisições.
async function get(caminho, params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const resp = await fetch(`/api${caminho}${qs.toString() ? `?${qs}` : ''}`);
  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(corpo.erro || 'Não foi possível carregar os dados.');
  return corpo;
}

export const api = {
  ufs: () => get('/ufs'),
  cargos: () => get('/cargos'),
  candidatos: ({ cargo, uf, q }) => get('/candidatos', { cargo, uf, q }),
  candidato: (id) => get(`/candidatos/${encodeURIComponent(id)}`),
  partido: (sigla, uf) => get(`/partidos/${encodeURIComponent(sigla)}`, { uf }),
};
