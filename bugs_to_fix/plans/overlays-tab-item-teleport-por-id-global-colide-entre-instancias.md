# MaxTabItem teleporta para um `id` derivado de `props.id` — dois `MaxTabs` com o mesmo `id` colidem e o teleport pode ficar órfão

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTabItem.vue:2`, `src/components/MaxTabs.vue:4`, `src/components/MaxTabs.vue:68`, `src/components/MaxTabItem.vue:46-58`
- **Domínio:** overlays-navegacao

## Problema

O `MaxTabs` cria o alvo de teleport como `<div class="max-tabs-title" :id="'max-tab-' + tabs_id">` (linha 4), onde `tabs_id = computed(() => props.id ?? Random())` (linha 68). O `MaxTabItem` teleporta seu título para lá (linha 2):

```
<teleport :to="'#max-tab-' + toValue(tabs_info?.tabs_id)" v-if="toValue(tabs_info?.tabs_id) && is_mounted">
```

Três problemas:

1. **Colisão de `id` entre instâncias.** Se dois `MaxTabs` na mesma página receberem o **mesmo** `props.id` (cenário plausível: um componente de tela reutilizado em duas colunas, ou uma rota que renderiza o mesmo bloco duas vezes), ambos geram `id="max-tab-<mesmo-id>"`. O seletor `#max-tab-...` do teleport resolve para o **primeiro** elemento no documento, e todos os títulos das duas instâncias acabam empilhados no primeiro `MaxTabs`. O segundo fica sem títulos.

   Agravante: `props.id` é também a chave do cache no `localStorage` (`MaxTabs.vue:53`: `'max-tab-opened-' + (props.id ?? '')`), então duas instâncias com o mesmo `id` já compartilham a aba selecionada — o `id` é tratado como identificador lógico, não como identificador único de DOM.

2. **`Random()` recomputado.** Quando `props.id` é `undefined`, `tabs_id` é `computed(() => props.id ?? Random())` — um computed que chama `Random()` no corpo. Computeds em Vue são cacheados, então na prática o valor se estabiliza, mas depender do cache de um computed para gerar um id estável é frágil: qualquer invalidação (mudança de `props.id` de `undefined` para outro `undefined` não invalida, mas uma refatoração que adicione outra dependência reativa invalidaria) regenera o id, quebrando o alvo do teleport de todos os `MaxTabItem` já montados. O idiomático é `const tabs_id = props.id ?? Random()` (não reativo) ou `ref(props.id ?? Random())`.

3. **Teleport dependente de ordem de montagem via `setTimeout`.** O `MaxTabItem` guarda o teleport com `is_mounted` (linha 2, setado em `onMounted`, linha 47) e resolve o `tab_id` num `setTimeout(..., 0)` (linhas 49-53) e a seleção inicial num `setTimeout(..., 10)` (linhas 54-57). Se o `MaxTabs` for desmontado nesse intervalo de 10ms (navegação rápida), os callbacks executam contra `tabs_info` de um componente destruído — `tabs_info?.selectTab(...)` (linha 55) escreve no `defineModel` de um `MaxTabs` já removido. Não há nenhum `onBeforeUnmount` limpando esses timers.

## Impacto

Duplicação silenciosa de títulos de abas quando duas instâncias compartilham `id` — os títulos de um `MaxTabs` aparecem no outro, e um dos dois fica com a barra vazia. Timers órfãos escrevendo em componentes desmontados durante navegação. Ambos os sintomas são difíceis de reproduzir e diagnosticar.

## Plano de correção

1. Desacoplar o `id` de DOM do `id` lógico: gerar sempre um identificador único de instância com `useId()` (Vue 3.5+, já usado em `MaxModal.vue:109` e `MaxPopover.vue:94`) para o alvo do teleport, e manter `props.id` apenas como chave de cache no `localStorage`:
   ```
   const dom_id = useId();
   const tabs_id = computed(() => props.id ?? dom_id);
   ```
   Ajustar o template da linha 4 para usar `dom_id` diretamente no `:id`, e prover `dom_id` no `tabs_info` como alvo do teleport, separado do `tabs_id` lógico.
2. Trocar o `computed` da linha 68 por um valor não reativo estável, eliminando a dependência do cache de computed.
3. Em `MaxTabItem.vue`, guardar os handles dos dois `setTimeout` (linhas 49 e 54) e limpá-los em `onBeforeUnmount`.
4. Adicionar um guard nos callbacks: `if (! tabs_info) return;` antes de tocar em `selectTab`/`add_count_tabs`.

## Verificação

- Teste em `tests/components/MaxTabItem.test.ts`: montar **dois** `MaxTabs` com o mesmo `id="x"`, cada um com um `MaxTabItem` de título distinto, avançar timers e afirmar que cada `.max-tabs-title` contém exatamente um título — o seu.
- Teste de unmount: montar um `MaxTabs` com `MaxTabItem`, desmontar antes de `vi.advanceTimersByTime(10)`, avançar os timers e afirmar que nenhum erro foi lançado.
- Teste de estabilidade do id: montar sem `props.id`, forçar um re-render (alterar outra prop) e afirmar que o `id` do `.max-tabs-title` não mudou.
- `npx vitest run tests/components/MaxTabItem.test.ts tests/components/MaxTabs.test.ts`
