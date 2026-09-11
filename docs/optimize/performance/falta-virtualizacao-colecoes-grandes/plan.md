# Plano de Implementação: Virtualização com Janelamento Real de DOM em Seletores e Coleções de Grande Escala

## 1. Objetivo da Refatoração

Eliminar os gargalos críticos de CPU, *input lag*, quedas bruscas de FPS e alto consumo de memória RAM causados pela montagem simultânea de milhares de nós DOM em listas de opções e seletores de dados.

Especificamente:
1. **Substituir a pseudo-virtualização no [`MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue)**: atualmente, a matemática de scroll em `onScrollerScroll` apenas filtra requisições de rede de SVG, mantendo todas as ~625 linhas e mais de 5.000 botões `<button class="icon-cell">` montados no DOM. Implementar janelamento real utilizando o composable nativo [`useVirtualList`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/composables/useVirtualList.ts), reduzindo o DOM a apenas as ~15 a 20 linhas visíveis na viewport (com *overscan* seguro).
2. **Implementar janelamento virtual em [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue)**: introduzir virtualização automática baseada em threshold (ex.: > 30 itens) para opções simples via [`useVirtualList`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/composables/useVirtualList.ts), espelhando o padrão canônico já validado em [`MaxListBox.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxListBox.vue).
3. **Eliminar overhead de referências reativas inline**: banir o padrão `:ref="(el) => setOptionRef(el, index)"` em [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue) e [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue), substituindo a rolagem por elementos físicos por scroll numérico programático calculado a partir de `highlightedIndex * itemHeight`.
4. **Estabelecer diretrizes e proteções arquiteturais** para matrizes e coleções densas em [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue), [`MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTableFields.vue) e [`MaxInputPhone.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhone.vue).

---

## 2. Arquivos Afetados

