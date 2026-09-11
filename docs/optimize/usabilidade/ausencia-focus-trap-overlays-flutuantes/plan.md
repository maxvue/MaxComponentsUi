# Plano de Implementação: Confinamento, Rastreamento e Restauração de Foco em Overlays Flutuantes e Seletores

## 1. Objetivo da Refatoração

Sanar a quebra crítica de navegabilidade por teclado em painéis flutuantes, seletores e overlays teleportados para o final do `<body>` (`MaxInputDatePicker`, `MaxInputIconPicker`, `MaxInputSelect`, `MaxTagSelect`, `MaxColorPicker`, `MaxInputAutoComplete`, `MaxInputAutoCompleteApi`).

Atualmente:
1. Ao abrir o calendário (`MaxInputDatePicker`), o foco do teclado permanece no `<input>`, e pressionar `Tab` salta para elementos atrás do calendário na página principal, tornando a grade de datas inalcançável por usuários que dependem exclusivamente de teclado.
2. No drawer de ícones (`MaxInputIconPicker`) e overlays com campo de pesquisa, a tabulação escapa para o fundo da página (falta de *focus containment*).
3. Ao fechar overlays via tecla `Escape` ou clique no backdrop, o foco é perdido e transferido para o elemento raiz do documento (`<body>`), obrigando o usuário a percorrer novamente toda a árvore DOM desde o topo.

Este plano estabelece a padronização do confinamento (*focus trap*), semântica WAI-ARIA de diálogo modal e restauração determinística de foco para o elemento disparador original.

---

## 2. Arquivos Afetados

### Utilitários de Foco
- [`src/helpers/useFocusTrap.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/useFocusTrap.ts) — Enriquecimento do composable para suportar passagem opcional de elemento disparador explícito (`triggerRef`) e elemento de foco inicial preferencial (`initialFocus`).

### Componentes de Seleção e Overlays
- [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputDatePicker.vue)
- [`src/components/MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue)
- [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue)
- [`src/components/MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue)
- [`src/components/MaxColorPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxColorPicker.vue)
- [`src/components/MaxInputAutoComplete.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoComplete.vue)
- [`src/components/MaxInputAutoCompleteApi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoCompleteApi.vue)

