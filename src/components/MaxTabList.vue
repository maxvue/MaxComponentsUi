<template>
    <div class="max-tab-list-wrapper">
        <button
            v-if="show_navigators"
            type="button"
            class="max-tab-nav max-tab-nav-prev"
            :class="{ 'max-tab-nav-disabled': is_prev_disabled }"
            :disabled="is_prev_disabled"
            :aria-disabled="is_prev_disabled ? 'true' : 'false'"
            aria-label="Aba anterior"
            tabindex="-1"
            @click="scrollBy(-1)"
        >
            <MaxIcon i="iconoir:nav-arrow-left" />
        </button>
        <div
            ref="list_el"
            class="max-tab-list"
            :class="{ 'max-tab-list-scrollable': context.scrollable.value }"
            role="tablist"
            @keydown="onKeydown"
            @scroll="updateScrollState"
            @wheel="onWheel"
        >
            <slot></slot>
        </div>
        <button
            v-if="show_navigators"
            type="button"
            class="max-tab-nav max-tab-nav-next"
            :class="{ 'max-tab-nav-disabled': is_next_disabled }"
            :disabled="is_next_disabled"
            :aria-disabled="is_next_disabled ? 'true' : 'false'"
            aria-label="Próxima aba"
            tabindex="-1"
            @click="scrollBy(1)"
        >
            <MaxIcon i="iconoir:nav-arrow-right" />
        </button>
    </div>
</template>

<script setup lang="ts">
    import { injectTabsContext } from '../helpers/tabsContext';
    import { computed, useTemplateRef, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    const context = injectTabsContext('MaxTabList');

    const list_el = useTemplateRef<HTMLElement>('list_el');

    const has_overflow = ref(false);
    const is_prev_disabled = ref(true);
    const is_next_disabled = ref(false);

    const updateScrollState = () => {
        const el = list_el.value;
        if (! el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        has_overflow.value = scrollWidth > clientWidth + 1;
        is_prev_disabled.value = scrollLeft <= 0;
        is_next_disabled.value = Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1;
    };

    /**
     * Os navegadores só aparecem quando o MaxTabs está em modo scrollable,
     * showNavigators não foi desligado e há overflow de conteúdo.
     */
    const show_navigators = computed(() => context.scrollable.value && context.show_navigators.value && has_overflow.value);

    const scrollBy = (direction: number) => {
        const el = list_el.value;
        if (! el) return;
        const distance = direction * (el.clientWidth / 2);
        if (typeof el.scrollBy === 'function') {
            el.scrollBy({ left: distance, behavior: 'smooth' });
        } else {
            el.scrollLeft += distance;
            updateScrollState();
        }
    };

    /** Rola a aba ativa para dentro da visualização caso esteja cortada ou fora da tela. */
    const scrollToActiveTab = (activeVal = context.effective_active_value.value) => {
        if (! context.scrollable.value || ! list_el.value || ! activeVal) return;
        const el = list_el.value;
        const activeEl = el.querySelector<HTMLElement>(`[data-tab-value="${activeVal}"]`);
        if (! activeEl) return;

        const tabLeft = activeEl.offsetLeft;
        const tabRight = tabLeft + activeEl.offsetWidth;
        const scrollLeft = el.scrollLeft;
        const clientWidth = el.clientWidth;

        if (tabLeft < scrollLeft) {
            if (typeof el.scrollTo === 'function') {
                el.scrollTo({ left: tabLeft, behavior: 'smooth' });
            } else {
                el.scrollLeft = tabLeft;
                updateScrollState();
            }
        } else if (tabRight > scrollLeft + clientWidth) {
            const targetScroll = tabRight - clientWidth;
            if (typeof el.scrollTo === 'function') {
                el.scrollTo({ left: targetScroll, behavior: 'smooth' });
            } else {
                el.scrollLeft = targetScroll;
                updateScrollState();
            }
        }
    };

    /** Permite rolagem horizontal suave através da roda vertical do mouse. */
    const onWheel = (event: WheelEvent) => {
        if (! context.scrollable.value || ! has_overflow.value || ! list_el.value) return;
        if (event.deltaY !== 0) {
            const can_scroll_left = event.deltaY < 0 && ! is_prev_disabled.value;
            const can_scroll_right = event.deltaY > 0 && ! is_next_disabled.value;
            if (can_scroll_left || can_scroll_right) {
                event.preventDefault();
                list_el.value.scrollLeft += event.deltaY;
                updateScrollState();
            }
        }
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

    watch(context.effective_active_value, (newVal) => {
        nextTick(() => {
            scrollToActiveTab(newVal);
            updateScrollState();
        });
    });

    let resize_observer: ResizeObserver | undefined;

    onMounted(() => {
        updateScrollState();
        nextTick(() => {
            updateScrollState();
            scrollToActiveTab();
        });

        if (list_el.value && typeof ResizeObserver !== 'undefined') {
            resize_observer = new ResizeObserver(() => {
                updateScrollState();
            });
            resize_observer.observe(list_el.value);
            for (const child of Array.from(list_el.value.children)) {
                resize_observer.observe(child);
            }
        }
    });

    onBeforeUnmount(() => {
        resize_observer?.disconnect();
    });

    defineExpose({
        updateScrollState,
        scrollToActiveTab,
        scrollBy,
        has_overflow,
        is_prev_disabled,
        is_next_disabled
    });
</script>

<style lang="scss">
    .max-tab-list-wrapper {
        display: flex;
        align-items: center;
        position: relative;
        width: 100%;
        border-bottom: 1px solid var(--background-300);

        .max-tab-list {
            display: flex;
            flex: 1;
            overflow-x: hidden;
            scroll-behavior: smooth;
            scrollbar-width: none;

            &::-webkit-scrollbar {
                display: none;
            }

            &.max-tab-list-scrollable {
                overflow-x: auto;
            }
        }

        .max-tab-nav {
            background: none;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 0.5rem;
            min-height: 2.25rem;
            color: var(--max-primary-500);
            transition: opacity 0.2s ease, color 0.2s ease, background-color 0.2s ease;
            flex-shrink: 0;

            &:hover:not(:disabled) {
                background-color: var(--background-100);
                color: var(--max-primary-600, var(--max-primary-500));
            }

            &.max-tab-nav-disabled,
            &:disabled {
                opacity: 0.35;
                cursor: not-allowed;
                pointer-events: none;
            }
        }
    }
</style>
