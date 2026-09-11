# Plano de Implementação: Padrão Roving Tabindex e Navegação por Setas em Barras de Ferramentas, Acordeões e Chips

## 1. Objetivo da Refatoração

Implementar o padrão canônico WAI-ARIA Authoring Practices Guide (APG) de **Roving Tabindex** e navegação por teclado nos componentes compostos `MaxInputCodeToolbar`, `MaxInputMarkdownToolbar`, `MaxAccordion` e `MaxChips`.

Causas a solucionar:
1. **Fadiga de Tabulação em Barras de Edição**: As toolbars de código e markdown contêm entre 15 e 25 botões que atuam como pontos de parada individuais de `Tab`. O usuário de teclado é forçado a tabular dezenas de vezes para alcançar o campo de texto. A barra deve constituir um **ponto único de parada (*single tab stop*)**, onde apenas o item ativo possui `tabindex="0"` e a navegação entre botões ocorre via setas direcionais (`ArrowLeft`/`ArrowRight`, `Home`, `End`).
2. **Navegação Vertical no Acordeão**: Falta de suporte a `ArrowDown`, `ArrowUp`, `Home` e `End` nos cabeçalhos de `MaxAccordion`, em desacordo com as práticas recomendadas para o padrão WAI-ARIA Accordion.
3. **Incapacidade de Inspeção de Chips por Teclado**: No `MaxChips`, o teclado não permite retornar aos chips anteriores via `ArrowLeft` para ler seus valores ou excluí-los seletivamente.

Este plano detalha as alterações estruturais para unificar e orquestrar o foco desses componentes de forma ágil e acessível.

---

## 2. Arquivos Afetados

### Barras de Ferramentas
- [`src/components/MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCodeToolbar.vue)
- [`src/components/MaxInputMarkdownToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputMarkdownToolbar.vue)

### Acordeão e Contexto
- [`src/helpers/accordionContext.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/helpers/accordionContext.ts) — Extensão do contexto para registro ordenado de itens e roteamento de foco circular.
- [`src/components/MaxAccordion.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxAccordion.vue)
- [`src/components/MaxAccordionItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxAccordionItem.vue)

### Tags / Chips
- [`src/components/MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxChips.vue)

