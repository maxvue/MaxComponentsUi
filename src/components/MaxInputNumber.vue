<template>
    <InputBase
        class="max-input-number"
        v-bind="props"
        :value="temp_value"
        :done="props.done ?? validation.done.value"
        :error="props.error ?? (typeof props.caution === 'string' ? null : validation.error.value)"
        :caution="props.caution ?? validation.caution.value"
    >
        <template #default="{ inputAttrs }">
            <input
                v-bind="inputAttrs"
                ref="inputRef"
                type="text"
                inputmode="decimal"
                class="max-input-native max-inputnumber"
                :value="displayValue"
                :placeholder="props.placeholder"
                :disabled="props.disabled"
                @input="onInput"
                @focus="onFocus"
                @blur="onBlur"
            />
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente de entrada de texto padrão para números.
     * Oferece suporte a formatação numérica pt-BR, prefixos, sufixos, validação e comparação de valores.
     */
    import { toSearchableString, hasContent } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import { useInputValidation } from '../helpers/useInputValidation';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor atual do input */
            modelValue: any;
            /** Ícone opcional (ex: 'mdi:email') */
            icon?: string | undefined;
            /** Alias para o ícone */
            i?: string | undefined;
            /** Desabilita o campo */
            disabled?: boolean | undefined;
            /** Ativa estilo FloatLabel */
            float?: boolean | undefined;
            /** Mensagem de feedback (alias) */
            msg?: string | undefined;
            /** Mensagem de feedback */
            message?: string | undefined;
            /** Ícone da mensagem de feedback */
            iconMessage?: string | undefined;
            /** Rótulo do campo */
            label?: string | undefined;
            /** Estado de conclusão/validação manual */
            done?: boolean | undefined;
            /** Mensagem ou estado de erro */
            error?: string | boolean | undefined;
            /** Valor para comparação (valida se o input é igual a este valor) */
            targetValue?: string;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean | undefined;
            /** Define se o campo é obrigatório */
            required?: boolean;
            /** Prefixo do campo */
            prefix?: string | undefined;
            /** Sufixo do campo */
            suffix?: string | undefined;
            /** Placeholder do campo */
            placeholder?: string | undefined;
            /** Mínimo de casas decimais */
            minFractionDigits?: number | undefined;
            /** Máximo de casas decimais */
            maxFractionDigits?: number | undefined;
        }>(),
        { modelValue: '', done: undefined, required: false, caution: undefined, error: undefined, prefix: undefined, suffix: undefined, placeholder: undefined, minFractionDigits: 0, maxFractionDigits: 2 }
    );

    const inputRef = ref<HTMLInputElement | null>(null);
    const isFocused = ref(false);

    const formatter = computed(() => new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: props.minFractionDigits ?? 0,
        maximumFractionDigits: props.maxFractionDigits ?? 2
    }));

    function formatDisplay(val: any): string {
        if (val === null || val === undefined || val === '') return '';
        const num = typeof val === 'number' ? val : Number(val);
        if (Number.isNaN(num)) return String(val);
        const formatted = formatter.value.format(num);
        return `${props.prefix ?? ''}${formatted}${props.suffix ?? ''}`;
    }

    function parseLocaleNumber(raw: string): number | null {
        if (!hasContent(raw)) return null;
        let s = raw;
        if (props.prefix) s = s.split(props.prefix).join('');
        if (props.suffix) s = s.split(props.suffix).join('');
        s = s.replace(/[^\d,.-]/g, '');
        s = s.replace(/\./g, '');
        s = s.replace(',', '.');
        const n = Number(s);
        return Number.isNaN(n) ? null : n;
    }

    const temp_value = ref(props.modelValue);
    const displayValue = ref(formatDisplay(props.modelValue));

    const customErrorMessage = computed(() => attrs.errMsg ?? attrs.error_message ?? attrs.error_msg);

    const validation = useInputValidation({
        value: temp_value,
        required: computed(() => props.required),
        targetValue: computed(() => props.targetValue),
        caution: computed(() => props.caution),
        done: computed(() => props.done),
        validator: (val) => {
            if (typeof props.targetValue === 'string' && hasContent(props.targetValue)) return toSearchableString(props.targetValue) === toSearchableString(val);

            return hasContent(val);
        },
        invalidMessage: customErrorMessage.value ?? (typeof props.targetValue === 'string' && hasContent(props.targetValue)
            ? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value'] ?? props.targetValue)
            : 'Valor inválido'),
        requiredMessage: customErrorMessage.value ?? 'Campo obrigatório'
    });

    const emit = defineEmits<{ 'update:modelValue': [value: number | null | undefined] }>();

    const onInput = (event: Event) => {
        const raw = (event.target as HTMLInputElement).value;
        displayValue.value = raw;
        const parsed = parseLocaleNumber(raw);
        temp_value.value = parsed;
        validation.onInput();
    };

    const onFocus = () => {
        isFocused.value = true;
    };

    const onBlur = () => {
        isFocused.value = false;
        displayValue.value = formatDisplay(temp_value.value);
        validation.onBlur();
    };

    watch(temp_value, () => {
        emit('update:modelValue', temp_value.value);
    });

    watch(
        () => props.modelValue,
        (val) => {
            temp_value.value = val;
            if (!isFocused.value) displayValue.value = formatDisplay(val);

        }
    );
</script>

<style lang="scss" scoped>
    .max-input-number {
        .max-inputnumber {
            width: 100%;
        }
    }
</style>