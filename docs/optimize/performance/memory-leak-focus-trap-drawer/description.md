# Memory Leak: FocusTrap não desativado no desmonte do MaxDrawer

## Categoria
Memory Leaks / Ciclo de Vida do Componente

## Severidade
Alta

## Componentes Envolvidos
- [MaxDrawer.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue#L184-L216)
- [useFocusTrap.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/useFocusTrap.ts#L24-L64)

## Descrição do Problema
O componente `MaxDrawer.vue` utiliza o composable `useFocusTrap` para reter a navegação por teclado dentro do painel lateral quando visível. O trap é ativado via `trap.activate()` no watcher de `props.visible` quando `value` é `true`:

```typescript
// MaxDrawer.vue L184-L198
watch(() => props.visible, (value) => {
    if (value) {
        emit('show');
        trap.activate();
        document.addEventListener('keydown', onEscape);
        if (props.blockScroll) {
            scroll_lock.lock();
            has_scroll_lock = true;
        }
        return;
    }
    ...
```

No entanto, no hook `onBeforeUnmount`, apenas o ouvinte de escape e o lock de scroll são liberados:

```typescript
// MaxDrawer.vue L210-L216
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
});
```

A chamada `trap.deactivate()` **não existe** no `onBeforeUnmount`.

## Causa Raiz
No helper `useFocusTrap.ts`, a função `activate()` armazena em uma variável interna (`previous`) a referência ao elemento DOM que estava em foco antes do trap ser ativado:

```typescript
// useFocusTrap.ts L48-L63
const activate = () => {
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ...
};

const deactivate = () => {
    if (previous?.isConnected) previous.focus();
    previous = null;
};
```

Quando um `MaxDrawer` aberto é desmontado (por exemplo, transição de rota no Vue Router ou um `v-if="isOpen"` no componente pai sendo alternado para `false`), `trap.deactivate()` nunca é chamado. 

Como resultado:
1. O elemento DOM previamente focado permanece retido na closure de `previous`.
2. Todo o fragmento de árvore DOM do elemento retido (e eventuais escopos do Vue aos quais ele pertence) não podem ser liberados pelo Garbage Collector (GC), gerando *detached DOM tree memory leak*.
3. Em outros componentes modais da biblioteca (`MaxModal.vue`, `MaxPopoverConfirm.vue`, `MaxPdfView.vue`), `trap.deactivate()` é corretamente invocado no `onBeforeUnmount`.

## Impacto na Performance
- Retenção de memória de elementos DOM destacados (*detached elements*) a cada abertura e desmonte do drawer.
- Acúmulo progressivo de consumo de RAM em SPAs de longa duração com frequentes aberturas de gavetas e trocas de rota.

## Solução Recomendada
Adicionar `trap.deactivate()` no hook `onBeforeUnmount` de `MaxDrawer.vue`:

```typescript
onBeforeUnmount(() => {
    trap.deactivate();
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
});
```
