<template>
    <teleport :to="'#max-tab-' + toValue(tabs_info?.tabs_id)" v-if="toValue(tabs_info?.tabs_id) && is_mounted">
        <div
            class="max-tab-item-title"
            :class="{ 'max-tab-active': is_active, 'max-tab-disabled': props.disabled }"
            :active="is_active"
            :disabled="props.disabled || undefined"
            role="tab"
            :id="`tab-${uniqueTabId}`"
            :aria-controls="`tabpanel-${uniqueTabId}`"
            :aria-selected="is_active ? 'true' : 'false'"
            :tabindex="is_active ? 0 : -1"
            @click="onTitleClick"
            @keydown.enter.prevent="onTitleClick"
            @keydown.space.prevent="onTitleClick"
        >
            <MaxIcon :icon="props.icon ?? props.i" v-if="props.icon || props.i" size="1.2" />
            <slot name="title">{{ props.title }}</slot>
        </div>
    </teleport>
    <teleport :to="'#max-tab-buttons-' + toValue(tabs_info?.tabs_id)" v-if="toValue(tabs_info?.tabs_id) && is_mounted && is_active && props.actionButton && (props.actionButtonLabel || props.actionButtonIcon)">
        <div @click="props.actionButton" class="button-tab-item">
            <MaxButton :label="props.actionButtonLabel" :icon="props.actionButtonIcon" v-if="props.actionButtonLabel" />
            <MaxIconButton :icon="props.actionButtonIcon" v-else />
        </div>
    </teleport>
    <div
        class="max-tab-item-content"
        v-if="is_active"
        role="tabpanel"
        :id="`tabpanel-${uniqueTabId}`"
        :aria-labelledby="`tab-${uniqueTabId}`"
        tabindex="0"
    >
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { inject, ref, onMounted, toValue, computed } from 'vue';
    import { Random } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import MaxButton from './MaxButton.vue';
    import MaxIconButton from './MaxIconButton.vue';

    type Props = {
        title?: string;
        icon?: string;
        i?: string;
        value?: string | number;
        actionButtonLabel?: string;
        actionButtonIcon?: string;
        actionButton?: (event?: MouseEvent) => unknown;
        disabled?: boolean;
    };

    const props = withDefaults(defineProps<Props>(), {});

    const tab_id = ref(null);

    const tabs_info: any = inject('tabs_info');

    const is_mounted = ref(false);

    const fallbackId = Random();
    const uniqueTabId = computed(() => {
        return String(props.value ?? tab_id.value ?? fallbackId);
    });

    // Aba desabilitada não seleciona — o atributo [disabled] cuida do visual.
    function onTitleClick() {
        if (props.disabled) return;
        tabs_info?.selectTab(tab_id.value);
    }

    const is_active = computed(() => String(toValue(tabs_info?.active_tab)) === String(toValue(tab_id)));

    onMounted(() => {
        is_mounted.value = true;

        setTimeout(() => {
            // Usa o `value` informado como identificador da aba; sem ele, mantém a
            // numeração automática por ordem de montagem (compatibilidade).
            if (!tab_id.value) tab_id.value = props.value ?? tabs_info.add_count_tabs();
        }, 0);
        setTimeout(() => {
            if (toValue(tabs_info?.active_tab) == 0 || toValue(tabs_info?.active_tab) === '' || toValue(tabs_info?.active_tab) === undefined) tabs_info?.selectTab(tab_id.value);
        }, 10);
    });
</script>

<style lang="scss" scoped>
.max-tab-item-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    color: var(--background-700);
    cursor: pointer;
    padding: 10px 20px;
    position: relative;
    user-select: none;
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;

    &:focus-visible {
        outline: 2px solid var(--max-primary-500, #00768E);
        outline-offset: -2px;
        border-radius: 4px;
    }

    &::before {
        content: '';
        left: 0;
        width: 100%;
        height: 100%;
        bottom: 0;
        position: absolute;
        color: var(--background-775);
        background-color: rgb(0 0 0 / 10%);
        opacity: 0;
        transition: opacity 0.2s;
    }

    &:hover {
        background-color: var(--background-100);
        color: var(--background-775);

        :deep(.max-icon) {
            color: var(--background-775) !important;
        }

        &::before {
            opacity: 1;
        }
    }

    &[active='true'] {
        background-color: var(--background-175);

        &::after {
            content: '';
            left: 0;
            width: 100%;
            height: 2px;
            bottom: 0;
            position: absolute;
            color: var(--background-775);
            background-color: var(--background-775);
        }

        :deep(.max-icon) {
            color: var(--background-775) !important;
        }
    }

    &[disabled] {
        opacity: 0.4;
        cursor: not-allowed;

        &:hover {
            background-color: transparent;
            color: var(--background-650);
        }
    }
}

.button-tab-item {
    padding: 0 8px;
    max-height: 25px;
}

.max-tab-item-content {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    height: 100%;
    min-height: 0;
    flex: 1 1 0;
    box-sizing: border-box;
    padding: 1rem;
    overflow: hidden;

    &:focus-visible {
        outline: 2px solid var(--max-primary-500, #00768E);
        outline-offset: -2px;
        border-radius: 4px;
    }
}
</style>