| Arquivo | Ação | Responsabilidade / Mudança |
|---|---|---|
| [`src/components/MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue) | Modificar | Integrar `useVirtualList` no drawer de ícones; criar spacer com `totalHeight` e window flutuante com `translateY(offsetY)`; conectar `setViewport` e `enqueueSvgFetch` estritamente à janela visível. |
| [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue) | Modificar | Adicionar props `virtualScroll` e `virtualScrollThreshold`; integrar `useVirtualList`; remover `optionRefs` e `:ref="setOptionRef"`; refatorar `scrollHighlightedIntoView` para posicionamento matemático por offset. |
| [`src/components/MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue) | Modificar | Remover mutações inline em `optionRefs` e adotar alinhamento com a estratégia virtualizada de `MaxInputSelect`. |
| [`src/composables/useVirtualList.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/composables/useVirtualList.ts) | Revisar / Validar | Garantir suporte pleno a coleções heterogêneas, reatividade de `totalHeight`, `offsetY` e controle de rolagem por `setViewport`. |
| [`tests/components/MaxInputIconPicker.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputIconPicker.test.ts) | Modificar / Expandir | Cobrir renderização da janela virtual, emissão de fetch sob demanda e integridade de seleção. |
| [`tests/components/MaxInputSelect.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxInputSelect.test.ts) | Modificar / Expandir | Validar navegação por teclado e renderização de listas longas (> 500 itens) sem degradação. |

---

## 3. Passo a Passo Detalhado da Implementação

### Etapa 1: Janelamento Real no `MaxInputIconPicker.vue`

1. **Importação e Parâmetros de Geometria**:
   - Importar o composable local:
     ```ts
     import { useVirtualList } from '../composables/useVirtualList';
     ```
   - Definir constantes fixas de layout da grade:
     ```ts
     const COLS = 8;
     const ROW_HEIGHT = 40; // 40px por linha de ícones (altura do botão + gap vertical)
     const OVERSCAN_ROWS = 4; // 4 linhas acima e abaixo para scroll suave sem pop-in
     ```

2. **Instanciação do Composable de Virtualização**:
   - Conectar `useVirtualList` à computada `rows` (que agrupa `flatIcons` em blocos de 8 colunas):
     ```ts
     const isVirtualActive = computed(() => rows.value.length > 0);

     const { visibleItems, offsetY, totalHeight, setViewport } = useVirtualList(rows, {
         itemHeight: computed(() => ROW_HEIGHT),
         enabled: isVirtualActive,
         overscan: OVERSCAN_ROWS
     });
     ```

3. **Template com Estrutura Spacer + Floating Window**:
   - Refatorar o container `.icon-virtual-list` no template:
     ```html
     <div
         v-else
         ref="scrollerEl"
         class="icon-virtual-list"
         @scroll="onScrollerScroll"
     >
         <!-- Espaçador que sustenta a barra de scroll com a altura real total -->
         <div
             class="icon-virtual-spacer"
             :style="{ height: `${totalHeight}px` }"
             aria-hidden="true"
         />

         <!-- Janela visível renderizada no DOM, transladada verticalmente -->
         <div
             class="icon-virtual-window"
             :style="{ transform: `translateY(${offsetY}px)` }"
         >
             <div
                 v-for="entry in visibleItems"
                 :key="entry.index"
                 class="icon-row"
                 :data-row-index="entry.index"
             >
                 <button
                     v-for="icon in entry.item"
                     :key="icon.name"
                     type="button"
                     class="icon-cell"
                     :class="{ selected: modelValue === icon.name }"
                     :aria-label="`Selecionar ícone ${icon.name}`"
                     :title="icon.name"
                     @click.stop="selectIcon(icon.name)"
                 >
                     <div
                         v-if="svgCache[icon.name]"
                         class="picker-icon-svg"
                         v-html="svgCache[icon.name]"
                     />
                     <div v-else class="picker-icon-placeholder" />
                 </button>
             </div>
         </div>
     </div>
     ```

4. **Sincronização de Viewport e Prefetch de SVGs**:
   - Ajustar o manipulador de rolagem `onScrollerScroll`:
     ```ts
     const onScrollerScroll = (event: Event) => {
         const el = event.target as HTMLElement;
         if (!el) return;

         setViewport(el.scrollTop, el.clientHeight || 400);

         // Coleta apenas os ícones que estão dentro da janela virtual atual (incluindo overscan)
         const iconsToFetch: string[] = [];
         for (const entry of visibleItems.value) {
             for (const icon of entry.item) {
                 iconsToFetch.push(icon.name);
             }
         }
         enqueueSvgFetch(iconsToFetch);
     };
     ```
   - No `preloadInitialSvgs`: inicializar o viewport com `setViewport(0, 400)` e solicitar SVGs apenas para a janela inicial calculada por `visibleItems.value`.
   - Ao alterar o termo de busca `search`: resetar a rolagem `scrollerEl.value.scrollTop = 0` e executar `setViewport(0, scrollerEl.value?.clientHeight || 400)`.

5. **Estilização SCSS Scoped Conforme GEMINI.md**:
   - Estruturar o SCSS aninhado sem classes utilitárias no template:
     ```scss
     .icon-virtual-list {
         position: relative;
         height: calc(90dvh - 140px);
         overflow-y: auto;

         .icon-virtual-spacer {
             width: 100%;
             pointer-events: none;
         }

         .icon-virtual-window {
             position: absolute;
             top: 0;
             left: 0;
             width: 100%;
             display: flex;
             flex-direction: column;

             .icon-row {
                 display: grid;
                 grid-template-columns: repeat(8, minmax(0, 1fr));
                 gap: 4px;
                 height: 40px;
                 align-items: center;

                 .icon-cell {
                     /* estilos de botão, hover, selected */
                 }
             }
         }
     }
     ```

---

### Etapa 2: Virtualização em `MaxInputSelect.vue`

1. **Novas Props de Controle de Virtualização**:
   - Adicionar à interface de props em [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue):
     ```ts
     /** Força ativação ou desativação do scroll virtual */
     virtualScroll?: boolean | undefined;
     /** Quantidade mínima de itens para acionar a virtualização automática. Padrão: 30 */
     virtualScrollThreshold?: number | undefined;
     ```
   - Configurar valores padrão em `withDefaults`:
     ```ts
     virtualScrollThreshold: 30
     ```

2. **Cálculo de Altura Numérica e Estado de Ativação**:
   - Extrair a altura numérica de cada item:
     ```ts
     const numericItemHeight = computed(() => {
         if (typeof props.listHeight === 'number') return props.listHeight;
         if (typeof props.listHeight === 'string') {
             const parsed = parseInt(props.listHeight, 10);
             return isNaN(parsed) ? 27 : parsed;
         }
         return 27; // padrão 27px
     });

     const isVirtual = computed(() => {
         // Não virtualiza opções agrupadas (groupOptions) para preservar hierarquia de cabeçalhos
         if (props.groupOptions) return false;
         if (props.virtualScroll !== undefined) return props.virtualScroll;
         return (filteredOptions.value?.length ?? 0) > props.virtualScrollThreshold;
     });
     ```

3. **Integração de `useVirtualList`**:
   - Instanciar o composable:
     ```ts
     const { visibleItems, offsetY, totalHeight, setViewport } = useVirtualList(filteredOptions, {
         itemHeight: numericItemHeight,
         enabled: isVirtual,
         overscan: 6
     });
     ```
   - Ao abrir o dropdown (`isOpen.value = true`):
     ```ts
     nextTick(() => {
         if (listEl.value) {
             setViewport(listEl.value.scrollTop, listEl.value.clientHeight || 200);
         }
     });
     ```
   - No evento `@scroll="onListScroll"` de `.max-select-list`:
     ```ts
     const onListScroll = (event: Event) => {
         const target = event.target as HTMLElement;
         if (!target) return;
         setViewport(target.scrollTop, target.clientHeight || 200);
     };
     ```

4. **Remoção de `optionRefs` e Refatoração de Navegação por Teclado**:
   - Eliminar a variável reativa `const optionRefs = ref<(HTMLElement | null)[]>([]);` e a função `setOptionRef`.
   - Remover `:ref="(el) => setOptionRef(el, index)"` do template.
   - Refatorar `scrollHighlightedIntoView` para cálculo de viewport puramente aritmético:
     ```ts
     const scrollHighlightedIntoView = () => {
         nextTick(() => {
             const container = listEl.value;
             if (!container) return;

             const h = numericItemHeight.value;
             const targetTop = highlightedIndex.value * h;
             const targetBottom = targetTop + h;

             if (targetTop < container.scrollTop) {
                 container.scrollTop = targetTop;
             } else if (targetBottom > container.scrollTop + container.clientHeight) {
                 container.scrollTop = targetBottom - container.clientHeight;
             }
         });
     };
     ```

5. **Template com Janela Flutuante em Modo Virtual**:
   - No bloco de opções simples (`!groupOptions`):
     ```html
     <div
         ref="listEl"
         class="max-select-list p-select-list"
         role="listbox"
         :id="listboxId"
         @scroll="onListScroll"
     >
         <div
             v-if="isVirtual"
             class="max-select-spacer"
             :style="{ height: `${totalHeight}px` }"
             aria-hidden="true"
         />

         <div
             class="max-select-window"
             :class="{ 'is-virtual': isVirtual }"
             :style="isVirtual ? { transform: `translateY(${offsetY}px)` } : undefined"
         >
             <div
                 v-for="entry in (isVirtual ? visibleItems : nonVirtualItems)"
                 :key="entry.index"
                 :id="`${listboxId}-opt-${entry.index}`"
                 class="max-select-option p-select-option"
                 :class="{
                     'max-select-option-selected p-select-option-selected is-selected': isOptionSelected(entry.item),
                     'max-select-option-highlighted p-select-option-highlighted is-focused': highlightedIndex === entry.index
                 }"
                 :style="{ height: itemHeight }"
                 role="option"
                 :aria-selected="isOptionSelected(entry.item)"
                 @click.stop="selectOption(entry.item)"
                 @mouseenter="highlightedIndex = entry.index"
             >
                 <!-- Slots e labels de opção inalterados -->
                 <slot name="option" :option="entry.item" :selected="isOptionSelected(entry.item)" :index="entry.index">
                     ...
                 </slot>
             </div>
         </div>
     </div>
     ```

---

### Etapa 3: Diretrizes de Proteção para `MaxTableFields` e `MaxInputPhone`

1. **`MaxInputPhone.vue`**:
   - Eliminar ouvintes `@mousemove="focused_index = index"` por elemento (delegar para `@mouseenter` ou navegação por teclado).
   - Adotar carregamento lazy das bandeiras PNG (`loading="lazy"` nas tags `<img>`) para não bloquear a thread na montagem da lista de DDI.
2. **`MaxTableFields.vue`**:
   - Documentar nos padrões do componente que matrizes editáveis com mais de 50 linhas devem utilizar a prop de paginação interna ou modo virtual nativo para evitar a instanciação de centenas de componentes pesados simultaneamente.

---

## 4. Padrões de Performance do GEMINI.md

1. **Regras de Estilização Front-End**:
   - Proibição absoluta de classes utilitárias no template (`class="flex h-40"`, etc.) e ausência total de sintaxe attributify do UnoCSS (`<div flex>`, `<div w-full>`).
   - Todo estilo posicional de virtualização (espaçador, window, translação `translateY`) deve residir na seção `<style lang="scss" scoped>`, espelhando estritamente a hierarquia DOM semântica.
2. **Reatividade e Alocação de Memória**:
   - Zero closures anônimas inline em `:ref` por nó repetido.
   - Preservação da imutabilidade das referências de cálculo e liberação de VNodes descartados da memória da GPU.
3. **Independência Total do PrimeVue**:
   - Estrutura de lista 100% nativa em Vue 3, sem importações de módulos terceiros desnecessários.

---

## 5. Critérios de Aceite e Verificação Técnica

- [ ] **DOM Reduzido**: Em [`MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue) com 5.000 ícones, o número de elementos `.icon-cell` montados no DOM inspecionado deve ser ≤ 160 nós em qualquer momento.
- [ ] **Desempenho de Renderização**: Abertura do drawer de ícones sem travamentos (Long Task < 50ms) e rolagem contínua estável a 60 FPS.
- [ ] **Rede Sob Demanda**: Apenas os SVGs correspondentes aos ícones visíveis e adjacentes no viewport atual devem ser enfileirados em `svgFetchQueue`.
- [ ] **Acessibilidade e Navegação por Teclado em `MaxInputSelect`**:
  - Pressionar ArrowDown e ArrowUp navega suavemente por listas de 1.000+ itens, mantendo o item focado visível no viewport sem erros de referência nula.
  - Seleção por tecla Enter e tecla Space funcional.
