# Plano de Implementação: Resiliência a Valores Nulos e Prevenção de Crash na Renderização

## 1. Diagnóstico e Objetivo

Em aplicações SPA corporativas, componentes de layout e tabelas recebem dados assíncronos originados de APIs e stores (Pinia). Durante a fase inicial de montagem, transições de rota ou estados de erro de rede, props como `tabs`, `list` e `columns` frequentemente recebem `undefined` ou `null`.

A auditoria identificou padrões de desproteção de arrays e coleções que causam exceções de tempo de execução não tratadas (`TypeError`), derrubando a árvore inteira de renderização do Vue:
1. Em [src/components/MaxBottomMenu.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBottomMenu.vue#L160-L176):
   - A linha 160 utiliza proteção defensiva `(props.tabs?.length ?? 0) / 2`, porém as linhas 161 e 162 invocam diretamente `props.tabs.slice(0, midIndex.value)` e `props.tabs.slice(midIndex.value)`.
   - Na linha 175, o cálculo de `gridStyle` acessa diretamente `props.tabs.length`.
   - Se um consumidor passar `:tabs="undefined"` ou `:tabs="null as any"`, a aplicação dispara `TypeError: Cannot read properties of undefined (reading 'slice')` e renderiza tela branca.
2. Em [src/components/MaxTableFields.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue#L133-L168):
   - A computada `totalColspan` na linha 168 executs `props.columns.length + ...`. Quando `columns` for `undefined` ou `null`, ocorre crash fatal no `tbody` da tabela.
   - O default da prop `list` na linha 133 é `{}` (objeto vazio) em vez de `[]` (array vazio), gerando inconsistências no tratamento de listas.

**Objetivo:**
Tornar a renderização dos componentes resiliente e imune a falhas por valores `undefined` e `null`, introduzindo normalizações seguras com nullish coalescing (`?? []`) em computadas e templates, e garantindo testes unitários dedicados a estados não inicializados.

---

## 2. Arquivos a Modificar

- [src/components/MaxBottomMenu.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBottomMenu.vue): Substituir o acesso cru a `props.tabs` por uma computada intermediária segura `safeTabs`.
- [src/components/MaxTableFields.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue): Corrigir o default de `list`, proteger o cálculo de `totalColspan` com encadeamento opcional e normalizar coleções nulas.
- [tests/components/MaxBottomMenu.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxBottomMenu.test.ts): Adicionar casos de teste para `:tabs="undefined"` e `:tabs="null as any"`.
- [tests/components/MaxTableFields.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxTableFields.test.ts): Adicionar casos de teste para `:columns="undefined"` e `:list="undefined"`.

---

## 3. Especificação Técnica Cirúrgica

### A. Refatoração em `src/components/MaxBottomMenu.vue`

1. Definir uma computada sentinela `safeTabs` no script:
```typescript
/** Lista segura de abas garantindo fallback para array vazio se a prop for nula/indefinida */
const safeTabs = computed<BottomTab[]>(() => props.tabs ?? []);

const midIndex = computed<number>(() => Math.ceil(safeTabs.value.length / 2));
const leftTabs = computed<BottomTab[]>(() => safeTabs.value.slice(0, midIndex.value));
const rightTabs = computed<BottomTab[]>(() => safeTabs.value.slice(midIndex.value));

const gridStyle = computed(() => {
    if (hasFab.value) {
        const leftCount = leftTabs.value.length;
        const rightCount = rightTabs.value.length;

        return {
            gridTemplateColumns: `repeat(${leftCount}, 1fr) 64px repeat(${rightCount}, 1fr)`
        };
    }

    return {
        gridTemplateColumns: `repeat(${safeTabs.value.length}, 1fr)`
    };
});
```

2. No template, atualizar a iteração do modo sem FAB para iterar sobre `safeTabs`:
```vue
<template v-else>
    <div
        v-for="tab in safeTabs"
        :key="tab.name"
        class="bottom-menu-tab"
        :class="{ active: isActive(tab) }"
        role="link"
        tabindex="0"
        :aria-label="tab.label || tab.name"
        :aria-current="isActive(tab) ? 'page' : undefined"
        @click="goTo(tab.name)"
        @keydown.enter="goTo(tab.name)"
    >
        <MaxIcon :icon="tab.icon" size="1.3" color="currentColor" />
        <span v-if="props.showLabels && tab.label" class="bottom-menu-label">{{ tab.label }}</span>
    </div>
</template>
```

---

### B. Refatoração em `src/components/MaxTableFields.vue`

1. Ajustar o `withDefaults` e o cálculo de `totalColspan`:
```typescript
const props = withDefaults(
    defineProps<{
        /** Lista de valores para preencher a tabela */
        list?: any[] | Record<string, any>;
        /** Definição das colunas */
        columns?: MaxTableColumn[];
        /** Texto do cabeçalho de ações */
        headerButton?: string;
        /** Identificador único da tabela */
        id?: string;
        /** Prop de chave única da linha */
        dataKey?: string;
        /** Mensagem exibida quando a lista está vazia */
        emptyMessage?: string;
        /** Largura da coluna de botões (ex: '120px' ou 120) */
        buttonsWidth?: string | number;
        /** Lista de botões */
        buttons?: MaxButtonsType[];
    }>(),
    {
        list: () => [],
        columns: () => [],
        emptyMessage: 'Nenhum registro encontrado'
    }
);

/** Colunas garantidamente seguras contra valores nulos */
const safeColumns = computed<MaxTableColumn[]>(() => props.columns ?? []);

/** Total de colunas para o colspan do estado vazio com guarda defensiva */
const totalColspan: ComputedRef<number> = computed((): number => safeColumns.value.length + (hasActionsColumn.value ? 1 : 0));
```

2. Refatorar `normalizedList` para tratar `undefined`, `null` ou tipos primitivos inesperados:
```typescript
/** Normaliza a lista: se for Record converte para array preservando a chave */
const normalizedList = computed<any[]>(() => {
    if (!props.list) return [];
    if (Array.isArray(props.list)) return props.list;
    if (typeof props.list === 'object') {
        return Object.entries(props.list).map(([key, val]) => {
            if (typeof val === 'object' && val !== null && !val.id && !val.uuid && !val.ulid) {
                return { ...val, _recordKey: key };
            }
            return val;
        });
    }
    return [];
});
```

3. No template de `MaxTableFields.vue`, utilizar `safeColumns` no cabeçalho e linhas:
```vue
<thead class="max-table-fields-head">
    <tr class="max-table-fields-head-row">
        <th v-for="col in safeColumns" :key="col.field" class="max-table-fields-th" :style="getColumnStyle(col)">
            <slot :name="`header-${col.field}`" :column="col">
                {{ col.header }}
            </slot>
        </th>
        ...
```

---

### C. Testes Unitários de Resiliência

#### 1. Casos de Teste para `tests/components/MaxBottomMenu.test.ts`
```typescript
it('deve renderizar graciosamente sem erros quando tabs for undefined', () => {
    expect(() => {
        const wrapper = mount(MaxBottomMenu, {
            props: { tabs: undefined }
        });
        expect(wrapper.find('.max-bottom-menu').exists()).toBe(true);
        expect(wrapper.findAll('.bottom-menu-tab')).toHaveLength(0);
    }).not.toThrow();
});

it('deve renderizar graciosamente sem erros quando tabs for nulo (null as any)', () => {
    expect(() => {
        const wrapper = mount(MaxBottomMenu, {
            props: { tabs: null as any }
        });
        expect(wrapper.find('.max-bottom-menu').exists()).toBe(true);
        expect(wrapper.findAll('.bottom-menu-tab')).toHaveLength(0);
    }).not.toThrow();
});
```

#### 2. Casos de Teste para `tests/components/MaxTableFields.test.ts`
```typescript
it('deve renderizar sem quebrar quando columns for undefined', () => {
    expect(() => {
        const wrapper = mount(MaxTableFields, {
            props: { columns: undefined, list: [] }
        });
        expect(wrapper.find('.max-table-fields').exists()).toBe(true);
    }).not.toThrow();
});

it('deve renderizar sem quebrar quando list for undefined ou null', () => {
    expect(() => {
        const wrapper = mount(MaxTableFields, {
            props: { columns: [{ field: 'id', header: 'ID' }], list: undefined }
        });
        expect(wrapper.find('.max-table-fields-body').exists()).toBe(true);
        expect(wrapper.text()).toContain('Nenhum registro encontrado');
    }).not.toThrow();
});
```

---

## 4. Garantia de Retrocompatibilidade

1. **Valores Padrão Preservados:** Quando nenhuma prop é informada em `MaxBottomMenu`, as 4 abas padrão continuam sendo carregadas pelo factory do `withDefaults`.
2. **Contratos Mantidos:** Nenhuma interface externa foi alterada; as propriedades continuam aceitando os mesmos formatos. Apenas estados assíncronos intermediários ganharam tolerância a falhas.
3. **Estilos e Seletores:** As classes BEM e as regras SCSS scoped continuam operando de forma idêntica.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. **Checagem de Tipagem TypeScript:**
   ```bash
   npm run type-check
   ```
   *Critério:* Compilação limpa sem erros em `MaxBottomMenu.vue` e `MaxTableFields.vue`.

2. **Execução das Suítes de Teste com Casos Defensivos:**
   ```bash
   npx vitest run tests/components/MaxBottomMenu.test.ts tests/components/MaxTableFields.test.ts
   ```
   *Critério:* Todos os testes passam, incluindo as novas asserções de props `undefined` e `null`.
