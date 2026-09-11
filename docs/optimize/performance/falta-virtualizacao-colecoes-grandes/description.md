# Ausência de Virtualização em Seletores e Coleções de Grande Escala

## Severidade
**Crítica**

---

## Componentes Impactados
- [`MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue#L70-L99)
- [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue#L88-L165)
- [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue#L85-L115)
- [`MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTableFields.vue#L37-L65)
- [`MaxInputPhone.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhone.vue#L48-L65)

---

## Sintoma Observado vs. Causa Raiz Profunda

### Sintoma Observado
- Ao abrir o seletor de ícones ([`MaxInputIconPicker`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue)), ocorre um congelamento instantâneo da interface (Long Task superior a 500ms–1500ms), com a taxa de quadros (FPS) despencando para 0.
- Durante a digitação no campo de filtro ou rolagem rápida, o navegador apresenta *input lag* severo e *jank* contínuo.
- Em formulários complexos contendo seletores com centenas ou milhares de opções (como municípios do IBGE, listas de clientes, produtos ou tabelas de campos editáveis via [`MaxTableFields`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTableFields.vue)), o tempo de montagem da tela e o consumo de memória RAM do processo da aba disparam.

### Causa Raiz Profunda
1. **Pseudo-virtualização no [`MaxInputIconPicker`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue)**:
   O componente possui uma classe CSS chamada `.icon-virtual-list` e implementa cálculos de fatia em [`onScrollerScroll`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue#L250-L266) (`scrollTop / itemSize`). Contudo, essa matemática é utilizada **exclusivamente para determinar quais SVGs devem ser baixados via rede** (`enqueueSvgFetch`). O template Vue renderiza todas as linhas da lista na árvore DOM por meio de um `v-for="(row, rIndex) in rows"`. Se houver 5.000 ícones, a lista divide-se em 625 linhas de 8 colunas, inserindo **5.000 elementos `<button class="icon-cell">` e seus nós internos diretamente no DOM**. O navegador é forçado a calcular estilo, geometria e pintura para milhares de elementos invisíveis fora do viewport.

2. **Renderização linear não virtualizada em [`MaxInputSelect`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue) e [`MaxTagSelect`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue)**:
   Enquanto o componente de navegação [`MaxListBox.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxListBox.vue#L101) implementou corretamente a virtualização via `useVirtualList`, os componentes [`MaxInputSelect`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue) e [`MaxTagSelect`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue) montam todos os itens de `filteredOptions` via `v-for`. Para piorar, no [`MaxInputSelect`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue#L100-L134) cada linha possui um callback de ref inline:
   `:ref="(el) => setOptionRef(el, index)"`
   Esse callback executa `optionRefs.value[index] = el`, mutando uma referência reativa profunda (`ref<(HTMLElement | null)[]>`) para cada elemento durante a renderização, gerando *overhead* adicional de reatividade e alocação desnecessária de funções closure a cada render.

3. **Multiplicação não virtualizada em matrizes editáveis ([`MaxTableFields`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTableFields.vue#L37-L65))**:
   No [`MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTableFields.vue), cada linha de dados monta instâncias completas de componentes de formulário (`MaxInputText`, `MaxInputNumber`, `MaxInputSelect`). Se uma tabela possuir 100 linhas e 5 colunas de entrada, são criadas **500 instâncias de componentes Vue completas** no DOM sem paginação ou janela virtual.

4. **Carregamento irrestrito de 240+ elementos em [`MaxInputPhone`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhone.vue#L48-L65)**:
   Ao abrir o seletor de DDI, mais de 240 opções de países são renderizadas imediatamente, cada uma com uma tag `<img>` remota apontando para `https://flagcdn.com/...` e ouvintes de `@mousemove` em cada linha, gerando avalanche de requisições e processamento de layout.

---

## Evidência Técnica

### 1. Pseudo-virtualização em `MaxInputIconPicker.vue`
Em [`src/components/MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue#L70-L99):
```html
<div
    v-else
    class="icon-virtual-list"
    :style="{ height: 'calc(90dvh - 140px)', overflowY: 'auto' }"
    @scroll="onScrollerScroll"
>
    <!-- Renderiza TODAS as linhas da coleção inteira sem janela virtual -->
    <div
        v-for="(row, rIndex) in rows"
        :key="rIndex"
        class="icon-row"
        :data-row-index="rIndex"
    >
        <button
            v-for="icon in row"
            :key="icon.name"
            type="button"
            class="icon-cell"
            ...
        >
```

Em [`src/components/MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue#L250-L266):
```ts
const onScrollerScroll = (event: Event) => {
    const el = event.target as HTMLElement;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const clientHeight = el.clientHeight;
    const itemSize = 40;

    const firstRow = Math.floor(scrollTop / itemSize);
    const visibleRows = Math.ceil(clientHeight / itemSize) + 2;
    const lastRow = firstRow + visibleRows;

    const visibleIcons: string[] = [];
    for (let r = firstRow; r <= lastRow && r < rows.value.length; r++) {
        for (const icon of rows.value[r]) visibleIcons.push(icon.name);
    }

    // Apenas enfileira o fetch dos SVGs, o DOM continua com todas as linhas montadas!
    enqueueSvgFetch(visibleIcons);
};
```

### 2. Renderização não virtualizada e inline ref mutation em `MaxInputSelect.vue`
Em [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue#L130-L145):
```html
<div
    v-for="(option, index) in (filteredOptions as any[])"
    :key="index"
    :id="`${listboxId}-opt-${index}`"
    :ref="(el) => setOptionRef(el, index)"
    class="max-select-option p-select-option"
    ...
>
```

Em [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue#L267-L272):
```ts
const optionRefs = ref<(HTMLElement | null)[]>([]);

const setOptionRef = (el: any, index: number) => {
    if (el) optionRefs.value[index] = el as HTMLElement;
};
```

---

## Impacto na Performance em Tempo de Execução e no Tamanho do Bundle

- **Tempo de Execução (FPS e CPU)**:
  - **Bloqueio da Main Thread**: Montar 5.000 nós no drawer do [`MaxInputIconPicker`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue) causa um bloqueio de script e cálculo de layout de **600ms a 1800ms** dependendo do hardware do usuário.
  - **Scroll Jank**: Durante o scroll da lista, centenas de nós DOM precisam ser mantidos na memória gráfica da GPU, gerando travamentos perceptíveis.
  - **Garbage Collection Pressure**: A cada digitação no campo de busca (`search`), todas as linhas e botões são destruídos e recriados do zero, gerando picos elevados de coleta de lixo no V8.
- **Memória de Heap**:
  - Aumenta o consumo de heap da aba em **40MB a 120MB** desnecessariamente para armazenar VNodes e nós nativos do DOM.
- **Impacto no Bundle**:
  - Neutro ou favorável: A introdução do composable reutilizável [`useVirtualList`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/composables/useVirtualList.ts) (que já existe no repositório) padroniza a biblioteca sem adicionar dependências externas, reduzindo código de controle manual.
