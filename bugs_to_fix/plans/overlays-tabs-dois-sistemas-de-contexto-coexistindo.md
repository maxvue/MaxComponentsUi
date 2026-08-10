# MaxTabs mantém dois sistemas de contexto concorrentes (`tabs_info` legado + `TABS_INJECTION_KEY`) na mesma instância

- **Categoria:** divergência
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTabs.vue:101-110`, `src/components/MaxTabs.vue:176-190`, `src/components/MaxTabItem.vue:34`, `src/components/MaxTab.vue:32`
- **Domínio:** overlays-navegacao

## Problema

O `MaxTabs` faz **dois `provide` distintos** para dois sistemas de abas que coexistem:

1. **Sistema legado**, `provide('tabs_info', {...})` (linhas 101-110), com chave string e consumido por `MaxTabItem` via `inject('tabs_info')` tipado como `any` (`src/components/MaxTabItem.vue:34`).
2. **Sistema novo**, `provide(TABS_INJECTION_KEY, {...})` (linhas 176-190), com `InjectionKey` tipado, consumido por `MaxTab`, `MaxTabList`, `MaxTabPanel` e `MaxTabPanels` via `injectTabsContext`.

Ambos derivam do mesmo `active_tab` (`defineModel`, linha 55), mas com **semânticas divergentes**:

- O legado usa numeração automática por ordem de montagem quando não há `value` (`MaxTabItem.vue:52`: `tabs_info.add_count_tabs()`), e força a seleção da primeira aba com dois `setTimeout` encadeados de 0ms e 10ms (`MaxTabItem.vue:49-57`).
- O novo usa `effective_active_value`/`fallback_tab_value` computados de forma síncrona (`MaxTabs.vue:126-146`).
- O legado compara com `String(...)` frouxo (`MaxTabItem.vue:44`); o novo normaliza para string no `active_value` (`MaxTabs.vue:113`).
- O legado mantém `registered_tabs` (linha 83) e `hasActiveTab`/`selectFirstTabIfNoneActive` (linhas 93-99); o novo mantém `tab_headers` (linha 116) — **dois registros paralelos da mesma coisa**, que podem divergir.

Se um consumidor misturar `MaxTabItem` e `MaxTab` sob o mesmo `MaxTabs` (nada impede), as duas máquinas de estado disputam o mesmo `active_tab`: os `setTimeout` do `MaxTabItem` (linha 55) podem sobrescrever uma seleção feita pelo `MaxTab` até 10ms após a montagem.

Note ainda que `hasActiveTab` e `selectFirstTabIfNoneActive` (linhas 93-99) são providos no `tabs_info` mas **nunca chamados** pelo `MaxTabItem` — código morto que sugere migração inacabada.

A cobertura do `MaxTabs` é de 77,9% stmts / 54% branches, consistente com dois caminhos alternativos dos quais só um é exercitado por vez nos testes.

## Impacto

Superfície de manutenção duplicada com risco de comportamento indeterminado na mistura dos dois sistemas. A migração para independência do PrimeVue (descrita no `CLAUDE.md`) fica mais cara enquanto o legado permanecer, e a cobertura de branches não sobe porque metade dos caminhos é inalcançável nos cenários testados.

## Plano de correção

1. Confirmar com o time o estado da migração: `MaxTabItem` é legado a ser deprecado, ou API pública mantida indefinidamente?
2. Marcar `MaxTabItem` como `@deprecated` no JSDoc e no README, apontando para `MaxTabList`/`MaxTab`/`MaxTabPanels`/`MaxTabPanel`.
3. Remover o código morto: `hasActiveTab` e `selectFirstTabIfNoneActive` (linhas 93-99) e o `registered_tabs`/`registerTab` legado (linhas 82-86) se de fato nenhum consumidor os usa — confirmar com `grep -rn "tabs_info" src/`.
4. Substituir os `setTimeout` do `MaxTabItem` (linhas 49-57) por lógica síncrona equivalente à do novo sistema (`effective_active_value`), eliminando a janela de corrida de 10ms.
5. Tipar o `inject('tabs_info')` do `MaxTabItem` (linha 34), removendo o `any` — ver `overlays-tipos-any-em-componentes-de-navegacao.md`.
6. Adicionar um aviso em dev (`console.warn`) se ambos os sistemas forem detectados sob o mesmo `MaxTabs`, até que o legado seja removido.

## Verificação

- Teste em `tests/components/MaxTabs.test.ts`: montar um `MaxTabs` com um `MaxTabItem` **e** um `MaxTab` simultaneamente; afirmar o comportamento determinístico definido no passo 6 (aviso emitido e uma única aba ativa após `vi.advanceTimersByTime(20)`).
- Teste do `MaxTabItem` sem `setTimeout`: os testes de `tests/components/MaxTabItem.test.ts` devem passar sem `await nextTick()` extra nem timers falsos após a refatoração do passo 4.
- `npx vitest run tests/components/MaxTabs.test.ts tests/components/MaxTabItem.test.ts`
- `npm run test:coverage` conferindo a subida das branches de `MaxTabs.vue` de 54%.
