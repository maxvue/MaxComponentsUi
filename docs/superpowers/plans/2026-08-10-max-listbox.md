# MaxListBox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar `MaxListBox`, uma lista de seleção sempre visível para painéis mestre-detalhe, com itens ricos, filtro, virtualização automática e scroll infinito paginado.

**Architecture:** Componente Vue 3 nativo (sem PrimeVue), autônomo (sem `InputBase`). A virtualização vive num composable separado (`useVirtualList`) para manter o SFC pequeno e testável. Duas fontes de dados mutuamente exclusivas: `options` (local, filtro em memória) ou `loadOptions` (API, filtro server-side + paginação por scroll infinito).

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + `@vue/test-utils` + happy-dom, SCSS com variáveis do tema Max, UnoCSS (`presetMaxUno`).

**Spec:** `docs/superpowers/specs/2026-08-10-max-listbox-design.md`

## Global Constraints

- **Worktree obrigatório:** toda a implementação ocorre em `../MaxComponentsUi-wt-max-listbox` (branch `max-listbox`), nunca no working tree principal. Ver Task 0.
- **Sem PrimeVue:** nenhum `import ... from 'primevue/*'` em nenhum arquivo criado por este plano. A biblioteca está migrando para longe do PrimeVue.
- **Estilo de código:** indentação de 4 espaços, aspas simples, ponto e vírgula obrigatório, sem vírgula final. Ordem dos blocos no `.vue`: Template → Script → Style.
- **Tipagem:** `defineProps<Interface>()` e `defineEmits<{...}>()` tipados. Sem `any` implícito em assinaturas públicas.
- **Cores:** somente variáveis CSS do tema Max (`var(--background-300)`, `var(--blue-600)`, `var(--background-0)`, …). Nunca hex cru.
- **Sem seleção = `null`** (nunca `undefined` nem `''`).
- **Nomes públicos exatos** (não renomear em nenhuma task): props `modelValue`, `selectedOption`, `options`, `loadOptions`, `optionValue`, `optionLabel`, `optionSubLabel`, `optionDisabled`, `filter`, `filterPlaceholder`, `filterFields`, `virtualScroll`, `virtualScrollThreshold`, `itemHeight`, `pageSize`, `twoLines`, `emptyMessage`, `disabled`, `loading`, `title`, `height`. Emits: `update:modelValue`, `change`, `filter`, `load-error`. Slots: `option`, `header`, `footer`, `empty`, `loader`.
- **Comandos de verificação:** `npx vitest run <arquivo>` para um teste; `npm run type-check`; `npm run lint`.

---

## File Structure

| Arquivo | Responsabilidade | Task |
|---------|------------------|------|
| `src/types/listbox.ts` | Tipos públicos `ListBoxOption`, `LoadOptionsContext`, `LoadOptionsResult` | 1 |
| `src/types/index.ts` | Re-export dos tipos do listbox | 1 |
| `src/composables/useVirtualList.ts` | Janela de virtualização (cálculo puro + handler de scroll) | 2 |
| `tests/composables/useVirtualList.test.ts` | Testes da virtualização | 2 |
| `src/components/MaxListBox.vue` | Componente (lista, seleção, filtro, paginação, teclado, estilo) | 3–8 |
| `tests/components/MaxListBox.test.ts` | Testes do componente | 3–8 |
| `src/index.ts` | Export + aliases | 9 |
| `src/components-manifest.json` | Regenerado pelo script | 9 |
| `playground/src/App.vue` | Demo manual | 10 |

O SFC cresce por tasks sucessivas: cada task adiciona uma capacidade completa e testada (lista+seleção → filtro → virtual scroll → API/scroll infinito → teclado → estilo). Isso mantém cada entrega revisável isoladamente.

---

### Task 0: Criar o worktree

**Files:**
- Nenhum arquivo alterado; apenas setup de ambiente.

**Interfaces:**
- Consumes: nada.
- Produces: diretório de trabalho `../MaxComponentsUi-wt-max-listbox` no branch `max-listbox`. **Todas as tasks seguintes rodam dentro dele.**

- [ ] **Step 1: Criar o worktree a partir de `dev`**

```bash
cd /home/johnattas/GitHub/MaxComponentsUi
git worktree add ../MaxComponentsUi-wt-max-listbox -b max-listbox
```

- [ ] **Step 2: Instalar dependências no worktree**

O worktree não compartilha `node_modules` com o principal.

```bash
cd ../MaxComponentsUi-wt-max-listbox
npm install
```

Se `npm install` falhar por causa de `@maxvue/max-use` (`file:../MaxUse`), o caminho relativo mudou: o worktree fica um nível ao lado, então `../MaxUse` continua resolvendo. Se ainda assim falhar, copie o node_modules do principal:
`cp -r ../MaxComponentsUi/node_modules ./node_modules`

- [ ] **Step 3: Verificar que a suíte existente passa antes de qualquer mudança**

Run: `npx vitest run tests/components/MaxInputSelect.test.ts`
Expected: PASS. Se falhar aqui, o ambiente está quebrado — pare e reporte antes de escrever código.

---

### Task 1: Tipos públicos do ListBox

**Files:**
- Create: `src/types/listbox.ts`
- Modify: `src/types/index.ts` (adicionar re-export no final do arquivo, junto do `export type * from './chart';`)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `ListBoxOption` — shape recomendado (não obrigatório) de um item.
  - `LoadOptionsContext = { page: number; search: string; pageSize: number }` — argumento único recebido por `loadOptions`.
  - `LoadOptionsResult = { items: any[]; hasMore?: boolean; total?: number }` — retorno esperado de `loadOptions`.

  Tasks 6 e 7 usam exatamente estes nomes e campos.

- [ ] **Step 1: Criar o arquivo de tipos**

```ts
// src/types/listbox.ts

/**
 * Shape recomendado de um item do MaxListBox.
 * Os nomes dos campos são configuráveis pelas props optionValue/optionLabel/
 * optionSubLabel/optionDisabled, então este tipo é um guia, não uma imposição.
 */
export type ListBoxOption = {
    /** Valor único do item (campo definido por optionValue) */
    value?: string | number | null;
    /** Rótulo principal (campo definido por optionLabel) */
    label?: string;
    /** Rótulo secundário (campo definido por optionSubLabel) */
    sub_label?: string;
    /** Ícone do Iconify (ex.: 'mdi:account') */
    icon?: string;
    /** Texto do badge exibido à direita */
    badge?: string | number;
    /** Cor do badge (variável do tema ou nome de cor aceito pelo MaxBadgeComponent) */
    badgeColor?: string;
    /** Item não selecionável (campo definido por optionDisabled) */
    disabled?: boolean;
    [key: string]: any;
};

/** Argumento recebido pela função loadOptions a cada página solicitada. */
export type LoadOptionsContext = {
    /** Página solicitada, iniciando em 1 */
    page: number;
    /** Termo de busca atual (string vazia quando não há filtro) */
    search: string;
    /** Quantidade de itens por página (prop pageSize) */
    pageSize: number;
};

/** Retorno esperado da função loadOptions. */
export type LoadOptionsResult = {
    /** Itens da página solicitada */
    items: any[];
    /** Indica se ainda existem páginas. Quando omitido, é derivado de `total`. */
    hasMore?: boolean;
    /** Total de registros disponíveis no servidor */
    total?: number;
};
```

- [ ] **Step 2: Re-exportar em `src/types/index.ts`**

Adicione ao final do arquivo, logo abaixo da linha `export type * from './chart';`:

```ts
// Tipos do MaxListBox.
export type * from './listbox';
```

- [ ] **Step 3: Verificar a tipagem**

Run: `npm run type-check`
Expected: PASS, sem erros novos.

- [ ] **Step 4: Commit**

```bash
git add src/types/listbox.ts src/types/index.ts
git commit -m "feat(MaxListBox): adiciona tipos publicos do listbox"
```

---

### Task 2: Composable `useVirtualList`

