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

    /** Headers registrados, na ordem de montagem, para navegacao por setas. */
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
        else emit('update:value', is_open ? undefined : value);

        if (is_open) emit('tab-close', { value });
        else emit('tab-open', { value });
    };

    const registerHeader: AccordionContext['registerHeader'] = (value, el, disabled) => {
        headers.value.push({ value, el, disabled });
        return () => {
            headers.value = headers.value.filter((header) => header.value !== value);
        };
    };

    /**
     * Move o foco para outro header, pulando os desabilitados e dando a volta
     * nas extremidades. Com selectOnFocus, abre o painel focado se ainda nao
     * estiver aberto.
     */
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
