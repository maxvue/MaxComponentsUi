<template>
    <InputBase v-bind="attrs" class="input-phone">
        <div class="inputs-div">
            <Select v-model="country" :options="countryOptions" filter :filterFields="['name', 'value']">
                <template #option="slotProps">
                    <slot name="option" :option="slotProps.option" :selected="slotProps.selected" :index="slotProps.index">
                        <div class="label_div">
                            <img :src="'https://flagcdn.com/w40/' + slotProps.option.sigla.toLowerCase() + '.png'" alt="flag" />
                            <div class="labelz">
                                <div v-html="slotProps.option.label || slotProps.option.name" pt2></div>
                            </div>
                            <div class="subLabel" v-html="'( + ' + slotProps.option?.value + ' )'"></div>
                        </div>
                    </slot>
                </template>
                <template #value="value">
                    <div class="item-selected" v-if="value.value">
                        <div class="item-flag">
                            <img :src="'https://flagcdn.com/w40/' + value.value.sigla.toLowerCase() + '.png'" alt="bandeira" flex />
                        </div>
                        <div pl9 style="font-size: 0.85rem; color: var(--background-600);" p2>+ {{ value.value.value }}</div>
                    </div>
                </template>
            </Select>
            <InputText type="text" slot-b v-model="phone" v-maska:unmaskedValue.unmasked="maskValue" flex autoClear="false" slotChar=" " :placeholder="parseInt(country.value) === 55 ? '(99) 9 9999 - 9999' : ''" p0 @focus="onFocus = true" @blur="onFocus = false" />
        </div>
    </InputBase>
</template>

/**
 * Componente de entrada para telefone internacional.
 * Suporta seleção de país, máscara automática baseada no DDI e detecção de nono dígito para o Brasil.
 */
<script setup lang="ts">
    import { vMaska } from 'maska/vue';
    import { watchDebounced } from '@vueuse/core';

    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor do telefone (incluindo DDI, apenas números) */
            modelValue: string;
            /** Lista personalizada de países [{ name, value (DDI), sigla }] */
            countries?: any[];
        }>(),
        { modelValue: '' }
    );

    const emit = defineEmits(['update:modelValue']);

    const defaultCountries = [
        { name: 'Brasil', value: 55, sigla: 'br' },
        { name: 'United States', value: 1, sigla: 'us' },
        { name: 'Portugal', value: 351, sigla: 'pt' },
        { name: 'Argentina', value: 54, sigla: 'ar' },
        { name: 'Uruguay', value: 598, sigla: 'uy' }
    ];

    const countryOptions = computed(() => props.countries && props.countries.length > 0 ? props.countries : defaultCountries);

    const country: Ref = ref({ value: 55, sigla: 'br' });
    const phone: Ref = ref('');
    const noMask: Ref<boolean> = ref(false);
    const onFocus = ref(false);

    watch(phone, () => {
        if (phone.value.length > 0 && phone.value[0] === '0') phone.value = phone.value.substring(1);
    });

    const { ctrl, v } = useMagicKeys();
    watch( () => [ctrl.value, v.value], () => {
        if (ctrl.value && v.value && onFocus.value) {
            noMask.value = true;
            setTimeout(() => {
                noMask.value = false;
            }, 30);
        }
    });

    const item_selected = computed(() => countryOptions.value.find((item: any) => item.value === country.value.value) ?? null);

    const onlyNumbersStr = (str: string) => str ? String(str).replace(/\D/g, '') : '';

    watch(() => props.modelValue, () => {
        if (!props.modelValue?.length || props.modelValue?.length === 0) {
            phone.value = '';
            return;
        }
        const model_value = onlyNumbersStr(props.modelValue);
        country.value = { value: parseInt(model_value.substring(0, 1)) };

        if (item_selected.value) {
            country.value = item_selected.value;
            phone.value = model_value.substring(1);
            return;
        }

        if (props.modelValue?.length > 1) {
            country.value = { value: parseInt(model_value.substring(0, 2)) };
            if (item_selected.value) {
                country.value = item_selected.value;
                phone.value = model_value.substring(2);
                return;
            }
        }
        if (props.modelValue?.length > 2) {
            country.value = { value: parseInt(model_value.substring(0, 3)) };
            if (item_selected.value) {
                country.value = item_selected.value;
                phone.value = model_value.substring(3);
                return;
            }
        }
        country.value = { value: 55, sigla: 'br' };
    }, { immediate: true });

    const temp_value = computed(() => country.value.value + onlyNumbersStr(phone.value));
    const only_numbers = computed(() => onlyNumbersStr(temp_value.value));

    watchDebounced(
        temp_value,
        () => {
            if (temp_value.value !== props.modelValue) emit('update:modelValue', temp_value.value);
        },
        { debounce: 500 }
    );

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ },
            $: { pattern: /[0-9]/, optional: true },
            '@': { pattern: /[a-zA-Z0-9@(.+_-]/ },
            '%': { pattern: /[a-zA-Z0-9@().+_-\s]/, optional: true, repeated: true }
        };

        if (noMask.value) return {
            tokens: tokens,
            mask: '$$$$$$$$$$$$$$$$$$$$$$$$$$$$$'
        };

        if (country.value.value !== 55) return {
            tokens: tokens,
            mask: '%'
        };

        return {
            tokens: tokens,
            mask: onlyNumbersStr(only_numbers.value).length > 4 && (only_numbers.value[4] === '9' || only_numbers.value[4] === '8' || only_numbers.value[4] === '7' || only_numbers.value[4] === '6') ? '(##) 9 #### - ####$$' : '(##) #### - ####$$'
        };
    });
</script>

<style lang="scss">
    .input-phone {
        .input-slot {
            grid-template-columns: 1fr;
        }

        .inputs-div {
            display: grid;
            grid-template-columns: auto 1fr;
            width: 100%;
            position: relative;
            grid-column: 1 !important;
            place-items: center;

            .item-flag {
                width: 30px;
                aspect-ratio: 3/2;
                display: grid;
                place-items: center;
                border-radius: 5px;
                overflow: hidden;
            }
        }

        [slot-a] {
            grid-column: 1 !important;
        }

        [slot-b] {
            grid-column: 2 !important;
        }

        .item-selected {
            display: grid;
            grid-template-columns: 30px 1fr;
            place-items: center;
        }

        .p-select-dropdown {
            display: none;
        }

        .p-select-label {
            padding: 0 !important;
            position: relative;
        }

        .p-inputtext {
            padding: 0 2px !important;
        }
    }

    .p-select-overlay {
        display: grid;
        grid-template-rows: auto 1fr;
        overflow: hidden;
    }
</style>
