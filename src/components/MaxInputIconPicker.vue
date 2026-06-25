<template>
    <InputBase
        v-bind="props"
        :done="props.done ?? isDone"
        :error="props.error ?? error_msg"
        :caution="caution"
        class="max-input-icon-picker"
        @click.stop="openDrawer"
    >
        <div class="icon-picker-trigger p-inputtext" pointer :class="{ 'is-disabled': props.disabled }">
            <MaxIcon
                :i="modelValue || 'tabler:icons-filled'"
                size="1.2"
                :color="modelValue && props.color ? props.color : undefined"
                :dark="!modelValue ? 0.3 : 0.5"
            />
            <span class="trigger-label">{{ modelValue || props.placeholder || 'Escolha um ícone' }}</span>
            <MaxIcon i="mdi:chevron-down" size="0.9" :dark="0.4" />
        </div>
    </InputBase>

    <Drawer
        v-model:visible="visible"
        header="Escolha um ícone"
        position="bottom"
        class="max-icon-picker-drawer"
    >
        <div class="picker-search-area">
            <PrimeInputText v-model="search" placeholder="Pesquisar ícones..." fluid />
        </div>

        <div v-if="isLoading" class="picker-state-area">
            <MaxIcon i="svg-spinners:ring-resize" size="2" :dark="0.4" />
        </div>

        <div v-else-if="rows.length === 0 && search.length >= 2" class="picker-state-area">
            Nenhum ícone encontrado para "{{ search }}"
        </div>

        <VirtualScroller
            v-else
            :items="rows"
            :itemSize="40"
            :style="{ height: 'calc(90dvh - 140px)' }"
            class="icon-virtual-list"
        >
            <template #item="{ item }">
                <div class="icon-row">
                    <div
                        v-for="icon in (item as string[])"
                        :key="icon"
                        class="icon-cell"
                        :class="{ selected: modelValue === icon }"
                        @click.stop="selectIcon(icon)"
                        v-tooltip="icon"
                        pointer
                    >
                        <MaxIcon :i="icon" size="1.5" />
                    </div>
                </div>
            </template>
        </VirtualScroller>
    </Drawer>
</template>

