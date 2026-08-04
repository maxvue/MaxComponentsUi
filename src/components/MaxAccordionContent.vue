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
