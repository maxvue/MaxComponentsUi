<template>
    <div
        ref="el"
        class="max-tab"
        :class="{ 'max-tab-active': is_active, 'max-tab-disabled': disabled }"
        role="tab"
        :id="`${context.id_prefix}-tab-${value}`"
        :data-tab-value="value"
        :aria-selected="is_active ? 'true' : 'false'"
        :aria-disabled="disabled ? 'true' : 'false'"
        :aria-controls="`${context.id_prefix}-panel-${value}`"
        :tabindex="is_tabbable ? '0' : '-1'"
        @click="onClick"
        @focus="onFocus"
    >
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { injectTabsContext } from '../helpers/tabsContext';
    import { computed, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';

    const props = withDefaults(defineProps<{
        /** Identificador do tab, casado com o MaxTabPanel de mesmo value. */
        value: string;
        disabled?: boolean;
    }>(), {
        disabled: false
    });

    const context = injectTabsContext('MaxTab');

    const el = useTemplateRef<HTMLElement>('el');

    const is_active = computed(() => context.effective_active_value.value === props.value);

    const is_tabbable = computed(() => {
        if (is_active.value) return true;
        if (! context.has_registered_active_tab.value) return context.fallback_tab_value.value === props.value;
        return false;
    });

    const onClick = () => {
        if (props.disabled) return;
        context.select(props.value);
    };

    const onFocus = () => {
        if (props.disabled) return;
        if (context.select_on_focus.value) context.select(props.value);
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
