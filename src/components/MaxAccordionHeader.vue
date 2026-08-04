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
