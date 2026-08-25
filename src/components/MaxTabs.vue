<template>
    <div class="max-tabs">
        <div class="max-tabs-content">
            <div :class="`max-tabs-title ${spread ? 'spread' : ''}`">
                <div class="max-tabs-title-items" :id="'max-tab-' + tabs_id"></div>
                <div class="max-tabs-title-buttons" :id="'max-tab-buttons-' + tabs_id"></div>

            </div>

            <div class="max-tab-content">
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { isValid, Random, useRefCached } from '@maxvue/max-use';
    import { TABS_INJECTION_KEY } from '../helpers/tabsContext';
    import { provide, computed, watch, ref, toRef } from 'vue';

    type Props = {
        title?: string;
        icon?: string;
        id?: string | number;
        cached?: boolean;
        /** Monta o conteudo do painel apenas quando ativado pela primeira vez. */
        lazy?: boolean;
        /** Ativa o tab ao receber foco, sem exigir clique. */
        selectOnFocus?: boolean;
        /** tabindex aplicado aos headers. */
        tabindex?: number;
        /** Habilita rolagem horizontal dos headers quando houver overflow. */
        scrollable?: boolean;
        /** Exibe os botoes de navegacao no modo scrollable. */
        showNavigators?: boolean;
        spread?:boolean;
    };

    const props = withDefaults( defineProps<Props>(), {
        title: '',
        icon: 'x',
        cached: true,
        lazy: false,
        selectOnFocus: false,
        tabindex: 0,
        scrollable: false,
        showNavigators: true
    });

    /**
     * Sentinela devolvida pelo useRefCached quando ainda não há aba salva no
     * localStorage. Como `isValid` só rejeita null/undefined, ela precisa ser
     * checada explicitamente — sem isso a aba inicial seria sobrescrita por
     * este literal e nenhuma aba ficaria ativa na primeira visita.
     */
    const NO_CACHED = 'no-cached';

    const active_tab_cached = useRefCached<string | number>('max-tab-opened-' + (props.id ?? ''), NO_CACHED);

    const active_tab = defineModel<string | number>('value');

    watch(active_tab_cached, () => {
        if (active_tab.value === active_tab_cached.value) return;
        if (active_tab_cached.value === NO_CACHED) return;
        if (isValid(props.id) && props.cached && isValid(active_tab_cached.value)) active_tab.value = active_tab_cached.value;
    }, { immediate: true });

    watch(active_tab, () => {
        if (active_tab.value === active_tab_cached.value) return;
        if (isValid(props.id) && props.cached && isValid(active_tab.value)) active_tab_cached.value = active_tab.value;
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

    /** Value ativo do novo sistema de tabs, sempre normalizado como string. */
    const active_value = computed(() => (active_tab.value === undefined ? undefined : String(active_tab.value)));

    /** Headers registrados pelos MaxTab, na ordem de montagem. */
    const tab_headers = ref<{ value: string; el: HTMLElement; disabled: () => boolean }[]>([]);

    const registerTabHeader = (value: string, el: HTMLElement, disabled: () => boolean) => {
        tab_headers.value.push({ value, el, disabled });
        return () => {
            tab_headers.value = tab_headers.value.filter((header) => header.value !== value);
        };
    };

    /** Value do primeiro tab habilitado, na ordem de registro. */
    const fallback_tab_value = computed(() => tab_headers.value.find((header) => ! header.disabled())?.value);

    /**
     * Antes de qualquer tab se registrar, fica true de forma conservadora
     * (janela entre a primeira renderizacao e o onMounted dos MaxTab
     * filhos) — assim a ausencia temporaria de registro nao e tratada como
     * "value orfao".
     */
    const has_registered_active_tab = computed(() => {
        if (! tab_headers.value.length) return true;
        if (active_value.value === undefined) return false;
        return tab_headers.value.some((header) => header.value === active_value.value);
    });

    /**
     * Value efetivamente selecionado para exibicao: usa active_value quando
     * ele corresponde a um tab registrado; caso contrario (sem v-model, ou
     * value orfao) cai para fallback_tab_value, garantindo que sempre haja
     * um tab selecionado e um painel visivel — mesmo no modo nao controlado.
     */
    const effective_active_value = computed(() => (has_registered_active_tab.value ? active_value.value : fallback_tab_value.value));

    const select = (value: string) => {
        active_tab.value = value;
    };

    /**
     * Move a selecao a partir de uma tecla de navegacao, pulando tabs
     * desabilitados e dando a volta nas extremidades.
     */
    const navigate = (from: string, key: 'next' | 'prev' | 'first' | 'last') => {

        const enabled = tab_headers.value.filter((header) => ! header.disabled());
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
        if (props.selectOnFocus) select(header.value);
    };

    provide(TABS_INJECTION_KEY, {
        active_value,
        fallback_tab_value,
        has_registered_active_tab,
        effective_active_value,
        select,
        lazy: toRef(props, 'lazy'),
        select_on_focus: toRef(props, 'selectOnFocus'),
        tabindex: toRef(props, 'tabindex'),
        id_prefix: `max-tabs-${Random()}`,
        registerTab: registerTabHeader,
        navigate,
        scrollable: toRef(props, 'scrollable'),
        show_navigators: toRef(props, 'showNavigators')
    });

    defineExpose({ select, navigate });
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
            display: grid;
            grid-template-columns: 1fr auto;
            border-bottom: 1px solid var(--background-300);
            width: 100%;
            place-items: center start;

            &.spread{
                .max-tabs-title-items {

                    width: 100%;
                    .max-tab-item-title{
                        flex-grow: 1 !important;
                    }
                }
            }

            .max-tabs-title-items {
                display: flex;
                background-color: var(--background-50);
            }

            .max-tabs-title-buttons {
                display: grid;
            }

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