**Files:**
- Create: `src/composables/useVirtualList.ts`
- Test: `tests/composables/useVirtualList.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:

```ts
function useVirtualList<T>(
    items: Ref<T[]> | ComputedRef<T[]>,
    options: {
        itemHeight: Ref<number> | ComputedRef<number>;
        enabled: Ref<boolean> | ComputedRef<boolean>;
        overscan?: number;          // default 5
    }
): {
    visibleItems: ComputedRef<Array<{ item: T; index: number }>>;
    offsetY: ComputedRef<number>;
    totalHeight: ComputedRef<number>;
    startIndex: ComputedRef<number>;
    setViewport: (scrollTop: number, viewportHeight: number) => void;
}
```

A Task 5 chama `setViewport` no handler de scroll e usa `visibleItems`/`offsetY`/`totalHeight` no template.

**Nota sobre o diretório:** `src/composables/` ainda não existe no repositório. Este é o primeiro composable; criar o diretório faz parte desta task.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// tests/composables/useVirtualList.test.ts
import { describe, it, expect } from 'vitest';
import { ref, computed } from 'vue';
import { useVirtualList } from '../../src/composables/useVirtualList';

function makeItems(n: number) {
    return Array.from({ length: n }, (_, i) => ({ id: i, label: `Item ${i}` }));
}

describe('useVirtualList', () => {
    it('retorna todos os itens quando desabilitado', () => {
        const items = ref(makeItems(1000));
        const vl = useVirtualList(items, { itemHeight: ref(44), enabled: ref(false) });

        vl.setViewport(0, 400);

        expect(vl.visibleItems.value).toHaveLength(1000);
        expect(vl.offsetY.value).toBe(0);
    });

    it('calcula a altura total pela quantidade de itens', () => {
        const items = ref(makeItems(100));
        const vl = useVirtualList(items, { itemHeight: ref(44), enabled: ref(true) });

        expect(vl.totalHeight.value).toBe(4400);
    });

    it('retorna apenas a janela visivel mais o overscan', () => {
        const items = ref(makeItems(1000));
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true), overscan: 5 });

        // viewport de 500px = 10 itens visiveis, no topo da lista
        vl.setViewport(0, 500);

        // 10 visiveis + 5 de overscan abaixo (nao ha itens acima do indice 0)
        expect(vl.startIndex.value).toBe(0);
        expect(vl.visibleItems.value).toHaveLength(15);
        expect(vl.visibleItems.value[0].index).toBe(0);
    });

    it('desloca a janela conforme o scrollTop', () => {
        const items = ref(makeItems(1000));
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true), overscan: 5 });

        // rolou 100 itens para baixo
        vl.setViewport(5000, 500);

        expect(vl.startIndex.value).toBe(95); // 100 - overscan
        expect(vl.offsetY.value).toBe(4750); // 95 * 50
        expect(vl.visibleItems.value[0].index).toBe(95);
        expect(vl.visibleItems.value).toHaveLength(20); // 5 acima + 10 visiveis + 5 abaixo
    });

    it('nao ultrapassa o fim da lista', () => {
        const items = ref(makeItems(20));
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true), overscan: 5 });

        vl.setViewport(900, 500); // alem do fim

        const last = vl.visibleItems.value[vl.visibleItems.value.length - 1];
        expect(last.index).toBe(19);
    });

    it('lida com lista menor que o viewport', () => {
        const items = ref(makeItems(3));
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true) });

        vl.setViewport(0, 500);

        expect(vl.visibleItems.value).toHaveLength(3);
        expect(vl.startIndex.value).toBe(0);
        expect(vl.offsetY.value).toBe(0);
    });

    it('lida com lista vazia', () => {
        const items = ref<any[]>([]);
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true) });

        vl.setViewport(0, 500);

        expect(vl.visibleItems.value).toHaveLength(0);
        expect(vl.totalHeight.value).toBe(0);
    });

    it('reage a mudanca de enabled sem recriar o composable', () => {
        const items = ref(makeItems(1000));
        const enabled = ref(true);
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: computed(() => enabled.value) });

        vl.setViewport(0, 500);
        const virtualizedCount = vl.visibleItems.value.length;

        enabled.value = false;

        expect(virtualizedCount).toBeLessThan(1000);
        expect(vl.visibleItems.value).toHaveLength(1000);
    });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

Run: `npx vitest run tests/composables/useVirtualList.test.ts`
Expected: FAIL — "Failed to resolve import ... src/composables/useVirtualList".

- [ ] **Step 3: Implementar o composable**

```ts
// src/composables/useVirtualList.ts
import { ref, computed, ComputedRef, Ref } from 'vue';

type MaybeRef<T> = Ref<T> | ComputedRef<T>;

export type VirtualListItem<T> = {
    item: T;
    index: number;
};

export type UseVirtualListOptions = {
    /** Altura fixa de cada linha, em pixels */
    itemHeight: MaybeRef<number>;
    /** Quando false, a lista inteira é retornada sem virtualizar */
    enabled: MaybeRef<boolean>;
    /** Itens extras renderizados acima e abaixo da janela visível */
    overscan?: number;
};

/**
 * Calcula a janela de itens visíveis de uma lista longa.
 * O consumidor informa o estado do scroll via setViewport() e renderiza
 * apenas visibleItems, deslocados por offsetY dentro de um container de totalHeight.
 */
