# Limpeza Prematura de Cache de SVGs e Memory Leak de Timer no MaxInputIconPicker

## Categoria
Otimização de SVGs / Requisições Repetitivas / Memory Leaks

## Severidade
Alta

## Componentes Envolvidos
- [MaxInputIconPicker.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue#L159-L230)
- [useIcon.Store.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useIcon.Store.ts#L13-L67)

## Descrição do Problema
O componente `MaxInputIconPicker.vue` implementa seu próprio mecanismo local de cache e busca em lote de SVGs, ignorando a infraestrutura global da biblioteca (`useIconStore`), e apresenta dois problemas críticos de performance e ciclo de vida:

1. **Destruição do cache ao reabrir o seletor**:
```typescript
// MaxInputIconPicker.vue L285-L297
const openDrawer = () => {
    if (props.disabled) return;
    search.value = '';
    curatedIcons.value = [];
    svgCache.value = {}; // <-- ZERA TODO O CACHE LOCAL DE SVGs
    svgFetchQueue = [];
    if (svgFetchTimer !== null) {
        clearTimeout(svgFetchTimer);
        svgFetchTimer = null;
    }
    visible.value = true;
    fetchCuratedIcons();
};
```
2. **Inexistência de desmonte e limpeza do timer (`svgFetchTimer`)**:
A função `enqueueSvgFetch` agenda uma requisição HTTP via `setTimeout` de 150ms:
```typescript
// MaxInputIconPicker.vue L206-L228
if (svgFetchTimer !== null) clearTimeout(svgFetchTimer);
svgFetchTimer = setTimeout(async () => {
    const batch = svgFetchQueue.splice(0, 200);
    ...
    const res = await fetch(props.svgUrl, { ... });
    const data = await res.json();
    ...
    svgCache.value = { ...svgCache.value, ...sanitized_data };
}, 150);
```
O componente **não possui** `onBeforeUnmount` ou `onUnmounted`. Se o componente for destruído enquanto a busca ou o debounce estiver pendente, o timer continua vivo e executará na thread principal, tentando atualizar `svgCache.value` de um componente desmontado.

## Causa Raiz
- O `MaxInputIconPicker` foi concebido isoladamente e gerencia `svgCache` como uma `ref` local ao invés de consumir a store unificada de ícones (`useIconStore`), que já possui persistência no IndexedDB, desduplicação de requisições e sanitização segura.
- A função `openDrawer` força `svgCache.value = {}` indiscriminadamente com o intuito de redefinir a busca, mas descarta todos os vetores SVG que o usuário já havia baixado minutos antes.

## Impacto na Performance
1. **Tráfego de Rede Desnecessário**: Cada vez que o usuário abre o modal de seleção de ícone (mesmo que tenha fechado segundos antes), todos os 60 a 200 ícones visíveis na janela inicial precisam ser requisitados novamente ao servidor via requisições POST para `props.svgUrl`.
2. **Flicker Visual e Overhead de Sanitização**: Ao limpar o cache, todos os ícones sofrem repaint, piscam na tela em branco e passam novamente por `DOMPurify.sanitize()` ao serem recebidos.
3. **Vazamento de Timer e Requisições Fantasmas**: Se o usuário navega para fora da página ou fecha o fluxo antes de 150ms, requisições de rede continuam ocorrendo em segundo plano sem nenhum consumidor ativo.

## Solução Recomendada
1. **Preservar o cache entre aberturas** ou integrar com o `useIconStore` global para que os ícones baixados permaneçam em cache persistente na sessão e no IndexedDB.
2. Adicionar `onBeforeUnmount` para cancelar o timer e limpar a fila:

```typescript
onBeforeUnmount(() => {
    if (svgFetchTimer !== null) {
        clearTimeout(svgFetchTimer);
        svgFetchTimer = null;
    }
    svgFetchQueue = [];
});
```
3. Na função `openDrawer`, remover a linha `svgCache.value = {};` para que ícones já cacheados apareçam instantaneamente sem latência de rede.
