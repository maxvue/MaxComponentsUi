# MaxTableColumn é um componente vazio que duplica (e conflita com) o CSS do MaxTable

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTableColumn.vue:1-9`, `src/components/MaxTableColumn.vue:12-139`, `src/components/MaxTable.vue:46-183`
- **Domínio:** tabela-layout-exibicao

## Problema

O componente não renderiza nada — o `<template>` está vazio (linhas 1-4) e o `<script setup>` contém apenas um import não utilizado:

```ts
import _Column from 'primevue/column';
```

O único efeito real do arquivo é o bloco `<style lang="scss">` **não escopado** (linhas 12-139), que redeclara integralmente o seletor `.max-table-main-div` — o mesmo seletor definido em `MaxTable.vue:47`, também não escopado. As duas declarações **divergem** em pontos concretos:

| Propriedade | `MaxTable.vue` | `MaxTableColumn.vue` |
|---|---|---|
| `width` / `height` do wrapper | `100%` (l. 51-52) | `calc(100% - 4px)` (l. 17-18) |
| `tbody` display | `flex` + `flex-direction: column` (l. 124-125) | `grid` (l. 89) |
| `tr` padding | `3px 6px` + regras `:first-of-type`/`:last-of-type` (l. 132-140) | `0 6px` (l. 95) |
| `tr` gap | `0 6px` (l. 131) | `6px` (l. 97) |
| `th` height | `100%` (l. 97) | ausente |
| `.max-table-buttons` | `width: auto`, `gap: 8px`, `padding: 0 6px` (l. 170-176) | `width: 100%`, `gap: 5px`, `.icon-div { flex-grow: 1 }` (l. 123-132) |

Como ambos os blocos são globais e injetados no mesmo CSS final, **qual vence depende da ordem de import no bundle** — resultado não determinístico entre builds. O teste existente (`tests/components/MaxTableColumn.test.ts`) confirma que o componente "não renderiza nenhum conteúdo", tratando o comportamento como esperado, mas não cobre o efeito colateral do CSS.

O CLAUDE.md registra que `MaxTable` → `MaxTableColumn` → `MaxTableFields` migram juntos na saída do PrimeVue; este arquivo é candidato natural a remoção nessa etapa.

## Impacto

- Estilos de tabela imprevisíveis conforme a ordem de bundling — bug de layout intermitente e difícil de diagnosticar.
- Peso morto no bundle: um componente exportado que não renderiza nada.
- Import `_Column` sem uso, mantendo uma dependência do PrimeVue sem propósito e poluindo o inventário da migração.

## Plano de correção

1. Confirmar que nenhuma aplicação consumidora referencia `MaxTableColumn` (checar `src/components-manifest.json`, `src/index.ts` e os aliases do resolver).
2. Remover o bloco `<style>` duplicado — a folha de estilo de tabela deve viver em um único lugar (`MaxTable.vue`). Se alguma das divergências acima for a versão desejada, portá-la explicitamente para `MaxTable.vue` antes de apagar.
3. Remover o import `_Column` não utilizado.
4. Decidir o destino do componente: deprecar/remover (com atualização de `src/index.ts` e regeneração do manifesto via `npx tsx src/scripts/generateResolver.ts`), ou transformá-lo em um wrapper real de `primevue/column` com API própria.
5. Registrar a decisão em `migration_plans/MaxTableColumn.md`.

## Verificação

- `npm run build` e inspeção do CSS gerado: o seletor `.max-table-main-div` deve aparecer uma única vez.
- `npx vitest run tests/components/MaxTable.test.ts tests/components/MaxTableColumn.test.ts`.
- Conferir visualmente uma tabela no playground antes e depois da remoção.
