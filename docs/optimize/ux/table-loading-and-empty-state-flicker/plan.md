# Plano de Implementação: Ausência de Estado de Loading e Falso Empty State em Tabelas (`MaxTable`, `MaxTableFields`)

## 1. Diagnóstico e Objetivo

Tabelas de dados operam de forma quase universal com chamadas assíncronas (paginação, busca, filtragem e sincronização de API). Entretanto, nos componentes [`MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTable.vue) e [`MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue):
1. **Falso Empty State (Flicker) em `MaxTableFields`:** Enquanto uma requisição HTTP está em andamento e a prop `list` inicia vazia (`[]`), o componente renderiza imediatamente a linha com a mensagem `"Nenhum registro encontrado"`. O usuário visualiza esse estado falso durante 1 a 2 segundos até os dados chegarem, provocando confusão cognitiva (usuário acha que a busca não retornou registros) e salto visual abrupto (Cumulative Layout Shift - CLS).
2. **Ausência de Empty State e Loading em `MaxTable`:** A tabela `MaxTable.vue` não possui prop `loading` nem slot padronizado de fallback para tabela vazia. Na ausência de linhas, o `<tbody>` fica vazio, com o cabeçalho flutuando isolado sobre uma caixa em branco sem qualquer explicação.

**Objetivo:**
1. Introduzir a propriedade `loading?: boolean` em `MaxTableFields.vue` e `MaxTable.vue`.
2. Criar estado de carregamento explícito (com slot `#loading`, spinner CSS e mensagem `"Carregando registros..."`), garantindo que o empty state **nunca** seja renderizado enquanto `loading === true`.
3. Padronizar em `MaxTable.vue` o suporte a linhas vazias via slot `#empty` e prop `emptyMessage`.

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue): inclusão da prop `loading`, bloqueio de empty state durante requisições e estilização do loading state.
- [`src/components/MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTable.vue): inclusão das props `loading`, `empty`, `loadingMessage`, `emptyMessage` e slots respectivos.
- [`tests/components/MaxTableFields.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxTableFields.test.ts): testes unitários validando prioridade do estado loading sobre o estado empty.
- [`tests/components/MaxTable.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxTable.test.ts): testes de renderização de loading e empty state.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Ajustes em `MaxTableFields.vue`

Extensão de props:

```ts
const props = withDefaults(
    defineProps<{
        /** Lista de valores para preencher a tabela */
        list: any[] | Record<string, any>;
        /** Definição das colunas */
        columns: MaxTableColumn[];
        /** Texto do cabeçalho de ações */
        headerButton?: string;
        /** Identificador único da tabela */
        id?: string;
        /** Prop de chave única da linha */
        dataKey?: string;
        /** Mensagem exibida quando a lista está vazia */
        emptyMessage?: string;
        /** Mensagem exibida durante o carregamento */
        loadingMessage?: string;
        /** Estado de carregamento da tabela */
        loading?: boolean;
        /** Largura da coluna de botões */
        buttonsWidth?: string | number;
        /** Lista de botões */
        buttons?: MaxButtonsType[];
    }>(),
    {
        list: () => ({}),
        columns: () => [],
        emptyMessage: 'Nenhum registro encontrado',
        loadingMessage: 'Carregando registros...',
        loading: false
    }
);
```

Template atualizado do `<tbody>` (linhas 60-92):

```html
<tbody>
    <!-- 1. Estado de carregamento (tem precedência absoluta) -->
    <tr v-if="props.loading" class="max-table-fields-row max-table-fields-loading">
        <td :colspan="totalColspan" class="max-table-fields-td max-table-fields-loading-cell">
            <slot name="loading">
                <div class="max-table-loading-container">
                    <div class="max-table-spinner" role="status" aria-label="Carregando"></div>
                    <span class="max-table-loading-text">{{ props.loadingMessage }}</span>
                </div>
            </slot>
        </td>
    </tr>

    <!-- 2. Linhas de dados quando houver itens -->
    <template v-else-if="hasItems">
        <tr
            v-for="(row, index) in normalizedList"
            :key="getRowKey(row, index)"
            class="max-table-fields-row"
            :class="{ 'max-table-fields-row-even': index % 2 === 0, 'max-table-fields-row-odd': index % 2 !== 0 }"
        >
            <!-- colunas de dados e botões mantidas idênticas -->
            <td v-for="col in props.columns" :key="col.field" class="max-table-fields-td" :style="getColumnStyle(col)">
                <slot :name="col.slot ?? col.field" :data="row" :index="index" :column="col">
                    <template v-if="col.input">
                        <!-- renderização de inputs mantida -->
                    </template>
                    <template v-else>
                        {{ getFieldValue(row, col.field) }}
                    </template>
                </slot>
            </td>

            <td v-if="hasActionsColumn" class="max-table-fields-td max-table-fields-buttons" :style="buttonsColumnStyle">
                <slot name="buttons" :data="row" :index="index">
                    <MaxIconButton v-for="btn in props.buttons" v-bind="btn" :key="btn.id" :data="btn.data ? resolveData(row, btn.data) : row" :size="btn.size ?? 1.2" class="table-icon-button"/>
                </slot>
            </td>
        </tr>
    </template>

    <!-- 3. Estado vazio (só renderiza se NÃO estiver carregando) -->
    <tr v-else class="max-table-fields-row max-table-fields-empty">
        <td :colspan="totalColspan" class="max-table-fields-td max-table-fields-empty-cell">
            <slot name="empty">
                <div class="max-table-empty-container">
                    <span class="max-table-empty-text">{{ emptyMessage }}</span>
                </div>
            </slot>
        </td>
    </tr>
</tbody>
```

Estilização SCSS scoped correspondente:

```scss
<style lang="scss" scoped>
.max-table-loading-container,
.max-table-empty-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px 16px;
    width: 100%;
    color: var(--background-650);
}

