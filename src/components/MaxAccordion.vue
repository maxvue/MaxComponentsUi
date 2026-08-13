<template>
    <div class="max-accordion">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { ACCORDION_INJECTION_KEY } from '../helpers/accordionContext';
    import { provide, toRef, computed } from 'vue';
    import { Random } from '@maxvue/max-use';

    const props = withDefaults(defineProps<{
        /** Permite manter varios itens abertos ao mesmo tempo. */
        multiple?: boolean;
        /** Monta o conteudo do item apenas quando ele abre. */
        lazy?: boolean;
        /** Icone exibido quando o item esta fechado. */
        expandIcon?: string;
        /** Icone exibido quando o item esta aberto. */
        collapseIcon?: string;
    }>(), {
        multiple: false,
        lazy: false,
        expandIcon: undefined,
        collapseIcon: undefined
    });

    /** Item aberto (string) ou itens abertos (array, com multiple). */
    const value = defineModel<string | string[] | undefined>('value');

    /** Normaliza value para array, independente do modo. */
    const open_values = computed<string[]>(() => {
        if (value.value === undefined) return [];
        return Array.isArray(value.value) ? value.value : [value.value];
    });

    const id_prefix = `max-accordion-${Random()}`;

    const toggle = (item_value: string) => {

        const is_open = open_values.value.includes(item_value);

        if (props.multiple) value.value = is_open
            ? open_values.value.filter((item) => item !== item_value)
            : [...open_values.value, item_value];
        else value.value = is_open ? undefined : item_value;
    };

    /**
     * Contador de itens sem `value` explicito. Cada MaxAccordionItem pede o
     * seu na montagem, na mesma ordem em que aparece no template.
     */
    let auto_count = 0;

    const nextAutoValue = () => {
        auto_count++;
        return `item-${auto_count}`;
    };

    provide(ACCORDION_INJECTION_KEY, {
        open_values,
        toggle,
        lazy: toRef(props, 'lazy'),
        expand_icon: toRef(props, 'expandIcon'),
        collapse_icon: toRef(props, 'collapseIcon'),
        id_prefix,
        nextAutoValue
    });

    defineExpose({ toggle });
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
