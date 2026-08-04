# MaxTabs, MaxAccordion e MaxDrawer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar 13 componentes (Tabs, Accordion, Drawer) à `@maxvue/max-components-ui` replicando a API pública do PrimeVue 4, implementados do zero sem importar `primevue/*`.

**Architecture:** Cada família tem um componente-raiz que faz `provide` de um contexto reativo tipado; os filhos fazem `inject`. Os contextos vivem em `src/helpers/` (o projeto não tem `src/composables/` — não crie um). O Drawer usa `<Teleport to="body">` com trap de foco próprio, controlado por `visible` como prop pura (nunca muta o próprio estado; só emite `update:visible`).

**Tech Stack:** Vue 3 `<script setup lang="ts">`, TypeScript, SCSS com escopo, UnoCSS (`presetMaxUno`), Vitest + `@vue/test-utils` + happy-dom.

**Spec:** [`docs/superpowers/specs/2026-08-04-tabs-accordion-drawer-design.md`](../specs/2026-08-04-tabs-accordion-drawer-design.md)

## Global Constraints

Aplicam-se a **todas** as tarefas:

- **Zero import de `primevue/*`** em qualquer arquivo criado por este plano. Isso é o ponto central do trabalho.
- **Indentação de 4 espaços**, aspas simples, ponto e vírgula obrigatório, **sem** vírgula final (ESLint `@stylistic`).
- **Ordem dos blocos em `.vue`:** Template → Script → Style.
- `<script setup lang="ts">` com `defineProps<Interface>()` tipado (use `withDefaults` quando houver defaults).
- **Sem `any`.** Tipe explicitamente; use `unknown` + narrowing quando o tipo for de fronteira.
- Textos de UI, comentários e nomes de teste em **português**, seguindo o padrão do repositório.
- SCSS usa variáveis do tema Max: `var(--background-0)`, `var(--background-300)`, `var(--surface-border)`, `var(--max-primary-500)`.
- Testes: `describe`/`it` em português, `mount` direto, asserções por classe CSS — siga `tests/components/LayoutComponents.test.ts`.
- **Não** implementar `activeIndex` (depreciada) nem o modo `unstyled`/pass-through do PrimeVue.
- Rodar `npm run lint` antes de cada commit; ele corrige automaticamente.

## Setup do worktree (antes da Tarefa 1)

Conforme [`CLAUDE.md`](../../../CLAUDE.md), toda modificação de código ocorre em worktree isolado:

```bash
git worktree add ../MaxComponentsUi-wt-tabs-accordion-drawer -b feat/tabs-accordion-drawer
cd ../MaxComponentsUi-wt-tabs-accordion-drawer
npm install
```

`npm install` requer que `../MaxUse` exista ao lado do repositório. Todos os caminhos deste plano são relativos à raiz do worktree.

## File Structure

**Criar:**

| Arquivo | Responsabilidade |
|---|---|
| `src/helpers/tabsContext.ts` | `InjectionKey` + tipo do contexto de Tabs |
| `src/helpers/accordionContext.ts` | `InjectionKey` + tipo do contexto de Accordion |
| `src/helpers/useFocusTrap.ts` | Trap de foco e restauração (usado pelo Drawer) |
| `src/components/MaxTabs.vue` | Raiz: estado do tab ativo, `provide` |
| `src/components/MaxTabList.vue` | `role="tablist"`, navegação por teclado, scroll |
| `src/components/MaxTab.vue` | `role="tab"`, um header |
| `src/components/MaxTabPanels.vue` | Container dos painéis |
| `src/components/MaxTabPanel.vue` | `role="tabpanel"`, um painel + `lazy` |
| `src/components/MaxAccordion.vue` | Raiz: estado aberto (single/multiple), `provide` |
| `src/components/MaxAccordionPanel.vue` | Um painel; provê seu `value` aos filhos |
| `src/components/MaxAccordionHeader.vue` | Botão com `aria-expanded`, teclado |
| `src/components/MaxAccordionContent.vue` | `role="region"` + `lazy` |
| `src/components/MaxDrawer.vue` | Overlay com teleport, trap de foco, posições |
| `tests/components/MaxTabs.test.ts` | Testes da família Tabs |
| `tests/components/MaxAccordion.test.ts` | Testes da família Accordion |
| `tests/components/MaxDrawer.test.ts` | Testes do Drawer |

**Modificar:**

| Arquivo | Mudança |
|---|---|
| `src/index.ts` | Exportar os 13 componentes + aliases sem prefixo |
| `src/prime/index.ts` | Remover linhas 51-54, 68-72, 81 (re-exports substituídos) |
| `src/components-manifest.json` | Regenerado por script (não editar à mão) |

---

## Task 1: Contexto de Tabs e componente raiz MaxTabs

**Files:**
- Create: `src/helpers/tabsContext.ts`
- Create: `src/components/MaxTabs.vue`
- Test: `tests/components/MaxTabs.test.ts`

**Interfaces:**
- Produces: `TABS_INJECTION_KEY: InjectionKey<TabsContext>` e a interface `TabsContext` — consumidos pelas Tarefas 2, 3, 4 e 5.

`TabsContext` tem esta forma exata (as tarefas seguintes dependem destes nomes):

```typescript
export interface TabsContext {
    /** Valor do tab atualmente ativo. */
    active_value: Readonly<Ref<string | undefined>>;
    /** Seleciona um tab pelo seu value. */
    select: (value: string) => void;
    /** Renderiza o conteúdo do painel só quando ativa pela primeira vez. */
    lazy: Readonly<Ref<boolean>>;
    /** Ativa o tab ao receber foco, sem exigir clique. */
    select_on_focus: Readonly<Ref<boolean>>;
    /** tabindex aplicado aos headers. */
    tabindex: Readonly<Ref<number>>;
    /** Prefixo de id para ligar aria-controls/aria-labelledby entre tab e painel. */
    id_prefix: string;
    /** Registra um header para a navegação por setas; retorna função de desregistro. */
    registerTab: (value: string, el: HTMLElement, disabled: () => boolean) => () => void;
    /** Move o foco/seleção a partir de uma tecla de navegação. */
    navigate: (from: string, key: 'next' | 'prev' | 'first' | 'last') => void;
}
```

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/components/MaxTabs.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTabs from '../../src/components/MaxTabs.vue';

