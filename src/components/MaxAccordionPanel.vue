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
