# Plano de Implementação: Ativação Condicional de Posicionamento e Listeners em Overlays

## 1. Objetivo da Refatoração

Eliminar completamente o consumo contínuo e inútil de ciclos de CPU da *main thread* (que atinge 30% a 70% durante a rolagem de tela) causado pela execução ininterrupta de `getBoundingClientRect()`, mutações reativas e ouvintes globais de evento em `window` (`scroll` e `resize`) quando os painéis flutuantes (overlays, popovers, dropdowns e menus) estão **fechados** (`isOpen === false`).

Objetivos arquiteturais específicos:
1. **Gatilhos de confirmação sem overlay próprio (Grupo A)**:
   - Componentes: [`MaxButtonConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxButtonConfirm.vue), [`MaxIconConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconConfirm.vue) e [`MaxTogglePopover.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTogglePopover.vue).
   - Esses componentes não mantêm nenhum elemento flutuante no DOM de seus templates; eles apenas abrem o diálogo global da store (`confirm_store.confirm(...)`) ao serem clicados.
   - **Solução**: Eliminar 100% de `useElementBounding`. Obter as coordenadas físicas do botão pontualmente via `getBoundingClientRect()` apenas dentro do manipulador `onClickToggle`. Zero listeners registrados na janela, zero chamadas a cada evento de scroll.
2. **Componentes com painéis flutuantes próprios (Grupo B)**:
   - Componentes: [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue), [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue), [`MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputDatePicker.vue), [`MaxInputAutoComplete.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoComplete.vue), [`MaxInputAutoCompleteApi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoCompleteApi.vue), [`MaxPopover.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopover.vue), [`MaxPopoverMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverMenu.vue) e [`MaxUserSection.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserSection.vue).
   - **Solução**: Condicionar o rastreamento geométrico e os ouvintes de evento à variável `isOpen === true`. Criar o composable leve [`src/composables/useActiveElementBounding.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/composables/useActiveElementBounding.ts) (ou [`src/helpers/useActiveElementBounding.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/useActiveElementBounding.ts)) que arma os listeners em `window` (`scroll`, `resize`) e executa medições apenas enquanto o overlay estiver aberto, desarmando tudo ao fechar.
3. **Restaurar 60 FPS consistentes na rolagem**: Eliminar o gargalo em formulários com 20 a 50 campos de entrada ou tabelas com centenas de botões de exclusão.

---

## 2. Arquivos Afetados

| Arquivo | Ação | Responsabilidade / Mudança |
|---|---|---|
| [`src/composables/useActiveElementBounding.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/composables/useActiveElementBounding.ts) | Criar | Composable de posicionamento condicional reativo que liga listeners e executa `getBoundingClientRect()` somente quando `isOpen === true`. |
| [`src/components/MaxButtonConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxButtonConfirm.vue) | Modificar | Remover `useElementBounding`; ler geometria pontualmente no clique em `onClickToggle`. |
| [`src/components/MaxIconConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconConfirm.vue) | Modificar | Remover `useElementBounding`; ler geometria pontualmente no clique em `onClickToggle`. |
| [`src/components/MaxTogglePopover.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTogglePopover.vue) | Modificar | Remover `useElementBounding`; ler geometria pontualmente no clique em `onClickToggle`. |
| [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue) | Modificar | Trocar `useElementBounding(triggerEl)` por `useActiveElementBounding(triggerEl, isOpen)`. |
| [`src/components/MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue) | Modificar | Trocar `useElementBounding(triggerEl)` por `useActiveElementBounding(triggerEl, isOpen)`. |
| [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputDatePicker.vue) | Modificar | Trocar `useElementBounding(triggerEl)` por `useActiveElementBounding(triggerEl, isOpen)`. |
| [`src/components/MaxInputAutoComplete.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoComplete.vue) | Modificar | Trocar `useElementBounding(ac)` por `useActiveElementBounding(ac, isOpen)`. |
| [`src/components/MaxInputAutoCompleteApi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoCompleteApi.vue) | Modificar | Trocar `useElementBounding(ac)` por `useActiveElementBounding(ac, isOpen)`. |
| [`src/components/MaxPopover.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopover.vue) | Modificar | Trocar `useElementBounding(btn_el)` por `useActiveElementBounding(btn_el, isOpen)`. |
| [`src/components/MaxPopoverMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverMenu.vue) | Modificar | Trocar `useElementBounding(anchorEl)` por `useActiveElementBounding(anchorEl, isOpen)`. |
| [`src/components/MaxUserSection.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserSection.vue) | Modificar | Trocar `useElementBounding(anchorEl)` por `useActiveElementBounding(anchorEl, isOpen)`. |
| [`tests/components/MaxButtonConfirm.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxButtonConfirm.test.ts) | Modificar / Validar | Garantir passagem sem listeners de scroll. |
| [`tests/components/MaxPopover.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxPopover.test.ts) | Modificar / Validar | Validar posicionamento reativo na abertura (`show()`). |
| [`tests/components/MaxInputSelectOverlay.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputSelectOverlay.test.ts) | Modificar / Validar | Validar cálculos de largura e posicionamento de overlay. |

---

## 3. Passo a Passo Detalhado da Implementação

### Etapa 1: Criação do Composable `useActiveElementBounding`

1. **Desenvolvimento de [`src/composables/useActiveElementBounding.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/composables/useActiveElementBounding.ts)**:
   - Encapsular a lógica de ativação condicional com desarmamento automático de listeners:
     ```ts
     import { ref, watch, onBeforeUnmount, unref, type Ref, type ComputedRef } from 'vue';

     type MaybeRef<T> = Ref<T> | ComputedRef<T> | T;

     export interface UseActiveElementBoundingOptions {
         /** Se true, reseta todas as variáveis para 0 quando inativo. Padrão: false (preserva última posição para evitar saltos durante animação de fechamento) */
         resetOnInactive?: boolean;
     }

     /**
      * Mede as coordenadas geométricas de um elemento no viewport sob demanda,
      * registrando ouvintes de `scroll` e `resize` exclusivamente quando `isActive` for true.
      */
     export function useActiveElementBounding(
         target: MaybeRef<HTMLElement | null | undefined>,
         isActive: MaybeRef<boolean>,
         options: UseActiveElementBoundingOptions = {}
     ) {
         const x = ref(0);
         const y = ref(0);
         const top = ref(0);
         const bottom = ref(0);
         const left = ref(0);
         const right = ref(0);
         const width = ref(0);
         const height = ref(0);

         const update = () => {
             const raw = unref(target);
             const el = (raw as any)?.$el ?? raw;
             if (!el || typeof el.getBoundingClientRect !== 'function') {
                 if (options.resetOnInactive) {
                     x.value = 0;
                     y.value = 0;
                     top.value = 0;
                     bottom.value = 0;
                     left.value = 0;
                     right.value = 0;
                     width.value = 0;
                     height.value = 0;
                 }
                 return;
             }

             const rect = el.getBoundingClientRect();
             x.value = rect.x;
             y.value = rect.y;
             top.value = rect.top;
             bottom.value = rect.bottom;
             left.value = rect.left;
             right.value = rect.right;
             width.value = rect.width;
             height.value = rect.height;
         };

         let isListening = false;

         const startListening = () => {
             if (isListening) return;
             isListening = true;
             update();
             window.addEventListener('scroll', update, { capture: true, passive: true });
             window.addEventListener('resize', update, { passive: true });
         };

         const stopListening = () => {
             if (!isListening) return;
             isListening = false;
             window.removeEventListener('scroll', update, { capture: true });
             window.removeEventListener('resize', update);
             if (options.resetOnInactive) {
                 update();
             }
         };

         watch(
             () => unref(isActive),
             (active) => {
                 if (active) {
                     startListening();
                 } else {
                     stopListening();
                 }
             },
             { immediate: true }
         );

         onBeforeUnmount(() => {
             stopListening();
         });

         return {
             x,
             y,
             top,
             bottom,
             left,
             right,
             width,
             height,
             update
         };
     }
     ```

2. **Benefícios Arquiteturais**:
   - Zero listeners em `window` enquanto o seletor ou overlay estiver fechado.
   - Preservação do estado da última posição física por padrão (`resetOnInactive: false`), evitando piscamento visual ou pulo de layout durante transições de fade-out do modal/menu.
   - Liberação de ouvintes em `onBeforeUnmount`.

---

### Etapa 2: Refatoração dos Gatilhos de Confirmação (Grupo A)

Em [`MaxButtonConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxButtonConfirm.vue), [`MaxIconConfirm.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconConfirm.vue) e [`MaxTogglePopover.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTogglePopover.vue):

1. **Remover a importação de `useElementBounding`**:
   - Excluir o import de `@maxvue/max-use`.
2. **Remover a chamada incondicional**:
   - Excluir: `const { x, y, height, width } = useElementBounding(btn_el as any);`.
3. **Medição Pontual em `onClickToggle`**:
   - Substituir pelo cálculo síncrono no evento de clique:
     ```ts
     const onClickToggle = () => {
         const rawEl = btn_el.value as any;
         const domEl = rawEl?.$el ?? rawEl;
         const rect = domEl?.getBoundingClientRect?.() ?? { x: 0, y: 0, width: 0, height: 0 };

         confirm_store.confirm({
             message: props.message,
             messageIcon: props.messageIcon,
             severity: props.severity,
             rejectProps: props.rejectProps,
             acceptProps: props.acceptProps,
             x: rect.x ?? rect.left ?? 0,
             y: rect.y ?? rect.top ?? 0,
             width: rect.width ?? 0,
             height: rect.height ?? 0
         });
     };
     ```
   - **Resultado**: 100% de overhead eliminado. Zero listeners mesmo que a tabela possua 500 linhas com botões de confirmação.

---

### Etapa 3: Refatoração dos Componentes de Formulário (Grupo B - Dropdowns)

Para [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue), [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue), [`MaxInputAutoComplete.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoComplete.vue), [`MaxInputAutoCompleteApi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoCompleteApi.vue) e [`MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputDatePicker.vue):

1. **Substituição da Importação**:
   - Substituir `useElementBounding` de `@maxvue/max-use` por `useActiveElementBounding` de `../composables/useActiveElementBounding`.
2. **Conexão ao Flag `isOpen`**:
   - Em vez de:
     ```ts
     const { x, y, width: width_btn, height: height_btn } = useElementBounding(triggerEl as any);
     ```
   - Utilizar:
     ```ts
     const { x, y, width: width_btn, height: height_btn, update: updateBounding } = useActiveElementBounding(triggerEl, isOpen);
     ```
3. **Cálculo de `position`**:
   - A computada `position` continua consumindo `x, y, width_btn, height_btn` normalmente.
   - Quando o overlay é aberto (`isOpen.value = true`), o composable dispara `update()` imediatamente antes do próximo quadro de animação e mantém os ouvintes de scroll ativos para que o painel acompanhe a rolagem enquanto estiver visível.
   - Ao selecionar uma opção ou clicar fora (`isOpen.value = false`), os ouvintes são removidos imediatamente.

---

### Etapa 4: Refatoração dos Componentes de Popover e Menus (Grupo B - Overlays Flutuantes)

Para [`MaxPopover.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopover.vue), [`MaxPopoverMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverMenu.vue) e [`MaxUserSection.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserSection.vue):

1. Em `MaxPopover.vue`:
   - `isOpen` já é uma computada reativa (`computed(() => popover_store.show_id === id.value)`).
   - Instanciar:
     ```ts
     const { x, y, width: width_btn, height: height_btn } = useActiveElementBounding(btn_el, isOpen);
     ```
2. Em `MaxPopoverMenu.vue` e `MaxUserSection.vue`:
   - Utilizar `useActiveElementBounding(anchorEl, isOpen)`.
   - Garantir que `setAnchor(event)` seja chamado antes de `isOpen.value = true` para que o alvo DOM exista no momento em que os ouvintes forem ativados.

---

## 4. Padrões de Performance do GEMINI.md

1. **Uso Eficiente de Recursos do Navegador**:
   - O GEMINI.md estabelece foco estrito em produtividade operacional, alta taxa de quadros e usabilidade em dashboards com múltiplos controles interativos.
   - A eliminação de centenas de chamadas contínuas a `getBoundingClientRect()` garante que o event loop permaneça desimpedido para renderização suave a 60 FPS.
2. **Arquitetura Reativa Limpa**:
   - Separação clara entre medições sob demanda (handlers de clique) e observação contínua de curto prazo (overlays abertos).
   - Zero acúmulo de listeners órfãos em `window`.

---

## 5. Critérios de Aceite e Verificação Técnica

- [ ] **Zero Overhead em Repouso**:
  - Com 30 componentes de formulário e 50 botões de confirmação montados na mesma página com overlays fechados, a rolagem da janela (`window.scroll`) dispara **0 chamadas a `getBoundingClientRect()`** e **0 mutações reativas**.
- [ ] **Alinhamento e Posicionamento Perfeitos**:
  - Ao abrir qualquer seletor (`MaxInputSelect`, `MaxInputDatePicker`, `MaxPopover`), o painel é posicionado exatamente abaixo (ou acima, se colidir com o rodapé) do gatilho no primeiro frame visual.
  - Ao rolar a página enquanto o dropdown estiver aberto, o overlay acompanha perfeitamente a posição do gatilho.
  - Ao fechar o dropdown, os ouvintes de scroll e resize são imediatamente removidos do objeto `window`.
- [ ] **Preservação de Mocks em Testes Unitários**:
  - `tests/components/MaxPopover.test.ts` passa 100% (incluindo testes com timers fakes e limites de viewport).
  - `tests/components/MaxButtonConfirm.test.ts` e `tests/components/MaxInputSelectOverlay.test.ts` passam com sucesso.
- [ ] **Suporte a Happy-DOM / Ambientes Headless**:
  - Fallbacks seguros implementados para elementos sem renderização física (`getBoundingClientRect` ausente ou retornando zeros).
- [ ] **Verificação de Compilação**:
  - `npm run type-check` sem erros de TypeScript.
  - `npm run build` executado com êxito.

---

## 6. Mitigação de Riscos de Regressão

| Risco | Impacto | Estratégia de Mitigação |
|---|---|---|
| Pulo visual (glitch de 1 frame) ao abrir o overlay | Dropdown pisca em `(0, 0)` antes de se posicionar | O `useActiveElementBounding` invoca `update()` de forma síncrona imediatamente quando `isActive` se torna `true`. Além disso, preserva as últimas coordenadas conhecidas em vez de zerá-las enquanto inativo. |
| Incompatibilidade com suites de teste existentes que mockam `useElementBounding` em `@maxvue/max-use` | Falha em testes legados de overlays | O composable `useActiveElementBounding` expõe rigorosamente a mesma interface reativa `{ x, y, width, height, top, bottom, left, right, update }`. Arquivos de teste pontuais podem ser atualizados para mockar o novo composable com facilidade. |
| Remoção de âncora antes do fechamento do overlay | `getBoundingClientRect` chamado em elemento nulo | O método `update()` possui checagem de guarda defensiva: `if (!el || typeof el.getBoundingClientRect !== 'function') return;`. |
