# 05 — Export `./stores` do package.json aponta para arquivo que o build não gera

**Severidade:** Crítica
**Categoria:** Build / Empacotamento
**Arquivos:** `package.json` (exports `./stores`), `vite.config.ts:25-30`

## Problema

`package.json` declara:

```json
"./stores": { "import": "./dist/stores/index.es.js" }
```

Mas o build multi-entrada do Vite só tem 4 entradas (`index`, `preset`, `resolver`, `prime`). `dist/stores/` contém apenas `.d.ts` — o `.es.js` não existe. Qualquer consumidor que importe `@maxvue/max-components-ui/stores` quebra em runtime/build.

## Evidência

`ls dist/stores/*.es.js` → "no matches found".

## Correção sugerida

Uma das duas:
1. Adicionar `stores: path.resolve(__dirname, './src/stores/index.ts')` em `build.lib.entry` no `vite.config.ts`; ou
2. Remover o export `./stores` do package.json (as stores já saem pelo index via `export * from './stores'`).