describe('MaxTabs', () => {
    it('renderiza o slot default dentro da raiz', () => {
        const wrapper = mount(MaxTabs, {
            props: { value: '0' },
            slots: { default: '<div class="filho">Conteudo</div>' }
        });
        expect(wrapper.find('.max-tabs').exists()).toBe(true);
        expect(wrapper.find('.filho').exists()).toBe(true);
    });

    it('emite update:value quando um filho chama select', () => {
        const wrapper = mount(MaxTabs, {
            props: { value: '0' },
            slots: { default: '<div class="filho">Conteudo</div>' }
        });
        // Acessa o contexto exposto para simular a seleção feita por um MaxTab.
        wrapper.vm.select('1');
        expect(wrapper.emitted('update:value')).toBeTruthy();
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['1']);
    });

    it('nao muta o proprio value (componente controlado)', () => {
        const wrapper = mount(MaxTabs, {
            props: { value: '0' },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.select('1');
        expect(wrapper.props('value')).toBe('0');
    });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run tests/components/MaxTabs.test.ts`
Expected: FAIL — `Cannot find module '../../src/components/MaxTabs.vue'`

- [ ] **Step 3: Criar o contexto**

Crie `src/helpers/tabsContext.ts`:

```typescript
import { inject, type InjectionKey, type Ref } from 'vue';

/**
 * Contexto compartilhado entre MaxTabs e seus componentes filhos
 * (MaxTabList, MaxTab, MaxTabPanels, MaxTabPanel).
 */
export interface TabsContext {
    active_value: Readonly<Ref<string | undefined>>;
    select: (value: string) => void;
    lazy: Readonly<Ref<boolean>>;
    select_on_focus: Readonly<Ref<boolean>>;
    tabindex: Readonly<Ref<number>>;
    id_prefix: string;
    registerTab: (value: string, el: HTMLElement, disabled: () => boolean) => () => void;
    navigate: (from: string, key: 'next' | 'prev' | 'first' | 'last') => void;
}

export const TABS_INJECTION_KEY: InjectionKey<TabsContext> = Symbol('max-tabs');

/**
 * Recupera o contexto de Tabs, falhando com mensagem clara quando o
 * componente for usado fora de um <MaxTabs>.
 */
export const injectTabsContext = (component: string): TabsContext => {
    const context = inject(TABS_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxTabs>.`);
    return context;
};
```

- [ ] **Step 4: Criar o MaxTabs**

Crie `src/components/MaxTabs.vue`:

```vue
<template>
    <div class="max-tabs" :class="{ 'max-tabs-scrollable': props.scrollable }">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { TABS_INJECTION_KEY, type TabsContext } from '../helpers/tabsContext';
    import { provide, toRef, ref, readonly } from 'vue';
    import { Random } from '@maxvue/max-use';

    const props = withDefaults(defineProps<{
        /** Value do tab ativo. */
        value?: string;
        /** Monta o conteudo do painel apenas quando ele ativa. */
        lazy?: boolean;
        /** Habilita rolagem horizontal dos headers quando houver overflow. */
        scrollable?: boolean;
        /** Exibe os botoes de navegacao no modo scrollable. */
        showNavigators?: boolean;
        /** tabindex aplicado aos headers. */
        tabindex?: number;
        /** Ativa o tab ao receber foco. */
        selectOnFocus?: boolean;
    }>(), {
        value: undefined,
        lazy: false,
        scrollable: false,
        showNavigators: true,
        tabindex: 0,
        selectOnFocus: false
    });

    const emit = defineEmits<{
        'update:value': [value: string];
    }>();

    /** Headers registrados, na ordem de montagem, para navegacao por setas. */
    const tabs = ref<{ value: string; el: HTMLElement; disabled: () => boolean }[]>([]);

    const id_prefix = `max-tabs-${Random()}`;

    const select = (value: string) => {
        emit('update:value', value);
    };

    const registerTab: TabsContext['registerTab'] = (value, el, disabled) => {
        tabs.value.push({ value, el, disabled });
        return () => {
            tabs.value = tabs.value.filter((tab) => tab.value !== value);
        };
    };

    /**
     * Move o foco para outro header, pulando os desabilitados e dando a volta
     * nas extremidades. Com selectOnFocus, o tab focado tambem e ativado.
     */
    const navigate: TabsContext['navigate'] = (from, key) => {

        const enabled = tabs.value.filter((tab) => ! tab.disabled());
        if (! enabled.length) return;

        const current = enabled.findIndex((tab) => tab.value === from);

        let target = 0;
        if (key === 'first') target = 0;
        else if (key === 'last') target = enabled.length - 1;
        else if (key === 'next') target = current < 0 ? 0 : (current + 1) % enabled.length;
        else target = current <= 0 ? enabled.length - 1 : current - 1;

        const tab = enabled[target];
        if (! tab) return;

        tab.el.focus();
        if (props.selectOnFocus) select(tab.value);
    };

    provide(TABS_INJECTION_KEY, {
        active_value: toRef(props, 'value'),
        select,
        lazy: toRef(props, 'lazy'),
        select_on_focus: toRef(props, 'selectOnFocus'),
        tabindex: toRef(props, 'tabindex'),
        id_prefix,
        registerTab,
        navigate
    });

    defineExpose({ select, navigate });
</script>

<style lang="scss">
    .max-tabs {
        display: flex;
        flex-direction: column;
        width: 100%;
    }
</style>
```

- [ ] **Step 5: Rodar o teste para confirmar que passa**

Run: `npx vitest run tests/components/MaxTabs.test.ts`
Expected: PASS (3 testes)

- [ ] **Step 6: Commit**

```bash
npm run lint
git add src/helpers/tabsContext.ts src/components/MaxTabs.vue tests/components/MaxTabs.test.ts
git commit -m "feat(tabs): adiciona contexto e componente raiz MaxTabs"
```

---

## Task 2: MaxTab e MaxTabList (headers + teclado)

**Files:**
- Create: `src/components/MaxTab.vue`
- Create: `src/components/MaxTabList.vue`
- Test: `tests/components/MaxTabs.test.ts` (adicionar ao arquivo existente)

**Interfaces:**
- Consumes: `TABS_INJECTION_KEY`, `TabsContext`, `injectTabsContext` da Tarefa 1.
- Produces: `MaxTab` renderiza `<button role="tab" class="max-tab">` com id `{id_prefix}-tab-{value}` e `aria-controls="{id_prefix}-panel-{value}"`. A Tarefa 3 depende desse esquema de ids.

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `tests/components/MaxTabs.test.ts`:

```typescript
import MaxTabList from '../../src/components/MaxTabList.vue';
import MaxTab from '../../src/components/MaxTab.vue';

/** Monta a estrutura completa de headers usada nos testes de teclado. */
const mountTabList = (props: Record<string, unknown> = {}) => mount(MaxTabs, {
    props: { value: '0', ...props },
    slots: {
        default: `
            <MaxTabList>
                <MaxTab value="0">Um</MaxTab>
                <MaxTab value="1" disabled>Dois</MaxTab>
                <MaxTab value="2">Tres</MaxTab>
            </MaxTabList>
        `
    },
    global: { components: { MaxTabList, MaxTab } }
});

describe('MaxTab', () => {
    it('marca o tab ativo com aria-selected', () => {
        const wrapper = mountTabList();
        const tabs = wrapper.findAll('.max-tab');
        expect(tabs[0].attributes('aria-selected')).toBe('true');
        expect(tabs[2].attributes('aria-selected')).toBe('false');
    });

    it('aplica role e aria-controls ligando ao painel', () => {
        const wrapper = mountTabList();
        const tab = wrapper.find('.max-tab');
        expect(tab.attributes('role')).toBe('tab');
        expect(tab.attributes('aria-controls')).toContain('-panel-0');
    });

    it('emite update:value ao clicar', async () => {
        const wrapper = mountTabList();
        await wrapper.findAll('.max-tab')[2].trigger('click');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['2']);
    });

    it('nao emite ao clicar num tab desabilitado', async () => {
        const wrapper = mountTabList();
        await wrapper.findAll('.max-tab')[1].trigger('click');
        expect(wrapper.emitted('update:value')).toBeFalsy();
    });

    it('marca aria-disabled no tab desabilitado', () => {
        const wrapper = mountTabList();
        expect(wrapper.findAll('.max-tab')[1].attributes('aria-disabled')).toBe('true');
    });

    it('so mantem o tab ativo no fluxo de tabulacao', () => {
        const wrapper = mountTabList();
        const tabs = wrapper.findAll('.max-tab');
        expect(tabs[0].attributes('tabindex')).toBe('0');
        expect(tabs[2].attributes('tabindex')).toBe('-1');
    });
});

describe('MaxTabList', () => {
    it('aplica role tablist', () => {
        const wrapper = mountTabList();
        expect(wrapper.find('.max-tab-list').attributes('role')).toBe('tablist');
    });

    it('seta a direita pula o tab desabilitado', async () => {
        const wrapper = mountTabList({ selectOnFocus: true });
        await wrapper.findAll('.max-tab')[0].trigger('keydown', { key: 'ArrowRight' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['2']);
    });

    it('Home vai para o primeiro tab habilitado', async () => {
        const wrapper = mountTabList({ selectOnFocus: true, value: '2' });
        await wrapper.findAll('.max-tab')[2].trigger('keydown', { key: 'Home' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['0']);
    });

    it('End vai para o ultimo tab habilitado', async () => {
        const wrapper = mountTabList({ selectOnFocus: true });
        await wrapper.findAll('.max-tab')[0].trigger('keydown', { key: 'End' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['2']);
    });

    it('Enter ativa o tab focado', async () => {
        const wrapper = mountTabList();
        await wrapper.findAll('.max-tab')[2].trigger('keydown', { key: 'Enter' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['2']);
    });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run tests/components/MaxTabs.test.ts`
Expected: FAIL — `Cannot find module '../../src/components/MaxTabList.vue'`

- [ ] **Step 3: Criar o MaxTab**

Crie `src/components/MaxTab.vue`:

```vue
<template>
    <button
        ref="el"
        type="button"
        role="tab"
        class="max-tab"
        :class="{ 'max-tab-active': is_active, 'max-tab-disabled': props.disabled }"
        :id="`${context.id_prefix}-tab-${props.value}`"
        :aria-controls="`${context.id_prefix}-panel-${props.value}`"
        :aria-selected="is_active"
        :aria-disabled="props.disabled || undefined"
        :disabled="props.disabled"
        :tabindex="is_active ? context.tabindex.value : -1"
        @click="onClick"
        @focus="onFocus"
    >
        <slot></slot>
    </button>
</template>

<script setup lang="ts">
    import { injectTabsContext } from '../helpers/tabsContext';
    import { computed, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';

    const props = withDefaults(defineProps<{
        /** Identificador do tab, casado com o MaxTabPanel de mesmo value. */
        value: string;
        /** Impede selecao e retira o header da navegacao por teclado. */
        disabled?: boolean;
    }>(), {
        disabled: false
    });

    const context = injectTabsContext('MaxTab');

    const el = useTemplateRef<HTMLElement>('el');

    const is_active = computed(() => context.active_value.value === props.value);

    const onClick = () => {
        if (props.disabled) return;
        context.select(props.value);
    };

    /** Com selectOnFocus, receber foco ja ativa o tab. */
    const onFocus = () => {
        if (props.disabled || ! context.select_on_focus.value) return;
        if (! is_active.value) context.select(props.value);
    };

    let unregister: (() => void) | undefined;

    onMounted(() => {
        if (el.value) unregister = context.registerTab(props.value, el.value, () => props.disabled);
    });

    onBeforeUnmount(() => unregister?.());
</script>

<style lang="scss">
    .max-tab {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        padding: 0.75rem 1rem;
        cursor: pointer;
        color: var(--text-color, inherit);
        white-space: nowrap;
        transition: color 0.2s ease, border-color 0.2s ease;

        &.max-tab-active {
            border-bottom-color: var(--max-primary-500);
            color: var(--max-primary-500);
        }

        &.max-tab-disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-tab {
            transition: none;
        }
    }
</style>
```

- [ ] **Step 4: Criar o MaxTabList**

Crie `src/components/MaxTabList.vue`:

```vue
<template>
    <div class="max-tab-list-wrapper">
        <button
            v-if="show_navigators"
            type="button"
            class="max-tab-nav max-tab-nav-prev"
            aria-hidden="true"
            tabindex="-1"
            @click="scrollBy(-1)"
        >
            <MaxIcon i="iconoir:nav-arrow-left" />
        </button>
        <div ref="list_el" class="max-tab-list" role="tablist" @keydown="onKeydown">
            <slot></slot>
        </div>
        <button
            v-if="show_navigators"
            type="button"
            class="max-tab-nav max-tab-nav-next"
            aria-hidden="true"
            tabindex="-1"
            @click="scrollBy(1)"
        >
            <MaxIcon i="iconoir:nav-arrow-right" />
        </button>
    </div>
</template>

<script setup lang="ts">
    import { injectTabsContext } from '../helpers/tabsContext';
    import { inject, computed, useTemplateRef } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    const context = injectTabsContext('MaxTabList');

    const list_el = useTemplateRef<HTMLElement>('list_el');

    /**
     * Os navegadores so aparecem quando o MaxTabs esta em modo scrollable e
     * showNavigators nao foi desligado. Ambos vem via props do pai, lidos aqui
     * pelo contexto de scroll fornecido pelo MaxTabs.
     */
    const scroll_config = inject<{ scrollable: boolean; show_navigators: boolean }>('max-tabs-scroll', {
        scrollable: false,
        show_navigators: true
    });

    const show_navigators = computed(() => scroll_config.scrollable && scroll_config.show_navigators);

    const scrollBy = (direction: number) => {
        if (! list_el.value) return;
        list_el.value.scrollLeft += direction * (list_el.value.clientWidth / 2);
    };

    /** Mapeia as teclas de navegacao para as direcoes entendidas pelo contexto. */
    const onKeydown = (event: KeyboardEvent) => {

        const target = event.target as HTMLElement | null;
        const value = target?.getAttribute('data-tab-value') ?? current_value.value;
        if (value === undefined) return;

        const keys: Record<string, 'next' | 'prev' | 'first' | 'last'> = {
            ArrowRight: 'next',
            ArrowLeft: 'prev',
            Home: 'first',
            End: 'last',
            PageUp: 'first',
            PageDown: 'last'
        };

        const direction = keys[event.key];

        if (direction) {
            event.preventDefault();
            context.navigate(value, direction);
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            context.select(value);
        }
    };

    const current_value = computed(() => context.active_value.value);
</script>

<style lang="scss">
    .max-tab-list-wrapper {
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--background-300);

        .max-tab-list {
            display: flex;
            flex: 1;
            overflow-x: auto;
            scrollbar-width: none;

            &::-webkit-scrollbar {
                display: none;
            }
        }

        .max-tab-nav {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            padding: 0 0.25rem;
            color: var(--max-primary-500);
        }
    }
</style>
```

Para que o `data-tab-value` exista, adicione ao `<button>` do `MaxTab.vue` (Step 3) o atributo `:data-tab-value="props.value"`.

Para que o `scroll_config` exista, adicione ao `MaxTabs.vue` (Tarefa 1), logo após o `provide` do `TABS_INJECTION_KEY`:

```typescript
    provide('max-tabs-scroll', reactive({
        scrollable: toRef(props, 'scrollable'),
        show_navigators: toRef(props, 'showNavigators')
    }));
```

E acrescente `reactive` ao import de `vue` no `MaxTabs.vue`.

- [ ] **Step 5: Rodar os testes para confirmar que passam**

Run: `npx vitest run tests/components/MaxTabs.test.ts`
Expected: PASS (todos os testes das seções MaxTabs, MaxTab e MaxTabList)

- [ ] **Step 6: Commit**

```bash
npm run lint
git add src/components/MaxTab.vue src/components/MaxTabList.vue src/components/MaxTabs.vue tests/components/MaxTabs.test.ts
git commit -m "feat(tabs): adiciona MaxTab e MaxTabList com navegacao por teclado"
```

---

## Task 3: MaxTabPanels e MaxTabPanel (conteúdo + lazy)

**Files:**
- Create: `src/components/MaxTabPanels.vue`
- Create: `src/components/MaxTabPanel.vue`
- Test: `tests/components/MaxTabs.test.ts` (adicionar)

**Interfaces:**
- Consumes: `injectTabsContext` (Tarefa 1); o esquema de ids `{id_prefix}-tab-{value}` / `{id_prefix}-panel-{value}` da Tarefa 2.

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `tests/components/MaxTabs.test.ts`:

```typescript
import MaxTabPanels from '../../src/components/MaxTabPanels.vue';
import MaxTabPanel from '../../src/components/MaxTabPanel.vue';

/** Monta a estrutura completa de tabs com painéis. */
const mountFull = (props: Record<string, unknown> = {}) => mount(MaxTabs, {
    props: { value: '0', ...props },
    slots: {
        default: `
            <MaxTabList>
                <MaxTab value="0">Um</MaxTab>
                <MaxTab value="1">Dois</MaxTab>
            </MaxTabList>
            <MaxTabPanels>
                <MaxTabPanel value="0"><span class="p0">Painel Um</span></MaxTabPanel>
                <MaxTabPanel value="1"><span class="p1">Painel Dois</span></MaxTabPanel>
            </MaxTabPanels>
        `
    },
    global: { components: { MaxTabList, MaxTab, MaxTabPanels, MaxTabPanel } }
});

describe('MaxTabPanel', () => {
    it('mostra apenas o painel do tab ativo', () => {
        const wrapper = mountFull();
        expect(wrapper.find('.p0').exists()).toBe(true);
        expect(wrapper.find('.p1').exists()).toBe(false);
    });

    it('troca o painel visivel quando value muda', async () => {
        const wrapper = mountFull();
        await wrapper.setProps({ value: '1' });
        expect(wrapper.find('.p0').exists()).toBe(false);
        expect(wrapper.find('.p1').exists()).toBe(true);
    });

    it('aplica role tabpanel e aria-labelledby apontando ao header', () => {
        const wrapper = mountFull();
        const panel = wrapper.find('.max-tab-panel');
        expect(panel.attributes('role')).toBe('tabpanel');
        expect(panel.attributes('aria-labelledby')).toContain('-tab-0');
    });

    it('com lazy, o painel inativo nunca foi montado', () => {
        const wrapper = mountFull({ lazy: true });
        expect(wrapper.find('.p1').exists()).toBe(false);
    });

    it('sem lazy, o painel inativo permanece no DOM apenas oculto', () => {
        const wrapper = mountFull();
        const panels = wrapper.findAll('.max-tab-panel');
        expect(panels.length).toBe(2);
    });

    it('com lazy, painel ja visitado continua montado apos sair', async () => {
        const wrapper = mountFull({ lazy: true });
        await wrapper.setProps({ value: '1' });
        await wrapper.setProps({ value: '0' });
        expect(wrapper.findAll('.max-tab-panel').length).toBe(2);
    });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run tests/components/MaxTabs.test.ts`
Expected: FAIL — `Cannot find module '../../src/components/MaxTabPanels.vue'`

- [ ] **Step 3: Criar o MaxTabPanels**

Crie `src/components/MaxTabPanels.vue`:

```vue
<template>
    <div class="max-tab-panels">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { injectTabsContext } from '../helpers/tabsContext';

    // Valida que o componente esta dentro de um <MaxTabs>.
    injectTabsContext('MaxTabPanels');
</script>

<style lang="scss">
    .max-tab-panels {
        padding: 1rem 0;
    }
</style>
```

- [ ] **Step 4: Criar o MaxTabPanel**

Crie `src/components/MaxTabPanel.vue`:

```vue
<template>
    <div
        v-if="should_render"
        v-show="is_active"
        class="max-tab-panel"
        role="tabpanel"
        :id="`${context.id_prefix}-panel-${props.value}`"
        :aria-labelledby="`${context.id_prefix}-tab-${props.value}`"
    >
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { injectTabsContext } from '../helpers/tabsContext';
    import { computed, ref, watch } from 'vue';

    const props = defineProps<{
        /** Identificador do painel, casado com o MaxTab de mesmo value. */
        value: string;
    }>();

    const context = injectTabsContext('MaxTabPanel');

    const is_active = computed(() => context.active_value.value === props.value);

    /**
     * No modo lazy o painel so entra no DOM na primeira ativacao; depois disso
     * permanece montado e apenas alterna a visibilidade, preservando o estado
     * interno dos componentes filhos.
     */
    const was_active = ref(is_active.value);

    watch(is_active, (value) => {
        if (value) was_active.value = true;
    });

    const should_render = computed(() => ! context.lazy.value || was_active.value);
</script>

<style lang="scss">
    .max-tab-panel {
        width: 100%;
    }
</style>
```

- [ ] **Step 5: Rodar os testes para confirmar que passam**

Run: `npx vitest run tests/components/MaxTabs.test.ts`
Expected: PASS (todos)

- [ ] **Step 6: Commit**

```bash
npm run lint
git add src/components/MaxTabPanels.vue src/components/MaxTabPanel.vue tests/components/MaxTabs.test.ts
git commit -m "feat(tabs): adiciona MaxTabPanels e MaxTabPanel com suporte a lazy"
```

---

## Task 4: Contexto de Accordion e componente raiz MaxAccordion

**Files:**
- Create: `src/helpers/accordionContext.ts`
- Create: `src/components/MaxAccordion.vue`
- Test: `tests/components/MaxAccordion.test.ts`

**Interfaces:**
- Produces: `ACCORDION_INJECTION_KEY: InjectionKey<AccordionContext>`, `injectAccordionContext`, e `PANEL_INJECTION_KEY: InjectionKey<AccordionPanelContext>` — consumidos pelas Tarefas 5 e 6.

```typescript
export interface AccordionContext {
    /** Values dos paineis abertos (sempre array, mesmo no modo single). */
    open_values: Readonly<Ref<string[]>>;
    /** Alterna um painel; respeita multiple. */
    toggle: (value: string) => void;
    lazy: Readonly<Ref<boolean>>;
    select_on_focus: Readonly<Ref<boolean>>;
    tabindex: Readonly<Ref<number>>;
    expand_icon: Readonly<Ref<string | undefined>>;
    collapse_icon: Readonly<Ref<string | undefined>>;
    id_prefix: string;
    registerHeader: (value: string, el: HTMLElement, disabled: () => boolean) => () => void;
    navigate: (from: string, key: 'next' | 'prev' | 'first' | 'last') => void;
}

export interface AccordionPanelContext {
    /** Value do painel que envolve o header/conteudo. */
    value: string;
    /** Painel desabilitado. */
    disabled: Readonly<Ref<boolean>>;
}
```

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/components/MaxAccordion.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxAccordion from '../../src/components/MaxAccordion.vue';

describe('MaxAccordion', () => {
    it('renderiza o slot default', () => {
        const wrapper = mount(MaxAccordion, {
            slots: { default: '<div class="filho">Conteudo</div>' }
        });
        expect(wrapper.find('.max-accordion').exists()).toBe(true);
        expect(wrapper.find('.filho').exists()).toBe(true);
    });

    it('emite update:value ao abrir um painel no modo single', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: undefined },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
    });

    it('no modo single, abrir um painel substitui o anterior', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: 'a' },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('b');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['b']);
    });

    it('no modo single, alternar o painel aberto emite undefined', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: 'a' },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('update:value')?.[0]).toEqual([undefined]);
    });

    it('no modo multiple, acumula valores em array', () => {
        const wrapper = mount(MaxAccordion, {
            props: { multiple: true, value: ['a'] },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('b');
        expect(wrapper.emitted('update:value')?.[0]).toEqual([['a', 'b']]);
    });

    it('no modo multiple, alternar remove do array', () => {
        const wrapper = mount(MaxAccordion, {
            props: { multiple: true, value: ['a', 'b'] },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('update:value')?.[0]).toEqual([['b']]);
    });

    it('emite tab-open ao abrir', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: undefined },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('tab-open')?.[0]).toEqual([{ value: 'a' }]);
    });

    it('emite tab-close ao fechar', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: 'a' },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('tab-close')?.[0]).toEqual([{ value: 'a' }]);
    });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run tests/components/MaxAccordion.test.ts`
Expected: FAIL — `Cannot find module '../../src/components/MaxAccordion.vue'`

- [ ] **Step 3: Criar o contexto**

Crie `src/helpers/accordionContext.ts`:

```typescript
import { inject, type InjectionKey, type Ref } from 'vue';

