<template>
    <div class="max-tabs">
        <div class="max-tabs-content">
            <div class="max-tabs-title" :id="'max-tab-' + tabs_id"></div>
            <div class="max-tab-content">
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { isValid, Random, useRefCached } from '@maxvue/max-use';
    import { provide, computed, watch, ref } from 'vue';

    type Props = {
        title?: string;
        icon?: string;
        id?: string | number;
        cached?: boolean;
    };

    const props = withDefaults( defineProps<Props>(), { title: '', icon: 'x', cached: true });

    /**
     * Sentinela devolvida pelo useRefCached quando ainda não há aba salva no
     * localStorage. Como `isValid` só rejeita null/undefined, ela precisa ser
     * checada explicitamente — sem isso a aba inicial seria sobrescrita por
     * este literal e nenhuma aba ficaria ativa na primeira visita.
     */
    const NO_CACHED = 'no-cached';

    const active_tab_cached = useRefCached<string | number>('max-tab-opened-' + (props.id ?? ''), NO_CACHED);

    const active_tab = defineModel<string | number>('value', { default: 0 });

    watch(active_tab_cached, () => {
        if (active_tab.value === active_tab_cached.value) return;
        if (active_tab_cached.value === NO_CACHED) return;
        if (isValid(props.id) && props.cached && isValid(active_tab_cached.value)) active_tab.value = active_tab_cached.value;
    }, { immediate: true });

    watch(active_tab, () => {
        if (active_tab.value === active_tab_cached.value) return;
        if (isValid(props.id) && props.cached) active_tab_cached.value = active_tab.value;
    });

    const tabs_id = computed(() => props.id ?? Random());

    function selectTab(id: string | number) {
        active_tab.value = id;
    }

    const count_tabs = ref(0);

    const add_count_tabs = (): number => {
        count_tabs.value++;
        return count_tabs.value;
    };

    /** Ids das abas montadas, na ordem de montagem. */
    const registered_tabs = ref<(string | number)[]>([]);

    const registerTab = (id: string | number) => {
        if (! registered_tabs.value.includes(id)) registered_tabs.value.push(id);
    };

    /**
     * Só há aba ativa se algum item registrado casar com o valor corrente.
     * Quando nada casa (valor inicial inexistente ou cache órfão de uma aba
     * removida), a primeira aba montada assume — evitando painel vazio.
     */
    const hasActiveTab = (): boolean => registered_tabs.value.some((id) => String(id) === String(active_tab.value));

    const selectFirstTabIfNoneActive = () => {
        if (hasActiveTab()) return;
        if (! registered_tabs.value.length) return;
        active_tab.value = registered_tabs.value[0];
    };

    provide('tabs_info', {
        active_tab: active_tab,
        registerTab,
        hasActiveTab,
        selectFirstTabIfNoneActive,
        tabs_id: tabs_id,
        count_tabs: count_tabs,
        add_count_tabs,
        selectTab
    });

</script>

<style lang="scss">
.max-tabs {
    display: grid;
    max-height: 100%;
    max-width: 100%;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .max-tabs-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        border: 1px solid var(--background-300);
        height: 100%;
        border-radius: 1rem;
        overflow: hidden;

        .max-tabs-title {
            display: flex;
            border-bottom: 1px solid var(--background-300);
            background-color: var(--background-50);
        }

        .max-tab-content {
            overflow: hidden;
            width: 100%;
            height: 100%;
            display: grid;
        }
    }
}

</style>