export function useVirtualList<T>(items: MaybeRef<T[]>, options: UseVirtualListOptions) {
    const overscan = options.overscan ?? 5;
    const scrollTop = ref(0);
    const viewportHeight = ref(0);

    function setViewport(nextScrollTop: number, nextViewportHeight: number) {
        scrollTop.value = Math.max(0, nextScrollTop);
        viewportHeight.value = Math.max(0, nextViewportHeight);
    }

    const totalHeight = computed(() => items.value.length * options.itemHeight.value);

    const startIndex = computed(() => {
        if (!options.enabled.value) return 0;

        const first = Math.floor(scrollTop.value / options.itemHeight.value);
        return Math.max(0, first - overscan);
    });

    const endIndex = computed(() => {
        if (!options.enabled.value) return items.value.length;

        const visibleCount = Math.ceil(viewportHeight.value / options.itemHeight.value);
        const last = Math.floor(scrollTop.value / options.itemHeight.value) + visibleCount + overscan;
        return Math.min(items.value.length, last);
    });

    const visibleItems = computed<VirtualListItem<T>[]>(() =>
        items.value
            .slice(startIndex.value, endIndex.value)
            .map((item, offset) => ({ item, index: startIndex.value + offset }))
    );

    const offsetY = computed(() => (options.enabled.value ? startIndex.value * options.itemHeight.value : 0));

    return { visibleItems, offsetY, totalHeight, startIndex, setViewport };
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/composables/useVirtualList.test.ts`
Expected: PASS (8 testes).

Se o teste "não ultrapassa o fim da lista" falhar, confira o `Math.min` em `endIndex`. Se "desloca a janela" falhar, confira que `startIndex` subtrai o overscan e `offsetY` multiplica por `itemHeight`.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useVirtualList.ts tests/composables/useVirtualList.test.ts
git commit -m "feat(MaxListBox): adiciona composable useVirtualList"
```

---

### Task 3: Componente base — renderização e seleção

**Files:**
- Create: `src/components/MaxListBox.vue`
- Test: `tests/components/MaxListBox.test.ts`

**Interfaces:**
- Consumes: `ListBoxOption` (Task 1).
- Produces: componente `MaxListBox` com props `modelValue`, `selectedOption`, `options`, `optionValue`, `optionLabel`, `optionSubLabel`, `optionDisabled`, `twoLines`, `emptyMessage`, `disabled`, `title`, `height`; emits `update:modelValue` e `change`; slots `option`, `header`, `footer`, `empty`. Classes CSS: raiz `.max-listbox`, lista `.max-listbox-list`, item `.max-listbox-item` (modificadores `.is-selected`, `.is-disabled`). Tasks 4–8 estendem este mesmo arquivo.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// tests/components/MaxListBox.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxListBox from '../../src/components/MaxListBox.vue';

const OPTIONS = [
    { value: 1, label: 'Alfa', sub_label: 'primeiro' },
    { value: 2, label: 'Beta', sub_label: 'segundo' },
    { value: 3, label: 'Gama', sub_label: 'terceiro', disabled: true }
];

function mountListBox(props: Record<string, any> = {}) {
    return mount(MaxListBox, {
        props: { modelValue: null, options: OPTIONS, ...props }
    });
}

describe('MaxListBox - renderizacao e selecao', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza um item por opcao', () => {
        const wrapper = mountListBox();
        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(3);
    });

    it('exibe label e sublabel', () => {
        const wrapper = mountListBox();
        const first = wrapper.findAll('.max-listbox-item')[0];
        expect(first.text()).toContain('Alfa');
        expect(first.text()).toContain('primeiro');
    });

    it('respeita optionLabel e optionValue customizados', () => {
        const wrapper = mountListBox({
            options: [{ id: 10, nome: 'Custom' }],
            optionValue: 'id',
            optionLabel: 'nome'
        });
        expect(wrapper.find('.max-listbox-item').text()).toContain('Custom');
    });

    it('emite update:modelValue e change ao clicar', async () => {
        const wrapper = mountListBox();
        await wrapper.findAll('.max-listbox-item')[1].trigger('click');

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2]);
        expect(wrapper.emitted('change')?.[0][0]).toEqual({ value: 2, option: OPTIONS[1] });
    });

    it('nao emite ao clicar em item desabilitado', async () => {
        const wrapper = mountListBox();
        await wrapper.findAll('.max-listbox-item')[2].trigger('click');

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('marca aria-selected no item correspondente ao modelValue', () => {
        const wrapper = mountListBox({ modelValue: 2 });
        const items = wrapper.findAll('.max-listbox-item');

        expect(items[1].attributes('aria-selected')).toBe('true');
        expect(items[0].attributes('aria-selected')).toBe('false');
    });

    it('marca aria-disabled no item desabilitado', () => {
        const wrapper = mountListBox();
        expect(wrapper.findAll('.max-listbox-item')[2].attributes('aria-disabled')).toBe('true');
    });

    it('usa selectedOption quando o valor nao esta na lista', () => {
        const wrapper = mountListBox({ modelValue: 99, selectedOption: { value: 99, label: 'Externo' } });
        expect(wrapper.text()).toContain('Externo');
    });

    it('exibe emptyMessage quando nao ha opcoes', () => {
        const wrapper = mountListBox({ options: [], emptyMessage: 'Nada aqui' });
        expect(wrapper.text()).toContain('Nada aqui');
    });

    it('nao emite quando o painel esta disabled', async () => {
        const wrapper = mountListBox({ disabled: true });
        await wrapper.findAll('.max-listbox-item')[0].trigger('click');

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('renderiza o slot option customizado', () => {
        const wrapper = mount(MaxListBox, {
            props: { modelValue: null, options: OPTIONS },
            slots: { option: '<template #option="{ option }"><b class="custom">{{ option.label }}</b></template>' }
        });
        expect(wrapper.findAll('.custom')).toHaveLength(3);
    });

    it('renderiza os slots header e footer', () => {
        const wrapper = mount(MaxListBox, {
            props: { modelValue: null, options: OPTIONS },
            slots: { header: '<div class="hdr">Topo</div>', footer: '<div class="ftr">Base</div>' }
        });
        expect(wrapper.find('.hdr').exists()).toBe(true);
        expect(wrapper.find('.ftr').exists()).toBe(true);
    });

    it('renderiza o titulo quando a prop title e informada', () => {
        const wrapper = mountListBox({ title: 'Registros' });
        expect(wrapper.text()).toContain('Registros');
    });

    it('aplica role listbox e option', () => {
        const wrapper = mountListBox();
        expect(wrapper.find('[role="listbox"]').exists()).toBe(true);
        expect(wrapper.findAll('[role="option"]')).toHaveLength(3);
    });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: FAIL — "Failed to resolve import ... MaxListBox.vue".

- [ ] **Step 3: Implementar o componente base**

Crie `src/components/MaxListBox.vue` com exatamente este conteúdo. O bloco `<style>` desta task é mínimo; a Task 8 substitui por completo.

```vue
<template>
    <div class="max-listbox" :class="{ 'is-disabled': props.disabled, 'two-lines': props.twoLines }" :style="rootStyle">
        <div v-if="$slots.header || props.title" class="max-listbox-header">
            <slot name="header">
                <span class="max-listbox-title">{{ props.title }}</span>
            </slot>
        </div>

        <ul ref="listElem" class="max-listbox-list" role="listbox" :aria-disabled="props.disabled">
            <li
                v-for="(option, index) in visibleOptions"
                :key="optionKey(option, index)"
                class="max-listbox-item"
                :class="{ 'is-selected': isSelected(option), 'is-disabled': isDisabled(option) }"
                role="option"
                :aria-selected="isSelected(option)"
                :aria-disabled="isDisabled(option)"
                @click="selectOption(option)"
            >
                <slot name="option" :option="option" :selected="isSelected(option)" :index="index">
                    <MaxIcon v-if="option.icon" :icon="option.icon" class="max-listbox-item-icon" />
                    <div class="max-listbox-item-labels">
                        <span class="max-listbox-item-label">{{ labelOf(option) }}</span>
                        <span v-if="subLabelOf(option)" class="max-listbox-item-sublabel">{{ subLabelOf(option) }}</span>
                    </div>
                    <MaxBadgeComponent v-if="option.badge !== undefined && option.badge !== null" :label="String(option.badge)" :color="option.badgeColor" class="max-listbox-item-badge" />
                </slot>
            </li>

            <li v-if="visibleOptions.length === 0" class="max-listbox-empty">
                <slot name="empty">{{ props.emptyMessage }}</slot>
            </li>
        </ul>

        <div v-if="$slots.footer" class="max-listbox-footer">
            <slot name="footer" />
        </div>
    </div>
</template>

/**
 * Lista de seleção sempre visível, para painéis de navegação mestre-detalhe.
 * Suporta itens ricos (ícone, label, sublabel, badge), filtro, virtualização
 * automática e carregamento paginado por scroll infinito.
 */
<script setup lang="ts">
    import { ref, computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxBadgeComponent from './MaxBadgeComponent.vue';

    const props = withDefaults(
        defineProps<{
            /** Valor selecionado; null quando nada está selecionado */
            modelValue?: any;
            /** Objeto já resolvido pela app, exibido enquanto o item real não foi carregado */
            selectedOption?: any;
            /** Lista de opções local */
            options?: any[];
            /** Campo que contém o valor do item */
            optionValue?: string;
            /** Campo que contém o rótulo principal */
            optionLabel?: string;
            /** Campo que contém o rótulo secundário */
            optionSubLabel?: string;
            /** Campo que marca o item como não selecionável */
            optionDisabled?: string;
            /** Exibe o sublabel abaixo do label em vez de à direita */
            twoLines?: boolean;
            /** Mensagem exibida quando não há itens */
            emptyMessage?: string;
            /** Desabilita o painel inteiro */
            disabled?: boolean;
            /** Título exibido no cabeçalho */
            title?: string;
            /** Altura do painel (ex.: '400px'); padrão 100% do container */
            height?: string;
        }>(),
        {
            modelValue: null,
            selectedOption: undefined,
            options: undefined,
            optionValue: 'value',
            optionLabel: 'label',
            optionSubLabel: 'sub_label',
            optionDisabled: 'disabled',
            twoLines: false,
            emptyMessage: 'Nenhum registro encontrado',
            disabled: false,
            title: undefined,
            height: undefined
        }
    );

    const emit = defineEmits<{
        (e: 'update:modelValue', value: any): void;
        (e: 'change', payload: { value: any; option: any }): void;
    }>();

    const listElem = ref<HTMLElement | null>(null);

    const rootStyle = computed(() => (props.height ? { height: props.height } : undefined));

    /** Lista efetivamente renderizada. Tasks seguintes reescrevem este computed. */
    const visibleOptions = computed<any[]>(() => props.options ?? []);

    function valueOf(option: any): any {
        return option?.[props.optionValue];
    }

    function labelOf(option: any): string {
        return option?.[props.optionLabel] ?? '';
    }

    function subLabelOf(option: any): string {
        return option?.[props.optionSubLabel] ?? '';
    }

    function isDisabled(option: any): boolean {
        return option?.[props.optionDisabled] === true;
    }

    function isSelected(option: any): boolean {
        return props.modelValue !== null && props.modelValue !== undefined && valueOf(option) === props.modelValue;
    }

    function optionKey(option: any, index: number): string | number {
        const value = valueOf(option);
        return value !== undefined && value !== null ? value : index;
    }

    function selectOption(option: any) {
        if (props.disabled || isDisabled(option)) return;

        const value = valueOf(option);
        emit('update:modelValue', value);
        emit('change', { value, option });
    }

    defineExpose({ listElem });
</script>

<style lang="scss">
.max-listbox {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.max-listbox-list {
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
}

.max-listbox-item {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}
</style>
```

**Nota sobre `selectedOption`:** o teste "usa selectedOption quando o valor não está na lista" espera que o texto do objeto externo apareça. No componente base, `visibleOptions` retorna apenas `props.options`, então o teste **falha**. Corrija fazendo `visibleOptions` incluir o `selectedOption` no topo quando ele existe e seu valor não está presente na lista:

```ts
    const visibleOptions = computed<any[]>(() => {
        const list = props.options ?? [];

        if (props.selectedOption === undefined || props.selectedOption === null) return list;

        const alreadyInList = list.some((opt) => valueOf(opt) === valueOf(props.selectedOption));
        return alreadyInList ? list : [props.selectedOption, ...list];
    });
```

Use esta versão desde já — a nota acima explica por que ela não é o `computed` trivial.

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: PASS (14 testes).

- [ ] **Step 5: Verificar tipagem e lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/MaxListBox.vue tests/components/MaxListBox.test.ts
git commit -m "feat(MaxListBox): renderizacao de itens e selecao unica"
```

---

### Task 4: Filtro local

**Files:**
- Modify: `src/components/MaxListBox.vue`
- Test: `tests/components/MaxListBox.test.ts` (adicionar novo bloco `describe`)

**Interfaces:**
- Consumes: componente da Task 3 (`visibleOptions`, `labelOf`, `subLabelOf`).
- Produces: props `filter`, `filterPlaceholder`, `filterFields`; emit `filter`; ref interna `searchTerm` e computed `filteredOptions`, usados pelas Tasks 5 e 6.

- [ ] **Step 1: Escrever os testes que falham**

Adicione ao final de `tests/components/MaxListBox.test.ts`:

```ts
describe('MaxListBox - filtro local', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('nao renderiza o campo de busca por padrao', () => {
        const wrapper = mountListBox();
        expect(wrapper.find('input').exists()).toBe(false);
    });

    it('renderiza o campo de busca quando filter e true', () => {
        const wrapper = mountListBox({ filter: true });
        expect(wrapper.find('input').exists()).toBe(true);
    });

    it('filtra os itens pelo label', async () => {
        const wrapper = mountListBox({ filter: true });
        await wrapper.find('input').setValue('alf');
        await wrapper.vm.$nextTick();

        const items = wrapper.findAll('.max-listbox-item');
        expect(items).toHaveLength(1);
        expect(items[0].text()).toContain('Alfa');
    });

    it('filtra ignorando acentos e caixa', async () => {
        const wrapper = mountListBox({
            filter: true,
            options: [{ value: 1, label: 'Órgão Público' }, { value: 2, label: 'Outro' }]
        });
        await wrapper.find('input').setValue('ORGAO');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(1);
    });

    it('filtra tambem pelo sublabel', async () => {
        const wrapper = mountListBox({ filter: true });
        await wrapper.find('input').setValue('segundo');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')[0].text()).toContain('Beta');
    });

    it('respeita filterFields customizado', async () => {
        const wrapper = mountListBox({
            filter: true,
            filterFields: ['codigo'],
            options: [{ value: 1, label: 'Alfa', codigo: 'X9' }, { value: 2, label: 'Beta', codigo: 'Y7' }]
        });
        await wrapper.find('input').setValue('y7');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(1);
        expect(wrapper.findAll('.max-listbox-item')[0].text()).toContain('Beta');
    });

    it('exibe emptyMessage quando o filtro nao casa com nada', async () => {
        const wrapper = mountListBox({ filter: true, emptyMessage: 'Nada aqui' });
        await wrapper.find('input').setValue('zzzz');
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(0);
        expect(wrapper.text()).toContain('Nada aqui');
    });

    it('emite filter apos o debounce de 300ms', async () => {
        const wrapper = mountListBox({ filter: true });
        await wrapper.find('input').setValue('alf');

        await new Promise((resolve) => setTimeout(resolve, 350));

        expect(wrapper.emitted('filter')?.[0]).toEqual(['alf']);
    });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: FAIL nos 7 novos testes de filtro (o primeiro, "não renderiza o campo de busca por padrão", já passa).

- [ ] **Step 3: Implementar o filtro**

No `<template>`, insira o campo de busca entre o header e o `<ul>`:

```vue
        <div v-if="props.filter" class="max-listbox-filter">
            <input
                v-model="searchInput"
                type="text"
                class="max-listbox-filter-input"
                :placeholder="props.filterPlaceholder"
                :disabled="props.disabled"
                @input="onFilterInput"
            >
        </div>
```

**Nota:** o campo é um `<input>` nativo, não o `MaxInputSearch`. O `MaxInputSearch` depende do `InputBase` + PrimeVue `InputText`, o que reintroduziria a dependência que este componente evita (Global Constraints). O visual é resolvido no SCSS da Task 8.

No `<script setup>`, adicione às props:

```ts
            /** Exibe o campo de busca */
            filter?: boolean;
            /** Placeholder do campo de busca */
            filterPlaceholder?: string;
            /** Campos usados no filtro local; padrão: optionLabel + optionSubLabel */
            filterFields?: string[];
```

e aos defaults:

```ts
            filter: false,
            filterPlaceholder: 'Buscar...',
            filterFields: undefined,
```

Adicione o emit:

```ts
        (e: 'filter', term: string): void;
```

Adicione o estado e a lógica de filtro (antes de `visibleOptions`):

```ts
    const searchInput = ref('');
    const searchTerm = ref('');
    let filterTimer: ReturnType<typeof setTimeout> | undefined;

    /** Remove acentos e normaliza a caixa para comparação de texto. */
    function normalize(value: any): string {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase();
    }

    function onFilterInput() {
        clearTimeout(filterTimer);
        filterTimer = setTimeout(() => {
            searchTerm.value = searchInput.value;
            emit('filter', searchInput.value);
        }, 300);
    }

    const filterFieldList = computed(() => props.filterFields ?? [props.optionLabel, props.optionSubLabel]);

    const filteredOptions = computed<any[]>(() => {
        const list = props.options ?? [];
        const term = normalize(searchInput.value);

        if (!props.filter || term === '') return list;

        return list.filter((option) => filterFieldList.value.some((field) => normalize(option?.[field]).includes(term)));
    });
```

E substitua `visibleOptions` para partir de `filteredOptions`:

```ts
    const visibleOptions = computed<any[]>(() => {
        const list = filteredOptions.value;

        if (props.selectedOption === undefined || props.selectedOption === null) return list;

        const alreadyInList = list.some((opt) => valueOf(opt) === valueOf(props.selectedOption));
        return alreadyInList ? list : [props.selectedOption, ...list];
    });
```

**Nota sobre o debounce:** a filtragem visual usa `searchInput` (imediata, para o usuário ver a lista reagir enquanto digita), enquanto o **emit** `filter` e a busca server-side usam `searchTerm` (debounced em 300ms). Os testes acima verificam exatamente esse par de comportamentos.

Limpe o timer ao desmontar — adicione o import `onBeforeUnmount` de `vue` e:

```ts
    onBeforeUnmount(() => clearTimeout(filterTimer));
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: PASS (22 testes).

- [ ] **Step 5: Verificar tipagem e lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/MaxListBox.vue tests/components/MaxListBox.test.ts
git commit -m "feat(MaxListBox): filtro local com debounce"
```

---

### Task 5: Virtual scroll

**Files:**
- Modify: `src/components/MaxListBox.vue`
- Test: `tests/components/MaxListBox.test.ts` (novo bloco `describe`)

**Interfaces:**
- Consumes: `useVirtualList` (Task 2), `visibleOptions` (Task 4).
- Produces: props `virtualScroll`, `virtualScrollThreshold`, `itemHeight`; handler `onListScroll` no `<ul>` (a Task 6 estende o **mesmo** handler para o scroll infinito). Elemento interno `.max-listbox-spacer` com a altura total.

- [ ] **Step 1: Escrever os testes que falham**

Adicione ao final do arquivo de teste:

```ts
describe('MaxListBox - virtual scroll', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    function manyOptions(n: number) {
        return Array.from({ length: n }, (_, i) => ({ value: i, label: `Item ${i}` }));
    }

    it('renderiza todos os itens abaixo do threshold', () => {
        const wrapper = mountListBox({ options: manyOptions(50) });
        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(50);
    });

    it('nao virtualiza automaticamente em 500 itens', () => {
        const wrapper = mountListBox({ options: manyOptions(500) });
        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(500);
    });

    it('virtualiza automaticamente acima de 500 itens', () => {
        const wrapper = mountListBox({ options: manyOptions(501) });
        expect(wrapper.findAll('.max-listbox-item').length).toBeLessThan(501);
    });

    it('respeita virtualScrollThreshold customizado', () => {
        const wrapper = mountListBox({ options: manyOptions(30), virtualScrollThreshold: 10 });
        expect(wrapper.findAll('.max-listbox-item').length).toBeLessThan(30);
    });

    it('virtualiza quando virtualScroll e true, mesmo em lista pequena', () => {
        const wrapper = mountListBox({ options: manyOptions(100), virtualScroll: true, itemHeight: 44 });
        expect(wrapper.findAll('.max-listbox-item').length).toBeLessThan(100);
    });

    it('nao virtualiza quando virtualScroll e false, mesmo em lista grande', () => {
        const wrapper = mountListBox({ options: manyOptions(600), virtualScroll: false });
        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(600);
    });

    it('renderiza o spacer com a altura total quando virtualizado', () => {
        const wrapper = mountListBox({ options: manyOptions(1000), itemHeight: 44 });
        const spacer = wrapper.find('.max-listbox-spacer');

        expect(spacer.exists()).toBe(true);
        expect(spacer.attributes('style')).toContain('44000px');
    });

    it('mantem a selecao funcionando com virtualizacao ativa', async () => {
        const wrapper = mountListBox({ options: manyOptions(1000) });
        await wrapper.findAll('.max-listbox-item')[0].trigger('click');

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0]);
    });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: FAIL nos testes que exigem virtualização (os que esperam `toBeLessThan` e o spacer).

**Nota sobre happy-dom:** o ambiente de teste reporta `clientHeight = 0`. Para que a virtualização produza uma janela não vazia mesmo sem layout real, o `viewportHeight` inicial deve ter um fallback — ver a implementação abaixo (`DEFAULT_VIEWPORT_HEIGHT`). Sem esse fallback, os testes renderizariam 0 itens e falhariam.

- [ ] **Step 3: Implementar a virtualização**

Adicione às props:

```ts
            /** Força a virtualização; undefined = automático acima do threshold */
            virtualScroll?: boolean;
            /** Quantidade de itens a partir da qual a virtualização liga sozinha */
            virtualScrollThreshold?: number;
            /** Altura fixa de cada linha, em pixels (exigida pela virtualização) */
            itemHeight?: number;
```

Defaults:

```ts
            virtualScroll: undefined,
            virtualScrollThreshold: 500,
            itemHeight: 44,
```

No script, importe o composable e monte a janela:

```ts
    import { useVirtualList } from '../composables/useVirtualList';

    /** Altura assumida do viewport antes do primeiro scroll (e em ambiente sem layout). */
    const DEFAULT_VIEWPORT_HEIGHT = 400;

    const isVirtual = computed(() => {
        if (props.virtualScroll !== undefined) return props.virtualScroll;
        return visibleOptions.value.length > props.virtualScrollThreshold;
    });

    const virtual = useVirtualList(visibleOptions, {
        itemHeight: computed(() => props.itemHeight),
        enabled: isVirtual
    });

    virtual.setViewport(0, DEFAULT_VIEWPORT_HEIGHT);

    function onListScroll(event: Event) {
        const target = event.target as HTMLElement;
        virtual.setViewport(target.scrollTop, target.clientHeight || DEFAULT_VIEWPORT_HEIGHT);
    }
```

No `<template>`, troque o `v-for` para iterar a janela virtual e envolva os itens no spacer. O `<ul>` passa a ter o handler de scroll:

```vue
        <ul ref="listElem" class="max-listbox-list" role="listbox" :aria-disabled="props.disabled" @scroll="onListScroll">
            <li v-if="isVirtual" class="max-listbox-spacer" :style="{ height: `${virtual.totalHeight.value}px` }" aria-hidden="true" />

            <div class="max-listbox-window" :style="isVirtual ? { transform: `translateY(${virtual.offsetY.value}px)` } : undefined">
                <li
                    v-for="entry in virtual.visibleItems.value"
                    :key="optionKey(entry.item, entry.index)"
                    class="max-listbox-item"
                    :class="{ 'is-selected': isSelected(entry.item), 'is-disabled': isDisabled(entry.item) }"
                    role="option"
                    :aria-selected="isSelected(entry.item)"
                    :aria-disabled="isDisabled(entry.item)"
                    :style="isVirtual ? { height: `${props.itemHeight}px` } : undefined"
                    @click="selectOption(entry.item)"
                >
                    <slot name="option" :option="entry.item" :selected="isSelected(entry.item)" :index="entry.index">
                        <MaxIcon v-if="entry.item.icon" :icon="entry.item.icon" class="max-listbox-item-icon" />
                        <div class="max-listbox-item-labels">
                            <span class="max-listbox-item-label">{{ labelOf(entry.item) }}</span>
                            <span v-if="subLabelOf(entry.item)" class="max-listbox-item-sublabel">{{ subLabelOf(entry.item) }}</span>
                        </div>
                        <MaxBadgeComponent v-if="entry.item.badge !== undefined && entry.item.badge !== null" :label="String(entry.item.badge)" :color="entry.item.badgeColor" class="max-listbox-item-badge" />
                    </slot>
                </li>
            </div>

            <li v-if="visibleOptions.length === 0" class="max-listbox-empty">
                <slot name="empty">{{ props.emptyMessage }}</slot>
            </li>
        </ul>
```

**Nota sobre a estrutura:** quando virtualizado, o spacer ocupa a altura total e a janela é posicionada por `translateY` sobre ele — por isso a Task 8 dá `position: absolute; top: 0; width: 100%` a `.max-listbox-window` e `position: relative` a `.max-listbox-list`. Sem esse CSS o layout empilha o spacer acima dos itens; os testes desta task não detectam isso, então **confira visualmente no playground (Task 10)**.

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: PASS (30 testes).

Se "renderiza todos os itens abaixo do threshold" falhar com menos itens que o esperado, `isVirtual` está ligando cedo demais — confira que a comparação é `>` e não `>=`.

- [ ] **Step 5: Verificar tipagem e lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/MaxListBox.vue tests/components/MaxListBox.test.ts
git commit -m "feat(MaxListBox): virtual scroll automatico acima do threshold"
```

---

### Task 6: Modo API — carregamento inicial e filtro server-side

**Files:**
- Modify: `src/components/MaxListBox.vue`
- Test: `tests/components/MaxListBox.test.ts` (novo bloco `describe`)

**Interfaces:**
- Consumes: `LoadOptionsContext`, `LoadOptionsResult` (Task 1); `searchTerm` (Task 4).
- Produces: props `loadOptions`, `pageSize`, `loading`; emit `load-error`; estado interno `apiItems`, `currentPage`, `hasMore`, `isLoadingPage`, `loadError` e função `fetchPage(page: number)` — a Task 7 usa `fetchPage`, `hasMore` e `isLoadingPage`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
describe('MaxListBox - modo API', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    function page(n: number, size = 3) {
        return Array.from({ length: size }, (_, i) => ({ value: n * 100 + i, label: `P${n}I${i}` }));
    }

    async function flush() {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    it('chama loadOptions na montagem com page 1', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: false });
        mountListBox({ options: undefined, loadOptions, pageSize: 25 });
        await flush();

        expect(loadOptions).toHaveBeenCalledWith({ page: 1, search: '', pageSize: 25 });
    });

    it('renderiza os itens retornados pela API', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: false });
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(3);
        expect(wrapper.text()).toContain('P1I0');
    });

    it('ignora options quando loadOptions esta definido', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: false });
        const wrapper = mountListBox({ options: OPTIONS, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).not.toContain('Alfa');
        expect(wrapper.text()).toContain('P1I0');
    });

    it('refaz a busca do zero ao filtrar, enviando o termo', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: true });
        const wrapper = mountListBox({ options: undefined, loadOptions, filter: true });
        await flush();

        await wrapper.find('input').setValue('teste');
        await new Promise((resolve) => setTimeout(resolve, 350));

        expect(loadOptions).toHaveBeenLastCalledWith({ page: 1, search: 'teste', pageSize: 50 });
    });

    it('descarta resposta fora de ordem', async () => {
        let resolveFirst: (v: any) => void = () => {};
        const loadOptions = vi.fn()
            .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
            .mockResolvedValueOnce({ items: [{ value: 9, label: 'Recente' }], hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions, filter: true });

        await wrapper.find('input').setValue('novo');
        await new Promise((resolve) => setTimeout(resolve, 350));
        await flush();

        // a primeira requisicao (obsoleta) responde depois da segunda
        resolveFirst({ items: [{ value: 1, label: 'Obsoleto' }], hasMore: false });
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('Recente');
        expect(wrapper.text()).not.toContain('Obsoleto');
    });

    it('emite load-error quando loadOptions rejeita', async () => {
        const loadOptions = vi.fn().mockRejectedValue(new Error('falhou'));
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();

        expect(wrapper.emitted('load-error')).toBeTruthy();
    });

    it('exibe o botao de retry apos erro', async () => {
        const loadOptions = vi.fn().mockRejectedValue(new Error('falhou'));
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-listbox-retry').exists()).toBe(true);
    });

    it('retry refaz a mesma pagina', async () => {
        const loadOptions = vi.fn().mockRejectedValue(new Error('falhou'));
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        loadOptions.mockResolvedValueOnce({ items: page(1), hasMore: false });
        await wrapper.find('.max-listbox-retry').trigger('click');
        await flush();

        expect(loadOptions).toHaveBeenLastCalledWith({ page: 1, search: '', pageSize: 50 });
    });

    it('deriva hasMore a partir de total', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), total: 10 });
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        // 3 carregados de 10 -> ainda ha mais
        expect(wrapper.find('.max-listbox-loader').exists()).toBe(true);
    });

    it('exibe o loader durante o carregamento inicial', async () => {
        const loadOptions = vi.fn().mockImplementation(() => new Promise(() => {}));
        const wrapper = mountListBox({ options: undefined, loadOptions });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.max-listbox-loader').exists()).toBe(true);
    });
});
```

Adicione `vi` ao import do vitest no topo do arquivo:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: FAIL nos 10 novos testes.

- [ ] **Step 3: Implementar o modo API**

Props adicionais:

```ts
            /** Carrega páginas do servidor; quando definido, `options` é ignorado */
            loadOptions?: (ctx: LoadOptionsContext) => Promise<LoadOptionsResult>;
            /** Itens por página enviados ao loadOptions */
            pageSize?: number;
            /** Loading controlado externamente pela app */
            loading?: boolean;