/** Contexto compartilhado entre MaxAccordion e seus filhos. */
export interface AccordionContext {
    open_values: Readonly<Ref<string[]>>;
    toggle: (value: string) => void;
    lazy: Readonly<Ref<boolean>>;
    select_on_focus: Readonly<Ref<boolean>>;
    tabindex: Readonly<Ref<number>>;
    expand_icon: Readonly<Ref<string | undefined>>;
    collapse_icon: Readonly<Ref<string | undefined>>;
    id_prefix: string;
    registerHeader: (value: string, el: HTMLElement, disabled: () => boolean) => () => void;
    navigate: (from: string, key: 'next' | 'prev' | 'first' | 'last') => void;
}

/** Contexto que o MaxAccordionPanel fornece ao seu header e conteudo. */
export interface AccordionPanelContext {
    value: string;
    disabled: Readonly<Ref<boolean>>;
}

export const ACCORDION_INJECTION_KEY: InjectionKey<AccordionContext> = Symbol('max-accordion');

export const PANEL_INJECTION_KEY: InjectionKey<AccordionPanelContext> = Symbol('max-accordion-panel');

export const injectAccordionContext = (component: string): AccordionContext => {
    const context = inject(ACCORDION_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxAccordion>.`);
    return context;
};

export const injectPanelContext = (component: string): AccordionPanelContext => {
    const context = inject(PANEL_INJECTION_KEY, null);
    if (! context) throw new Error(`[MaxComponentsUi] <${component}> precisa estar dentro de um <MaxAccordionPanel>.`);
    return context;
};
```

- [ ] **Step 4: Criar o MaxAccordion**

Crie `src/components/MaxAccordion.vue`:

```vue
<template>
    <div class="max-accordion">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { ACCORDION_INJECTION_KEY, type AccordionContext } from '../helpers/accordionContext';
    import { provide, toRef, ref, computed } from 'vue';
    import { Random } from '@maxvue/max-use';

    const props = withDefaults(defineProps<{
        /** Painel aberto (string) ou paineis abertos (array, com multiple). */
        value?: string | string[];
        /** Permite manter varios paineis abertos ao mesmo tempo. */
        multiple?: boolean;
        /** Monta o conteudo do painel apenas quando ele abre. */
        lazy?: boolean;
        /** tabindex aplicado aos headers. */
        tabindex?: number;
        /** Abre o painel ao receber foco. */
        selectOnFocus?: boolean;
        /** Icone exibido quando o painel esta fechado. */
        expandIcon?: string;
        /** Icone exibido quando o painel esta aberto. */
        collapseIcon?: string;
    }>(), {
        value: undefined,
        multiple: false,
        lazy: false,
        tabindex: 0,
        selectOnFocus: false,
        expandIcon: undefined,
        collapseIcon: undefined
    });

    const emit = defineEmits<{
        'update:value': [value: string | string[] | undefined];
        'tab-open': [event: { value: string }];
        'tab-close': [event: { value: string }];
    }>();

    /** Normaliza value para array, independente do modo. */
    const open_values = computed<string[]>(() => {
        if (props.value === undefined) return [];
        return Array.isArray(props.value) ? props.value : [props.value];
    });

    const headers = ref<{ value: string; el: HTMLElement; disabled: () => boolean }[]>([]);

    const id_prefix = `max-accordion-${Random()}`;

    const toggle = (value: string) => {

        const is_open = open_values.value.includes(value);

        if (props.multiple) {
            const next = is_open
                ? open_values.value.filter((item) => item !== value)
                : [...open_values.value, value];
            emit('update:value', next);
        }
        else {
            emit('update:value', is_open ? undefined : value);
        }

        emit(is_open ? 'tab-close' : 'tab-open', { value });
    };

    const registerHeader: AccordionContext['registerHeader'] = (value, el, disabled) => {
        headers.value.push({ value, el, disabled });
        return () => {
            headers.value = headers.value.filter((header) => header.value !== value);
        };
    };

    const navigate: AccordionContext['navigate'] = (from, key) => {

        const enabled = headers.value.filter((header) => ! header.disabled());
        if (! enabled.length) return;

        const current = enabled.findIndex((header) => header.value === from);

        let target = 0;
        if (key === 'first') target = 0;
        else if (key === 'last') target = enabled.length - 1;
        else if (key === 'next') target = current < 0 ? 0 : (current + 1) % enabled.length;
        else target = current <= 0 ? enabled.length - 1 : current - 1;

        const header = enabled[target];
        if (! header) return;

        header.el.focus();
        if (props.selectOnFocus && ! open_values.value.includes(header.value)) toggle(header.value);
    };

    provide(ACCORDION_INJECTION_KEY, {
        open_values,
        toggle,
        lazy: toRef(props, 'lazy'),
        select_on_focus: toRef(props, 'selectOnFocus'),
        tabindex: toRef(props, 'tabindex'),
        expand_icon: toRef(props, 'expandIcon'),
        collapse_icon: toRef(props, 'collapseIcon'),
        id_prefix,
        registerHeader,
        navigate
    });

    defineExpose({ toggle, navigate });
</script>

<style lang="scss">
    .max-accordion {
        display: flex;
        flex-direction: column;
        width: 100%;
        border: 1px solid var(--background-300);
        border-radius: 0.75rem;
        overflow: hidden;
    }
</style>
```

- [ ] **Step 5: Rodar os testes para confirmar que passam**

Run: `npx vitest run tests/components/MaxAccordion.test.ts`
Expected: PASS (8 testes)

- [ ] **Step 6: Commit**

```bash
npm run lint
git add src/helpers/accordionContext.ts src/components/MaxAccordion.vue tests/components/MaxAccordion.test.ts
git commit -m "feat(accordion): adiciona contexto e componente raiz MaxAccordion"
```

---

## Task 5: MaxAccordionPanel, MaxAccordionHeader e MaxAccordionContent

**Files:**
- Create: `src/components/MaxAccordionPanel.vue`
- Create: `src/components/MaxAccordionHeader.vue`
- Create: `src/components/MaxAccordionContent.vue`
- Test: `tests/components/MaxAccordion.test.ts` (adicionar)

**Interfaces:**
- Consumes: `injectAccordionContext`, `injectPanelContext`, `PANEL_INJECTION_KEY` da Tarefa 4.
- Produces: header com id `{id_prefix}-header-{value}`, conteúdo com id `{id_prefix}-content-{value}`.

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `tests/components/MaxAccordion.test.ts`:

```typescript
import MaxAccordionPanel from '../../src/components/MaxAccordionPanel.vue';
import MaxAccordionHeader from '../../src/components/MaxAccordionHeader.vue';
import MaxAccordionContent from '../../src/components/MaxAccordionContent.vue';

/** Monta a estrutura completa do accordion usada nos testes. */
const mountFull = (props: Record<string, unknown> = {}) => mount(MaxAccordion, {
    props,
    slots: {
        default: `
            <MaxAccordionPanel value="a">
                <MaxAccordionHeader>Um</MaxAccordionHeader>
                <MaxAccordionContent><span class="c-a">Conteudo A</span></MaxAccordionContent>
            </MaxAccordionPanel>
            <MaxAccordionPanel value="b" disabled>
                <MaxAccordionHeader>Dois</MaxAccordionHeader>
                <MaxAccordionContent><span class="c-b">Conteudo B</span></MaxAccordionContent>
            </MaxAccordionPanel>
            <MaxAccordionPanel value="c">
                <MaxAccordionHeader>Tres</MaxAccordionHeader>
                <MaxAccordionContent><span class="c-c">Conteudo C</span></MaxAccordionContent>
            </MaxAccordionPanel>
        `
    },
    global: { components: { MaxAccordionPanel, MaxAccordionHeader, MaxAccordionContent } }
});

describe('MaxAccordionHeader', () => {
    it('renderiza como botao com aria-expanded', () => {
        const wrapper = mountFull({ value: 'a' });
        const header = wrapper.findAll('.max-accordion-header')[0];
        expect(header.attributes('aria-expanded')).toBe('true');
        expect(wrapper.findAll('.max-accordion-header')[2].attributes('aria-expanded')).toBe('false');
    });

    it('liga aria-controls ao conteudo', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.find('.max-accordion-header').attributes('aria-controls')).toContain('-content-a');
    });

    it('alterna o painel ao clicar', async () => {
        const wrapper = mountFull({ value: undefined });
        await wrapper.findAll('.max-accordion-header')[0].trigger('click');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
    });

    it('nao alterna quando o painel esta desabilitado', async () => {
        const wrapper = mountFull({ value: undefined });
        await wrapper.findAll('.max-accordion-header')[1].trigger('click');
        expect(wrapper.emitted('update:value')).toBeFalsy();
    });

    it('marca aria-disabled no header desabilitado', () => {
        const wrapper = mountFull({ value: undefined });
        expect(wrapper.findAll('.max-accordion-header')[1].attributes('aria-disabled')).toBe('true');
    });

    it('seta para baixo pula o painel desabilitado', async () => {
        const wrapper = mountFull({ value: undefined, selectOnFocus: true });
        await wrapper.findAll('.max-accordion-header')[0].trigger('keydown', { key: 'ArrowDown' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['c']);
    });

    it('Enter alterna o painel focado', async () => {
        const wrapper = mountFull({ value: undefined });
        await wrapper.findAll('.max-accordion-header')[0].trigger('keydown', { key: 'Enter' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
    });

    it('usa headerAriaLevel 2 por padrao', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.find('.max-accordion-header-wrapper').attributes('aria-level')).toBe('2');
    });
});

describe('MaxAccordionContent', () => {
    it('mostra apenas o conteudo do painel aberto', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.find('.c-a').isVisible()).toBe(true);
        expect(wrapper.find('.c-c').exists()).toBe(true);
    });

    it('aplica role region e aria-labelledby', () => {
        const wrapper = mountFull({ value: 'a' });
        const content = wrapper.find('.max-accordion-content');
        expect(content.attributes('role')).toBe('region');
        expect(content.attributes('aria-labelledby')).toContain('-header-a');
    });

    it('com lazy, conteudo fechado nunca foi montado', () => {
        const wrapper = mountFull({ value: 'a', lazy: true });
        expect(wrapper.find('.c-c').exists()).toBe(false);
    });

    it('no modo multiple exibe varios conteudos', () => {
        const wrapper = mountFull({ multiple: true, value: ['a', 'c'] });
        expect(wrapper.find('.c-a').isVisible()).toBe(true);
        expect(wrapper.find('.c-c').isVisible()).toBe(true);
    });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run tests/components/MaxAccordion.test.ts`
Expected: FAIL — `Cannot find module '../../src/components/MaxAccordionPanel.vue'`

- [ ] **Step 3: Criar o MaxAccordionPanel**

Crie `src/components/MaxAccordionPanel.vue`:

```vue
<template>
    <div class="max-accordion-panel" :class="{ 'max-accordion-panel-disabled': props.disabled }">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { PANEL_INJECTION_KEY, injectAccordionContext } from '../helpers/accordionContext';
    import { provide, toRef } from 'vue';

    const props = withDefaults(defineProps<{
        /** Identificador do painel. */
        value: string;
        /** Impede abrir/fechar e retira o header da navegacao por teclado. */
        disabled?: boolean;
    }>(), {
        disabled: false
    });

    // Valida que o componente esta dentro de um <MaxAccordion>.
    injectAccordionContext('MaxAccordionPanel');

    provide(PANEL_INJECTION_KEY, {
        value: props.value,
        disabled: toRef(props, 'disabled')
    });
</script>

<style lang="scss">
    .max-accordion-panel {
        border-bottom: 1px solid var(--background-300);

        &:last-child {
            border-bottom: none;
        }

        &.max-accordion-panel-disabled {
            opacity: 0.5;
        }
    }
</style>
```

- [ ] **Step 4: Criar o MaxAccordionHeader**

Crie `src/components/MaxAccordionHeader.vue`:

```vue
<template>
    <div class="max-accordion-header-wrapper" role="heading" :aria-level="props.headerAriaLevel">
        <button
            ref="el"
            type="button"
            class="max-accordion-header"
            :class="{ 'max-accordion-header-active': is_open }"
            :id="`${context.id_prefix}-header-${panel.value}`"
            :aria-controls="`${context.id_prefix}-content-${panel.value}`"
            :aria-expanded="is_open"
            :aria-disabled="panel.disabled.value || undefined"
            :disabled="panel.disabled.value"
            :tabindex="context.tabindex.value"
            @click="onClick"
            @keydown="onKeydown"
        >
            <span class="max-accordion-header-text"><slot></slot></span>
            <MaxIcon :i="icon" class="max-accordion-header-icon" />
        </button>
    </div>
</template>

<script setup lang="ts">
    import { injectAccordionContext, injectPanelContext } from '../helpers/accordionContext';
    import { computed, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    const props = withDefaults(defineProps<{
        /** Nivel do heading que envolve o botao, para leitores de tela. */
        headerAriaLevel?: number;
    }>(), {
        headerAriaLevel: 2
    });

    const context = injectAccordionContext('MaxAccordionHeader');

    const panel = injectPanelContext('MaxAccordionHeader');

    const el = useTemplateRef<HTMLElement>('el');

    const is_open = computed(() => context.open_values.value.includes(panel.value));

    const icon = computed(() => {
        if (is_open.value) return context.collapse_icon.value ?? 'iconoir:nav-arrow-up';
        return context.expand_icon.value ?? 'iconoir:nav-arrow-down';
    });

    const onClick = () => {
        if (panel.disabled.value) return;
        context.toggle(panel.value);
    };

    const onKeydown = (event: KeyboardEvent) => {

        const keys: Record<string, 'next' | 'prev' | 'first' | 'last'> = {
            ArrowDown: 'next',
            ArrowUp: 'prev',
            Home: 'first',
            End: 'last'
        };

        const direction = keys[event.key];

        if (direction) {
            event.preventDefault();
            context.navigate(panel.value, direction);
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    };

    let unregister: (() => void) | undefined;

    onMounted(() => {
        if (el.value) unregister = context.registerHeader(panel.value, el.value, () => panel.disabled.value);
    });

    onBeforeUnmount(() => unregister?.());
</script>

<style lang="scss">
    .max-accordion-header-wrapper {
        margin: 0;

        .max-accordion-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            width: 100%;
            padding: 1rem;
            background: none;
            border: none;
            cursor: pointer;
            text-align: left;
            color: inherit;
            transition: background-color 0.2s ease;

            &:hover:not(:disabled) {
                background-color: var(--background-300);
            }

            &.max-accordion-header-active {
                color: var(--max-primary-500);
            }

            &:disabled {
                cursor: not-allowed;
            }

            .max-accordion-header-icon {
                flex-shrink: 0;
            }
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-accordion-header-wrapper .max-accordion-header {
            transition: none;
        }
    }
</style>
```

- [ ] **Step 5: Criar o MaxAccordionContent**

Crie `src/components/MaxAccordionContent.vue`:

```vue
<template>
    <div
        v-if="should_render"
        v-show="is_open"
        class="max-accordion-content"
        role="region"
        :id="`${context.id_prefix}-content-${panel.value}`"
        :aria-labelledby="`${context.id_prefix}-header-${panel.value}`"
    >
        <div class="max-accordion-content-inner">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { injectAccordionContext, injectPanelContext } from '../helpers/accordionContext';
    import { computed, ref, watch } from 'vue';

    const context = injectAccordionContext('MaxAccordionContent');

    const panel = injectPanelContext('MaxAccordionContent');

    const is_open = computed(() => context.open_values.value.includes(panel.value));

    /**
     * No modo lazy o conteudo so entra no DOM na primeira abertura; depois
     * permanece montado, preservando o estado dos componentes filhos.
     */
    const was_open = ref(is_open.value);

    watch(is_open, (value) => {
        if (value) was_open.value = true;
    });

    const should_render = computed(() => ! context.lazy.value || was_open.value);
</script>

<style lang="scss">
    .max-accordion-content {
        .max-accordion-content-inner {
            padding: 0 1rem 1rem;
        }
    }
</style>
```

- [ ] **Step 6: Rodar os testes para confirmar que passam**

Run: `npx vitest run tests/components/MaxAccordion.test.ts`
Expected: PASS (todos)

- [ ] **Step 7: Commit**

```bash
npm run lint
git add src/components/MaxAccordionPanel.vue src/components/MaxAccordionHeader.vue src/components/MaxAccordionContent.vue tests/components/MaxAccordion.test.ts
git commit -m "feat(accordion): adiciona Panel, Header e Content com teclado e lazy"
```

---

## Task 6: Helper de trap de foco

**Files:**
- Create: `src/helpers/useFocusTrap.ts`
- Test: `tests/components/MaxDrawer.test.ts` (criado aqui, expandido na Tarefa 7)

**Interfaces:**
- Produces: `useFocusTrap(el: Ref<HTMLElement | null>)` retornando `{ activate, deactivate, onKeydown }` — consumido pela Tarefa 7.

```typescript
export interface FocusTrap {
    /** Guarda o foco atual e move o foco para dentro do container. */
    activate: () => void;
    /** Devolve o foco ao elemento que o tinha antes do activate. */
    deactivate: () => void;
    /** Handler de keydown que cicla o Tab dentro do container. */
    onKeydown: (event: KeyboardEvent) => void;
}
```

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/components/MaxDrawer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';
import { useFocusTrap } from '../../src/helpers/useFocusTrap';

describe('useFocusTrap', () => {
    it('move o foco para o primeiro elemento focavel ao ativar', async () => {
        const container = document.createElement('div');
        container.innerHTML = '<button id="um">Um</button><button id="dois">Dois</button>';
        document.body.appendChild(container);

        const trap = useFocusTrap(ref(container));
        trap.activate();
        await nextTick();

        expect(document.activeElement?.id).toBe('um');
        document.body.removeChild(container);
    });

    it('devolve o foco ao elemento anterior ao desativar', async () => {
        const anterior = document.createElement('button');
        document.body.appendChild(anterior);
        anterior.focus();

        const container = document.createElement('div');
        container.innerHTML = '<button id="um">Um</button>';
        document.body.appendChild(container);

        const trap = useFocusTrap(ref(container));
        trap.activate();
        await nextTick();
        trap.deactivate();
        await nextTick();

        expect(document.activeElement).toBe(anterior);
        document.body.removeChild(container);
        document.body.removeChild(anterior);
    });

    it('Tab no ultimo elemento volta para o primeiro', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button id="um">Um</button><button id="dois">Dois</button>';
        document.body.appendChild(container);

        const ultimo = container.querySelector<HTMLElement>('#dois');
        ultimo?.focus();

        const trap = useFocusTrap(ref(container));
        const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
        Object.defineProperty(event, 'target', { value: ultimo });
        trap.onKeydown(event);

        expect(document.activeElement?.id).toBe('um');
        document.body.removeChild(container);
    });

    it('Shift+Tab no primeiro elemento vai para o ultimo', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button id="um">Um</button><button id="dois">Dois</button>';
        document.body.appendChild(container);

        const primeiro = container.querySelector<HTMLElement>('#um');
        primeiro?.focus();

        const trap = useFocusTrap(ref(container));
        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
        Object.defineProperty(event, 'target', { value: primeiro });
        trap.onKeydown(event);

        expect(document.activeElement?.id).toBe('dois');
        document.body.removeChild(container);
    });

    it('ignora containers sem elementos focaveis', () => {
        const container = document.createElement('div');
        container.innerHTML = '<span>Sem foco</span>';
        document.body.appendChild(container);

        const trap = useFocusTrap(ref(container));
        expect(() => trap.activate()).not.toThrow();

        document.body.removeChild(container);
    });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run tests/components/MaxDrawer.test.ts`
Expected: FAIL — `Cannot find module '../../src/helpers/useFocusTrap'`

- [ ] **Step 3: Implementar o helper**

Crie `src/helpers/useFocusTrap.ts`:

```typescript
import { nextTick, type Ref } from 'vue';

export interface FocusTrap {
    activate: () => void;
    deactivate: () => void;
    onKeydown: (event: KeyboardEvent) => void;
}

/** Seletor dos elementos que podem receber foco pelo teclado. */
const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Mantem o foco do teclado dentro de um container enquanto ele estiver ativo,
 * devolvendo o foco ao elemento de origem quando desativado. Usado pelo
 * MaxDrawer para que a tabulacao nao escape para o conteudo atras da mascara.
 */
export const useFocusTrap = (el: Ref<HTMLElement | null>): FocusTrap => {

    /** Elemento que tinha o foco antes de o trap ser ativado. */
    let previous: HTMLElement | null = null;

    const focusable = (): HTMLElement[] => {
        if (! el.value) return [];
        return Array.from(el.value.querySelectorAll<HTMLElement>(FOCUSABLE));
    };

    const activate = () => {
        previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        nextTick(() => {
            const items = focusable();
            items[0]?.focus();
        });
    };

    const deactivate = () => {
        previous?.focus();
        previous = null;
    };

    const onKeydown = (event: KeyboardEvent) => {

        if (event.key !== 'Tab') return;

        const items = focusable();
        if (! items.length) return;

        const first = items[0];
        const last = items[items.length - 1];
        const target = event.target as HTMLElement | null;

        if (event.shiftKey && target === first) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (! event.shiftKey && target === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return { activate, deactivate, onKeydown };
};
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

Run: `npx vitest run tests/components/MaxDrawer.test.ts`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
npm run lint
git add src/helpers/useFocusTrap.ts tests/components/MaxDrawer.test.ts
git commit -m "feat(drawer): adiciona helper de trap de foco"
```

---

## Task 7: MaxDrawer

**Files:**
- Create: `src/components/MaxDrawer.vue`
- Test: `tests/components/MaxDrawer.test.ts` (adicionar)

**Interfaces:**
- Consumes: `useFocusTrap` da Tarefa 6.
- Produces: `MaxDrawer` com `defineExpose({ open, close, toggle, is_show })`.

**Nota sobre o teleport nos testes:** o conteúdo é teleportado para `body`, então `wrapper.find()` não o encontra. Use `document.querySelector` e monte com `attachTo: document.body`.

- [ ] **Step 1: Escrever o teste que falha**

Adicione a `tests/components/MaxDrawer.test.ts`:

```typescript
import { mount } from '@vue/test-utils';
import MaxDrawer from '../../src/components/MaxDrawer.vue';

/** Monta o drawer anexado ao body, necessario por causa do Teleport. */
const mountDrawer = (props: Record<string, unknown> = {}) => mount(MaxDrawer, {
    props: { visible: true, ...props },
    slots: { default: '<button class="interno">Interno</button>' },
    attachTo: document.body
});

describe('MaxDrawer', () => {
    it('nao renderiza nada quando visible e false', () => {
        mountDrawer({ visible: false });
        expect(document.querySelector('.max-drawer')).toBeNull();
    });

    it('renderiza o painel e o slot quando visible e true', () => {
        mountDrawer();
        expect(document.querySelector('.max-drawer')).not.toBeNull();
        expect(document.querySelector('.interno')).not.toBeNull();
    });

    it('aplica a classe da posicao, com left por padrao', () => {
        mountDrawer();
        expect(document.querySelector('.max-drawer-left')).not.toBeNull();
    });

    it('aceita as demais posicoes', () => {
        mountDrawer({ position: 'right' });
        expect(document.querySelector('.max-drawer-right')).not.toBeNull();
    });

    it('aplica role complementary e aria-modal', () => {
        mountDrawer();
        const drawer = document.querySelector('.max-drawer');
        expect(drawer?.getAttribute('role')).toBe('complementary');
        expect(drawer?.getAttribute('aria-modal')).toBe('true');
    });

    it('renderiza o header quando a prop header e informada', () => {
        mountDrawer({ header: 'Titulo' });
        expect(document.querySelector('.max-drawer-header')?.textContent).toContain('Titulo');
    });

    it('emite update:visible false ao clicar no botao de fechar', async () => {
        const wrapper = mountDrawer();
        const botao = document.querySelector<HTMLElement>('.max-drawer-close');
        botao?.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('nao renderiza o botao de fechar com showCloseIcon false', () => {
        mountDrawer({ showCloseIcon: false });
        expect(document.querySelector('.max-drawer-close')).toBeNull();
    });

    it('fecha ao clicar na mascara quando dismissable', async () => {
        const wrapper = mountDrawer();
        const mascara = document.querySelector<HTMLElement>('.max-drawer-mask');
        mascara?.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('nao fecha ao clicar na mascara quando dismissable e false', async () => {
        const wrapper = mountDrawer({ dismissable: false });
        const mascara = document.querySelector<HTMLElement>('.max-drawer-mask');
        mascara?.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('fecha com a tecla Escape', async () => {
        const wrapper = mountDrawer();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('nao muta o proprio visible (componente controlado)', async () => {
        const wrapper = mountDrawer();
        document.querySelector<HTMLElement>('.max-drawer-close')?.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.props('visible')).toBe(true);
    });

    it('expoe open, close e toggle imperativos', async () => {
        const wrapper = mountDrawer({ visible: false });
        wrapper.vm.open();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([true]);
    });

    it('emite show ao abrir', async () => {
        const wrapper = mountDrawer({ visible: false });
        await wrapper.setProps({ visible: true });
        expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('emite hide ao fechar', async () => {
        const wrapper = mountDrawer({ visible: true });
        await wrapper.setProps({ visible: false });
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('trava o scroll do body com blockScroll', async () => {
        const wrapper = mountDrawer({ visible: false, blockScroll: true });
        await wrapper.setProps({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        await wrapper.setProps({ visible: false });
        expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('renderiza o slot footer quando informado', () => {
        mount(MaxDrawer, {
            props: { visible: true },
            slots: { default: '<div>x</div>', footer: '<span class="rodape">Rodape</span>' },
            attachTo: document.body
        });
        expect(document.querySelector('.rodape')).not.toBeNull();
    });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `npx vitest run tests/components/MaxDrawer.test.ts`
Expected: FAIL — `Cannot find module '../../src/components/MaxDrawer.vue'`

- [ ] **Step 3: Implementar o MaxDrawer**

Crie `src/components/MaxDrawer.vue`:

```vue
<template>
    <teleport to="body">
        <transition name="max-drawer-fade" @after-leave="emit('after-hide')">
            <div
                v-if="props.visible"
                class="max-drawer-mask"
                :class="{ 'max-drawer-mask-modal': props.modal }"
                :style="{ zIndex: z_index }"
                @click.self="onMaskClick"
            >
                <slot name="container" :close-callback="close">
                    <div
                        ref="panel_el"
                        class="max-drawer"
                        :class="`max-drawer-${props.position}`"
                        role="complementary"
                        aria-modal="true"
                        @keydown="trap.onKeydown"
                    >
                        <div v-if="props.header || $slots.header || props.showCloseIcon" class="max-drawer-header">
                            <slot name="header">
                                <span class="max-drawer-title">{{ props.header }}</span>
                            </slot>
                            <button
                                v-if="props.showCloseIcon"
                                type="button"
                                class="max-drawer-close"
                                aria-label="Fechar"
                                @click="close"
                            >
                                <slot name="closeicon">
                                    <MaxIcon :i="props.closeIcon ?? 'iconoir:xmark'" size="1.3" />
                                </slot>
                            </button>
                        </div>
                        <div class="max-drawer-content">
                            <slot></slot>
                        </div>
                        <div v-if="$slots.footer" class="max-drawer-footer">
                            <slot name="footer"></slot>
                        </div>
                    </div>
                </slot>
            </div>
        </transition>
    </teleport>
</template>

<script setup lang="ts">
    import { useFocusTrap } from '../helpers/useFocusTrap';
    import { computed, watch, onBeforeUnmount, useTemplateRef } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    const props = withDefaults(defineProps<{
        /** Controla a visibilidade. Funciona com v-model:visible ou como prop controlada. */
        visible?: boolean;
        /** Borda a partir da qual o painel desliza. */
        position?: 'left' | 'right' | 'top' | 'bottom' | 'full';
        /** Texto do cabecalho. */
        header?: string | null;
        /** Permite fechar clicando fora ou com Escape. */
        dismissable?: boolean;
        /** Exibe o botao de fechar no cabecalho. */
        showCloseIcon?: boolean;
        /** Exibe a mascara escura atras do painel. */
        modal?: boolean;
        /** Trava o scroll do body enquanto aberto. */
        blockScroll?: boolean;
        /** Nome do icone do botao de fechar. */
        closeIcon?: string;
        /** z-index base somado ao incremento automatico. */
        baseZIndex?: number;
        /** Calcula o z-index automaticamente a partir do baseZIndex. */
        autoZIndex?: boolean;
    }>(), {
        visible: false,
        position: 'left',
        header: null,
        dismissable: true,
        showCloseIcon: true,
        modal: true,
        blockScroll: false,
        closeIcon: undefined,
        baseZIndex: 0,
        autoZIndex: true
    });

    const emit = defineEmits<{
        'update:visible': [visible: boolean];
        'show': [];
        'hide': [];
        'after-hide': [];
    }>();

    const panel_el = useTemplateRef<HTMLElement>('panel_el');

    const trap = useFocusTrap(panel_el);

    const is_show = computed(() => props.visible);

    /** Fica acima do MaxModal (z-index 59) quando autoZIndex esta ligado. */
    const z_index = computed(() => (props.autoZIndex ? props.baseZIndex + 60 : props.baseZIndex));

    /**
     * O componente nunca muta o proprio estado: apenas emite a intencao e
     * deixa o consumidor decidir, o que faz v-model:visible e :visible
     * controlado funcionarem igualmente.
     */
    const close = () => emit('update:visible', false);

    const open = () => emit('update:visible', true);

    const toggle = () => emit('update:visible', ! props.visible);

    const onMaskClick = () => {
        if (props.dismissable) close();
    };

    const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && props.dismissable) close();
    };

    watch(() => props.visible, (value) => {

        if (value) {
            emit('show');
            trap.activate();
            document.addEventListener('keydown', onEscape);
            if (props.blockScroll) document.body.style.overflow = 'hidden';
            return;
        }

        emit('hide');
        trap.deactivate();
        document.removeEventListener('keydown', onEscape);
        if (props.blockScroll) document.body.style.overflow = '';

    }, { immediate: true });

    onBeforeUnmount(() => {
        document.removeEventListener('keydown', onEscape);
        if (props.blockScroll) document.body.style.overflow = '';
    });

    defineExpose({ open, close, toggle, is_show });
</script>

<style lang="scss">
    .max-drawer-mask {
        position: fixed;
        inset: 0;
        display: flex;

        &.max-drawer-mask-modal {
            background-color: rgb(0 0 0 / 40%);
        }

        .max-drawer {
            background-color: var(--background-0);
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 16px rgb(0 0 0 / 20%);
            transition: transform 0.3s ease;

            &.max-drawer-left {
                width: 20rem;
                height: 100%;
                margin-right: auto;
            }

            &.max-drawer-right {
                width: 20rem;
                height: 100%;
                margin-left: auto;
            }

            &.max-drawer-top {
                width: 100%;
                height: 10rem;
                margin-bottom: auto;
            }

            &.max-drawer-bottom {
                width: 100%;
                height: 10rem;
                margin-top: auto;
            }

            &.max-drawer-full {
                width: 100%;
                height: 100%;
            }

            .max-drawer-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                padding: 1rem;
                border-bottom: 1px solid var(--background-300);

                .max-drawer-title {
                    font-weight: 600;
                }

                .max-drawer-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    color: inherit;
                }
            }

            .max-drawer-content {
                flex: 1;
                overflow: auto;
                padding: 1rem;
            }

            .max-drawer-footer {
                padding: 1rem;
                border-top: 1px solid var(--background-300);
            }
        }
    }

    .max-drawer-fade-enter-active,
    .max-drawer-fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .max-drawer-fade-enter-from,
    .max-drawer-fade-leave-to {
        opacity: 0;
    }

    @media (prefers-reduced-motion: reduce) {
        .max-drawer-mask .max-drawer,
        .max-drawer-fade-enter-active,
        .max-drawer-fade-leave-active {
            transition: none;
        }
    }
</style>
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

Run: `npx vitest run tests/components/MaxDrawer.test.ts`
Expected: PASS (todos)

Se algum teste falhar por resíduo de DOM entre casos (o Teleport deixa nós no `body`), adicione no início do `describe('MaxDrawer')`:

```typescript
afterEach(() => {
    document.body.innerHTML = '';
});
```

e importe `afterEach` de `vitest`.

- [ ] **Step 5: Commit**

```bash
npm run lint
git add src/components/MaxDrawer.vue tests/components/MaxDrawer.test.ts
git commit -m "feat(drawer): adiciona MaxDrawer com trap de foco e posicoes"
```

---

## Task 8: Integração — exports, remoção do prime e manifesto

**Files:**
- Modify: `src/index.ts`
- Modify: `src/prime/index.ts` (remover linhas de Accordion, Tabs e Drawer)
- Modify: `src/components-manifest.json` (via script)

**Interfaces:**
- Consumes: os 13 componentes das Tarefas 1-7.

- [ ] **Step 1: Adicionar os exports ao `src/index.ts`**

Acrescente antes da linha `export * from './stores';`:

```typescript
// Tabs
export { default as MaxTabs } from './components/MaxTabs.vue';
export { default as Tabs } from './components/MaxTabs.vue';
export { default as MaxTabList } from './components/MaxTabList.vue';
export { default as TabList } from './components/MaxTabList.vue';
export { default as MaxTab } from './components/MaxTab.vue';
export { default as Tab } from './components/MaxTab.vue';
export { default as MaxTabPanels } from './components/MaxTabPanels.vue';
export { default as TabPanels } from './components/MaxTabPanels.vue';
export { default as MaxTabPanel } from './components/MaxTabPanel.vue';
export { default as TabPanel } from './components/MaxTabPanel.vue';

// Accordion
export { default as MaxAccordion } from './components/MaxAccordion.vue';
export { default as Accordion } from './components/MaxAccordion.vue';
export { default as MaxAccordionPanel } from './components/MaxAccordionPanel.vue';
export { default as AccordionPanel } from './components/MaxAccordionPanel.vue';
export { default as MaxAccordionHeader } from './components/MaxAccordionHeader.vue';
export { default as AccordionHeader } from './components/MaxAccordionHeader.vue';
export { default as MaxAccordionContent } from './components/MaxAccordionContent.vue';
export { default as AccordionContent } from './components/MaxAccordionContent.vue';

// Drawer
export { default as MaxDrawer } from './components/MaxDrawer.vue';
export { default as Drawer } from './components/MaxDrawer.vue';
```

- [ ] **Step 2: Remover os re-exports substituídos de `src/prime/index.ts`**

Apague estas 10 linhas (os números originais são 51-54, 68-72 e 81; localize por conteúdo, pois mudam conforme você edita):

```typescript
export { default as Accordion } from 'primevue/accordion';
export { default as AccordionPanel } from 'primevue/accordionpanel';
export { default as AccordionHeader } from 'primevue/accordionheader';
export { default as AccordionContent } from 'primevue/accordioncontent';
export { default as Tabs } from 'primevue/tabs';
export { default as TabList } from 'primevue/tablist';
export { default as Tab } from 'primevue/tab';
export { default as TabPanels } from 'primevue/tabpanels';
export { default as TabPanel } from 'primevue/tabpanel';
export { default as Drawer } from 'primevue/drawer';
```

**Não** remova `SplitterPanel`, `StepPanel`, `StepPanels`, `PanelMenu`, `Panel` ou `ScrollPanel` — esses continuam sem equivalente Max.

- [ ] **Step 3: Regenerar o manifesto do resolver**

Run: `npx tsx src/scripts/generateResolver.ts`
Expected: `src/components-manifest.json` passa a conter os 13 componentes novos e seus aliases.

- [ ] **Step 4: Verificar que não sobrou nenhum import de PrimeVue nos novos arquivos**

```bash
grep -rn "primevue" src/components/MaxTab*.vue src/components/MaxAccordion*.vue src/components/MaxDrawer.vue src/helpers/tabsContext.ts src/helpers/accordionContext.ts src/helpers/useFocusTrap.ts
```

Expected: nenhuma saída. Qualquer resultado aqui é um erro a corrigir antes de commitar.

- [ ] **Step 5: Rodar a verificação completa**

```bash
npm run type-check
npm run lint
npm run test
```

Expected: os três passam. Em particular, a suíte completa não pode ter regressões nos testes já existentes.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts src/prime/index.ts src/components-manifest.json
git commit -m "feat: exporta Tabs, Accordion e Drawer e remove os re-exports do PrimeVue

BREAKING CHANGE: Accordion, Tabs e Drawer importados de
@maxvue/max-components-ui/prime agora resolvem para a implementacao Max.
A API publica e a mesma, mas o componente por tras mudou."
```

---

## Task 9: Validação manual no playground

**Files:**
- Modify: arquivos do playground (localize com `ls playground/` — a estrutura exata depende do que já existe)

- [ ] **Step 1: Localizar a estrutura do playground**

```bash
ls playground/ && cat package.json | grep -A2 "dev:playground"
```

Siga o padrão de página já existente ali para adicionar as demonstrações.

- [ ] **Step 2: Adicionar uma demonstração de cada família**

Inclua na página do playground:

```vue
<MaxTabs v-model:value="tab_ativa">
    <MaxTabList>
        <MaxTab value="0">Dados</MaxTab>
        <MaxTab value="1">Anexos</MaxTab>
        <MaxTab value="2" disabled>Bloqueada</MaxTab>
    </MaxTabList>
    <MaxTabPanels>
        <MaxTabPanel value="0">Conteudo dos dados</MaxTabPanel>
        <MaxTabPanel value="1">Conteudo dos anexos</MaxTabPanel>
        <MaxTabPanel value="2">Conteudo bloqueado</MaxTabPanel>
    </MaxTabPanels>
</MaxTabs>

<MaxAccordion v-model:value="painel_aberto">
    <MaxAccordionPanel value="a">
        <MaxAccordionHeader>Primeira secao</MaxAccordionHeader>
        <MaxAccordionContent>Conteudo da primeira secao.</MaxAccordionContent>
    </MaxAccordionPanel>
    <MaxAccordionPanel value="b">
        <MaxAccordionHeader>Segunda secao</MaxAccordionHeader>
        <MaxAccordionContent>Conteudo da segunda secao.</MaxAccordionContent>
    </MaxAccordionPanel>
</MaxAccordion>

<MaxButton label="Abrir drawer" @click="drawer_visivel = true" />
<MaxDrawer v-model:visible="drawer_visivel" header="Menu lateral" position="right">
    <p>Conteudo do drawer.</p>
    <template #footer>
        <MaxButton label="Fechar" @click="drawer_visivel = false" />
    </template>
</MaxDrawer>
```

Com o script correspondente:

```typescript
const tab_ativa = ref('0');
const painel_aberto = ref<string | undefined>('a');
const drawer_visivel = ref(false);
```

- [ ] **Step 3: Rodar o playground e validar manualmente**

Run: `npm run dev:playground`

Confira, no navegador:
- Tabs: clique troca o painel; `←`/`→` navegam e pulam a tab desabilitada; `Home`/`End` funcionam; a tab ativa tem a borda inferior colorida
- Accordion: clique abre/fecha; o ícone alterna entre seta para baixo e para cima; `↑`/`↓` movem o foco entre headers
- Drawer: abre pela direita com animação; `Escape` fecha; clique fora fecha; o Tab não escapa para o conteúdo atrás; ao fechar, o foco volta ao botão que abriu

- [ ] **Step 4: Commit**

```bash
npm run lint
git add playground/
git commit -m "chore(playground): adiciona demos de Tabs, Accordion e Drawer"
```

---

## Task 10: Fechamento — verificação final e merge

- [ ] **Step 1: Rodar a suíte completa uma última vez**

```bash
npm run type-check && npm run lint && npm run test && npm run build
```

Expected: todos passam, incluindo o build.

- [ ] **Step 2: Conferir a cobertura dos novos componentes**

Run: `npm run test:coverage`
Expected: os arquivos de `src/components/MaxTab*`, `MaxAccordion*`, `MaxDrawer.vue` e `src/helpers/*Context.ts`, `useFocusTrap.ts` aparecem cobertos.

- [ ] **Step 3: Revisar o diff completo**

```bash
git diff main...HEAD --stat
```

Confirme: 13 componentes `.vue` novos, 3 helpers novos, 3 arquivos de teste novos, `src/index.ts` e `src/prime/index.ts` modificados, manifesto regenerado.

- [ ] **Step 4: Integrar ao main**

Conforme o `CLAUDE.md`, o merge só acontece após a validação completa acima. A partir do worktree principal:

```bash
cd /home/johnattas/GitHub/MaxComponentsUi
git merge feat/tabs-accordion-drawer
```

Depois, remova o worktree:

```bash
git worktree remove ../MaxComponentsUi-wt-tabs-accordion-drawer
```

---

## Self-Review

**Cobertura do spec:** os 13 componentes estão nas Tarefas 1-7; helpers na 1, 4 e 6; testes embutidos em cada tarefa; integração e breaking change na 8; playground na 9; verificação na 10. As props verificadas no código-fonte do PrimeVue aparecem literalmente nos `withDefaults` de cada componente.

**Desvio do spec, corrigido aqui:** o spec dizia `src/composables/`, mas esse diretório **não existe** no projeto — lógica compartilhada mora em `src/helpers/`. Este plano usa `src/helpers/` e nomeia os arquivos `tabsContext.ts`, `accordionContext.ts` e `useFocusTrap.ts`.

**Consistência de tipos:** `TabsContext` (Tarefa 1) é consumido nas 2 e 3 com os mesmos nomes (`active_value`, `select`, `registerTab`, `navigate`, `id_prefix`). `AccordionContext` e `AccordionPanelContext` (Tarefa 4) são consumidos na 5. `useFocusTrap` (Tarefa 6) retorna `{ activate, deactivate, onKeydown }`, exatamente o que a Tarefa 7 usa. Os esquemas de id (`-tab-`/`-panel-`, `-header-`/`-content-`) são consistentes entre quem gera e quem referencia.

**Pontos de atenção na execução:**
- `Random()` vem de `@maxvue/max-use` — já usado pelo `MaxModal`, mesmo padrão.
- O `MaxTab` precisa do atributo `data-tab-value` (adicionado no Step 4 da Tarefa 2) para o `MaxTabList` identificar a origem do keydown.
- O `MaxTabs` precisa do `provide('max-tabs-scroll', ...)` (Step 4 da Tarefa 2) e do import de `reactive`.
- Testes do Drawer usam `document.querySelector` por causa do Teleport, não `wrapper.find`.
