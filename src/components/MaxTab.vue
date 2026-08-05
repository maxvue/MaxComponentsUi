<template>
    <button ref="el" type="button" role="tab" class="max-tab" :class="{ 'max-tab-active': is_active, 'max-tab-disabled': props.disabled }" :id="`${context.id_prefix}-tab-${props.value}`" :data-tab-value="props.value" :aria-controls="`${context.id_prefix}-panel-${props.value}`" :aria-selected="is_active" :aria-disabled="props.disabled || undefined" :disabled="props.disabled" :tabindex="is_reachable ? context.tabindex.value : -1" @click="onClick" @focus="onFocus" >
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

    /**
     * Determina qual tab recebe tabindex 0. Quando o value ativo corresponde
     * a um tab registrado (has_registered_active_tab), o proprio is_active
     * decide — isso cobre tanto o caso comum quanto a janela antes de
     * qualquer tab se registrar via onMounted, onde has_registered_active_tab
     * fica true de forma conservadora para nao quebrar o value valido na
     * primeira renderizacao sincrona. So quando o value ativo e undefined OU
     * orfao (nao corresponde a nenhum tab ja registrado) e que caimos no
     * fallback do contexto — o primeiro tab habilitado, na ordem de registro
     * — para o tablist nunca ficar inteiramente fora do fluxo de tabulacao.
     */
    const is_reachable = computed(() => {
        if (context.has_registered_active_tab.value) return is_active.value;
        return context.fallback_tab_value.value === props.value;
    });

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
