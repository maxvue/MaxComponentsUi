# Plano de Implementação: Eliminação de Dead Clicks, Flickering e Desancoragem em Overlays Flutuantes

## 1. Objetivo da Refatoração

Erradicar a perda de cliques ("Dead Clicks") causada por backdrops invisíveis de tela inteira em menus e seletores, estabilizar o cálculo geométrico pré-render para extinguir saltos visuais (*flickering* / *layout jumps*) na abertura de painéis flutuantes, sincronizar dinamicamente a ancoragem de caixas de diálogo (`MaxPopoverConfirm`) durante a rolagem de página (*scroll drift*), e unificar a hierarquia de camadas (*z-index*) de toda a biblioteca sob uma escala semântica centralizada e padronizada.

---

## 2. Arquivos Afetados

| Arquivo | Papel na Refatoração |
|---|---|
| [`src/components/base/MaxBaseOverlay.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/base/MaxBaseOverlay.vue) | Consolidação do motor base de overlay: click-outside não-bloqueante, RAF em scroll/resize, transição sem pulo. |
| [`src/helpers/useFloatingPosition.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/useFloatingPosition.ts) | Composable utilitário reutilizável de posicionamento flutuante reativo com auto-flip e bounds detection. |
| [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue) | Remoção de `.max-select-backdrop`, adoção de click-outside pass-through e cálculo de altura sem magic number. |
| [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputDatePicker.vue) | Remoção de `.max-datepicker-backdrop`, renderização de painel com click-outside e z-index padronizado. |
| [`src/components/MaxInputAutoComplete.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoComplete.vue) | Remoção de `.max-autocomplete-backdrop`, passagem direta de cliques para elementos subjacentes. |
| [`src/components/MaxInputAutoCompleteApi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoCompleteApi.vue) | Remoção de `.max-autocomplete-backdrop`, alinhamento com motor flutuante. |
| [`src/components/MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue) | Remoção de `.max-select-tag-backdrop` e unificação de click-outside. |
| [`src/components/MaxPopoverMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverMenu.vue) | Remoção de `.max-popover-menu-backdrop` e transição suave do menu de opções. |
| [`src/components/MaxUserSection.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserSection.vue) | Remoção de `.max-user-section-backdrop` no menu de perfil de usuário. |
| [`src/components/MaxPopover.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopover.vue) | Eliminação de `.background-popover` bloqueante e suporte a click-outside configurável. |
| [`src/components/MaxPopoverConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverConfirm.vue) | Ancoragem reativa ao elemento-alvo (suporte a target HTMLElement e scroll tracking contínuo). |
| [`src/stores/useConfirm.Store.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/stores/useConfirm.Store.ts) | Extensão do `ConfirmPayload` para aceitar `target?: HTMLElement | null` e recalcular dinamicamente. |
| [`src/styles/tokens.scss`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/styles/tokens.scss) | Declaração dos tokens semânticos de escala de Z-Index. |
| [`tests/components/MaxInputSelect.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputSelect.test.ts) | Testes de click pass-through externo (sem backdrop bloqueante) e posicionamento flutuante. |
| [`tests/components/MaxPopoverConfirm.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxPopoverConfirm.test.ts) | Testes de rastreamento de scroll e reancoragem a elementos dinâmicos. |

---

## 3. Passo a Passo Detalhado da Implementação

### 3.1. Definição da Escala Canônica de Z-Index do Design System

1. Em `src/styles/tokens.scss` (ou nos temas em `src/themes/`):
   ```scss
   :root {
       --z-dropdown: 1000;
       --z-sticky: 1100;
       --z-modal-backdrop: 1200;
       --z-modal: 1210;
       --z-popover: 1300;
       --z-tooltip: 1400;
       --z-toast: 1500;
   }
   ```
2. Refatorar os seletores SCSS de todos os componentes impactados:
   - `MaxInputSelect`, `MaxInputDatePicker`, `MaxInputAutoComplete*`, `MaxTagSelect`, `MaxPopoverMenu`: `z-index: var(--z-dropdown);`
   - `MaxPopover`, `MaxPopoverConfirm`: `z-index: var(--z-popover);`
   - `MaxModal`: backdrop `var(--z-modal-backdrop)` e diálogo `var(--z-modal);`
   - `MaxTooltip`: `z-index: var(--z-tooltip);` (eliminando o valor anômalo `99999`)
   - `MaxToast`: `z-index: var(--z-toast);`