.max-table-loading-text,
.max-table-empty-text {
    font-size: 0.95rem;
    font-weight: 500;
}

.max-table-spinner {
    width: 22px;
    height: 22px;
    border: 2px solid var(--background-300, #e2e8f0);
    border-top-color: var(--primary-500, #00768e);
    border-radius: 50%;
    animation: max-table-spin 0.8s linear infinite;
}

@keyframes max-table-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
```

### 3.2. Ajustes em `MaxTable.vue`

Em `MaxTable.vue`, adicionar declaração de props:

```ts
const props = withDefaults(
    defineProps<{
        loading?: boolean;
        empty?: boolean;
        emptyMessage?: string;
        loadingMessage?: string;
    }>(),
    {
        loading: false,
        empty: false,
        emptyMessage: 'Nenhum registro encontrado',
        loadingMessage: 'Carregando dados...'
    }
);
```

No template:

```html
<tbody>
    <tr v-if="props.loading" class="max-table-row-state">
        <td class="p-datatable-cell state-cell">
            <slot name="loading">
                <div class="max-table-feedback-box">
                    <div class="max-table-spinner"></div>
                    <span>{{ props.loadingMessage }}</span>
                </div>
            </slot>
        </td>
    </tr>
    <tr v-else-if="props.empty" class="max-table-row-state">
        <td class="p-datatable-cell state-cell">
            <slot name="empty">
                <div class="max-table-feedback-box">
                    <span>{{ props.emptyMessage }}</span>
                </div>
            </slot>
        </td>
    </tr>
    <template v-else>
        <template v-for="name in slotNames.filter(n => n !== 'buttons' && n !== 'header' && n !== 'footer' && n !== 'loading' && n !== 'empty')" :key="name">
            <slot :name="name" v-bind="{}" />
        </template>
        <slot />
        <tr v-if="slotNames.includes('buttons')" class="p-column max-table-column-buttons" :style="`width: ${width}px; max-width: ${width}px;`">
            <td class="p-datatable-cell">
                <div class="max-table-buttons" ref="el">
                    <slot name="buttons" v-bind="{ data: {}, index: 0 }" />
                </div>
            </td>
        </tr>
    </template>
</tbody>
```

---

## 4. Garantia de Retrocompatibilidade

- O valor padrão de `loading` é `false` e `empty` é `false`. Tabelas existentes continuam exibindo seus slots de conteúdo ou o empty state tradicional caso `list` esteja vazia.
- A estrutura das colunas, inputs aninhados e botões de ação de linha permanece inalterada.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. Quando `props.loading === true`, a linha de loading com spinner é renderizada.
2. Quando `props.loading === true` e `list: []`, o texto `"Nenhum registro encontrado"` **não** é renderizado no DOM.
3. Quando `props.loading === false` e `list: []`, a linha de empty state é exibida.
4. O slot `#loading` customizado é renderizado prioritariamente quando fornecido.

### 5.2. Comandos de Validação
```bash
# Validação de tipagem
npm run type-check

# Testes automatizados das tabelas
npx vitest run tests/components/MaxTableFields.test.ts tests/components/MaxTable.test.ts
```
