# 14 — Resolver oferece componentes que o index.ts não exporta

**Severidade:** Alta
**Categoria:** Bug / Build
**Arquivos:** `src/components-manifest.json`, `src/index.ts`, `src/helpers/MaxComponentsUiResolver.ts:12-16`, `src/scripts/generateResolver.ts`

## Problema

O manifesto lista os 89 `.vue` (sincronizado com o filesystem), mas **`MaxApp`, `MaxTableColumn` e `MaxTogglePopover` não são exportados por `src/index.ts`**. O resolver retorna `{ name: 'MaxTableColumn', from: '@maxvue/max-components-ui' }` para qualquer app que use `<MaxTableColumn>`, `<TableColumn>`, `<max-app>` etc. → erro de import em runtime/build no consumidor.

`MaxApp` inclusive está excluído do tsconfig (arquivo órfão — ver achado 03) mas continua no manifesto.

## Evidência

Diff programático manifesto × index.ts: `targets NOT exported: ['MaxApp', 'MaxTableColumn', 'MaxTogglePopover']`. `MaxTableColumn` é usado internamente por `MaxTableFields.vue` e tem teste próprio.

## Correção sugerida

- Exportar `MaxTableColumn` e `MaxTogglePopover` em `src/index.ts`.
- Fazer `generateResolver.ts` excluir do manifesto componentes na lista de exclusão do tsconfig (ex.: `MaxApp`).
- Regenerar: `npx tsx src/scripts/generateResolver.ts`.
