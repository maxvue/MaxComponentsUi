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
    import { computed, useTemplateRef } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    const context = injectTabsContext('MaxTabList');

    const list_el = useTemplateRef<HTMLElement>('list_el');

    /**
     * Os navegadores so aparecem quando o MaxTabs esta em modo scrollable e
     * showNavigators nao foi desligado. Ambos vem do contexto de Tabs.
     */
    const show_navigators = computed(() => context.scrollable.value && context.show_navigators.value);

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
