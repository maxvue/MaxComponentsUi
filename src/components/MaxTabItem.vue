<template>
    <teleport :to="'#max-tab-' + toValue(tabs_info?.tabs_id)" v-if="toValue(tabs_info?.tabs_id) && is_mounted">
        <div
            class="max-tab-item-title"
            :active="is_active"
            :disabled="props.disabled || undefined"
            @click="onTitleClick"
        >
            <max-icon :icon="props.icon ?? props.i" v-if="props.icon || props.i" size="1.2" />
            <slot name="title">{{ props.title }}</slot>
        </div>
    </teleport>
    <div class="max-tab-item-content" v-if="is_active">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { inject, ref, onMounted, toValue, computed } from 'vue';
    // import MaxIcon from './MaxIcon.vue';
    import { Random, watchOnce } from '@maxvue/max-use';

    type Props = {
        title?: string;
        icon?: string;
        i?: string;
        value?: string | number;
        disabled?: boolean;
    };

    const props = withDefaults( defineProps<Props>(), { });

    const tab_id = ref(null);

    const tabs_info: any = inject('tabs_info');

    const is_mounted = ref(false);

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
            if (! tab_id.value) tab_id.value = props.value ?? tabs_info.add_count_tabs();
        }, 0);
        setTimeout(() => {
            if (toValue(tabs_info?.active_tab) == 0 || toValue(tabs_info?.active_tab) === '' || toValue(tabs_info?.active_tab) === undefined) tabs_info?.selectTab(tab_id.value);
        }, 10);

    });

</script>

<style lang="scss">
.max-tab-panel {
    width: 100%;
}

.max-tab-item-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    color: var(--background-750);
    cursor: pointer;
    padding: 10px 20px;
    position: relative;

    &::before {
        content: '';
        left: 0;
        width: 100%;
        height: 100%;
        bottom: 0;
        position: absolute;
        color: var(--background-800);
        background-color: rgb(0 0 0 / 10%);
        opacity: 0;
        transition: opacity 0.2s;
    }

    &:hover {
        background-color: var(--background-100);
        color: var(--background-800);

        .max-icon {
            color: var(--background-800) !important;
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
            color: var(--background-800);
            background-color: var(--background-800);
        }


        .max-icon {
            color: var(--background-800) !important;
        }
    }

    &[disabled] {
        opacity: 0.4;
        cursor: not-allowed;

        &:hover {
            background-color: transparent;
            color: var(--background-750);
        }
    }
}

.max-tab-item-content {
    display: grid;
    padding: 1rem;
    overflow: hidden;
}
</style>