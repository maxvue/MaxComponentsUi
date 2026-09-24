<template>
    <InputBase
        class="max-input-money-wrapper"
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
                inputmode="numeric"
                class="max-input-native max-input-money"
                :value="currentDisplay"
                :placeholder="props.placeholder"
                :disabled="props.disabled"
                @keydown="onKeydown"
                @paste="onPaste"
                @input="onNativeInput"
                @focus="onFocus"
                @blur="onBlur"
            />
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente de entrada para valores monetários com máscara reversa.
     * Aceita apenas números e formata automaticamente no padrão monetário (ex: R$ 14,30 ou U$ 14,30).
     */
    import { hasContent } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs, nextTick } from 'vue';
    import InputBase from './InputBase.vue';
    import { useInputValidation } from '../helpers/useInputValidation';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor atual do input (emite number | null) */
            modelValue: number | string | null | undefined;
            /** Símbolo monetário (ex: 'R$', 'U$', '$') */
            symbol?: string;
            /** Número de casas decimais */
            decimals?: number | string;
            /** Permite valores negativos */
            allowNegative?: boolean;
            /** Valor mínimo permitido para validação */
            min?: number;
            /** Valor máximo permitido para validação */
            max?: number;
            /** Ícone opcional à esquerda */
            icon?: string | undefined;
            /** Alias para o ícone */
            i?: string | undefined;
            /** Ícone à esquerda */
            iconLeft?: string | undefined;
            /** Ícone à direita */
            iconRight?: string | undefined;
            /** Posição do ícone */
            iconPos?: 'left' | 'right' | undefined;
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
            error?: string | boolean | null | undefined;
            /** Valor para comparação (valida se o input é igual a este valor) */
            targetValue?: any;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean | undefined;
            /** Define se o campo é obrigatório */
            required?: boolean;
            /** Oculta a área de mensagem */
            noMessage?: boolean;
            /** Trunca a mensagem de erro com reticências */
            truncateMessage?: boolean;
            /** Centraliza o texto */
            textCenter?: boolean;
            /** Alinha o texto à direita */
            textRight?: boolean;
            /** Exibe label e campo na mesma linha horizontal */
            inLine?: boolean;
            /** Placeholder do campo */
            placeholder?: string | undefined;
        }>(),
        {
            modelValue: null,
            symbol: 'R$',
            decimals: 2,
            allowNegative: false,
            done: undefined,
            required: false,
            caution: undefined,
            error: undefined,
            placeholder: undefined
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: number | null];
        'focus': [event: FocusEvent];
        'blur': [event: FocusEvent];
    }>();

    const inputRef = ref<HTMLInputElement | null>(null);
    const isFocused = ref(false);

    const parsedDecimals = computed(() => {
        const val = Number(props.decimals);
        if (Number.isNaN(val) || val < 0) return 2;
        return Math.min(10, Math.floor(val));
    });

    const divisor = computed(() => Math.pow(10, parsedDecimals.value));

    const formattedPrefix = computed(() => {
        if (!props.symbol) return '';
        return props.symbol.endsWith(' ') ? props.symbol : `${props.symbol} `;
    });

    const rawDigits = ref('');
    const isNegative = ref(false);

    function formatNumberString(absNumber: number): string {
        return absNumber.toLocaleString('pt-BR', {
            minimumFractionDigits: parsedDecimals.value,
            maximumFractionDigits: parsedDecimals.value
        });
    }

    function formatDisplay(val: number | null): string {
        if (val === null || val === undefined || Number.isNaN(val)) return '';
        const isNeg = val < 0;
        const absVal = Math.abs(val);
        const formattedNum = formatNumberString(absVal);
        return `${isNeg ? '-' : ''}${formattedPrefix.value}${formattedNum}`;
    }

    function syncFromModel(val: number | string | null | undefined) {
        if (val === null || val === undefined || val === '') {
            rawDigits.value = '';
            isNegative.value = false;
            return;
        }

        const num = typeof val === 'number' ? val : Number(String(val).replace(',', '.'));
        if (Number.isNaN(num)) {
            rawDigits.value = '';
            isNegative.value = false;
            return;
        }

        isNegative.value = num < 0 && props.allowNegative;
        const abs = Math.abs(num);
        const cents = Math.round(abs * divisor.value);
        rawDigits.value = String(cents);
    }

    syncFromModel(props.modelValue);

    const temp_value = ref<number | null>(
        rawDigits.value !== '' ? (isNegative.value ? -Number(rawDigits.value) / divisor.value : Number(rawDigits.value) / divisor.value) : null
    );

    const currentDisplay = computed(() => {
        if (rawDigits.value === '') return '';
        const num = Number(rawDigits.value) / divisor.value;
        const finalNum = isNegative.value ? -num : num;
        return formatDisplay(finalNum);
    });

    const customErrorMessage = computed(() => attrs.errMsg ?? attrs.error_message ?? attrs.error_msg);

    const validation = useInputValidation({
        value: temp_value,
        required: computed(() => props.required),
        targetValue: computed(() => props.targetValue),
        caution: computed(() => props.caution),
        done: computed(() => props.done),
        validator: (val) => {
            if (val === null || val === undefined || val === '') return !props.required;
            const num = Number(val);
            if (props.min !== undefined && num < props.min) return false;
            if (props.max !== undefined && num > props.max) return false;
            return true;
        },
        invalidMessage: customErrorMessage.value ?? 'Valor inválido',
        requiredMessage: customErrorMessage.value ?? 'Campo obrigatório'
    });

    function setCaretToEnd() {
        nextTick(() => {
            if (!inputRef.value) return;
            const len = inputRef.value.value.length;
            inputRef.value.setSelectionRange(len, len);
        });
    }

    function emitCurrentValue() {
        if (rawDigits.value === '') {
            temp_value.value = null;
            emit('update:modelValue', null);
        } else {
            const num = Number(rawDigits.value) / divisor.value;
            const finalNum = isNegative.value ? -num : num;
            temp_value.value = finalNum;
            emit('update:modelValue', finalNum);
        }
        validation.onInput();
        setCaretToEnd();
    }

    const onKeydown = (event: KeyboardEvent) => {
        // Permite atalhos de controle (Ctrl+C, Ctrl+V, Cmd+A, etc.)
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        // Permite teclas de navegação e controle padrão
        if (['Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;

        // Suporte a valor negativo com o sinal de menos '-'
        if (event.key === '-') {
            event.preventDefault();
            if (props.allowNegative) {
                isNegative.value = !isNegative.value;
                emitCurrentValue();
            }
            return;
        }

        // Remoção com Backspace (máscara reversa: remove o último dígito)
        if (event.key === 'Backspace') {
            event.preventDefault();
            if (rawDigits.value.length > 0) {
                rawDigits.value = rawDigits.value.slice(0, -1);
                if (rawDigits.value === '') isNegative.value = false;
                emitCurrentValue();
            }
            return;
        }

        // Limpeza com Delete
        if (event.key === 'Delete') {
            event.preventDefault();
            rawDigits.value = '';
            isNegative.value = false;
            emitCurrentValue();
            return;
        }

        // Dígitos de 0 a 9
        if (/^[0-9]$/.test(event.key)) {
            event.preventDefault();
            // Limite de segurança de 15 dígitos para manter precisão de float
            if (rawDigits.value.length < 15) {
                if (rawDigits.value === '0') rawDigits.value = event.key;
                else rawDigits.value += event.key;
                emitCurrentValue();
            }
            return;
        }

        // Qualquer outro caractere (letras, pontuação, símbolos) é bloqueado
        if (event.key.length === 1) event.preventDefault();
    };

    const onPaste = (event: ClipboardEvent) => {
        event.preventDefault();
        const text = event.clipboardData?.getData('text') ?? '';
        const digits = text.replace(/\D/g, '');
        if (!hasContent(digits)) return;

        if (props.allowNegative && text.trim().startsWith('-')) isNegative.value = true;

        rawDigits.value = digits.slice(0, 15);
        emitCurrentValue();
    };

    const onNativeInput = (event: Event) => {
        // Fallback defensivo para teclados móveis / IMEs virtuais
        const target = event.target as HTMLInputElement;
        const val = target.value;
        const digits = val.replace(/\D/g, '');
        if (digits !== rawDigits.value) {
            rawDigits.value = digits.slice(0, 15);
            emitCurrentValue();
        }
    };

    const onFocus = (event: FocusEvent) => {
        isFocused.value = true;
        emit('focus', event);
        setCaretToEnd();
    };

    const onBlur = (event: FocusEvent) => {
        isFocused.value = false;
        emit('blur', event);
        validation.onBlur();
    };

    watch(
        () => props.modelValue,
        (newVal) => {
            const currentComputed = temp_value.value;
            if (newVal !== currentComputed) {
                syncFromModel(newVal);
                temp_value.value = rawDigits.value !== ''
                    ? (isNegative.value ? -Number(rawDigits.value) / divisor.value : Number(rawDigits.value) / divisor.value)
                    : null;
            }
        }
    );
</script>

<style lang="scss" scoped>
    .max-input-money-wrapper {
        .max-input-money {
            width: 100%;
        }
    }
</style>
