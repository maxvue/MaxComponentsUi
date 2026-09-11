# Plano de Implementação: Arquitetura de Pilha de Modais (Modal Stack), Suporte a v-model:visible e Eliminação de Travas Artificiais

## 1. Objetivo da Refatoração

Eliminar a destruição acidental de contexto e formulários em andamento causada pelo modelo Singleton (`show_id: string | null`) da store global; introduzir uma arquitetura robusta de Pilha de Modais (*Modal Stack*) que permita múltiplos diálogos sobrepostos (stacked modals) com preservação integral de estado, foco e rolagem; fornecer suporte de primeira classe ao padrão canônico do Vue 3 (`v-model:visible`); e substituir a emulação frágil de animações por temporizadores aninhados e travas arbitrárias de clique (`refAutoReset(400)`) pela primitiva nativa acelerada por GPU `<Transition name="max-modal-fade">`.

---

## 2. Arquivos Afetados

| Arquivo | Papel na Refatoração |
|---|---|
| [`src/stores/useModal.Store.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/stores/useModal.Store.ts) | Evolução para estrutura de pilha (`stack: string[]`), preservando retrocompatibilidade total com `show_id`. |
| [`src/components/MaxModal.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxModal.vue) | Suporte a `v-model:visible`, empilhamento de z-index por profundidade, transição nativa `<Transition>` e remoção de timers/`is_changing`. |
| [`src/components/MaxPopoverConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverConfirm.vue) | Ajuste de escala de sobreposição para coexistência perfeita sobre modais secundários. |
| [`src/stores/useConfirm.Store.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/stores/useConfirm.Store.ts) | Alinhamento com o ecossistema de confirmação em camadas. |
| [`tests/stores/useModalStore.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/stores/useModalStore.test.ts) | Testes unitários para pilha de modais: push, pop, remoção no meio da pilha e compatibilidade com `show_id`. |
| [`tests/components/MaxModal.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxModal.test.ts) | Testes de múltiplos modais abertos simultaneamente, `v-model:visible`, restauração de foco e transições. |

---

## 3. Passo a Passo Detalhado da Implementação

### 3.1. `useModal.Store.ts`: Arquitetura de Pilha (Modal Stack)

1. **Estrutura de Estado**:
   - Manter a reatividade de pilha ordenada:
     ```ts
     import { defineStore } from 'pinia';
     import { ref, computed } from 'vue';

     export const useModalStore = defineStore('modal', () => {
         const stack = ref<string[]>([]);

         // Retrocompatibilidade total: show_id reflete o ID do topo da pilha
         const show_id = computed({
             get: () => stack.value[stack.value.length - 1] ?? null,
             set: (newId: string | null) => {
                 if (newId === null) stack.value = [];
                 else if (!stack.value.includes(newId)) stack.value = [...stack.value, newId];
             }
         });

         const isOpen = (id: string) => stack.value.includes(id);

         const isTop = (id: string) => stack.value[stack.value.length - 1] === id;

         const getIndex = (id: string) => stack.value.indexOf(id);

         const push = (id: string) => {
             if (!stack.value.includes(id)) {
                 stack.value = [...stack.value, id];
             }
         };

         const pop = (id?: string) => {
             if (id) {
                 stack.value = stack.value.filter((item) => item !== id);
             } else {
                 stack.value = stack.value.slice(0, -1);
             }
         };

         const show = (id: string) => {
             push(id);
         };

         const hide = (id?: string) => {
             if (id) pop(id);
             else stack.value = [];
         };

         const toggle = (id: string) => {
             if (isOpen(id)) pop(id);
             else push(id);
         };

         return { stack, show_id, isOpen, isTop, getIndex, push, pop, show, hide, toggle };
     });
     ```
