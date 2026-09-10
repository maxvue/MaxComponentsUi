# Plano de Implementação: Correção de Memory Leak por Falta de Desativação do FocusTrap no Desmonte do MaxDrawer

## 1. Diagnóstico e Objetivo

No componente `MaxDrawer.vue`, o composable `useFocusTrap` é utilizado para reter o foco do teclado dentro do painel lateral quando o drawer está aberto.

No watcher de `props.visible`:

```typescript
// MaxDrawer.vue L184-L208
watch(() => props.visible, (value) => {
    const first_run = is_first_run;
    is_first_run = false;

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

    if (!first_run) emit('hide');
    trap.deactivate();
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
}, { immediate: true });
```

Porém, no hook `onBeforeUnmount`:

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

A chamada `trap.deactivate()` **está ausente** no desmonte.

**Problemas identificados:**
1. **Detached DOM Tree Memory Leak:** O helper `useFocusTrap.ts` retém em sua closure interna a variável `previous` (o elemento DOM que estava em foco no momento da abertura do drawer via `document.activeElement`). Se o `MaxDrawer` for desmontado enquanto aberto (por exemplo, em trocas de rota no Vue Router, desmonte de modal ancestral ou alternância de `v-if`), `previous` nunca é liberado nem desreferenciado (`previous = null`).
2. **Retenção em Cascata de Memória:** O elemento DOM retido impede a coleta pelo Garbage Collector de toda a sub-árvore HTML a ele conectada, assim como os componentes Vue e escopos de reatividade correspondentes.
3. **Inconsistência com Demais Componentes:** Todos os outros componentes modais com focus trap na biblioteca (`MaxModal.vue`, `MaxPopover.vue`, `MaxPdfView.vue`, `MaxPopoverConfirm.vue`) invocam `trap.deactivate()` explicitamente no `onBeforeUnmount`.

**Objetivo:**
Adicionar a invocação de `trap.deactivate()` no ciclo de vida `onBeforeUnmount` de `MaxDrawer.vue`, garantindo liberação imediata de referências DOM e restauração limpa do foco.

---

## 2. Arquivos a Modificar

- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxDrawer.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxDrawer.test.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Modificações em `src/components/MaxDrawer.vue`

No hook `onBeforeUnmount` em [MaxDrawer.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue#L210-L216):

```typescript
// Antes:
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
});

// Depois (cirúrgico):
onBeforeUnmount(() => {
    trap.deactivate();
    document.removeEventListener('keydown', onEscape);
    if (has_scroll_lock) {
        scroll_lock.unlock();
        has_scroll_lock = false;
    }
});
```

Template e estilos SCSS scoped mantêm-se estritamente intactos.

---

### 3.2. Adição de Testes Unitários em `tests/components/MaxDrawer.test.ts`

Adicionar asserção específica para verificar que desmontar o drawer enquanto visível devolve o foco e desativa o trap:

```typescript
it('desativa o focus trap e devolve o foco ao elemento anterior quando desmontado enquanto visivel', async () => {
    const anterior = document.createElement('button');
    anterior.id = 'botao-acionador';
    document.body.appendChild(anterior);
    anterior.focus();

    expect(document.activeElement?.id).toBe('botao-acionador');

    const wrapper = mount(MaxDrawer, {
        props: { visible: true },
        slots: {
            default: '<button id="botao-drawer">Ação interna</button>'
        },
        attachTo: document.body
    });

    await nextTick();
    await nextTick();

    // Desmonta o drawer sem fechar previamente via prop
    wrapper.unmount();
    await nextTick();

    // O foco deve ter retornado ao botão acionador e as referências liberadas
    expect(document.activeElement?.id).toBe('botao-acionador');

    document.body.removeChild(anterior);
});
```

---

## 4. Garantia de Retrocompatibilidade

- **Sem Alteração de Contrato:** Nenhuma prop, slot, evento ou método de `defineExpose` é alterado.
- **Acessibilidade Aprimorada:** O comportamento de retorno de foco ao elemento que originou a abertura torna-se mais consistente e previsível em cenários de fechamento por navegação.
- **Segurança Operacional:** Chamar `trap.deactivate()` quando o trap já estiver inativo é uma operação no-op completamente segura em `useFocusTrap.ts`.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. Ao desmontar uma instância de `MaxDrawer` com `props.visible = true`, a função `trap.deactivate()` deve ser executada.
2. A referência ao elemento `previous` dentro de `useFocusTrap` deve ser anulada, prevenindo memory leaks.
3. O foco do teclado deve retornar ao elemento acionador original.
4. Verificação de tipagem TypeScript estrita:
   ```bash
   npm run type-check
   ```
5. Execução completa dos testes unitários do `MaxDrawer`:
   ```bash
   npx vitest run tests/components/MaxDrawer.test.ts
   ```
