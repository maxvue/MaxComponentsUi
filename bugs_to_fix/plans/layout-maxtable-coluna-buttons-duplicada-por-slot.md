# MaxTable renderiza a Column de botões uma vez por slot declarado

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxTable.vue:4-13`
- **Domínio:** tabela-layout-exibicao

## Problema

O template itera sobre **todos** os slots e, dentro de cada iteração, renderiza condicionalmente a `Column` de botões:

```vue
<template v-for="name in slotNames" #[name]="slotProps" :key="name">
    <slot :name="name" v-bind="slotProps || {}" v-if="name !== 'buttons'"></slot>
    <Column header="" v-if="slotNames.includes('buttons')" :style="...">
```

A condição da `Column` é `slotNames.includes('buttons')` — um valor **constante** dentro do loop, não `name === 'buttons'`. Consequência: se a aplicação passar N slots (ex.: `header`, `footer`, `buttons`), a `Column` de botões é emitida N vezes, uma dentro de cada slot nomeado do `DataTable`. Além disso, a `Column` é emitida **dentro** do conteúdo de um slot arbitrário do `DataTable` (ex.: `#header`), e não como filho direto da `DataTable` — o PrimeVue só coleta `Column` a partir dos filhos default, então em vários cenários a coluna de botões simplesmente não é registrada como coluna.

O teste existente (`tests/components/MaxTable.test.ts:70`) usa um stub de `DataTable` que renderiza apenas o slot `buttons`, mascarando o defeito: com um único slot o bug não aparece.

## Impacto

- Colunas de ação duplicadas (ou ausentes) quando a tabela recebe mais de um slot.
- Cabeçalho e corpo dessincronizados, quebrando o alinhamento de colunas do `DataTable`.
- O bug só se manifesta em uso real com múltiplos slots — não é coberto pela suíte.

## Plano de correção

1. Extrair a `Column` de botões para fora do `v-for`, como filho direto do `DataTable`, renderizada apenas uma vez:
   ```vue
   <DataTable v-bind="attrs" stripedRows>
       <template v-for="name in slotNames.filter(n => n !== 'buttons')" #[name]="slotProps" :key="name">
           <slot :name="name" v-bind="slotProps || {}"></slot>
       </template>
       <Column v-if="slotNames.includes('buttons')" header="" :style="...">
           <template #body="{ data, index }"> ... </template>
       </Column>
   </DataTable>
   ```
2. Manter o `defineExpose({ width })` e a lógica do `useElementSize` inalterados.

## Verificação

- Novo teste montando `MaxTable` com os slots `header`, `footer` e `buttons` simultaneamente, com stub de `DataTable` que renderize todos os slots, asserindo exatamente **uma** ocorrência de `.max-table-buttons` por linha.
- `npx vitest run tests/components/MaxTable.test.ts`.
- Verificação manual no playground com uma tabela com múltiplos slots.