```

Defaults:

```ts
            loadOptions: undefined,
            pageSize: 50,
            loading: false,
```

Import dos tipos e do `watch`/`onMounted`:

```ts
    import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
    import { LoadOptionsContext, LoadOptionsResult } from '../types';
```

Emit adicional:

```ts
        (e: 'load-error', error: unknown): void;
```

Estado e busca:

```ts
    const isApiMode = computed(() => props.loadOptions !== undefined);

    const apiItems = ref<any[]>([]);
    const currentPage = ref(0);
    const hasMore = ref(true);
    const isLoadingPage = ref(false);
    const loadError = ref<unknown>(null);
    /** Sequência de requisição: respostas de buscas antigas são descartadas. */
    let requestId = 0;

    const isLoading = computed(() => props.loading || isLoadingPage.value);
    const isInitialLoading = computed(() => isLoadingPage.value && apiItems.value.length === 0);

    async function fetchPage(pageToLoad: number) {
        if (!props.loadOptions || isLoadingPage.value) return;

        const thisRequest = ++requestId;
        isLoadingPage.value = true;
        loadError.value = null;

        try {
            const result = await props.loadOptions({
                page: pageToLoad,
                search: searchTerm.value,
                pageSize: props.pageSize
            });

            // Uma busca mais recente já foi disparada: descarta esta resposta.
            if (thisRequest !== requestId) return;

            const items = result?.items ?? [];
            apiItems.value = pageToLoad === 1 ? items : [...apiItems.value, ...items];
            currentPage.value = pageToLoad;

            if (result?.hasMore !== undefined) hasMore.value = result.hasMore;
            else if (result?.total !== undefined) hasMore.value = apiItems.value.length < result.total;
            else hasMore.value = items.length > 0;
        } catch (error) {
            if (thisRequest !== requestId) return;

            loadError.value = error;
            hasMore.value = false;
            emit('load-error', error);
        } finally {
            if (thisRequest === requestId) isLoadingPage.value = false;
        }
    }

    /** Recomeça a busca do zero — usado na montagem e a cada mudança de filtro. */
    function resetAndFetch() {
        apiItems.value = [];
        currentPage.value = 0;
        hasMore.value = true;
        loadError.value = null;
        isLoadingPage.value = false;
        fetchPage(1);
    }

    function retry() {
        loadError.value = null;
        hasMore.value = true;
        fetchPage(Math.max(1, currentPage.value + 1 - (apiItems.value.length === 0 ? 1 : 0)));
    }

    onMounted(() => {
        if (isApiMode.value) resetAndFetch();
    });

    watch(searchTerm, () => {
        if (isApiMode.value) resetAndFetch();
    });
