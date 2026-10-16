<template>
    <InputBase class="max-base-quantity" v-bind="forwardProps" :value="draftText" :done="props.done" :error="effectiveError" :caution="props.caution ?? validation.caution.value">
        <template #default="{ inputAttrs }">
            <div class="max-quantity-inner" :class="{ 'has-prefix': Boolean(resolvedPrefix), 'has-suffix': Boolean(resolvedSuffix) }">
                <slot name="prefix"><span v-if="resolvedPrefix" class="max-quantity-prefix">{{ resolvedPrefix }}</span></slot>
                <input v-bind="inputAttrs" ref="inputRef" type="text" inputmode="decimal" class="max-input-native max-quantity-input" :class="{ 'text-right': props.textRight, 'text-center': props.textCenter }" :value="draftText" :placeholder="props.placeholder" :disabled="props.disabled" @input="onInput" @focus="onFocus" @blur="onBlur" />
                <slot name="suffix"><span v-if="resolvedSuffix" class="max-quantity-suffix">{{ resolvedSuffix }}</span></slot>
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import InputBase from '../InputBase.vue';
    import { useInputValidation } from '../../helpers/useInputValidation';

    defineOptions({
        name: 'MaxBaseQuantity',
        inheritAttrs: false
    });

    interface Props {
        modelValue?: number | null;
        id?: string;
        label?: string;
        placeholder?: string;
        disabled?: boolean;
        required?: boolean;
        done?: boolean | string | null;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        message?: string;
        msg?: string;
        noMessage?: boolean;
        icon?: string;
        i?: string;
        iconMessage?: string;
        float?: boolean;
        textCenter?: boolean;
        textRight?: boolean;
        inLine?: boolean;
        min?: number;
        max?: number;
        step?: number;
        minFractionDigits?: number;
        maxFractionDigits?: number;
        integer?: boolean;
        prefix?: string;
        suffix?: string;
        unit?: string;
        invalidMessage?: string;
        requiredMessage?: string;
        targetValue?: string | number;
    }

    const props = withDefaults(defineProps<Props>(), {
        modelValue: null,
        disabled: false,
        required: false,
        done: undefined,
        error: undefined,
        caution: undefined,
        noMessage: false,
        float: undefined,
        textCenter: false,
        textRight: false,
        inLine: false,
        min: undefined,
        max: undefined,
        step: undefined,
        minFractionDigits: 0,
        maxFractionDigits: 2,
        integer: false,
        prefix: undefined,
        suffix: undefined,
        unit: undefined,
        invalidMessage: undefined,
        requiredMessage: undefined,
        targetValue: undefined
    });

    const emit = defineEmits<{
        'update:modelValue': [value: number | null];
        'focus': [event: FocusEvent];
        'blur': [event: FocusEvent];
    }>();

    defineSlots<{
        default?(props: { inputAttrs: any }): any;
        prefix?(): any;
        suffix?(): any;
    }>();

    const inputRef = ref<HTMLInputElement | null>(null);
    const isFocused = ref(false);
    const lastEmittedValue = ref<number | null>(props.modelValue ?? null);
    const internalError = ref<string | null>(null);

    const resolvedPrefix = computed(() => props.prefix ?? '');
    const resolvedSuffix = computed(() => props.suffix ?? props.unit ?? '');

    function formatPtBr(val: number | null | undefined): string {
        if (val === null || val === undefined) return '';
        if (typeof val !== 'number' || !Number.isFinite(val)) return String(val);

        const minDec = props.integer ? 0 : (props.minFractionDigits ?? 0);
        const maxDec = props.integer ? 0 : (props.maxFractionDigits ?? 2);

        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: minDec,
            maximumFractionDigits: maxDec,
            useGrouping: true
        }).format(val);
    }

    function parseNumber(text: string): { valid: boolean; value: number | null; error?: string } {
        const trimmed = text.trim();
        if (trimmed === '') return { valid: true, value: null };

        if (!/^-?[\d.,]+$/.test(trimmed)) return { valid: false, value: null, error: props.invalidMessage ?? 'Valor contém caracteres inválidos' };

        if (trimmed.includes('-') && !trimmed.startsWith('-')) return { valid: false, value: null, error: props.invalidMessage ?? 'Sinal negativo inválido' };
        if ((trimmed.match(/-/g) || []).length > 1) return { valid: false, value: null, error: props.invalidMessage ?? 'Sinal negativo inválido' };

        if (props.min !== undefined && props.min >= 0 && trimmed.startsWith('-')) return { valid: false, value: null, error: props.invalidMessage ?? `Valor mínimo permitido é ${props.min}` };

        const unsigned = trimmed.startsWith('-') ? trimmed.slice(1) : trimmed;

        if ((unsigned.match(/,/g) || []).length > 1) return { valid: false, value: null, error: props.invalidMessage ?? 'Formato numérico inválido' };

        if (unsigned.includes('.')) {
            const parts = unsigned.split(',');
            const intPart = parts[0];
            if (!/^\d{1,3}(\.\d{3})+$/.test(intPart)) return { valid: false, value: null, error: props.invalidMessage ?? 'Use vírgula para casas decimais (ex: 1,5)' };
        }

        if (props.integer && unsigned.includes(',')) return { valid: false, value: null, error: props.invalidMessage ?? 'Valores decimais não são permitidos' };

        if (!props.integer && unsigned.includes(',') && props.maxFractionDigits !== undefined) {
            const decPart = unsigned.split(',')[1] ?? '';
            if (decPart.length > props.maxFractionDigits) return { valid: false, value: null, error: props.invalidMessage ?? `Máximo de ${props.maxFractionDigits} casas decimais` };
        }

        const normalized = trimmed.replace(/\./g, '').replace(',', '.');
        const num = Number(normalized);

        if (!Number.isFinite(num) || Number.isNaN(num)) return { valid: false, value: null, error: props.invalidMessage ?? 'Número inválido' };

        if (props.integer && !Number.isSafeInteger(num)) return { valid: false, value: null, error: props.invalidMessage ?? 'Número inteiro fora do limite seguro' };

        if (props.min !== undefined && num < props.min) return { valid: false, value: null, error: props.invalidMessage ?? `Valor mínimo permitido é ${props.min}` };
        if (props.max !== undefined && num > props.max) return { valid: false, value: null, error: props.invalidMessage ?? `Valor máximo permitido é ${props.max}` };

        if (props.targetValue !== undefined && props.targetValue !== null && props.targetValue !== '') {
            const targetNum = Number(props.targetValue);
            if (!Number.isNaN(targetNum) && num !== targetNum) return { valid: false, value: null, error: props.invalidMessage ?? `Valor esperado: ${props.targetValue}` };
        }

        return { valid: true, value: num };
    }

    function validateInitial(val: number | null | undefined): string | null {
        if (val === null || val === undefined) return null;
        if (typeof val !== 'number' || !Number.isFinite(val) || Number.isNaN(val)) return props.invalidMessage ?? 'Número inválido';
        if (props.integer && !Number.isSafeInteger(val)) return props.invalidMessage ?? 'Número inteiro fora do limite seguro';
        if (props.min !== undefined && val < props.min) return props.invalidMessage ?? `Valor mínimo permitido é ${props.min}`;
        if (props.max !== undefined && val > props.max) return props.invalidMessage ?? `Valor máximo permitido é ${props.max}`;
        if (props.targetValue !== undefined && props.targetValue !== null && props.targetValue !== '') {
            const targetNum = Number(props.targetValue);
            if (!Number.isNaN(targetNum) && val !== targetNum) return props.invalidMessage ?? `Valor esperado: ${props.targetValue}`;
        }
        return null;
    }

    const draftText = ref<string>(props.modelValue !== null && props.modelValue !== undefined ? formatPtBr(props.modelValue) : '');
    internalError.value = validateInitial(props.modelValue);

    const validation = useInputValidation({
        value: computed(() => (internalError.value ? 'invalid' : props.modelValue)),
        required: computed(() => props.required),
        targetValue: computed(() => props.targetValue),
        caution: computed(() => (props.caution === null ? undefined : props.caution)),
        done: computed(() => (typeof props.done === 'boolean' ? props.done : undefined)),
        validator: () => internalError.value === null,
        invalidMessage: computed(() => internalError.value ?? props.invalidMessage ?? 'Valor inválido'),
        requiredMessage: computed(() => props.requiredMessage ?? 'Campo obrigatório')
    });

    const effectiveError = computed(() => {
        if (typeof props.error === 'string' && props.error !== '') return props.error;
        if (props.error === true) return true;
        if (internalError.value && (validation.dirty.value || validation.touched.value || props.modelValue !== null)) return internalError.value;
        return validation.error.value;
    });

    const forwardProps = computed(() => ({
        id: props.id,
        label: props.label,
        disabled: props.disabled,
        required: props.required,
        float: props.float,
        msg: props.msg,
        message: props.message,
        iconMessage: props.iconMessage,
        icon: props.icon,
        i: props.i,
        noMessage: props.noMessage,
        textCenter: props.textCenter,
        textRight: props.textRight,
        inLine: props.inLine
    }));

    const onInput = (event: Event) => {
        const raw = (event.target as HTMLInputElement).value;
        draftText.value = raw;
        validation.onInput(raw);

        const result = parseNumber(raw);
        if (result.valid) {
            internalError.value = null;
            lastEmittedValue.value = result.value;
            emit('update:modelValue', result.value);
        } else internalError.value = result.error ?? 'Valor inválido';
    };

    const onFocus = (event: FocusEvent) => {
        isFocused.value = true;
        if (!internalError.value && lastEmittedValue.value !== null && lastEmittedValue.value !== undefined) draftText.value = String(lastEmittedValue.value).replace('.', ',');
        emit('focus', event);
    };

    const onBlur = (event: FocusEvent) => {
        isFocused.value = false;
        if (!internalError.value) draftText.value = (lastEmittedValue.value !== null && lastEmittedValue.value !== undefined) ? formatPtBr(lastEmittedValue.value) : '';
        validation.onBlur();
        emit('blur', event);
    };

    watch(() => props.modelValue, (newVal) => {
        if (newVal === lastEmittedValue.value) return;

        lastEmittedValue.value = newVal ?? null;
        internalError.value = validateInitial(newVal);

        if (!isFocused.value) draftText.value = newVal !== null && newVal !== undefined ? formatPtBr(newVal) : '';
        else if (newVal !== null && newVal !== undefined && typeof newVal === 'number' && Number.isFinite(newVal)) draftText.value = String(newVal).replace('.', ',');
        else if (newVal === null || newVal === undefined) draftText.value = '';
    });

    watch([() => props.min, () => props.max, () => props.integer], () => {
        if (props.modelValue !== null && props.modelValue !== undefined) internalError.value = validateInitial(props.modelValue);
        else if (draftText.value.trim() !== '') {
            const res = parseNumber(draftText.value);
            internalError.value = res.valid ? null : (res.error ?? 'Valor inválido');
        }
    });
</script>

<style lang="scss" scoped>
.max-base-quantity {
    .max-quantity-inner {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
        position: relative;

        .max-quantity-prefix,
        .max-quantity-suffix {
            display: inline-flex;
            align-items: center;
            font-size: 0.85rem;
            color: var(--background-600);
            user-select: none;
            flex-shrink: 0;
            padding: 0 4px;
        }

        .max-quantity-input {
            flex: 1 1 auto;
            width: 100%;
            height: 100%;
            min-width: 0;

            &.text-right {
                text-align: right !important;
            }

            &.text-center {
                text-align: center !important;
            }
        }
    }
}
</style>
