# Janela Nacional

Site que reúne, em linguagem simples e de forma **neutra**, as informações básicas dos candidatos de uma eleição
(nome, número, partido, propostas e histórico de atuação). Projeto Integrador — RGD-ENS001 Engenharia de Software, IFRS Campus Rio Grande.

> Protótipo funcional (Entrega 4 + 5). **Nomes, números e partidos são fictícios.** O sistema não recomenda nem ranqueia candidatos.

## Como rodar

Requer Node.js 18 ou superior.

```bash
npm install
npm run importar   # (opcional) regenera data/candidatos.json a partir do CSV do TSE
npm start          # http://localhost:3000
```

## Testes

```bash
npm test                         # 22 testes unitários e de integração (node:test)
npx playwright install chromium  # uma vez
npm run test:e2e                 # 12 cenários no navegador + capturas em docs/evidencias/
```

## Organização do código

| Pasta | Responsabilidade |
|---|---|
| `public/` | Interface web (SPA): `js/main.js` (roteador), `js/views/` (telas), `js/components/` (cartão, avatar, fonte…), `js/api.js` (cliente da API), `js/estado.js` (UF salva) |
| `server/routes/` | Rotas da API REST (`/api/...`) |
| `server/controllers/` | Traduzem HTTP ⇄ serviços |
| `server/services/` | Regras de negócio: lista por cargo/UF, busca, perfil, partido, neutralidade |
| `server/repositories/` | Leitura dos dados (JSON) |
| `server/domain/`, `server/utils/` | Cargos, UFs, erros; normalização de acentos e ordem alfabética |
| `importador/`, `scripts/` | Importação dos dados abertos do TSE (`consulta_cand_AAAA_UF.csv`) |
| `data/` | Dados gerados (`candidatos.json`), partidos e curadoria (propostas, histórico) |
| `tests/` | `unit/`, `integration/`, `e2e/` |
| `docs/` | Diagrama de componentes e evidências de teste |

## API

| Método e rota | Descrição |
|---|---|
| `GET /api/ufs` · `GET /api/cargos` | Listas de referência |
| `GET /api/candidatos?cargo=senador&uf=RS&q=silva` | Lista em ordem alfabética, com busca opcional (nome, número exato ou sigla) |
| `GET /api/candidatos/:id` | Perfil com propostas e histórico |
| `GET /api/partidos/:sigla?uf=RS` | Página do partido |

Toda resposta informa `fonte` e `atualizadoEm`.

## Integrantes

Andrew · William Motta · Lucas Madono · Paulo César