```

**Nota sobre `retry`:** a expressão acima é obscura. Use esta versão, que simplesmente repete a página que falhou:

```ts
    /** Página que estava sendo buscada quando o erro ocorreu. */
    const failedPage = ref(1);

    function retry() {
        loadError.value = null;
        hasMore.value = true;
        fetchPage(failedPage.value);
    }
```

e dentro de `fetchPage`, no início do `try`, registre a página em voo:

```ts
        failedPage.value = pageToLoad;
```

Agora a lista efetiva precisa considerar o modo API. Substitua `filteredOptions`:

```ts
    const filteredOptions = computed<any[]>(() => {
        // No modo API o filtro é server-side: a lista já vem filtrada.
        if (isApiMode.value) return apiItems.value;

        const list = props.options ?? [];
        const term = normalize(searchInput.value);

        if (!props.filter || term === '') return list;

        return list.filter((option) => filterFieldList.value.some((field) => normalize(option?.[field]).includes(term)));
    });
```

No `<template>`, antes do `<li>` de empty, adicione o rodapé de loader e o de erro:

```vue
            <li v-if="isLoading || (isApiMode && hasMore && visibleOptions.length > 0)" class="max-listbox-loader">
                <slot name="loader">Carregando...</slot>
            </li>

            <li v-if="loadError" class="max-listbox-error">
                <span>Erro ao carregar</span>
                <button type="button" class="max-listbox-retry" @click="retry">Tentar novamente</button>
            </li>
