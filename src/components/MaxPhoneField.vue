<template>
    <InputBase class="input-phone" v-bind="props" :value="temp_value" :done="done" :error="error" :caution="caution" :label="props.noLabel ? undefined : props.label ?? ('Telefone' + String(props.noLabel)) " :icon-right="props.noIcon ? undefined : 'ic:baseline-whatsapp'" >
        <div class="inputs-div">
            <Select v-model="country" :options="country_ddi_flags" filter :filterFields="['name', 'value']">
                <template #option="slotProps">
                    <slot name="option" :option="slotProps.option" :selected="slotProps.selected" :index="slotProps.index">
                        <div class="input-phone-label-div">
                            <img :src="'https://flagcdn.com/w40/' + slotProps.option.sigla.toLowerCase() + '.png'" alt="flag" />
                            <div class="labelz">
                                <div pt2 elipsis >{{ slotProps.option.label }}</div>
                            </div>
                            <div class="subLabel">( +{{ slotProps.option?.value }} )</div>
                        </div>
                    </slot>
                </template>
                <template #value="value: any">
                    <div class="item-selected">
                        <div class="item-flag">
                            <img :src="'https://flagcdn.com/w40/' + value.value.sigla.toLowerCase() + '.png'" alt="bandeira" flex />
                        </div>
                        <div style="color: var(--background-600);">+ {{ value.value.value }}</div>
                    </div>
                </template>
            </Select>
            <InputText type="text" slot-b v-model="phone" v-maska:unmaskedValue.unmasked="maskValue" flex :autoClear="false" slotChar=" " :placeholder="country.value === 55 ? '(99) 9 9999 - 9999' : ''" p0 fluid/>
        </div>
    </InputBase>
</template>

<script setup lang="ts">
    import { watchDebounced, refAutoReset } from '@maxvue/max-use';
    import { useMagicKeys } from '@maxvue/max-use';
    import { ref, computed, watch } from 'vue';
    import InputBase from './InputBase.vue';
    import Select from 'primevue/select';
    import InputText from 'primevue/inputtext';
    import { vMaska } from 'maska/vue';
    import { country_ddi_flags } from '../constants/ddiFlags';

    const props = withDefaults(
        defineProps<{
            icon?: string | undefined;
            i?: string | undefined;
            disabled?: boolean | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
            required?: boolean;
            noLabel?: boolean;
            noIcon?: boolean;
        }>(),
        { done: undefined, required: false, caution: undefined, noLabel: false, noIcon: false }
    );

    const temp_value = computed(() => country.value.value + phone.value.replace(/\D/g, ''));
    const modelValue = defineModel<any>({ default: '' });
    const only_numbers = computed(() => String(temp_value.value).replace(/\D/g, ''));

    const country = ref(country_ddi_flags.find((f) => f.ddi === 55) || country_ddi_flags[0]);
    const phone = ref('');
    const noMask = refAutoReset(false, 50);
    const onFocus = ref(false);

    watch(phone, () => {
        if (phone.value.startsWith('0')) phone.value = phone.value.substring(1);
    });

    const { ctrl, v } = useMagicKeys();
    watch(() => [ctrl.value, v.value], () => noMask.value = ctrl.value && v.value && onFocus.value);

    watch(modelValue, (newVal) => {
        if (!newVal) {
            phone.value = '';
            return;
        }

        const digits = newVal.replace(/\D/g, '');
        if (digits === temp_value.value.replace(/\D/g, '')) return;

        // Tenta encontrar o DDI correspondente (3, 2 ou 1 dígito)
        for (let i = 3; i >= 1; i--) {
            const ddi = parseInt(digits.substring(0, i));
            const found = country_ddi_flags.find((f) => f.ddi === ddi);
            if (found) {
                country.value = found;
                phone.value = digits.substring(i);
                return;
            }
        }

        // Default caso não encontre
        country.value = country_ddi_flags.find((f) => f.ddi === 55) || country_ddi_flags[0];
        phone.value = digits;
    }, { immediate: true });


    watchDebounced(temp_value, () => {
        if (temp_value.value !== modelValue.value) modelValue.value = temp_value.value;
    }, { debounce: 500 });

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
            mask: only_numbers.value.length > 4 && ['6','7','8','9'].includes(only_numbers.value[4])
                ? '(##) 9 #### - ####$$'
                : '(##) #### - ####$$'
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
        height: 36px !important;
        border-radius: var(--max-inputtext-border-radius);
        border: 1px solid var(--max-inputtext-border-color);

        &:focus-within {
            border-color: var(--max-inputtext-focus-border-color);
        }

        .p-select {
            height: 36px;
            background-color: transparent !important;
            border: none !important;
            width: 80px;

            .p-select-label {
                height: 36px;
                background-color: transparent !important;

                .item-selected {
                    display: grid;
                    grid-template-columns: 25px 1fr;
                    place-items: center;
                    height: 100%;
                    padding-left: 5px;

                    .item-flag {
                        width: 20px;
                        height: 14px;
                        display: grid;
                        place-items: center;
                        border-radius: 5px;
                        overflow: hidden;
                        left: 0;
                        font-size: 1rem;

                        img {
                            width: 21px;
                            aspect-ratio: 3/2;
                        }
                    }
                }
            }
        }

        input {
            border: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
        }
    }

    .p-inputicon {
        transform: translateY(-2px) !important;
    }

    [slot-a] {
        grid-column: 1 !important;
    }

    [slot-b] {
        grid-column: 2 !important;
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

.input-phone-label-div {
    display: grid;
    grid-template-columns: auto 1fr auto;
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
        color: var(--background-600);
        padding-left: 1rem;
        text-align: right;
        width: 100%;
        font-size: 0.85rem;
    }

    .labelz {
        display: grid;
        place-items: center;
        color: var(--background-750);
    }

    img {
        width: 40px;
        height: 28px;
        border-radius: 5px;
        border: 1px solid rgb(0 0 0 / 20%);
    }
}

.p-select-option {
    gap: 0 !important;
    display: grid !important;
}
</style>