### 3.2. Eliminação de Backdrops Bloqueantes e Adoção do Click-Outside Pass-Through

1. **Desmontar as Divs de Backdrop Bloqueante**:
   - Em `MaxInputSelect.vue`, substituir:
     ```html
     <!-- ANTES: Bloqueia a tela inteira com click eater -->
     <Teleport to="body" v-if="isOpen">
         <div class="max-select-backdrop" @click="hide">
             <div ref="overlayEl" ... @click.stop>...</div>
         </div>
     </Teleport>
     ```
     Por:
     ```html
     <!-- DEPOIS: Painel livre teleportado com click-outside ativo -->
     <Teleport to="body">
         <Transition name="max-overlay-fade">
             <div
                 v-if="isOpen"
                 ref="overlayEl"
                 :id="listboxId"
                 class="max-select-overlay"
                 role="listbox"
                 tabindex="-1"
                 :style="overlayStyle"
                 @keydown="onKeydown"
             >
                 ...
             </div>
         </Transition>
     </Teleport>
     ```
   - Aplicar a mesma remoção de backdrop em:
     - `MaxInputDatePicker.vue` (remover `.max-datepicker-backdrop`)
     - `MaxInputAutoComplete.vue` e `MaxInputAutoCompleteApi.vue` (remover `.max-autocomplete-backdrop`)
     - `MaxTagSelect.vue` (remover `.max-select-tag-backdrop`)
     - `MaxPopoverMenu.vue` (remover `.max-popover-menu-backdrop`)
     - `MaxUserSection.vue` (remover `.max-user-section-backdrop`)
     - `MaxPopover.vue` (remover `.background-popover`)
2. **Implementar Click-Outside Pass-Through Sem Captura Bloqueante**:
   - Registrar ouvinte de `pointerdown` / `click` no `document`:
     ```ts
     const onDocumentPointerDown = (event: PointerEvent | MouseEvent) => {
         const target = event.target as Node;
         // Se o clique foi no próprio painel ou no botão gatilho, ignora
         if (overlayEl.value?.contains(target) || triggerEl.value?.contains(target)) return;
         // Fecha o overlay suavemente, SEM chamar event.preventDefault() nem event.stopPropagation()
         hide();
     };
     ```
   - **Resultado de UX**: Quando o usuário clica em outro campo ou botão enquanto um select está aberto, o select fecha imediatamente E o elemento clicado recebe seu evento normal no mesmo instante (zero cliques desperdiçados).

### 3.3. Composable Unificado de Posicionamento Flutuante (`useFloatingPosition`)

1. Criar `src/helpers/useFloatingPosition.ts` para encapsular a matemática de viewport:
   - Mede `triggerEl.getBoundingClientRect()` e `overlayEl.getBoundingClientRect()`.
   - **Prevenção de Flickering / Layout Jump**:
     - O overlay inicia com `visibility: hidden` ou `opacity: 0` até o primeiro cálculo de geometria ser concluído no `nextTick()`.
     - Medição real do `overlayEl.offsetHeight`: se ainda não estiver montado ou for `0`, executa uma pré-medição forçada síncrona ou aguarda um microtick de RAF antes de exibir.
     - Lógica de inversão inteligente (Flip):
       ```ts
       const spaceBelow = windowHeight - triggerRect.bottom;
       const spaceAbove = triggerRect.top;
       const openUp = spaceBelow < panelHeight && spaceAbove > spaceBelow;
       const top = openUp ? triggerRect.top - panelHeight - offset : triggerRect.bottom + offset;
       ```
   - Escutas Reativas de Scroll e Resize com `passive: true` e throttled via `requestAnimationFrame`:
     - Ouve `'scroll'` com captura profunda (`window.addEventListener('scroll', onUpdate, true)`) para recalcular a posição em tempo real se o contêiner interno for rolado.

### 3.4. Resolução da Desancoragem em `MaxPopoverConfirm.vue`

1. **Atualizar Store `useConfirm.Store.ts`**:
   - Adicionar campo `target?: HTMLElement | null` em `ConfirmPayload`.
   - Na função `confirm(payload)`, salvar `targetElement.value = payload.target ?? null`.
2. **Atualizar `MaxIconConfirm.vue` e `MaxButtonConfirm.vue`**:
   - Ao chamar `confirm_store.confirm(...)`, passar `target: btn_ref.value` (a referência do elemento HTML do botão disparador).
