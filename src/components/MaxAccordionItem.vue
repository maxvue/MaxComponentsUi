<template>
    <div class="max-accordion-item" :class="{ 'max-accordion-item-disabled': props.disabled }">
        <div class="max-accordion-item-header-wrapper" role="heading" :aria-level="props.headerAriaLevel">
            <div
                class="max-accordion-item-header"
                :class="{
                    'max-accordion-item-header-active': is_open,
                    'max-accordion-item-header-disabled': props.disabled
                }"
                :id="`${context.id_prefix}-header-${item_value}`"
                role="button"
                :tabindex="props.disabled ? -1 : 0"
                :aria-controls="`${context.id_prefix}-content-${item_value}`"
                :aria-expanded="is_open"
                :aria-disabled="props.disabled || undefined"
                @click="onClick"
                @keydown.enter.prevent="onClick"
                @keydown.space.prevent="onClick"
            >
                <span class="max-accordion-item-header-text">
                    <slot name="header">{{ props.title }}</slot>
                </span>
                <MaxIcon :i="icon" class="max-accordion-item-header-icon" />
            </div>
        </div>
        <div
            v-if="should_render"
            v-show="is_open"
            class="max-accordion-item-content"
            role="region"
            :id="`${context.id_prefix}-content-${item_value}`"
            :aria-labelledby="`${context.id_prefix}-header-${item_value}`"
        >
            <div class="max-accordion-item-content-inner">
                <!-- #content e a forma canonica; o slot default funciona como atalho. -->
                <slot name="content" v-if="$slots.content"></slot>
                <slot v-else></slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { injectAccordionContext } from '../helpers/accordionContext';
    import { computed, ref, watch } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    const props = withDefaults(defineProps<{
        /** Identificador do item; sem ele, um value automatico e gerado por ordem de montagem. */
        value?: string;
        /** Texto do header, alternativa ao slot #header. */
        title?: string;
        /** Impede abrir/fechar o item. */
        disabled?: boolean;
        /** Nivel do heading que envolve o botao, para leitores de tela. */
        headerAriaLevel?: number;
    }>(), {
        value: undefined,
        title: '',
        disabled: false,
        headerAriaLevel: 2
    });

    const context = injectAccordionContext('MaxAccordionItem');

    /**
     * Resolvido uma unica vez, no setup: com `value` explicito usa-o; sem ele,
     * consome o proximo id automatico do pai. Nao e computed de proposito —
     * o id automatico precisa ser estavel durante toda a vida do item.
     */
    const item_value = props.value ?? context.nextAutoValue();

    const is_open = computed(() => context.open_values.value.includes(item_value));

    const icon = computed(() => {
        if (is_open.value) return context.collapse_icon.value ?? 'iconoir:nav-arrow-up';
        return context.expand_icon.value ?? 'iconoir:nav-arrow-down';
    });

    const onClick = () => {
        if (props.disabled) return;
        context.toggle(item_value);
    };

    /**
     * No modo lazy o conteudo so entra no DOM na primeira abertura; depois
     * permanece montado, preservando o estado dos componentes filhos.
     */
    const was_open = ref(is_open.value);

    watch(is_open, (value) => {
        if (value) was_open.value = true;
    });

    const should_render = computed(() => ! context.lazy.value || was_open.value);

    defineExpose({ value: item_value });
</script>

<style lang="scss">
    .max-accordion-item {
        border-bottom: 1px solid var(--background-300);

        &:last-child {
            border-bottom: none;
        }

        &.max-accordion-item-disabled {
            opacity: 0.5;
        }

        .max-accordion-item-header-wrapper {
            margin: 0;

            .max-accordion-item-header {
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

                &:hover:not(.max-accordion-item-header-disabled) {
                    background-color: var(--background-300);
                }

                &.max-accordion-item-header-active {
                    color: var(--max-primary-500);
                }

                &.max-accordion-item-header-disabled {
                    cursor: not-allowed;
                }

                .max-accordion-item-header-icon {
                    flex-shrink: 0;
                }
            }
        }

        .max-accordion-item-content .max-accordion-item-content-inner {
            padding: 0 1rem 1rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-accordion-item .max-accordion-item-header-wrapper .max-accordion-item-header {
            transition: none;
        }
    }
</style>
