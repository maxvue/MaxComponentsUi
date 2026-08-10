# `injectTabsContext()` sem teste unitário

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/helpers/tabsContext.ts:63-67`
- **Domínio:** helpers-composables

## Problema

Não existe `tests/helpers/tabsContext.test.ts`. O arquivo exporta uma função de runtime que lança:

```ts
// src/helpers/tabsContext.ts:63-67
export const injectTabsContext = (component: string): TabsContext => {
    const context = inject(TABS_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxTabs>.`);
    return context;
};
```

O que torna este caso mais grave que o do accordion é a densidade de contrato documentada apenas em JSDoc, sem nenhuma asserção executável. As linhas 10-36 descrevem três campos com semântica sutil e interdependente:

- `fallback_tab_value` (linhas 10-18): "o tablist nunca fique inteiramente inalcançável por teclado (WAI-ARIA exige exatamente um tab com tabindex 0)".
- `effective_active_value` (linhas 19-27): cai para o fallback "quando não há v-model definido (modo não controlado) ou o value ativo é órfão".
- `has_registered_active_tab` (linhas 28-36): "Antes do registro ter ao menos um tab (janela entre a primeira renderização do MaxTabs e o onMounted dos MaxTab filhos), fica true de forma conservadora".

Essa última regra — o comportamento conservador durante a janela de montagem — é precisamente o tipo de invariante que quebra em refatoração silenciosa. O contrato está descrito no tipo, mas a implementação vive nos componentes (`MaxTabs.vue` e filhos); nada neste arquivo nem em teste algum verifica que o produtor do contexto respeita o que a interface promete.

## Impacto

Se `has_registered_active_tab` deixar de ser conservador durante a montagem, todos os `MaxTab` renderizam com `tabindex="-1"` no primeiro frame e o tablist fica temporariamente inacessível por teclado — regressão de acessibilidade invisível para testes de snapshot e para inspeção visual.

## Plano de correção

1. Criar `tests/helpers/tabsContext.test.ts` cobrindo o comportamento direto da função: contexto provido é devolvido intacto; ausência de provide lança com a mensagem `[MaxComponentsUi] <MaxTab> precisa estar dentro de um <MaxTabs>.`
2. Complementar com testes de integração (em `tests/components/MaxTabs.test.ts`, se já existir, ou novo) que assertem os três invariantes documentados: exatamente um tab com `tabindex="0"` após a montagem; fallback ativo quando o `v-model` é `undefined`; fallback ativo quando o `active_value` aponta para um tab removido dinamicamente.
3. Assertar que `TABS_INJECTION_KEY` (linha 57) é um `Symbol` distinto das chaves de accordion, evitando colisão entre contextos.

## Verificação

- Testes a criar/ajustar: `tests/helpers/tabsContext.test.ts` (novo), `tests/components/MaxTabs.test.ts`
- Comandos: `npx vitest run tests/helpers/tabsContext.test.ts`, `npm run type-check`, `npm run lint`