<script setup lang="ts">
    import { hasContent, watchDebounced } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs } from 'vue';
    import type { Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import PrimeInputText from 'primevue/inputtext';
    import Drawer from 'primevue/drawer';
    import VirtualScroller from 'primevue/virtualscroller';

    const COLS = 8;

    const POPULAR_ICONS: string[] = [
        // Finanças
        'mdi:cash', 'mdi:cash-multiple', 'mdi:credit-card', 'mdi:credit-card-outline',
        'mdi:bank', 'mdi:bank-outline', 'mdi:wallet', 'mdi:wallet-outline',
        'mdi:piggy-bank', 'mdi:piggy-bank-outline', 'mdi:currency-usd', 'mdi:currency-eur',
        'mdi:currency-brl', 'mdi:chart-line', 'mdi:chart-bar', 'mdi:chart-pie',
        'mdi:trending-up', 'mdi:trending-down', 'mdi:trending-neutral', 'mdi:receipt',
        'mdi:receipt-text', 'mdi:calculator', 'mdi:tag', 'mdi:tag-outline',
        'mdi:coins', 'mdi:safe', 'mdi:percent', 'mdi:ticket-percent',
        'mdi:account-cash', 'mdi:cash-register', 'mdi:transfer', 'mdi:swap-horizontal',
        // Casa & Moradia
        'mdi:home', 'mdi:home-outline', 'mdi:sofa', 'mdi:bed', 'mdi:shower',
        'mdi:fridge', 'mdi:television', 'mdi:lightbulb', 'mdi:water', 'mdi:fire',
        'mdi:tools', 'mdi:broom', 'mdi:air-conditioner', 'mdi:washing-machine',
        'mdi:apartment', 'mdi:office-building', 'mdi:garage', 'mdi:key',
        // Alimentação
        'mdi:food', 'mdi:food-fork-drink', 'mdi:food-apple', 'mdi:coffee',
        'mdi:beer', 'mdi:pizza', 'mdi:hamburger', 'mdi:cake', 'mdi:ice-cream',
        'mdi:silverware-fork-knife', 'mdi:cart', 'mdi:shopping', 'mdi:basket',
        // Transporte
        'mdi:car', 'mdi:car-outline', 'mdi:bus', 'mdi:train', 'mdi:airplane',
        'mdi:bicycle', 'mdi:motorbike', 'mdi:taxi', 'mdi:ferry', 'mdi:subway',
        'mdi:gas-station', 'mdi:parking', 'mdi:road-variant', 'mdi:map-marker',
        // Saúde
        'mdi:medical-bag', 'mdi:heart', 'mdi:heart-outline', 'mdi:pill',
        'mdi:doctor', 'mdi:hospital', 'mdi:dumbbell', 'mdi:yoga', 'mdi:run',
        'mdi:tooth', 'mdi:eye', 'mdi:stethoscope',
        // Educação
        'mdi:school', 'mdi:book', 'mdi:book-open', 'mdi:pen', 'mdi:pencil',
        'mdi:backpack', 'mdi:graduation-cap', 'mdi:laptop', 'mdi:monitor',
        // Lazer & Entretenimento
        'mdi:movie', 'mdi:music', 'mdi:gamepad', 'mdi:headphones',
        'mdi:guitar', 'mdi:soccer', 'mdi:basketball', 'mdi:tennis',
        'mdi:swim', 'mdi:theater', 'mdi:ticket', 'mdi:music-note',
        // Tecnologia
        'mdi:phone', 'mdi:cellphone', 'mdi:wifi', 'mdi:cloud', 'mdi:email',
        'mdi:printer', 'mdi:keyboard', 'mdi:mouse', 'mdi:server',
        'mdi:shield', 'mdi:lock', 'mdi:magnify',
        // Trabalho
        'mdi:briefcase', 'mdi:clipboard-text', 'mdi:calendar', 'mdi:clock',
        'mdi:account', 'mdi:account-group', 'mdi:handshake', 'mdi:presentation',
        'mdi:chart-gantt', 'mdi:file-document',
        // Vestuário
        'mdi:tshirt-crew', 'mdi:shoe-heel', 'mdi:hanger', 'mdi:glasses',
        'mdi:sunglasses', 'mdi:hat-fedora',
        // Pets
        'mdi:dog', 'mdi:cat', 'mdi:paw', 'mdi:bird', 'mdi:fish',
        // Outros
        'mdi:gift', 'mdi:charity', 'mdi:recycle', 'mdi:star', 'mdi:flag',
        'mdi:earth', 'mdi:weather-sunny', 'mdi:umbrella', 'mdi:baby-carriage',
        'mdi:flower', 'mdi:leaf', 'mdi:tree', 'mdi:bottle-wine', 'mdi:barley'
    ];

    const attrs: any = useAttrs();

    const modelValue = defineModel<string>({ default: '' });

    const props = withDefaults(
        defineProps<{
            /** Cor aplicada ao ícone selecionado no trigger */
            color?: string;
            /** Desabilita o campo */
            disabled?: boolean;
            /** Ativa estilo FloatLabel */
            float?: boolean;
            /** Mensagem de feedback (alias) */
            msg?: string;
            /** Mensagem de feedback */
            message?: string;
            /** Ícone da mensagem de feedback */
            iconMessage?: string;
            /** Rótulo do campo */
            label?: string;
            /** Estado de conclusão/validação manual */
            done?: boolean;
            /** Mensagem ou estado de erro */
            error?: string | boolean;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean;
            /** Define se o campo é obrigatório */
            required?: boolean;
            /** Texto de placeholder quando nenhum ícone está selecionado */
            placeholder?: string;
        }>(),
        {
            done: undefined,
            required: false,
            caution: undefined,
            disabled: false,
            error: undefined
        }
    );

    const visible = ref(false);
    const search = ref('');
    const apiIcons = ref<string[]>([]);
    const isLoading = ref(false);
    const isDone: Ref = ref(props.done ?? null);

    const isRequiredDone = computed(() => (props.required ? hasContent(modelValue.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => (
        props.caution !== undefined
            ? props.caution && isDone.value === false
            : isDone.value === false
    ));

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Valor inválido';
    });

    const toRows = (icons: string[]): string[][] => {
        const result: string[][] = [];
        for (let i = 0; i < icons.length; i += COLS) result.push(icons.slice(i, i + COLS));

        return result;
    };

    const rows = computed<string[][]>(() => {
        if (search.value.length >= 2) return toRows(apiIcons.value);
        return toRows(POPULAR_ICONS);
    });

    const openDrawer = () => {
        if (props.disabled) return;
        search.value = '';
        apiIcons.value = [];
        visible.value = true;
    };

    const selectIcon = (icon: string) => {
        modelValue.value = icon;
        isDone.value = testIsDone();
        visible.value = false;
    };

    watchDebounced(() => search.value, async (val: string) => {
        if (val.length < 2) {
            apiIcons.value = [];
            return;
        }
        isLoading.value = true;
        try {
            const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(val)}&limit=120`);
            const data = await res.json();
            apiIcons.value = data.icons ?? [];
        } catch {
            apiIcons.value = [];
        } finally {
            isLoading.value = false;
        }
    }, { debounce: 400 });

    watch(modelValue, () => {
        isDone.value = testIsDone();
    });

    defineEmits<{
        'update:modelValue': [value: string];
    }>();
</script>

<style lang="scss">
.max-input-icon-picker {
    .icon-picker-trigger {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        height: 36px;
        width: 100%;
        cursor: pointer;

        &.is-disabled {
            cursor: not-allowed;
            opacity: 0.6;
        }

        .trigger-label {
            flex: 1;
            font-size: 0.875rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.max-icon-picker-drawer {
    height: 90dvh;

    .picker-search-area {
        padding: 0 4px 14px;
    }

    .picker-state-area {
        display: flex;
        align-items: center;
        justify-content: center;
        height: calc(90dvh - 140px);
        color: var(--background-500);
        font-size: 0.9rem;
        gap: 0.5rem;
    }

    .icon-virtual-list {
        width: 100%;
    }

    .icon-row {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        height: 40px;
        align-items: center;
    }

    .icon-cell {
        display: grid;
        place-items: center;
        height: 40px;
        border-radius: 6px;
        transition: background-color 0.15s ease;

        &:hover {
            background-color: var(--background-100);
        }

        &.selected {
            background-color: var(--max-primary-100);

            .max-icon-div {
                color: var(--max-primary-600) !important;
            }
        }
    }
}
</style>
