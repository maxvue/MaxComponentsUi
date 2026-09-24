<template>
    <InputBase
        class="max-input-discount"
        :id="props.id"
        :label="props.label"
        :disabled="props.disabled"
        :float="props.float"
        :required="props.required"
        :done="props.done ?? computedDone"
        :error="props.error ?? computedError"
        :caution="props.caution"
        :no-message="computedNoMessage"
        :message="computedMessage"
        :icon="props.icon ?? props.i"
    >
        <template #default="{ inputAttrs }">
            <div class="max-discount-control-wrapper">
                <button
                    v-if="effectiveActiveType === 'currency'"
                    type="button"
                    tabindex="-1"
                    class="max-discount-symbol max-discount-symbol-prefix"
                    :disabled="props.disabled"
                    title="Alternar para porcentagem"
                    @click="onSymbolClick"
                >
                    R$
                </button>
                <input
                    v-bind="inputAttrs"
                    ref="inputRef"
                    type="text"
                    inputmode="numeric"
                    class="max-input-native max-discount-input"
                    :class="{
                        'has-prefix': effectiveActiveType === 'currency',
                        'has-suffix': effectiveActiveType === 'percent'
                    }"
                    :value="displayValue"
                    :placeholder="props.placeholder"
                    :disabled="props.disabled"
                    @keydown="onKeyDown"
                    @input="onInput"
                    @focus="onFocus"
                    @blur="onBlur"
                />
                <button
                    v-if="effectiveActiveType === 'percent'"
                    type="button"
                    tabindex="-1"
                    class="max-discount-symbol max-discount-symbol-suffix"
                    :disabled="props.disabled"
                    title="Alternar para moeda"
                    @click="onSymbolClick"
                >
                    %
                </button>
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente de entrada para descontos (moeda e porcentagem).
     * Suporta máscara contínua da direita para a esquerda, cálculo bidirecional de preço pós-desconto,
     * alternância interativa via símbolo e detecção automática de tipo.
     */
    import { ref, computed, watch, onMounted } from 'vue';
    import InputBase from './InputBase.vue';

    defineOptions({
        name: 'MaxInputDiscount',
        inheritAttrs: false
    });

    const props = withDefaults(
        defineProps<{
            /** ID customizado */
            id?: string;
            /** Classe customizada */
            class?: string;
            /** Valor do desconto (v-model principal) */
            modelValue?: number | string | null;
            /** Valor bruto sem o desconto (alias: startValue) */
            gross?: number | string;
            /** Alias para gross */
            startValue?: number | string;
            /** Desconto padrão (default: 0) */
            default?: number | string;
            /** Valor do desconto */
            discount?: number | string | null;
            /** Valor final após considerar o desconto (alias: endValue) */
            price?: number | string | null;
            /** Alias para price */
            endValue?: number | string | null;
            /** Desconto Máximo em Porcentagem (default: 20%) */
            max_percent?: number | string;
            /** Desconto Máximo em Valor */
            max_discount?: number | string;
            /** Tipo de desconto: 'percent' | 'value' | 'currency' | 'auto' (default: 'auto') */
            type_discount?: 'percent' | 'value' | 'currency' | 'auto';
            /** Mensagem de erro ao exceder o desconto máximo */
            error_message?: string;
            /** Oculta a área de mensagens (prioridade máxima) */
            noMessage?: boolean;
            /** Rótulo do campo */
            label?: string;
            /** Desabilita o campo */
            disabled?: boolean;
            /** Estilo FloatLabel */
            float?: boolean;
            /** Campo obrigatório */
            required?: boolean;
            /** Placeholder */
            placeholder?: string;
            /** Estado done manual */
            done?: boolean;
            /** Mensagem ou estado de erro manual */
            error?: string | boolean | null;
            /** Mensagem ou estado de atenção manual */
            caution?: string | boolean | null;
            /** Mensagem de feedback */
            message?: string;
            /** Ícone */
            icon?: string;
            /** Alias de ícone */
            i?: string;
        }>(),
        {
            modelValue: undefined,
            gross: undefined,
            startValue: undefined,
            default: '0',
            discount: undefined,
            price: undefined,
            endValue: undefined,
            max_percent: undefined,
            max_discount: undefined,
            type_discount: 'auto',
            error_message: undefined,
            noMessage: undefined,
            label: undefined,
            disabled: false,
            float: undefined,
            required: false,
            placeholder: undefined,
            done: undefined,
            error: undefined,
            caution: undefined,
            message: undefined,
            icon: undefined,
            i: undefined
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: number | null];
        'update:discount': [value: number | null];
        'update:price': [value: number | null];
        'update:type_discount': [type: 'percent' | 'currency'];
        'type-change': [type: 'percent' | 'currency'];
    }>();

    const inputRef = ref<HTMLInputElement | null>(null);
    const isFocused = ref(false);

    // Tipo ativo internamente ('percent' ou 'currency')
    const userSelectedType = ref<'percent' | 'currency' | null>(null);

    const effectiveActiveType = computed<'percent' | 'currency'>(() => {
        if (userSelectedType.value) return userSelectedType.value;
        if (props.type_discount === 'percent') return 'percent';
        if (props.type_discount === 'value' || props.type_discount === 'currency') return 'currency';
        return 'percent';
    });

    watch(
        () => props.type_discount,
        (newType) => {
            if (newType === 'percent') userSelectedType.value = 'percent';
            else if (newType === 'currency' || newType === 'value') userSelectedType.value = 'currency';
            else userSelectedType.value = null;
        }
    );

    // Valor bruto normalizado
    const effectiveGross = computed<number>(() => {
        const val = props.gross ?? props.startValue ?? 0;
        const num = typeof val === 'number' ? val : Number(val);
        return Number.isNaN(num) ? 0 : num;
    });

    // Limites máximos configurados
    const effectiveMaxPercent = computed<number>(() => {
        if (props.max_percent !== undefined) {
            const num = Number(props.max_percent);
            return Number.isNaN(num) ? 20 : num;
        }
        if (props.max_discount !== undefined && effectiveGross.value > 0) {
            const num = Number(props.max_discount);
            return Number.isNaN(num) ? 20 : (num / effectiveGross.value) * 100;
        }
        return 20;
    });

    const effectiveMaxDiscount = computed<number>(() => {
        if (props.max_discount !== undefined) {
            const num = Number(props.max_discount);
            return Number.isNaN(num) ? 0 : num;
        }
        return (effectiveGross.value * effectiveMaxPercent.value) / 100;
    });

    // Buffer de dígitos apenas numéricos para máscara da direita para a esquerda
    const digitsBuffer = ref<string>('');

    function parseInitialDiscount(): number {
        const raw = props.discount ?? props.modelValue ?? props.default ?? 0;
        const num = typeof raw === 'number' ? raw : Number(raw);
        return Number.isNaN(num) ? 0 : num;
    }

    function initBufferFromNumeric(val: number, type: 'percent' | 'currency'): string {
        if (val <= 0) return '';
        if (type === 'percent') return Math.round(val * 10).toString();

        return Math.round(val * 100).toString();
    }

    // Inicializa o buffer
    const initialDiscount = parseInitialDiscount();
    digitsBuffer.value = initBufferFromNumeric(initialDiscount, effectiveActiveType.value);

    // Valor numérico calculado a partir do buffer
    const currentDiscountValue = computed<number>(() => {
        if (!digitsBuffer.value || digitsBuffer.value === '0') return 0;
        const rawInt = Number.parseInt(digitsBuffer.value, 10);
        if (Number.isNaN(rawInt)) return 0;
        if (effectiveActiveType.value === 'percent') return Number((rawInt / 10).toFixed(1));

        return Number((rawInt / 100).toFixed(2));
    });

    // Formatação visual do display
    const percentFormatter = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });

    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const displayValue = computed<string>(() => {
        if (effectiveActiveType.value === 'percent') return `${percentFormatter.format(currentDiscountValue.value)} %`;

        return `R$ ${currencyFormatter.format(currentDiscountValue.value)}`;
    });

    // Preço líquido final
    const currentPrice = computed<number>(() => {
        const gross = effectiveGross.value;
        const discount = currentDiscountValue.value;
        if (effectiveActiveType.value === 'percent') {
            const calc = gross - (gross * discount) / 100;
            return Number(calc.toFixed(2));
        }
        const calc = gross - discount;
        return Number(calc.toFixed(2));
    });

    // Validação de limite excedido
    const isExceeded = computed<boolean>(() => {
        if (currentDiscountValue.value <= 0) return false;
        if (effectiveActiveType.value === 'percent') return currentDiscountValue.value > effectiveMaxPercent.value;

        return currentDiscountValue.value > effectiveMaxDiscount.value;
    });

    const computedError = computed<string | boolean | null>(() => {
        if (props.error !== undefined) return props.error;
        if (isExceeded.value) return props.error_message ?? true;

        return null;
    });

    const computedNoMessage = computed<boolean>(() => {
        // Prioridade máxima se noMessage for explicitamente passado
        if (props.noMessage !== undefined) return Boolean(props.noMessage);
        // Se houver erro por excesso e não houver error_message, oculta mensagem de texto
        if (isExceeded.value && !props.error_message) return true;
        return false;
    });

    const computedMessage = computed<string | undefined>(() => {
        if (props.message) return props.message;
        if (isExceeded.value && props.error_message) return props.error_message;
        return undefined;
    });

    const computedDone = computed<boolean | undefined>(() => {
        if (props.done !== undefined) return props.done;
        if (isExceeded.value) return false;
        if (currentDiscountValue.value > 0) return true;
        return undefined;
    });

    // Emissão de sincronização
    function emitValues() {
        const discount = currentDiscountValue.value;
        const price = currentPrice.value;
        emit('update:modelValue', discount);
        emit('update:discount', discount);
        emit('update:price', price);
    }

    // Teclado e máscara da direita para a esquerda
    const onKeyDown = (e: KeyboardEvent) => {
        if (props.disabled) return;

        // Permite atalhos com Ctrl/Meta/Alt
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        // Permite teclas de controle
        if (e.key === 'Tab' || e.key === 'Enter' || e.key.startsWith('Arrow')) return;

        // Atalhos de tipo no modo auto
        if (props.type_discount === 'auto') {
            if (e.key === '%') {
                e.preventDefault();
                userSelectedType.value = 'percent';
                emit('update:type_discount', 'percent');
                emit('type-change', 'percent');
                return;
            }
            if (e.key === '$' || e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                userSelectedType.value = 'currency';
                emit('update:type_discount', 'currency');
                emit('type-change', 'currency');
                return;
            }
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            digitsBuffer.value = digitsBuffer.value.slice(0, -1);
            if (props.type_discount === 'auto' && digitsBuffer.value === '') userSelectedType.value = 'percent';

            emitValues();
            return;
        }

        if (e.key === 'Delete') {
            e.preventDefault();
            digitsBuffer.value = '';
            if (props.type_discount === 'auto') userSelectedType.value = 'percent';

            emitValues();
            return;
        }

        // Apenas dígitos
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            const nextBuffer = (digitsBuffer.value + e.key).replace(/^0+/, '');
            // Limite razoável de dígitos
            if (nextBuffer.length > 12) return;

            // Se modo auto, avalia faixas de valor
            if (props.type_discount === 'auto') {
                const numericAsPercent = Number((Number.parseInt(nextBuffer, 10) / 10).toFixed(1));
                const numericAsCurrency = Number((Number.parseInt(nextBuffer, 10) / 100).toFixed(2));
                const maxPct = effectiveMaxPercent.value;
                const maxDisc = effectiveMaxDiscount.value;

                // Se o valor digitado estiver acima da max_percent mas abaixo de max_discount: considera currency
                if (numericAsCurrency > maxPct && numericAsCurrency <= maxDisc) userSelectedType.value = 'currency';

                // Se o valor digitado estiver acima de max_discount mas abaixo de max_percent: considera percent
                else if (numericAsPercent > maxDisc && numericAsPercent <= maxPct) userSelectedType.value = 'percent';

            }

            digitsBuffer.value = nextBuffer;
            emitValues();
            return;
        }

        // Bloqueia qualquer outro caractere não numérico
        e.preventDefault();
    };

    const onInput = (e: Event) => {
        if (props.disabled) return;
        const target = e.target as HTMLInputElement;
        const rawDigits = target.value.replace(/\D/g, '').replace(/^0+/, '');
        if (rawDigits !== digitsBuffer.value) {
            digitsBuffer.value = rawDigits;
            if (props.type_discount === 'auto') {
                const numericAsPercent = Number((Number.parseInt(rawDigits || '0', 10) / 10).toFixed(1));
                const numericAsCurrency = Number((Number.parseInt(rawDigits || '0', 10) / 100).toFixed(2));
                const maxPct = effectiveMaxPercent.value;
                const maxDisc = effectiveMaxDiscount.value;

                if (numericAsCurrency > maxPct && numericAsCurrency <= maxDisc) userSelectedType.value = 'currency';
                else if (numericAsPercent > maxDisc && numericAsPercent <= maxPct) userSelectedType.value = 'percent';

            }
            emitValues();
        }
    };

    // Alternar tipo via clique no símbolo (com conversão equivalente)
    const onSymbolClick = () => {
        if (props.disabled) return;
        const currentType = effectiveActiveType.value;
        const gross = effectiveGross.value;
        const currentVal = currentDiscountValue.value;

        if (currentType === 'percent') {
            // Converte % para R$
            const equivCurrency = Number(((gross * currentVal) / 100).toFixed(2));
            userSelectedType.value = 'currency';
            digitsBuffer.value = equivCurrency > 0 ? Math.round(equivCurrency * 100).toString() : '';
            emit('update:type_discount', 'currency');
            emit('type-change', 'currency');
        } else {
            // Converte R$ para %
            const equivPercent = gross > 0 ? Number(((currentVal / gross) * 100).toFixed(1)) : 0;
            userSelectedType.value = 'percent';
            digitsBuffer.value = equivPercent > 0 ? Math.round(equivPercent * 10).toString() : '';
            emit('update:type_discount', 'percent');
            emit('type-change', 'percent');
        }

        emitValues();
    };

    const onFocus = () => {
        isFocused.value = true;
    };

    const onBlur = () => {
        isFocused.value = false;
    };

    // Sincronização externa de props
    watch(
        () => props.modelValue,
        (val) => {
            if (val !== undefined && val !== null) {
                const num = Number(val);
                if (!Number.isNaN(num) && num !== currentDiscountValue.value) {
                    digitsBuffer.value = initBufferFromNumeric(num, effectiveActiveType.value);
                    emit('update:price', currentPrice.value);
                }
            }
        }
    );

    watch(
        () => props.discount,
        (val) => {
            if (val !== undefined && val !== null) {
                const num = Number(val);
                if (!Number.isNaN(num) && num !== currentDiscountValue.value) {
                    digitsBuffer.value = initBufferFromNumeric(num, effectiveActiveType.value);
                    emit('update:price', currentPrice.value);
                }
            }
        }
    );

    // Watcher de preço externo (bidirecionalidade)
    watch(
        () => props.price ?? props.endValue,
        (val) => {
            if (val !== undefined && val !== null) {
                const newPrice = Number(val);
                if (!Number.isNaN(newPrice) && newPrice !== currentPrice.value) {
                    const gross = effectiveGross.value;
                    if (effectiveActiveType.value === 'percent') {
                        const newDiscount = gross > 0 ? Number((((gross - newPrice) / gross) * 100).toFixed(1)) : 0;
                        digitsBuffer.value = initBufferFromNumeric(newDiscount, 'percent');
                    } else {
                        const newDiscount = Number((gross - newPrice).toFixed(2));
                        digitsBuffer.value = initBufferFromNumeric(newDiscount, 'currency');
                    }
                    emit('update:modelValue', currentDiscountValue.value);
                    emit('update:discount', currentDiscountValue.value);
                }
            }
        }
    );

    onMounted(() => {
        // Emite o valor inicial de preço
        emit('update:price', currentPrice.value);
    });

    defineExpose({
        inputRef,
        currentDiscountValue,
        currentPrice,
        effectiveActiveType,
        digitsBuffer
    });