### Testes
- [`tests/components/RovingTabindexToolbarsAccordion.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/RovingTabindexToolbarsAccordion.test.ts) (Novo arquivo de validação de Roving Tabindex e setas)
- Testes existentes: `tests/components/MaxAccordion.test.ts`, `tests/components/MaxChips.test.ts`.

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Implementação de Roving Tabindex em `MaxInputCodeToolbar.vue`
1. **Atributos Semânticos no Contêiner**:
   ```vue
   <div
       class="max-input-code-toolbar"
       role="toolbar"
       :aria-label="props.label || 'Barra de ferramentas de código'"
       :class="{ 'max-input-code-toolbar--disabled': props.disabled }"
       @keydown="onToolbarKeydown"
   >
   ```
2. **Gerenciamento Reativo de Itens e Foco**:
   - Manter um array reativo de referências aos controles interativos da barra (`controlsRef = ref<HTMLElement[]>([])`).
   - Manter `currentFocusedIndex = ref(0)`.
   - Cada botão e select recebe:
     `:tabindex="currentFocusedIndex === idx && !props.disabled ? 0 : -1"`
   - Adicionar manipulador `@keydown` na toolbar:
     ```typescript
     const onToolbarKeydown = (event: KeyboardEvent) => {
         const items = controlsRef.value.filter(el => !el.hasAttribute('disabled'));
         if (!items.length) return;

         let nextIndex = currentFocusedIndex.value;

         if (event.key === 'ArrowRight') {
             event.preventDefault();
             nextIndex = (currentFocusedIndex.value + 1) % items.length;
         } else if (event.key === 'ArrowLeft') {
             event.preventDefault();
             nextIndex = (currentFocusedIndex.value - 1 + items.length) % items.length;
         } else if (event.key === 'Home') {
             event.preventDefault();
             nextIndex = 0;
         } else if (event.key === 'End') {
             event.preventDefault();
             nextIndex = items.length - 1;
         } else {
             return;
         }

         currentFocusedIndex.value = nextIndex;
         items[nextIndex]?.focus();
     };
     ```
3. **Comportamento da Tecla Tab**:
   - Pressionar `Tab` quando o foco está em qualquer botão da toolbar não navega para os botões irmãos; o foco salta imediatamente para o editor de código abaixo da toolbar.

### Passo 2: Implementação de Roving Tabindex em `MaxInputMarkdownToolbar.vue`
1. **Semântica ARIA**:
   - Aplicar `role="toolbar"` e `aria-label="Barra de ferramentas de formatação"`.
2. **Atribuição Dinâmica de Tabindex**:
   - Aplicar o mesmo mecanismo de Roving Tabindex para todos os botões (Inline, Headings, Listas, Alinhamento, Tabela, Imagens/Links).
   - Ao teclar `Tab`, a toolbar inteira é ultrapassada em um único passo, entregando o foco ao editor Tiptap/Markdown.

### Passo 3: Orquestração de Navegação por Setas em `MaxAccordion`
Espelhar o modelo arquitetural bem-sucedido já adotado em `src/helpers/tabsContext.ts`:
1. **Atualização da Interface `AccordionContext` (`src/helpers/accordionContext.ts`)**:
   ```typescript
   export interface AccordionContext {
       open_values: Readonly<Ref<string[]>>;
       toggle: (value: string) => void;
       lazy: Readonly<Ref<boolean>>;
       expand_icon: Readonly<Ref<string | undefined>>;
       collapse_icon: Readonly<Ref<string | undefined>>;
       id_prefix: string;
       nextAutoValue: () => string;
       // Novos métodos para coordenação por setas:
       registerHeader: (value: string, el: HTMLElement, disabled: () => boolean) => () => void;
       navigate: (fromValue: string, direction: 'next' | 'prev' | 'first' | 'last') => void;
   }
   ```
2. **Implementação no `MaxAccordion.vue`**:
   - Manter registro ordenado dos cabeçalhos:
     ```typescript
     interface HeaderEntry {
         value: string;
         el: HTMLElement;
         disabled: () => boolean;
     }
     const headers = ref<HeaderEntry[]>([]);

     const registerHeader = (value: string, el: HTMLElement, disabled: () => boolean) => {
         const entry = { value, el, disabled };
         headers.value.push(entry);
         return () => {
             headers.value = headers.value.filter(h => h !== entry);
         };
     };

     const navigate = (fromValue: string, direction: 'next' | 'prev' | 'first' | 'last') => {
         const available = headers.value.filter(h => !h.disabled());
         if (!available.length) return;
         const currentIdx = available.findIndex(h => h.value === fromValue);

         let targetIdx = 0;
         if (direction === 'next') targetIdx = (currentIdx + 1) % available.length;
         else if (direction === 'prev') targetIdx = (currentIdx - 1 + available.length) % available.length;
         else if (direction === 'first') targetIdx = 0;
         else if (direction === 'last') targetIdx = available.length - 1;

         available[targetIdx]?.el.focus();
     };
     ```
3. **Consumo no `MaxAccordionItem.vue`**:
   - Registrar o elemento cabeçalho no `onMounted` e desregistrar no `onBeforeUnmount`.
   - Adicionar manipuladores de teclado no `.max-accordion-item-header`:
     ```vue
     @keydown.down.prevent="context.navigate(item_value, 'next')"
     @keydown.up.prevent="context.navigate(item_value, 'prev')"
     @keydown.home.prevent="context.navigate(item_value, 'first')"
     @keydown.end.prevent="context.navigate(item_value, 'last')"
     ```

### Passo 4: Navegação Bidirecional e Exclusão em `MaxChips.vue`
1. **Transição do Input para os Chips**:
   - No `<input class="max-chips-input">`, monitorar `@keydown`:
     ```typescript
     const onInputKeydown = (event: KeyboardEvent) => {
         if (event.key === 'ArrowLeft' && inputValue.value === '' && itemsList.value.length > 0) {
             event.preventDefault();
             focusChip(itemsList.value.length - 1);
         } else {
             onKeyDown(event);
         }
     };
     ```
2. **Navegação Entre Chips e Exclusão**:
   - No botão de exclusão do chip (`.max-chip-remove-btn`) ou no chip item:
     - Teclar `ArrowLeft`: mover foco para o chip anterior.
     - Teclar `ArrowRight`: mover foco para o próximo chip ou para o input de texto se for o último chip.
     - Teclar `Backspace` ou `Delete`: excluir o chip em foco. Se houver chip anterior, focar nele; caso contrário, focar no `<input>`.

---

## 4. Padrões WCAG 2.1/2.2 e Diretrizes do GEMINI.md

| Critério WCAG | Nível | Como a Implementação Cumpre o Padrão |
|---|---|---|
| **2.1.1 Keyboard** | A | Toda a navegação por ferramentas, cabeçalhos de acordeões e listas de tags torna-se 100% operável via setas do teclado e teclas `Home`/`End`. |
| **2.4.3 Focus Order** | A | A ordem de tabulação é drasticamente otimizada: usuários não precisam mais pressionar a tecla `Tab` dezenas de vezes para pular barras de ferramentas complexas. |
| **WAI-ARIA APG Toolbar Pattern** | N/A | Implementação estrita do padrão APG com `role="toolbar"`, ponto de parada único e Roving Tabindex. |
| **WAI-ARIA APG Accordion Pattern** | N/A | Implementação estrita do padrão APG com navegação vertical por setas nos cabeçalhos (`ArrowDown`/`ArrowUp`). |

### Diretrizes de Estilização (GEMINI.md)
- Nenhum atributo de utilitário ou classe utilitária inserido no template.
- Estilos aplicados com seletores semânticos estruturados e aninhados no SCSS scoped de cada componente.

---

## 5. Critérios de Aceite e Verificação Técnica

### Critérios de Aceite
1. **Eficiência de Tabulação na Toolbar**:
   - Ao focar um formulário contendo `MaxInputCode` ou `MaxInputMarkdown`, uma única pressão na tecla `Tab` deve entrar na toolbar e a pressão subsequente de `Tab` deve sair imediatamente da toolbar para o editor, sem percorrer os mais de 15 botões intermediários.
   - Pressionar `ArrowRight` e `ArrowLeft` dentro da toolbar move o foco entre os botões continuamente.
2. **Navegação no Acordeão**:
   - Com o foco no cabeçalho do primeiro item de um `MaxAccordion`, teclar `ArrowDown` deve mover o foco para o segundo cabeçalho.
   - Teclar `ArrowUp` no primeiro cabeçalho deve saltar para o último cabeçalho habilitado (navegação circular).
   - Teclar `Home` vai para o primeiro item e `End` vai para o último.
3. **Navegação e Remoção em `MaxChips`**:
   - Com o input de texto vazio, teclar `ArrowLeft` deve mover o foco para o botão de remoção da última tag inserida.
   - Pressionar `Delete` ou `Backspace` no chip focado remove o item e posiciona o foco no elemento vizinho apropriado.

### Suíte de Testes Automatizados (`tests/components/RovingTabindexToolbarsAccordion.test.ts`)
```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import MaxAccordion from '../../src/components/MaxAccordion.vue';
import MaxAccordionItem from '../../src/components/MaxAccordionItem.vue';
import MaxInputCodeToolbar from '../../src/components/MaxInputCodeToolbar.vue';

describe('Roving Tabindex e Navegação por Setas', () => {
    it('MaxInputCodeToolbar deve ter role=toolbar e gerenciar tabindex dos botões', () => {
        const wrapper = mount(MaxInputCodeToolbar, {
            props: { language: 'javascript' }
        });
        expect(wrapper.attributes('role')).toBe('toolbar');
        const buttons = wrapper.findAll('button');
        const activeButtons = buttons.filter(b => b.attributes('tabindex') === '0');
        expect(activeButtons.length).toBe(1);
    });

    it('MaxAccordion deve navegar entre headers com ArrowDown e ArrowUp', async () => {
        const wrapper = mount({
            components: { MaxAccordion, MaxAccordionItem },
            template: `
                <MaxAccordion>
                    <MaxAccordionItem value="1" title="Item 1" />
                    <MaxAccordionItem value="2" title="Item 2" />
                    <MaxAccordionItem value="3" title="Item 3" />
                </MaxAccordion>
            `
        }, { attachTo: document.body });

        const headers = wrapper.findAll('.max-accordion-item-header');
        headers[0].element.focus();
        expect(document.activeElement).toBe(headers[0].element);

        await headers[0].trigger('keydown', { key: 'ArrowDown' });
        expect(document.activeElement).toBe(headers[1].element);

        await headers[1].trigger('keydown', { key: 'ArrowUp' });
        expect(document.activeElement).toBe(headers[0].element);
        wrapper.unmount();
    });
});
```

---

## 6. Mitigação de Riscos de Regressão

| Risco Potencial | Probabilidade | Impacto | Estratégia de Mitigação |
|---|---|---|---|
| **Conflito de setas horizontais com cursores em inputs textuais** | Baixa | Alto | A tecla `ArrowLeft` no `MaxChips` só intercepta a navegação quando `inputValue` estiver vazio e a seleção estiver no índice zero (`selectionStart === 0`). |
| **Itens desabilitados no Acordeão** | Média | Médio | A função `navigate()` filtra dinamicamente os itens desabilitados via `!h.disabled()`, garantindo que o foco salte itens inativos sem travar a navegação circular. |
| **Toolbars sem botões ou desabilitadas** | Baixa | Baixo | Quando `props.disabled` for verdadeiro na toolbar, o container e seus itens recebem `tabindex="-1"`, permitindo que o Tab ultrapasse a barra sem paradas. |
