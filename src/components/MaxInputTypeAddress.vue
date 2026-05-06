<template>
    <MaxInputSelect v-bind="attrs" :options="listTypeAddress" :optionLabel="attrs.optionLabel ?? 'name'" :optionValue="attrs.optionValue ?? 'value'" v-model="inputValue" />
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs } from 'vue';
    import MaxInputSelect from './MaxInputSelect.vue';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            street?: string;
        }>(),
        { modelValue: '' }
    );

    const inputValue = ref(props.modelValue);
    const emit = defineEmits(['update:modelValue']);
    const street = computed(() => attrs.street ?? props.street);

    const listTypeAddress = [
        { name: 'Rua', value: 'Rua', values: ['rua', 'r'] },
        { name: 'Avenida', value: 'Avenida', values: ['avenida', 'av', 'ave'] },
        { name: 'Alameda', value: 'Alameda', values: ['alameda', 'al'] },
        { name: 'Praça', value: 'Praça', values: ['praca', 'pra', 'pca'] },
        { name: 'Rodovia', value: 'Rodovia', values: ['rodovia', 'rod'] },
        { name: 'Travessa', value: 'Travessa', values: ['travessa', 'trav', 'trv'] },
        { name: 'Vila', value: 'Vila', values: ['vila', 'vl'] },
        { name: 'Estrada', value: 'Estrada', values: ['estrada', 'est'] },
        { name: 'Viela', value: 'Viela', values: ['viela'] },
        { name: 'Beco', value: 'Beco', values: ['beco'] },
        { name: 'Caminho', value: 'Caminho', values: ['caminho'] },
        { name: 'Largo', value: 'Largo', values: ['largo'] }
    ];

    const toSearchable = (str: string) => {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    };

    watch(street, () => {
        if (street.value) {
            const first_word = toSearchable(street.value.split(' ')[0]);
            for (let item of listTypeAddress) if (item.values.includes(first_word)) {
                if (inputValue.value !== item.value) {
                    inputValue.value = item.value;
                    emit('update:modelValue', item.value);
                }
                break;
            }

        }
    }, { immediate: true, deep: true });

    watch(inputValue, (val) => {
        emit('update:modelValue', val);
    });

    watch(() => props.modelValue, (val) => {
        inputValue.value = val;
    });
</script>

<style lang="scss">
    .label_div-type-address {
        display: grid;
        grid-template-columns: auto 1fr;
        width: 100% !important;
        place-items: center start;
        gap: 10px;

        .icon-div {
            color: var(--background-650) !important;
        }

        &:hover {
            .icon-div {
                color: var(--background-650) !important;
            }
        }

        .subLabel {
            color: var(--gray-500);
            padding-left: 1rem;
            text-align: right;
            width: 100%;
            font-size: 0.85rem;
        }

        .labelz {
            display: grid;
            place-items: center;
        }
    }
</style>
