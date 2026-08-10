# MaxTableFields gera o id da tabela dentro de um computed com ulid()

- **Categoria:** bug
- **Severidade:** baixa
- **Arquivo(s):** `src/components/MaxTableFields.vue:138`, `src/components/MaxTableFields.vue:2`, `src/components/MaxTableFields.vue:235`
- **Domínio:** tabela-layout-exibicao

## Problema

```ts
const tableId = computed(() => props.id ?? ulid());
```

`ulid()` é uma função **impura** dentro de um `computed`. O valor é cacheado enquanto as dependências não mudam, mas o computed depende de `props.id`: qualquer alteração de `props.id` (inclusive de `undefined` para `undefined` em um re-registro do efeito, ou uma invalidação do cache) produz um **novo** ULID.

O `tableId` é aplicado ao `id` do DOM (linha 2) e exposto via `defineExpose` (linha 235). Um `id` de DOM que muda entre renders invalida qualquer referência externa: `document.getElementById`, âncoras, `aria-controls`/`aria-labelledby` apontando para a tabela, seletores de teste e alvos de `Teleport`.

O idioma correto para um identificador estável é gerá-lo uma única vez fora do sistema reativo.

## Impacto

- Referências externas ao `id` da tabela quebram silenciosamente.
- Atributos ARIA que apontem para o id ficam pendurados.
- Comportamento não determinístico e difícil de testar.

## Plano de correção

1. Gerar o fallback uma única vez, fora do computed:
   ```ts
   const fallbackId = ulid();
   const tableId = computed<string>(() => props.id ?? fallbackId);
   ```
2. Manter o `defineExpose({ tableId })` inalterado.

## Verificação

- Teste: montar sem `id`, ler `vm.tableId`, forçar um re-render (`setProps` de outra prop) e asserir que o `id` do DOM permanece o mesmo.
- `npx vitest run tests/components/MaxTableFields.test.ts`.