### Testes
- [`tests/components/OverlayFocusTrap.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/OverlayFocusTrap.test.ts) (Novo arquivo de validação de foco em seletores teleportados)
- Testes unitários existentes: `tests/components/MaxInputDatePicker.test.ts`, `tests/components/MaxInputSelect.test.ts`, `tests/components/MaxInputIconPicker.test.ts`.

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Evolução do Helper `src/helpers/useFocusTrap.ts`
Garantir que o helper existente ofereça flexibilidade para gerenciar overlays acoplados a campos de formulário:
1. **Interface com Opções Estendidas**:
   ```typescript
   export interface FocusTrapOptions {
       /** Elemento disparador para devolução de foco explícita. */
       triggerElement?: Ref<HTMLElement | null>;
       /** Elemento que deve receber foco inicial imediato ao ativar. */
       initialFocus?: Ref<HTMLElement | null> | (() => HTMLElement | null);
       /** Se deve desativar o trap ao teclar Escape (default: true). */
       escapeDeactivates?: boolean;
       /** Callback disparado ao solicitar fechamento por Escape. */
       onEscape?: () => void;
   }
   ```
2. **Preservação e Restauração Segura de Foco**:
   - Se `options.triggerElement` for fornecido, utilizá-lo como destino prioritário em `deactivate()`, com fallback para `previous = document.activeElement`.
   - Garantir verificação rigorosa `if (target?.isConnected) target.focus();`.
   - Implementar idempotência para múltiplas invocações de `deactivate()`.

### Passo 2: Implementação em `MaxInputDatePicker.vue`
1. **Semântica e Confinamento de Foco no Painel Teleportado**:
   - No elemento `.max-datepicker-panel`, adicionar:
     ```vue
     <div
         ref="overlayEl"
         class="max-datepicker-panel"
         role="dialog"
         aria-modal="true"
         aria-label="Seletor de data"
         :style="{ top: position.top + 'px', left: position.left + 'px' }"
         @keydown="trap.onKeydown"
         @click.stop
     >
     ```
2. **Transferência de Foco do Input para a Grade**:
   - No `<input class="max-datepicker-input">`, adicionar atalhos de teclado para abrir/entrar no calendário:
     ```vue
     @keydown.down.prevent="focusCalendarGrid"
     @keydown.alt.down.prevent="focusCalendarGrid"
     ```
   - Criar método `focusCalendarGrid`:
     ```typescript
     const focusCalendarGrid = async () => {
         if (!isOpen.value) open();
         await nextTick();
         const targetBtn = dayButtonRefs.value[focusedCellIndex.value] || overlayEl.value?.querySelector<HTMLElement>('.max-datepicker-day:not([disabled])');
         targetBtn?.focus();
     };
     ```
3. **Foco Programático ao Mudar de Mês/Ano**:
   - Ao teclar setas dentro da grade (`onGridKeydown`), após atualizar `focusedCellIndex.value`, garantir que o botão receba foco imediatamente via:
     ```typescript
     await nextTick();
     dayButtonRefs.value[focusedCellIndex.value]?.focus();
     ```
4. **Restauração de Foco ao Concluir**:
   - No método `hide()` ou `selectDate()`:
     ```typescript
     const hide = () => {
         isOpen.value = false;
         trap.deactivate();
         inputElement.value?.focus();
     };
     ```

### Passo 3: Implementação em `MaxInputIconPicker.vue`
1. **Semântica ARIA no Drawer Inferior**:
   - Adicionar atributos WAI-ARIA no `.max-icon-picker-drawer`:
     ```vue
     <div
         ref="drawerEl"
         class="max-icon-picker-drawer p-drawer-bottom"
         role="dialog"
         aria-modal="true"
         aria-label="Escolha um ícone"
         @click.stop
         @keydown="trap.onKeydown"
     >
     ```
2. **Ativação e Foco Inicial no Campo de Busca**:
   - Instanciar `const trap = useFocusTrap(drawerEl, { triggerElement: triggerEl, initialFocus: searchInputEl });`.
   - No watcher de `visible`:
     ```typescript
     watch(visible, async (val) => {
         if (val) {
             await nextTick();
             trap.activate();
             searchInputEl.value?.focus();
         } else {
             trap.deactivate();
         }
     });
     ```

### Passo 4: Implementação em `MaxInputSelect.vue` e `MaxTagSelect.vue`
1. **Contenção no Modo com Filtro de Busca**:
   - Quando `props.filter` estiver ativo, o campo de busca `.max-select-filter-input` vive dentro do overlay teleportado.
   - Pressionar `Tab` dentro do overlay não pode vazar para os nós da página. A navegação de tabulação deve alternar entre o campo de busca, o botão de limpar filtro (se houver) e os botões de ação do overlay.
2. **Restauração de Foco ao Fechar**:
   - Em `hide()`:
     ```typescript
     const hide = () => {
         isOpen.value = false;
         searchQuery.value = '';
         nextTick(() => {
             triggerEl.value?.focus();
         });
     };
     ```
   - Ao selecionar uma opção com `Enter` ou clique: fechar o overlay e devolver o foco para o combobox principal (`triggerEl`).

### Passo 5: Implementação em `MaxColorPicker.vue`
1. **Atributos de Diálogo e Trap no Painel de Cores**:
   - O painel teleportado recebe `role="dialog"`, `aria-modal="true"`, `aria-label="Seletor de cor"`.
   - Confinar a navegação via teclado entre os sliders de cor (Matiz/Saturação) e as entradas hexadecimais.
   - Ao fechar, restaurar o foco para o botão amostra de cor (`color-sample-btn`).

### Passo 6: Implementação em `MaxInputAutoComplete.vue` e `MaxInputAutoCompleteApi.vue`
1. **Associação Combobox/Listbox**:
   - O input textual preserva o foco enquanto o usuário digita.
   - A lista flutuante de sugestões utiliza `aria-activedescendant` para indicar o item realçado.
   - Ao fechar com `Escape`, fechar a lista e manter o foco no `<input>`. Ao teclar `Tab`, fechar as sugestões sem travar o avanço natural do formulário.

---

## 4. Padrões WCAG 2.1/2.2 e Diretrizes do GEMINI.md

| Critério WCAG | Nível | Como a Implementação Cumpre o Padrão |
|---|---|---|
| **2.1.1 Keyboard** | A | Toda a grade de datas, o catálogo de ícones e as listas de opções são navegáveis, selecionáveis e descartáveis 100% via teclado. |
| **2.1.2 No Keyboard Trap** | A | A tecla `Escape` ou atalhos de saída sempre desativam o confinamento de forma previsível e segura. |
| **2.4.3 Focus Order** | A | O foco progride logicamente do botão/campo acionador para o interior do painel modal e retorna com precisão milimétrica ao gatilho original. |
| **4.1.2 Name, Role, Value** | A | Painéis modais declaram `role="dialog"` e `aria-modal="true"`, permitindo que softwares leitores de tela mudem seu modo de leitura para navegação de diálogo. |

### Diretrizes de Estilização (GEMINI.md)
- Estilização de overlays exclusivamente dentro de `<style lang="scss" scoped>`.
- O foco visível dos elementos internos dos overlays deve consumir `--max-focus-ring` ou `--max-focus-outline`.
- Não utilizar classes utilitárias no template dos painéis teleportados.

---

## 5. Critérios de Aceite e Verificação Técnica

### Critérios de Aceite
1. **Navegação por Teclado no `MaxInputDatePicker`**:
   - Com o foco no input de data, teclar `ArrowDown` ou `Alt + ArrowDown` deve abrir o painel (se fechado) e focar o botão da data atual/selecionada.
   - Teclar as setas (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`) deve mover o foco entre as células da grade.
   - Teclar `Enter` deve selecionar o dia em foco, fechar o calendário e posicionar o foco de volta no `<input>` nativo.
   - Teclar `Escape` fecha o calendário e restaura o foco no `<input>`.
