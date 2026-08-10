# `injectAccordionContext()` / `injectPanelContext()` sem teste unitário

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/helpers/accordionContext.ts:43-57`
- **Domínio:** helpers-composables

## Problema

Não existe `tests/helpers/accordionContext.test.ts`. O arquivo exporta duas funções com comportamento de runtime (não apenas tipos) que lançam exceção:

```ts
// src/helpers/accordionContext.ts:43-47
export const injectAccordionContext = (component: string): AccordionContext => {
    const context = inject(ACCORDION_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxAccordion>.`);
    return context;
};
```

e o par equivalente `injectPanelContext` (linhas 53-57). Ambas são a superfície de erro que o desenvolvedor da app consumidora encontra ao montar a hierarquia errada — a mensagem de erro **é** parte do contrato público, e nada garante que ela permaneça estável ou que a função de fato lance.

Dois detalhes verificáveis não cobertos:

1. `inject(KEY, null)` com default `null` significa que a função também lança quando chamada **fora de qualquer setup de componente** — nesse caso o Vue emite um warning adicional (`inject() can only be used inside setup()`), e o erro resultante confunde a causa real.
2. O guard é `if (! context)` e não `if (context === null)`. Se algum dia um contexto legítimo for provido como valor falsy (improvável para um objeto, mas o tipo não impede), a checagem falharia. É um risco pequeno mas trivial de fixar.

Também não existe teste para `tabsContext.ts` — coberto no plano `helpers-tabs-context-sem-teste.md`.

## Impacto

A mensagem de erro é a única documentação em runtime de que `<MaxAccordionHeader>` precisa de um `<MaxAccordion>` ancestral. Alterá-la ou removê-la acidentalmente (por exemplo, ao migrar o componente para fora do PrimeVue, conforme `status-primevue.migration.yaml`) degradaria a DX sem nenhum sinal em CI.

## Plano de correção

1. Criar `tests/helpers/accordionContext.test.ts`.
2. Cobrir, montando componentes de teste com `@vue/test-utils`: (a) com `provide(ACCORDION_INJECTION_KEY, ctx)`, `injectAccordionContext('MaxAccordionHeader')` devolve exatamente o objeto provido; (b) sem provide, lança `Error` com a mensagem `[MaxComponentsUi] <MaxAccordionHeader> precisa estar dentro de um <MaxAccordion>.`.
3. Repetir os dois casos para `injectPanelContext` / `PANEL_INJECTION_KEY`.
4. Assertar que `ACCORDION_INJECTION_KEY !== PANEL_INJECTION_KEY` (são `Symbol()` distintos, linhas 35 e 37) — protege contra colisão em refatoração.

## Verificação

- Testes a criar/ajustar: `tests/helpers/accordionContext.test.ts` (novo)
- Comandos: `npx vitest run tests/helpers/accordionContext.test.ts`, `npm run type-check`, `npm run lint`
