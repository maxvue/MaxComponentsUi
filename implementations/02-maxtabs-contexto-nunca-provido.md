# 02 — Sistema MaxTabs quebrado: contexto nunca é provido (25 testes falhando)

**Severidade:** Crítica
**Categoria:** Bug de produto
**Arquivos:** `src/components/MaxTabs.vue:81`, `src/components/MaxTabList.vue`, `src/components/MaxTab.vue`, `src/components/MaxTabPanel.vue`, `src/helpers/tabsContext.ts:48-56`

## Problema

`MaxTabList`, `MaxTab` e `MaxTabPanel` injetam o contexto via `injectTabsContext()` (Symbol `TABS_INJECTION_KEY`), mas **nenhum componente chama o provider** — grep por `TABS_INJECTION_KEY` só encontra o próprio `tabsContext.ts`. `MaxTabs.vue` provê apenas a chave string legada `'tabs_info'`.

Qualquer uso real de `<MaxTabList>` dentro de `<MaxTabs>` lança:

```
Error: [MaxComponentsUi] <MaxTabList> precisa estar dentro de um <MaxTabs>.
```

É exatamente o que derruba os 25 testes de `tests/components/MaxTabs.test.ts` (`npm run test`: 25 failed | 624 passed).

Havia arquivos deletados não commitados em `implementations/` (ex.: `01-tabs-contexto-quebrado.md`) indicando uma refatoração de Tabs iniciada e não concluída.

## Correção sugerida

Em `MaxTabs.vue`, prover o contexto tipado (`provide(TABS_INJECTION_KEY, {...})` ou uma função `provideTabsContext`) com a API definida em `tabsContext.ts`, mantendo `'tabs_info'` para os filhos legados (`MaxTabItem`). Rodar `npx vitest run tests/components/MaxTabs.test.ts` até 100% verde.

## Relacionados

- `MaxTabPanel.vue:31`: computed `should_render` calculado e nunca usado no template — provável lazy-render não ligado.
- `MaxTabItem.vue:16`: imports mortos `Random`, `watchOnce` (warnings ESLint).