</script>

<style lang="scss" scoped>
    .max-input-discount {
        .max-discount-control-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;

            .max-discount-symbol {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 2.25rem;
                height: 1.85rem;
                padding: 0 0.5rem;
                font-family: inherit;
                font-size: 0.8rem;
                font-weight: 600;
                color: var(--max-primary-500, #00768e);
                background: var(--background-100, #f1f5f9);
                border: 1px solid var(--background-300, #cbd5e1);
                border-radius: 4px;
                cursor: pointer;
                user-select: none;
                transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;

                &:hover:not(:disabled) {
                    color: var(--max-primary-600, #005f77);
                    background: var(--background-200, #e2e8f0);
                    border-color: var(--max-primary-400, #178da5);
                }

                &:focus-visible {
                    outline: 2px solid var(--max-primary-500, #00768e);
                    outline-offset: 1px;
                }

                &:disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                &.max-discount-symbol-prefix {
                    margin-right: 0.375rem;
                }

                &.max-discount-symbol-suffix {
                    margin-left: 0.375rem;
                }
            }

            .max-discount-input {
                flex: 1 1 auto;
                min-width: 0;
                width: 100%;
                text-align: right;
            }
        }
    }

    @media (prefers-reduced-motion: reduce) {
        *,
        ::before,
        ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }
    }
</style>
