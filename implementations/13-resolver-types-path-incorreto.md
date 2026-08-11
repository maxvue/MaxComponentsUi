# 13 — Export `./resolver`: caminho de types aponta para arquivo inexistente

**Severidade:** Alta
**Categoria:** Build / Empacotamento
**Arquivos:** `package.json` (exports `./resolver`)

## Problema

`"types": "./dist/helpers/resolver.d.ts"` aponta para arquivo que não existe; o vite-plugin-dts gera `dist/helpers/MaxComponentsUiResolver.d.ts`. Consumidores TypeScript do subpath `/resolver` ficam sem tipos.

## Evidência

`ls dist/helpers/` mostra apenas `MaxComponentsUiResolver.d.ts`.

## Correção sugerida

Trocar para `"types": "./dist/helpers/MaxComponentsUiResolver.d.ts"`.