2. **Confinamento no `MaxInputIconPicker`**:
   - Ao abrir o drawer, o cursor de foco deve ir automaticamente para o campo de pesquisa de ícones.
   - Teclar `Tab` repetidas vezes deve ciclar entre o campo de busca, o botão fechar e os ícones da grade, sem atingir links da página de fundo.
   - Ao fechar o drawer, o foco deve retornar para o botão acionador (`.icon-picker-trigger`).
3. **Restauração de Foco nos Seletores (`MaxInputSelect` / `MaxTagSelect`)**:
   - Ao fechar a lista flutuante clicando no backdrop ou teclando `Escape`, o elemento com `role="combobox"` deve readquirir o foco do navegador imediatamente.
4. **Ausência de Memory Leaks**:
   - Ao desmontar componentes de formulário com overlays abertos, os listeners globais de teclado no `window` e referências DOM em `useFocusTrap` devem ser limpos sem exceções.

### Suíte de Testes Automatizados (`tests/components/OverlayFocusTrap.test.ts`)
```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';

describe('Gerenciamento e Confinamento de Foco em Overlays', () => {
    it('deve transferir foco para o calendário com ArrowDown e restaurar no input com Escape', async () => {
        const wrapper = mount(MaxInputDatePicker, {
            attachTo: document.body,
            props: { modelValue: '2026-09-11' }
        });
        const input = wrapper.find('.max-datepicker-input');
        await input.trigger('focus');
        await input.trigger('keydown', { key: 'ArrowDown' });

        const activeElement = document.activeElement;
        expect(activeElement?.classList.contains('max-datepicker-day')).toBe(true);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(document.activeElement).toBe(input.element);
        wrapper.unmount();
    });

    it('deve mover foco para o campo de busca ao abrir MaxInputIconPicker e restaurar ao fechar', async () => {
        const wrapper = mount(MaxInputIconPicker, {
            attachTo: document.body,
            props: { modelValue: '' }
        });
        const trigger = wrapper.find('.icon-picker-trigger');
        await trigger.trigger('click');

        const searchInput = document.body.querySelector('.picker-search-input') as HTMLElement;
        expect(document.activeElement).toBe(searchInput);

        const closeBtn = document.body.querySelector('.p-drawer-close-button') as HTMLElement;
        closeBtn.click();
        await wrapper.vm.$nextTick();

        expect(document.activeElement).toBe(trigger.element);
        wrapper.unmount();
    });
});
```

---

## 6. Mitigação de Riscos de Regressão

| Risco Potencial | Probabilidade | Impacto | Estratégia de Mitigação |
|---|---|---|---|
| **Interferência na digitação manual do usuário no input de data** | Média | Alto | A abertura do painel não transfere o foco automaticamente para a grade de dias enquanto o usuário estiver digitando números; a transferência só ocorre mediante ação intencional (`ArrowDown`, clique explícito na grade ou atalho de navegação). |
| **Conflito de focus trap entre múltiplos overlays abertos simultaneamente** | Baixa | Médio | Cada overlay opera sua própria instância do `useFocusTrap` ligada estritamente ao seu container teleportado, operando em pilha LIFO natural. |
| **Falha de foco caso o componente pai seja desmontado durante o fechamento** | Baixa | Baixo | Uso da guarda `if (target?.isConnected) target.focus()` no `deactivate()`, prevenindo erros de tentativa de foco em nós desconectados. |