2. **Propriedades da Solução**:
   - Se a tela abrir o "Modal A", `stack = ['modal-a']`.
   - Se o "Modal A" abrir o "Modal B", `stack = ['modal-a', 'modal-b']`. O "Modal A" permanece vivo e montado no DOM.
   - Ao fechar o "Modal B", `pop()` deixa `stack = ['modal-a']`. O usuário retorna suavemente para o "Modal A" com tudo intacto.

### 3.2. `MaxModal.vue`: Suporte Declarativo a `v-model:visible`

1. **Adicionar Props e Emits Canônicos**:
   ```ts
   const props = withDefaults(defineProps<{
       /** Controla visibilidade declarativa (suporte a v-model:visible) */
       visible?: boolean;
       ...
   }>(), { ... });

   const emit = defineEmits<{
       'update:visible': [value: boolean];
       'before-close': [done: () => void];
       'after-hide': [];
       'show': [];
       'hide': [];
   }>();
   ```
2. **Computar Visibilidade Ativa (Híbrida: Local vs Stack)**:
   - Se `props.visible !== undefined`, o componente é guiado prioritariamente pela prop:
     ```ts
     const isControlled = computed(() => props.visible !== undefined);

     const is_show = computed(() => {
         if (isControlled.value) return Boolean(props.visible);
         return modal_store.isOpen(id.value);
     });
     ```
   - Ao abrir/fechar, sincronizar tanto a stack da store quanto a emissão de `update:visible`:
     ```ts
     const close = () => {
         emit('update:visible', false);
         modal_store.pop(id.value);
         emit('hide');
     };

     const open = () => {
         emit('update:visible', true);
         modal_store.push(id.value);
         emit('show');
     };
     ```

### 3.3. Cálculo Dinâmico de Camadas (Stacked Z-Index)

1. **Camadas Progressivas**:
   - Cada modal na pilha recebe elevação proporcional ao seu índice de profundidade, garantindo que o diálogo mais recente sobreponha visualmente seus predecessores:
     ```ts
     const modalDepth = computed(() => {
         const idx = modal_store.getIndex(id.value);
         return idx >= 0 ? idx : 0;
     });

     const backdropZIndex = computed(() => 1200 + (modalDepth.value * 20));
     const dialogZIndex = computed(() => backdropZIndex.value + 10);
     ```
2. **Comportamento Restrito ao Modal do Topo (`isTop`)**:
   - Apenas o modal no topo da pilha (`modal_store.isTop(id.value)`) responde ao pressionamento da tecla `Escape` e captura o foco ativo pelo `useFocusTrap`.
   - Modais inferiores mantêm seu estado e formulário visíveis no fundo ou escurecidos pelo backdrop do modal superior, sem perda de foco acidental.

### 3.4. Eliminação de `is_changing = refAutoReset(400)` e Adoção de `<Transition>` Nativa

1. **Substituir Temporizadores por Transição CSS Acelerada**:
   - Remover as variáveis `is_changing`, `pending_timers`, e os callbacks com `setTimeout(..., 1)` e `setTimeout(..., 300)`.
   - Template refatorado:
     ```html
     <teleport to="body">
         <Transition name="max-modal-fade" @after-leave="emit('after-hide')">
             <div
                 v-if="is_show"
                 class="background-modal"
                 :style="{ zIndex: backdropZIndex }"
                 @click.stop="onBackdropClick"
                 :data-html2canvas-ignore="props.ignoreCanvas"
             >
                 <div
                     ref="el"
                     class="max-modal"
                     role="dialog"
                     aria-modal="true"
                     :aria-labelledby="title_id"
                     :aria-label="!title_id ? (props.title ?? undefined) : undefined"
                     :style="{ zIndex: dialogZIndex, padding: modal_padding }"
                     @click.stop
                     @keydown="trap.onKeydown"
                     :class="[{ 'is-shaking': isShaking }, props.class]"
                 >
                     <!-- Header, Content, Footer -->
                 </div>
             </div>
         </Transition>
     </teleport>
     ```