```

E ajuste a condição do empty para não aparecer durante o carregamento inicial nem em caso de erro:

```vue
            <li v-if="visibleOptions.length === 0 && !isInitialLoading && !loadError" class="max-listbox-empty">
                <slot name="empty">{{ props.emptyMessage }}</slot>
            </li>
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: PASS (40 testes).

Se "descarta resposta fora de ordem" falhar, confira que `fetchPage` compara `thisRequest !== requestId` **depois** do `await` e que `resetAndFetch` zera `isLoadingPage` antes de chamar `fetchPage` (senão o guard `isLoadingPage.value` bloqueia a segunda busca).

- [ ] **Step 5: Verificar tipagem e lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/MaxListBox.vue tests/components/MaxListBox.test.ts
git commit -m "feat(MaxListBox): modo API com filtro server-side e retry"
```

---

### Task 7: Scroll infinito

**Files:**
- Modify: `src/components/MaxListBox.vue`
- Test: `tests/components/MaxListBox.test.ts` (novo bloco `describe`)

**Interfaces:**
- Consumes: `fetchPage`, `currentPage`, `hasMore`, `isLoadingPage` (Task 6); `onListScroll` (Task 5).
- Produces: extensão do `onListScroll` que dispara a próxima página. Nenhuma nova prop pública.

- [ ] **Step 1: Escrever os testes que falham**

```ts
describe('MaxListBox - scroll infinito', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    async function flush() {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    function page(n: number, size = 3) {
        return Array.from({ length: size }, (_, i) => ({ value: n * 100 + i, label: `P${n}I${i}` }));
    }

    /** Simula o usuário rolando até o fim da lista. */
    async function scrollToBottom(wrapper: any) {
        const list = wrapper.find('.max-listbox-list');
        Object.defineProperty(list.element, 'scrollHeight', { value: 1000, configurable: true });
        Object.defineProperty(list.element, 'clientHeight', { value: 400, configurable: true });
        Object.defineProperty(list.element, 'scrollTop', { value: 600, configurable: true, writable: true });
        await list.trigger('scroll');
    }

    it('carrega a proxima pagina ao rolar ate o fim', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockResolvedValueOnce({ items: page(2), hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();

        expect(loadOptions).toHaveBeenLastCalledWith({ page: 2, search: '', pageSize: 50 });
    });

    it('acumula os itens das paginas carregadas', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockResolvedValueOnce({ items: page(2), hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(6);
    });

    it('para de carregar quando hasMore e false', async () => {
        const loadOptions = vi.fn().mockResolvedValue({ items: page(1), hasMore: false });

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();

        expect(loadOptions).toHaveBeenCalledTimes(1);
    });

    it('nao dispara requisicao duplicada com uma ja em voo', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockImplementationOnce(() => new Promise(() => {}));

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await scrollToBottom(wrapper);
        await scrollToBottom(wrapper);
        await flush();

        expect(loadOptions).toHaveBeenCalledTimes(2);
    });

    it('nao dispara scroll infinito no modo local', async () => {
        const wrapper = mountListBox({ options: OPTIONS });
        await scrollToBottom(wrapper);
        await flush();

        expect(wrapper.findAll('.max-listbox-item')).toHaveLength(3);
    });

    it('para de carregar apos um erro', async () => {
        const loadOptions = vi.fn()
            .mockResolvedValueOnce({ items: page(1), hasMore: true })
            .mockRejectedValueOnce(new Error('falhou'));

        const wrapper = mountListBox({ options: undefined, loadOptions });
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();
        await wrapper.vm.$nextTick();

        await scrollToBottom(wrapper);
        await flush();

        expect(loadOptions).toHaveBeenCalledTimes(2);
    });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: FAIL nos testes de scroll infinito.

- [ ] **Step 3: Implementar o scroll infinito**

Estenda `onListScroll` (não crie um segundo handler):

```ts
    /** Distância do fim, em múltiplos da altura do viewport, que dispara a próxima página. */
    const LOAD_MORE_THRESHOLD_VIEWPORTS = 2;

    function shouldLoadMore(target: HTMLElement): boolean {
        if (!isApiMode.value) return false;
        if (!hasMore.value || isLoadingPage.value || loadError.value) return false;

        const viewport = target.clientHeight || DEFAULT_VIEWPORT_HEIGHT;
        const distanceToBottom = target.scrollHeight - target.scrollTop - viewport;

        return distanceToBottom <= viewport * LOAD_MORE_THRESHOLD_VIEWPORTS;
    }

    function onListScroll(event: Event) {
        const target = event.target as HTMLElement;
        virtual.setViewport(target.scrollTop, target.clientHeight || DEFAULT_VIEWPORT_HEIGHT);

        if (shouldLoadMore(target)) fetchPage(currentPage.value + 1);
    }
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: PASS (46 testes).

Se "não dispara requisição duplicada" falhar contando 3+ chamadas, o guard `isLoadingPage.value` em `fetchPage` não está sendo respeitado — confira que ele é setado **antes** do `await`.

- [ ] **Step 5: Verificar tipagem e lint**

Run: `npm run type-check && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/MaxListBox.vue tests/components/MaxListBox.test.ts
git commit -m "feat(MaxListBox): scroll infinito com paginacao"
```

---

### Task 8: Teclado, acessibilidade e estilo final

**Files:**
- Modify: `src/components/MaxListBox.vue`
- Test: `tests/components/MaxListBox.test.ts` (novo bloco `describe`)

**Interfaces:**
- Consumes: tudo das Tasks 3–7.
- Produces: `focusedIndex` e handler `onKeydown` no `<ul>`; bloco `<style>` final. Última task que toca o componente.

- [ ] **Step 1: Escrever os testes que falham**

```ts
describe('MaxListBox - teclado', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('a lista e focavel', () => {
        const wrapper = mountListBox();
        expect(wrapper.find('.max-listbox-list').attributes('tabindex')).toBe('0');
    });

    it('seta para baixo move o foco para o primeiro item', async () => {
        const wrapper = mountListBox();
        await wrapper.find('.max-listbox-list').trigger('keydown', { key: 'ArrowDown' });

        expect(wrapper.findAll('.max-listbox-item')[0].classes()).toContain('is-focused');
    });

    it('seta para baixo duas vezes move para o segundo item', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });
        await list.trigger('keydown', { key: 'ArrowDown' });

        expect(wrapper.findAll('.max-listbox-item')[1].classes()).toContain('is-focused');
    });

    it('seta para cima nao passa do primeiro item', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });
        await list.trigger('keydown', { key: 'ArrowUp' });
        await list.trigger('keydown', { key: 'ArrowUp' });

        expect(wrapper.findAll('.max-listbox-item')[0].classes()).toContain('is-focused');
    });

    it('Enter seleciona o item em foco', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });
        await list.trigger('keydown', { key: 'Enter' });

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    });

    it('Espaco seleciona o item em foco', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });
        await list.trigger('keydown', { key: ' ' });

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    });

    it('Enter nao seleciona item desabilitado', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        // terceiro item (indice 2) esta disabled
        await list.trigger('keydown', { key: 'End' });
        await list.trigger('keydown', { key: 'Enter' });

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('Home vai para o primeiro item e End para o ultimo', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');

        await list.trigger('keydown', { key: 'End' });
        expect(wrapper.findAll('.max-listbox-item')[2].classes()).toContain('is-focused');

        await list.trigger('keydown', { key: 'Home' });
        expect(wrapper.findAll('.max-listbox-item')[0].classes()).toContain('is-focused');
    });

    it('nao reage ao teclado quando disabled', async () => {
        const wrapper = mountListBox({ disabled: true });
        await wrapper.find('.max-listbox-list').trigger('keydown', { key: 'ArrowDown' });

        expect(wrapper.find('.is-focused').exists()).toBe(false);
    });

    it('aplica aria-activedescendant no item em foco', async () => {
        const wrapper = mountListBox();
        const list = wrapper.find('.max-listbox-list');
        await list.trigger('keydown', { key: 'ArrowDown' });

        const active = list.attributes('aria-activedescendant');
        expect(active).toBeTruthy();
        expect(wrapper.findAll('.max-listbox-item')[0].attributes('id')).toBe(active);
    });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: FAIL nos 10 novos testes de teclado.

