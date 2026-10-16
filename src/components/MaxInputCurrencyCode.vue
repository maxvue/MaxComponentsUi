<template>
    <MaxInputSelect v-bind="{ ...inputBaseProps, ...attrsWithoutModelProps }" class="max-input-currency-code" :options="normalizedOptions" optionLabel="label" optionValue="code" :filter="props.filter" :icon="props.icon ?? 'solar:dollar-minimalistic-line-duotone'" :placeholder="props.placeholder ?? 'Selecione a moeda...'" :disabled="props.disabled" :modelValue="props.modelValue" @update:modelValue="onSelectUpdate">
        <template #value="{ value }">
            <slot name="value" :value="value" :currency="selectedCurrency">
                <span v-if="selectedCurrency" class="max-currency-trigger-text">
                    <span class="max-currency-symbol">{{ selectedCurrency.symbol }}</span>
                    <span class="max-currency-code">{{ selectedCurrency.code }}</span>
                </span>
            </slot>
        </template>

        <template #option="{ option }">
            <slot name="option" :option="option">
                <div class="max-currency-option-item">
                    <span class="max-currency-opt-symbol">{{ option.symbol }}</span>
                    <span class="max-currency-opt-code">{{ option.code }}</span>
                    <span class="max-currency-opt-dash">-</span>
                    <span class="max-currency-opt-name">{{ option.name }}</span>
                </div>
            </slot>
        </template>
    </MaxInputSelect>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxInputSelect from './MaxInputSelect.vue';
    import { DEFAULT_CURRENCIES, type CurrencyOption } from '../constants/currencies';

    defineOptions({
        name: 'MaxInputCurrencyCode',
        inheritAttrs: false
    });

    export type { CurrencyOption };

    export interface MaxInputCurrencyCodeProps {
        modelValue?: string | null;
        options?: CurrencyOption[];
        filter?: boolean;
        placeholder?: string;
        disabled?: boolean;
        label?: string;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        done?: boolean | null;
        required?: boolean | null;
        message?: string;
        icon?: string;
    }

    const props = withDefaults(defineProps<MaxInputCurrencyCodeProps>(), {
        modelValue: 'BRL',
        options: () => DEFAULT_CURRENCIES,
        filter: true,
        placeholder: 'Selecione a moeda...',
        disabled: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'change': [value: string, currency: CurrencyOption | undefined];
    }>();

    const attrs = useAttrs();
    const attrsWithoutModelProps = computed(() => {
        const { modelValue: _, ...rest } = attrs;
        return rest;
    });

    const inputBaseProps = computed(() => ({
        label: props.label,
        error: props.error,
        caution: props.caution,
        done: props.done ?? undefined,
        required: props.required ?? undefined,
        message: props.message,
        disabled: props.disabled
    }));

    const normalizedOptions = computed(() => {
        const list = props.options && props.options.length > 0 ? props.options : DEFAULT_CURRENCIES;
        return list.map((c) => ({
            ...c,
            label: `${c.code} - ${c.name} (${c.symbol})`
        }));
    });

    const selectedCurrency = computed<CurrencyOption | undefined>(() => {
        return normalizedOptions.value.find((c) => c.code === props.modelValue);
    });

    const onSelectUpdate = (val: any) => {
        const code = String(val ?? '');
        const matched = normalizedOptions.value.find((c) => c.code === code);
        emit('update:modelValue', code);
        emit('change', code, matched);
    };
</script>

<style lang="scss" scoped>
    .max-currency-trigger-text {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
    }

    .max-currency-symbol {
        font-weight: 600;
        color: var(--max-primary-600, #005f77);
    }

    .max-currency-code {
        font-weight: 500;
        color: var(--max-neutral-800, #1f2937);
    }

    .max-currency-option-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
    }

    .max-currency-opt-symbol {
        font-weight: 600;
        min-width: 24px;
        color: var(--max-primary-600, #005f77);
    }

    .max-currency-opt-code {
        font-weight: 600;
    }

    .max-currency-opt-dash {
        color: var(--max-neutral-400, #9ca3af);
    }

    .max-currency-opt-name {
        color: var(--max-neutral-600, #4b5563);
    }
</style>
