<template>
    <teleport :to="'#max-tab-' + toValue(tabs_info?.tabs_id)" v-if="toValue(tabs_info?.tabs_id) && is_mounted">
        <div class="max-tab-item-title" :active="is_active" @click="tabs_info?.selectTab(tab_id)">
            <max-icon :icon="props.icon ?? props.i" v-if="props.icon || props.i" size="1.2" />
            {{ props.title }}
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
    };

    const props = withDefaults( defineProps<Props>(), { });

    const tab_id = ref(null);

    const tabs_info: any = inject('tabs_info');

    const is_mounted = ref(false);

    const is_active = computed(() => String(toValue(tabs_info?.active_tab)) === String(toValue(tab_id)));

    onMounted(() => {
        is_mounted.value = true;

        setTimeout(() => {
            // Usa o `value` informado como identificador da aba; sem ele, mantém a
            // numeração automática por ordem de montagem (compatibilidade).
            if (! tab_id.value) tab_id.value = props.value ?? tabs_info.add_count_tabs();
            tabs_info?.registerTab?.(tab_id.value);
        }, 0);
        setTimeout(() => {
            // A aba só é escolhida automaticamente quando NENHUMA das registradas
            // casa com o valor corrente. Testar se o valor "parece vazio" não serve:
            // uma aba com value="0" satisfaria a comparação e cada item seguinte
            // sobrescreveria o anterior, abrindo sempre a aba errada.
            tabs_info?.selectFirstTabIfNoneActive?.();
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

    &:hover {
        background-color: var(--background-50);
        color: var(--background-800);

        .max-icon {
            color: var(--background-800) !important;
        }
    }

    &[active='true'] {
        background-color: var(--background-150);

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
}
</style>
\