- [ ] **Step 3: Implementar o teclado**

No script:

```ts
    /** Identificador único desta instância, usado no aria-activedescendant. */
    const instanceId = `max-listbox-${Math.random().toString(36).slice(2, 9)}`;
    const focusedIndex = ref(-1);

    const focusedItemId = computed(() => (focusedIndex.value >= 0 ? `${instanceId}-opt-${focusedIndex.value}` : undefined));

    function itemId(index: number): string {
        return `${instanceId}-opt-${index}`;
    }

    function moveFocus(delta: number) {
        const total = visibleOptions.value.length;
        if (total === 0) return;

        const next = focusedIndex.value < 0 ? 0 : focusedIndex.value + delta;
        focusedIndex.value = Math.min(total - 1, Math.max(0, next));
        scrollFocusedIntoView();
    }

    /** Mantém o item em foco visível ao navegar pelo teclado. */
    function scrollFocusedIntoView() {
        const list = listElem.value;
        if (!list || focusedIndex.value < 0) return;

        const top = focusedIndex.value * props.itemHeight;
        const bottom = top + props.itemHeight;
        const viewport = list.clientHeight || DEFAULT_VIEWPORT_HEIGHT;

        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + viewport) list.scrollTop = bottom - viewport;
    }

    function onKeydown(event: KeyboardEvent) {
        if (props.disabled) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                moveFocus(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                moveFocus(-1);
                break;
            case 'Home':
                event.preventDefault();
                focusedIndex.value = 0;
                scrollFocusedIntoView();
                break;
            case 'End':
                event.preventDefault();
                focusedIndex.value = visibleOptions.value.length - 1;
                scrollFocusedIntoView();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (focusedIndex.value >= 0) selectOption(visibleOptions.value[focusedIndex.value]);
                break;
            default:
                break;
        }
    }
```

No `<template>`, o `<ul>` ganha foco, keydown e activedescendant:

```vue
        <ul
            ref="listElem"
            class="max-listbox-list"
            role="listbox"
            :tabindex="props.disabled ? -1 : 0"
            :aria-disabled="props.disabled"
            :aria-activedescendant="focusedItemId"
            @scroll="onListScroll"
            @keydown="onKeydown"
        >
```

E cada `<li>` de item ganha `id` e a classe de foco — adicione ao `<li>` existente:

```vue
                :id="itemId(entry.index)"
```

e no `:class`:

```vue
                :class="{ 'is-selected': isSelected(entry.item), 'is-disabled': isDisabled(entry.item), 'is-focused': focusedIndex === entry.index }"
```

**Nota sobre `scrollFocusedIntoView` com virtualização:** como as linhas têm altura fixa (`itemHeight`), a posição do item é calculada aritmeticamente em vez de lida do DOM — isso funciona tanto na lista virtualizada quanto na completa.

- [ ] **Step 4: Rodar os testes de teclado**

Run: `npx vitest run tests/components/MaxListBox.test.ts`
Expected: PASS (56 testes).

- [ ] **Step 5: Substituir o bloco `<style>` pelo definitivo**

Troque o `<style lang="scss">` inteiro por:

