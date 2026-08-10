# Helper `Toast` chama `useToastStore()` sem Pinia ativa e lança erro opaco

- **Categoria:** falha
- **Severidade:** baixa
- **Arquivo(s):** `src/helpers/Toast.ts:12-38`
- **Domínio:** helpers-composables

## Problema

Todos os cinco métodos instanciam a store no momento da chamada, sem nenhuma proteção:

```ts
// src/helpers/Toast.ts:15-17
add(payload: ToastPayload): string {
    return useToastStore().add(payload);
},
```

O mesmo padrão em `show` (21), `hide` (25), `delete` (31) e `clear` (35). Chamar qualquer um deles fora de um contexto com Pinia ativa — antes do `app.use(pinia)`, num módulo de boot, ou em código de utilidade fora de componente — lança `getActivePinia()" was called but there was no active Pinia`. O erro do Pinia é genérico e não menciona `Toast` nem o helper, então o desenvolvedor da app consumidora recebe uma pilha que não aponta para a causa.

Isso é agravado pelo posicionamento do helper: o JSDoc (linhas 4-10) o apresenta como *"Helper **global** para exibir toasts"*, com exemplo de uso `Toast.show({...})` sem nenhum contexto de componente. A API convida exatamente ao uso que falha.

Detalhe secundário: `add` (linha 15) e `show` (linha 21) são idênticos linha a linha, assim como `hide` (25) e `delete` (31). Os aliases estão documentados como tais, mas duplicam o corpo em vez de delegar (`show: (p) => Toast.add(p)`), então uma mudança futura em `add` precisa ser replicada manualmente em `show`.

O teste existente (`tests/helpers/Toast.test.ts`, 56 linhas) roda com Pinia provida globalmente pelo `tests/setup.ts` (conforme `CLAUDE.md`), então o caminho sem Pinia nunca é exercitado.

## Impacto

Um erro de inicialização em app consumidora que aponta para as entranhas do Pinia em vez de dizer "chame `Toast` só após `app.use(pinia)`". Custo de diagnóstico desproporcional à trivialidade da causa.

## Plano de correção

1. Envolver a resolução da store num helper interno que capture o erro e relance com mensagem contextualizada: `[MaxComponentsUi] Toast.<metodo>() exige uma instância ativa do Pinia. Chame app.use(pinia) antes.`
2. Fazer `show` delegar a `add` e `delete` delegar a `hide`, eliminando a duplicação de corpo.
3. Documentar no JSDoc a exigência de Pinia ativa, corrigindo a impressão de que o helper é utilizável em qualquer ponto.

## Verificação

- Testes a criar/ajustar: `tests/helpers/Toast.test.ts` — adicionar caso com `setActivePinia(undefined)` assertando que a mensagem lançada contém `[MaxComponentsUi]`; e caso confirmando que `show` e `add` chamam o mesmo método da store (via spy).
- Comandos: `npx vitest run tests/helpers/Toast.test.ts`, `npm run type-check`, `npm run lint`