3. **Atualizar `MaxPopoverConfirm.vue`**:
   - Se `confirm_store.targetElement` estiver presente:
     - Escutar evento `scroll` e `resize` no ciclo ativo do diálogo.
     - Recalcular `getBoundingClientRect()` do `targetElement` em cada frame de animação.
     - Se o elemento-alvo sair da viewport visível (`rect.bottom < 0 || rect.top > window.innerHeight`), fechar automaticamente ou ocultar o popover com fade, evitando que ele paire sobre áreas aleatórias da tela.
   - Manter fallback para `confirm_store.x` e `confirm_store.y` quando acionado programaticamente sem nó DOM.

---

## 4. Regras de Usabilidade e Padrões do GEMINI.md

1. **Eliminação Integral de Classes e Estilos Utilitários Inline no Template**:
   - Todos os estilos de overlays, transições e painéis devem residir em `<style lang="scss" scoped>` com classes semânticas (`.max-select-overlay`, `.max-datepicker-panel`, `.max-confirm-panel`).
2. **Hierarquia Semântica e Aninhamento SCSS**:
   - As regras devem espelhar a árvore DOM. As transições Vue devem seguir o padrão `<Transition name="max-overlay-fade">`:
     ```scss
     .max-overlay-fade-enter-active,
     .max-overlay-fade-leave-active {
         transition: opacity 0.15s ease, transform 0.15s ease;
     }
     .max-overlay-fade-enter-from,
     .max-overlay-fade-leave-to {
         opacity: 0;
         transform: translateY(-4px);
     }
     ```
3. **Cores e Superfícies Padronizadas**:
   - Fundos com `var(--background-0)`, bordas com `var(--background-200)` ou `var(--surface-border)`, e elevação com `box-shadow` padronizado.

---

## 5. Critérios de Aceite e Testes Vitest Necessários

### Critérios de Aceite
- [ ] Ao clicar fora de qualquer dropdown/select em direção a um botão ou input, o menu anterior fecha E o botão/input clicado executa sua ação no primeiro clique.
- [ ] Nenhum elemento `.max-*-backdrop` de tela cheia transparente permanece no DOM após a abertura de selects, datepickers, autocompletes ou popovers de confirmação.
- [ ] Abrir um select ou datepicker próximo à borda inferior da tela não gera pulo visual perceptível: o painel abre apontando para cima com animação suave de fade/slide.
- [ ] Durante a rolagem da página com um `MaxPopoverConfirm` aberto, o balão acompanha perfeitamente o botão de disparo sem se descolar no ar.
- [ ] A escala de `z-index` segue rigidamente a hierarquia padronizada: dropdown (1000) < modal (1200) < popover (1300) < tooltip (1400) < toast (1500).

### Bateria de Testes Vitest a Implementar / Atualizar
1. `tests/components/MaxInputSelect.test.ts`:
   - `test('fecha dropdown ao clicar fora sem consumir evento externo (pass-through)')`
   - `test('posiciona overlay para cima quando espaco inferior for insuficiente')`
   - `test('aplica z-index semantico de dropdown')`
2. `tests/components/MaxPopoverConfirm.test.ts`:
   - `test('recalcula posicao reativamente ao disparar evento de scroll')`
   - `test('fecha popover de confirmacao quando elemento alvo sai da viewport')`
   - `test('executa dismiss em clique fora sem bloquear a acao do elemento clicado')`

---

## 6. Mitigação de Riscos de Regressão

- **Risco de Fechamento Acidental ao Interagir com Subcomponentes**:
  - *Mitigação*: O listener de click-outside valida explicitamente se o `target` está contido no nó do painel ou nos seus portais filhos antes de disparar `hide()`.
- **Risco de Degradação de Performance em Páginas com Rolagem Intensa**:
  - *Mitigação*: Listeners de `scroll` utilizam `passive: true` e throttle estrito via `requestAnimationFrame` (executado no máximo 1 vez por frame do display a 60fps).
- **Risco de Quebra de Modais com Seletores Internos**:
  - *Mitigação*: A escala padronizada de `z-index` garante que popovers disparados dentro de um modal recebam `z-index` superior ao modal (`--z-popover: 1300` vs `--z-modal: 1210`), garantindo oclusão visual correta.