```scss
.max-listbox {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    background-color: var(--background-0);
    border: 1px solid var(--background-300);
    border-radius: 6px;
    overflow: hidden;

    &.is-disabled {
        opacity: 0.6;
        pointer-events: none;
    }
}

.max-listbox-header {
    padding: 10px 12px;
    border-bottom: 1px solid var(--background-300);
}

.max-listbox-title {
    font-weight: 600;
    color: var(--background-750);
}

.max-listbox-filter {
    padding: 8px 10px;
    border-bottom: 1px solid var(--background-300);
}

.max-listbox-filter-input {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--background-300);
    border-radius: 4px;
    background-color: var(--background-0);
    color: var(--background-750);
    font-size: 0.9rem;
    outline: none;

    &::placeholder {
        color: var(--background-600);
    }

    &:focus {
        border-color: var(--blue-600);
    }
}

.max-listbox-list {
    position: relative;
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
    outline: none;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
        width: 3px;
        height: 3px;
    }
}

.max-listbox-spacer {
    width: 100%;
}

// Quando virtualizado, a janela flutua sobre o spacer que sustenta a altura total.
.max-listbox-window {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
}

.max-listbox-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    min-height: 44px;
    cursor: pointer;
    color: var(--background-750);

    &:hover {
        background-color: var(--background-300);
    }

    &.is-focused {
        outline: 2px solid var(--blue-600);
        outline-offset: -2px;
    }

    &.is-selected {
        background-color: var(--blue-600);
        color: var(--background-0);

        .max-listbox-item-sublabel,
        .icon-div {
            color: var(--background-200);
        }

        &:hover {
            background-color: var(--blue-700);
        }
    }

    &.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;

        &:hover {
            background-color: transparent;
        }
    }
}

.max-listbox-item-labels {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.max-listbox-item-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.max-listbox-item-sublabel {
    color: var(--background-600);
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

// Layout de duas linhas: sublabel abaixo do label em vez de ao lado.
.max-listbox.two-lines {
    .max-listbox-item-labels {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }
}

.max-listbox-empty,
.max-listbox-loader,
.max-listbox-error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 12px;
    color: var(--background-600);
    font-size: 0.9rem;
}

.max-listbox-retry {
    border: none;
    background: none;
    padding: 0;
    color: var(--blue-600);
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.9rem;
}

.max-listbox-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--background-300);
}
```

- [ ] **Step 6: Rodar a suíte completa, tipagem e lint**

Run: `npx vitest run tests/components/MaxListBox.test.ts tests/composables/useVirtualList.test.ts && npm run type-check && npm run lint`
Expected: PASS em tudo.

- [ ] **Step 7: Commit**

```bash
git add src/components/MaxListBox.vue tests/components/MaxListBox.test.ts
git commit -m "feat(MaxListBox): navegacao por teclado, acessibilidade e estilo"
```

---

### Task 9: Registro no index e no resolver

**Files:**
- Modify: `src/index.ts`
- Modify: `src/components-manifest.json` (gerado, não editado à mão)

**Interfaces:**
- Consumes: `MaxListBox.vue` (Tasks 3–8).
- Produces: exports públicos `MaxListBox`, `ListBox`, `Listbox`.

- [ ] **Step 1: Adicionar os exports**

Em `src/index.ts`, insira junto ao bloco de componentes (ordem alfabética aproximada — próximo a `MaxInputTextList`/`MaxLink`):

```ts
export { default as MaxListBox } from './components/MaxListBox.vue';
export { default as ListBox } from './components/MaxListBox.vue';
export { default as Listbox } from './components/MaxListBox.vue';
```

- [ ] **Step 2: Regenerar o manifesto do resolver**

Run: `npx tsx src/scripts/generateResolver.ts`
Expected: `src/components-manifest.json` passa a conter `MaxListBox` e seus aliases.

- [ ] **Step 3: Confirmar que o manifesto mudou**

Run: `git diff --stat src/components-manifest.json && grep -c MaxListBox src/components-manifest.json`
Expected: o arquivo aparece modificado e o grep retorna pelo menos 1.

- [ ] **Step 4: Verificar tipagem e build**

Run: `npm run type-check && npm run build`
Expected: PASS. O build precisa passar porque o componente agora entra no bundle público.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts src/components-manifest.json
git commit -m "feat(MaxListBox): registra o componente no index e no resolver"
```

---

### Task 10: Demo no playground

**Files:**
- Modify: `playground/src/App.vue`

**Interfaces:**
- Consumes: `MaxListBox` registrado (Task 9).
- Produces: nada consumido por outras tasks. Última task.

- [ ] **Step 1: Adicionar a seção de demo no template**

Em `playground/src/App.vue`, dentro de `<main class="playground__main">`, adicione uma nova `<section>` após as existentes:

```vue
            <section class="component-section">
                <h2>MaxListBox</h2>
                <div class="component-grid">
                    <div class="component-item">
                        <h3>Local com filtro</h3>
                        <MaxListBox
                            v-model="listBoxValue"
                            :options="listBoxOptions"
                            filter
                            title="Registros"
                            height="320px"
                        />
                        <p>Selecionado: {{ listBoxValue ?? 'nenhum' }}</p>
                    </div>

                    <div class="component-item">
                        <h3>Duas linhas + badge</h3>
                        <MaxListBox
                            v-model="listBoxValue"
                            :options="listBoxOptions"
                            two-lines
                            :item-height="56"
                            height="320px"
                        />
                    </div>

                    <div class="component-item">
                        <h3>Virtual scroll (2000 itens)</h3>
                        <MaxListBox
                            v-model="bigListValue"
                            :options="bigListOptions"
                            filter
                            height="320px"
                        />
                    </div>

                    <div class="component-item">
                        <h3>API paginada (scroll infinito)</h3>
                        <MaxListBox
                            v-model="apiListValue"
                            :load-options="fakeLoadOptions"
                            filter
                            :page-size="20"
                            height="320px"
                            @load-error="lastClickEvent = 'erro ao carregar'"
                        />
                    </div>
                </div>
            </section>
```

- [ ] **Step 2: Adicionar o estado no script**

No `<script setup>` de `playground/src/App.vue`, após `const selectValue = ref();`:

```ts
    const listBoxValue = ref(null);
    const bigListValue = ref(null);
    const apiListValue = ref(null);

    const listBoxOptions = ref([
        { value: 1, label: 'Construtora Alfa', sub_label: 'CNPJ 11.111.111/0001-11', icon: 'mdi:office-building', badge: '12' },
        { value: 2, label: 'Beta Engenharia', sub_label: 'CNPJ 22.222.222/0001-22', icon: 'mdi:office-building', badge: '3' },
        { value: 3, label: 'Gama Incorporadora', sub_label: 'CNPJ 33.333.333/0001-33', icon: 'mdi:office-building' },
        { value: 4, label: 'Delta Obras (inativa)', sub_label: 'CNPJ 44.444.444/0001-44', icon: 'mdi:office-building', disabled: true }
    ]);

    const bigListOptions = ref(
        Array.from({ length: 2000 }, (_, i) => ({
            value: i,
            label: `Registro ${i}`,
            sub_label: `código ${1000 + i}`
        }))
    );

    /** Simula uma API paginada com latência, para testar o scroll infinito. */
    async function fakeLoadOptions({ page, search, pageSize }: { page: number; search: string; pageSize: number }) {
        await new Promise((resolve) => setTimeout(resolve, 400));

        const total = 137;
        const start = (page - 1) * pageSize;
        const items = Array.from({ length: Math.min(pageSize, Math.max(0, total - start)) }, (_, i) => ({
            value: start + i,
            label: `${search ? `[${search}] ` : ''}Item remoto ${start + i}`,
            sub_label: `página ${page}`
        }));

        return { items, total };
    }
```

- [ ] **Step 3: Rodar o playground e validar manualmente**

Run: `npm run dev:playground`

Verifique, na ordem:
1. **Local com filtro** — a lista aparece; digitar "beta" reduz a um item; clicar seleciona (fundo azul); o item "Delta Obras (inativa)" não seleciona.
2. **Duas linhas + badge** — sublabel abaixo do label; badges à direita.
3. **Virtual scroll** — a rolagem é fluida e os itens **não se sobrepõem nem ficam desalinhados** (isto valida o CSS `position: absolute` da janela sobre o spacer, ponto sinalizado na Task 5).
4. **API paginada** — carrega 20 itens, mostra "Carregando..." no rodapé, e ao rolar até o fim carrega mais até chegar a 137; digitar no filtro reinicia a lista.
5. **Teclado** — clicar na lista e usar ↑/↓, Enter, Home/End.

- [ ] **Step 4: Commit**

```bash
git add playground/src/App.vue
git commit -m "docs(MaxListBox): adiciona demos no playground"
```

- [ ] **Step 5: Rodar a suíte completa antes de integrar**

Run: `npm run test && npm run type-check && npm run lint && npm run build`
Expected: PASS em tudo. Só então o branch `max-listbox` está pronto para merge em `dev`.

---

## Notas de integração

Após a Task 10 e com tudo verde, integre e limpe o worktree a partir do repositório principal:

```bash
cd /home/johnattas/GitHub/MaxComponentsUi
git merge max-listbox
git worktree remove ../MaxComponentsUi-wt-max-listbox
```

Não há entrada a atualizar em `status-primevue.migration.yaml`: o `MaxListBox` é um componente novo e nativo, não faz parte da fila de migração do PrimeVue.
