# 01 — `MaxTabList`, `MaxTabPanels` e `MaxTabPanel` lançam exceção fatal dentro do novo `MaxTabs`

- **Severidade:** Crítico
- **Tipo:** Bug / quebra em runtime
- **Arquivos:** [src/components/MaxTabs.vue](../src/components/MaxTabs.vue), [src/components/MaxTabList.vue](../src/components/MaxTabList.vue), [src/components/MaxTabPanels.vue](../src/components/MaxTabPanels.vue), [src/components/MaxTabPanel.vue](../src/components/MaxTabPanel.vue), [src/helpers/tabsContext.ts](../src/helpers/tabsContext.ts)
- **Estado:** alteração **não commitada** no working tree

## Descrição

A reescrita não commitada de [MaxTabs.vue](../src/components/MaxTabs.vue) trocou o
mecanismo de comunicação com os filhos. A implementação anterior fornecia um
contexto tipado através de uma `InjectionKey`:

```ts
provide(TABS_INJECTION_KEY, { active_value, select, lazy, registerTab, navigate, /* ... */ });
```

A nova implementação fornece um objeto **completamente diferente**, sob uma chave
**string** diferente ([MaxTabs.vue:51-57](../src/components/MaxTabs.vue#L51-L57)):

```ts
provide('tabs_info', {
    active_tab, tabs_id, count_tabs, add_count_tabs, selectTab
});
```

Porém `MaxTabList`, `MaxTabPanels` e `MaxTabPanel` **não foram atualizados** e
continuam consumindo o contexto antigo via `injectTabsContext()`, que lança erro
quando não encontra a chave ([tabsContext.ts:54-57](../src/helpers/tabsContext.ts#L54-L57)):

```ts
export const injectTabsContext = (component: string): TabsContext => {
    const context = inject(TABS_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxTabs>.`);
    return context;
};
```

Como `TABS_INJECTION_KEY` é um `Symbol` e o novo `MaxTabs` fornece a string
`'tabs_info'`, o `inject` **nunca** resolve. O resultado é uma exceção fatal
durante o `setup()`, que derruba a árvore de renderização inteira.

## Cenário de falha

Qualquer consumidor que use a API pública documentada:

```vue
<MaxTabs v-model:value="aba">
    <MaxTabList>
        <MaxTab value="a">Primeira</MaxTab>
    </MaxTabList>
    <MaxTabPanels>
        <MaxTabPanel value="a">Conteúdo</MaxTabPanel>
    </MaxTabPanels>
</MaxTabs>
```

Resultado: `Error: [MaxComponentsUi] <MaxTabList> precisa estar dentro de um <MaxTabs>.`
mesmo estando corretamente dentro de um `<MaxTabs>` — a mensagem de erro é
**enganosa**, apontando para um problema de uso quando a causa é interna.

## Evidência

Reproduzido pela suíte de testes — 25 de 26 testes de
[tests/components/MaxTabs.test.ts](../tests/components/MaxTabs.test.ts) falham:

```
Error: [MaxComponentsUi] <MaxTabList> precisa estar dentro de um <MaxTabs>.
 ❯ injectTabsContext src/helpers/tabsContext.ts:56:26
 ❯ setup src/components/MaxTabList.vue:34:21
```

Agravante: os cinco componentes continuam **exportados na API pública** em
[src/index.ts:33-45](../src/index.ts#L33-L45) e listados em
`src/components-manifest.json`, ou seja, ficam disponíveis para auto-import em
apps consumidoras enquanto estão garantidamente quebrados.

## Causa raiz

Migração parcial: o componente-pai foi reescrito com uma arquitetura nova
(`teleport` para um container de headers) sem que os componentes-filhos da
arquitetura antiga fossem migrados ou removidos. As duas arquiteturas coexistem
no mesmo diretório sem qualquer ponte entre elas.

## Correção recomendada

São necessárias decisões de produto, não apenas de código. Duas rotas coerentes:

**Rota A — completar a nova arquitetura (`MaxTabItem` unificado):**
1. Remover `MaxTabList.vue`, `MaxTabPanels.vue`, `MaxTabPanel.vue`, `MaxTab.vue`
   e `src/helpers/tabsContext.ts`.
2. Remover os exports correspondentes de [src/index.ts](../src/index.ts#L33-L45).
3. Regenerar o manifesto: `npx tsx src/scripts/generateResolver.ts`.
4. Reescrever [tests/components/MaxTabs.test.ts](../tests/components/MaxTabs.test.ts)
   para a nova API (`MaxTabs` + `MaxTabItem`).
5. **Documentar como breaking change** — a API pública muda de 5 componentes para
   2, o que exige bump de major version.

**Rota B — reverter a reescrita:**
```bash
git checkout -- src/components/MaxTabs.vue src/components/MaxTabItem.vue src/components/MaxTabPanel.vue
```
Retorna à implementação acessível e testada, mantendo a evolução para um branch
dedicado até estar completa.

## Nota sobre processo

O `CLAUDE.md` deste repositório determina que alterações propostas por agentes
ocorram em **git worktree separado**, nunca no working tree principal. Esta
reescrita está diretamente no working tree do branch `dev`, misturada com o
estado estável — o que dificulta reverter uma coisa sem a outra.
