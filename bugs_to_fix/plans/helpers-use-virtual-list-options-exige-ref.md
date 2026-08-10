# `UseVirtualListOptions` obriga `itemHeight`/`enabled` a serem `Ref`, contrariando o nome `MaybeRef`

- **Categoria:** melhoria
- **Severidade:** baixa
- **Arquivo(s):** `src/composables/useVirtualList.ts:3`, `:12-15`, `:34`, `:37`
- **Domínio:** helpers-composables

## Problema

O alias declarado é:

```ts
// src/composables/useVirtualList.ts:3
type MaybeRef<T> = Ref<T> | ComputedRef<T>;
```

O nome `MaybeRef` é o idiom estabelecido (VueUse) para "`T` **ou** `Ref<T>`". Aqui ele significa o oposto: **sempre** um ref, nunca o valor cru. O corpo confirma — todo acesso é via `.value` sem `unref`:

```ts
// :34
const totalHeight = computed(() => items.value.length * options.itemHeight.value);
// :37
if (!options.enabled.value) return 0;
```

Consequências para o consumidor:

1. Chamar `useVirtualList(items, { itemHeight: 32, enabled: true })` — a forma mais natural para valores constantes — falha na compilação, e o nome do tipo sugere que deveria funcionar.
2. Não há `unref()`/`toValue()` em lugar nenhum do arquivo, então nem sequer há suporte parcial.
3. `items` sofre do mesmo problema (linha 24, `items: MaybeRef<T[]>`, acessado como `items.value` nas linhas 34, 40, 49, 53).

Nada disso é bug funcional — é um contrato público enganoso, num arquivo que compõe a superfície de API da lib (composable exportado de `src/composables/`).

## Impacto

Fricção de DX na app consumidora: o desenvolvedor precisa envolver constantes em `ref()` sem motivo aparente, e o erro do TypeScript aponta para um tipo cujo nome contradiz a mensagem. Em revisão futura, alguém pode "corrigir" o tipo para incluir o valor cru sem ajustar o corpo, quebrando em runtime.

## Plano de correção

1. Renomear o alias para `RefLike<T>` (ou reutilizar `MaybeRefOrGetter` do próprio Vue) para que o nome descreva o que o código faz.
2. Alternativa preferível: manter o nome `MaybeRef` com a semântica canônica (`T | Ref<T> | ComputedRef<T>`) e trocar todos os acessos `.value` por `toValue(...)` do Vue 3.3+, que é exatamente o utilitário para isso. Isso amplia a API sem quebrar chamadores existentes.
3. Atualizar o JSDoc das opções (linhas 12-16) para registrar a forma aceita.

## Verificação

- Testes a criar/ajustar: `tests/composables/useVirtualList.test.ts` — se o passo 2 for adotado, adicionar caso passando `itemHeight: 32` e `enabled: true` como valores crus, e outro passando `items` como array cru.
- Comandos: `npx vitest run tests/composables/useVirtualList.test.ts`, `npm run type-check`, `npm run lint`
