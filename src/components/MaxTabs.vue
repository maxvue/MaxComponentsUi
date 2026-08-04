<template>
    <div class="max-tabs" :class="{ 'max-tabs-scrollable': props.scrollable }">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { TABS_INJECTION_KEY, type TabsContext } from '../helpers/tabsContext';
    import { provide, toRef, ref } from 'vue';
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
        navigate,
        scrollable: toRef(props, 'scrollable'),
        show_navigators: toRef(props, 'showNavigators')
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