2. **Estilização de Animação no SCSS Scoped**:
   ```scss
   .max-modal-fade-enter-active,
   .max-modal-fade-leave-active {
       transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);

       .max-modal {
           transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
       }
   }

   .max-modal-fade-enter-from,
   .max-modal-fade-leave-to {
       opacity: 0;

       .max-modal {
           transform: scale(0.96) translateY(-8px);
       }
   }
   ```
3. **Erradicação do Congelamento de Cliques**:
   - Sem o bloqueador `if (is_changing.value) return;`, o usuário tem resposta interativa imediata a cada clique, sem dead clicks ou ignorância de eventos.

---

## 4. Regras de Usabilidade e Padrões do GEMINI.md

1. **Padrão Arquitetural de Diálogos**:
   - `MaxModal` passa a oferecer paridade de API com `MaxDrawer.vue` (`v-model:visible`, `visible`, `@after-hide`), criando coerência completa no design system.
2. **Gerenciamento de Foco e Rolagem do Body**:
   - `useScrollLock()` é gerenciado de forma segura: o body permanece travado enquanto `modal_store.stack.length > 0`, liberando o scroll somente quando o último modal for fechado.
   - O foco acessível é retornado ao gatilho original de cada modal assim que ele é desmontado.
3. **Conformidade Estrita com Estilos**:
   - Transições declaradas dentro de `<style lang="scss" scoped>`.
   - Paleta de cores semântica: fundos em `var(--background-0)`, divisórias em `var(--background-200)`.

---

## 5. Critérios de Aceite e Testes Vitest Necessários

### Critérios de Aceite
- [ ] Abrir um modal secundário a partir de um modal primário mantém o primeiro modal no DOM com seus formulários e estados preservados.
- [ ] Fechar o modal secundário devolve o foco imediatamente ao primeiro modal sem tela em branco ou fechamento cascata indevido.
- [ ] O componente `MaxModal` pode ser controlado inteiramente via `v-model:visible="meuModalAberto"` sem necessidade de chamar `useModalStore` manualmente.
- [ ] Pressionar `Escape` fecha apenas o modal que está no topo da pilha, deixando o modal de baixo aberto.
- [ ] Cliques rápidos não são descartados: a transição de abertura e fechamento responde fluentemente via CSS a 60fps sem dependência de `refAutoReset(400)`.

### Bateria de Testes Vitest a Implementar / Atualizar
1. `tests/stores/useModalStore.test.ts`:
   - `test('gerencia pilha com multiplos IDs via push e pop')`
   - `test('mantem retrocompatibilidade de show_id refletindo topo da pilha')`
   - `test('remove modal especifico no meio da pilha via pop(id)')`
2. `tests/components/MaxModal.test.ts`:
   - `test('opera em modo controlado com v-model:visible')`
   - `test('mantem dois modais montados simultaneamente quando empilhados')`
   - `test('fecha somente o modal do topo ao pressionar Escape')`
   - `test('calcula z-index progressivo para modais aninhados')`
   - `test('responde a toggle() sem delay ou trava de 400ms')`

---

## 6. Mitigação de Riscos de Regressão

- **Risco de Incompatibilidade com Código Legado que Lê `store.show_id`**:
  - *Mitigação*: A propriedade `show_id` na store foi desenhada como um `computed` que reflete o topo da pilha. Qualquer código legado que compare `store.show_id === 'meu-id'` continua funcionando com precisão cirúrgica.
- **Risco de Scroll Desbloqueado Prematuramente com Multi-Modais**:
  - *Mitigação*: A trava de rolagem (`useScrollLock`) monitora a contagem de elementos na pilha (`stack.length`). Se um modal fechar mas outro ainda estiver aberto na pilha, o body permanece travado.
- **Risco de Conflito com Testes que Usavam `vi.advanceTimersByTime(400)`**:
  - *Mitigação*: Atualizar os testes legados que usavam fake timers manuais para simular `is_changing`, simplificando-os para asserções reativas síncronas/`nextTick()`.