- [ ] **Compatibilidade Regressiva**:
  - `groupOptions` continua funcionando perfeitamente no modo tradicional linear.
  - Slots customizados (`#option`, `#emptyMessage`) preservam contratos públicos.
- [ ] **Verificação Automatizada**:
  - Execução bem-sucedida de `npx vitest run tests/components/MaxInputIconPicker.test.ts tests/components/MaxInputSelect.test.ts`.
  - Execução bem-sucedida de `npm run type-check`.

---

## 6. Mitigação de Riscos de Regressão

| Risco | Impacto | Estratégia de Mitigação |
|---|---|---|
| Quebra de layout em dropdowns com altura customizada (`listHeight`) | Visual desalinhado ou fatias cortadas | `numericItemHeight` faz parse de valores numéricos e strings com unidades (`px`), garantindo que o cálculo de `itemHeight` no `useVirtualList` coincida exatamente com a altura renderizada. |
| Incompatibilidade com opções agrupadas (`groupOptions`) | Subtítulos de grupo sumindo | `isVirtual` é desativado automaticamente quando `groupOptions` estiver presente, retornando para renderização linear nativa. |
| Perda de sincronia de scroll ao filtrar itens rapidamente | Viewport vazio ou scroll fora da faixa | Reset explícito de `scrollTop = 0` e recálculo síncrono de `setViewport` sempre que o termo de busca for alterado. |
| Falhas em ambientes de teste sem layout físico (happy-dom/jsdom) | `clientHeight` retornando 0 | Manter fallbacks padrão (`clientHeight || 400` no picker e `clientHeight || 200` no select) para que testes unitários continuem renderizando itens normalmente. |
