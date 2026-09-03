<template>
    <InputBase
        v-bind="props"
        class="max-input-otp-base"
        no-border
        text-center
        :label="props.label"
        :done="props.done ?? done"
        :required="props.required"
        :error="props.error ?? error_msg"
        :caution="props.caution"
        :no-status="props.noStatus"
    >
        <div class="max-input-otp-container" :class="{ 'is-disabled': props.disabled }">
            <template v-for="(group, gIdx) in groupedInputs" :key="gIdx">
                <div v-if="gIdx > 0" class="max-input-otp-separator" aria-hidden="true">
                    <slot name="separator">
                        <span>{{ effectiveSeparatorChar }}</span>
                    </slot>
                </div>
                <div class="max-input-otp-group">
                    <input
                        v-for="item in group"
                        :key="item.index"
                        :ref="(el) => setInputRef(el, item.index)"
                        class="max-input-otp-cell"
                        :class="{
                            'has-value': !!values[item.index],
                            'is-focused': focusedIndex === item.index
                        }"
                        :type="props.mask ? 'password' : 'text'"
                        :inputmode="props.integerOnly ? 'numeric' : 'text'"
                        :pattern="props.integerOnly ? '[0-9]*' : undefined"
                        :maxlength="1"
                        :disabled="props.disabled"
                        :placeholder="props.placeholder || ''"
                        :value="values[item.index]"
                        :autocomplete="item.index === 0 ? 'one-time-code' : 'off'"
                        @input="onInput($event, item.index)"
                        @keydown="onKeyDown($event, item.index)"
                        @focus="onFocus(item.index)"
                        @blur="onBlur(item.index)"
                        @paste="onPaste($event)"
                    />
                </div>
            </template>
        </div>
        <slot></slot>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick, onMounted } from 'vue';
    import { onlyNumbers } from '@maxvue/max-use';
    import InputBase from './InputBase.vue';

    interface Props {
        /** Valor do código OTP (v-model) */
        modelValue?: string | number;
        /** Quantidade total de dígitos do código OTP (padrão 6) */
        length?: number;
        /** Alias para length */
        len?: number;
        /** Quantidade de dígitos em cada grupo separado */
        groupLength?: number;
        /** Habilita ou customiza o separador central entre grupos */
        separator?: boolean | string;
        /** Caractere usado como separador visual (padrão '-') */
        separatorChar?: string;
        /** Aceita exclusivamente dígitos numéricos de 0 a 9 */
        integerOnly?: boolean;
        /** Oculta os caracteres digitados em modo senha/PIN */
        mask?: boolean;
        /** Foca automaticamente na primeira caixa ao montar */
        autofocus?: boolean;
        /** Desabilita todos os campos de entrada */
        disabled?: boolean;
        /** Campo obrigatório */
        required?: boolean;
        /** Rótulo exibido acima do campo */
        label?: string;
        /** Placeholder para cada caixa vazia */
        placeholder?: string;
        /** Mensagem ou estado de erro */
        error?: string | boolean;
        /** Mensagem ou estado de atenção */
        caution?: string | boolean;
        /** Estado de conclusão */
        done?: boolean;
        /** Mensagem de instrução ou feedback */
        message?: string;
        /** Alias para message */
        msg?: string;
        /** Ícone da mensagem */
        iconMessage?: string;
        /** Oculta os ícones de status */
        noStatus?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        modelValue: '',
        length: 6,
        len: undefined,
        groupLength: undefined,
        separator: true,
        separatorChar: '-',
        integerOnly: true,
        mask: false,
        autofocus: false,
        disabled: false,
        required: false,
        label: undefined,
        placeholder: '',
        error: undefined,
        caution: undefined,
        done: undefined,
        message: undefined,
        msg: undefined,
        iconMessage: undefined,
        noStatus: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        complete: [value: string];
        change: [value: string];
        focus: [index: number];
        blur: [index: number];
    }>();

    const totalLength = computed(() => Math.max(1, props.len ?? props.length ?? 6));

    const effectiveGroupLength = computed(() => {
        if (props.groupLength && props.groupLength > 0) return props.groupLength;
        return Math.ceil(totalLength.value / 2);
    });

    const effectiveSeparatorChar = computed(() => {
        if (typeof props.separator === 'string') return props.separator;
        return props.separatorChar ?? '-';
    });

    const hasSeparator = computed(() => {
        if (props.separator === false) return false;
        return totalLength.value > 1 && effectiveGroupLength.value < totalLength.value;
    });

    interface InputItem {
        index: number;
    }

    const groupedInputs = computed<InputItem[][]>(() => {
        const total = totalLength.value;
        const gLen = effectiveGroupLength.value;

        if (!hasSeparator.value || gLen <= 0 || gLen >= total) {
            const all: InputItem[] = [];
            for (let i = 0; i < total; i++) all.push({ index: i });
            return [all];
        }

        const groups: InputItem[][] = [];
        let current: InputItem[] = [];

        for (let i = 0; i < total; i++) {
            current.push({ index: i });
            if (current.length === gLen || i === total - 1) {
                groups.push(current);
                current = [];
            }
        }

        return groups;
    });

    const inputRefs = ref<(HTMLInputElement | null)[]>([]);

    const setInputRef = (el: any, index: number) => {
        inputRefs.value[index] = el as HTMLInputElement | null;
    };

    const parseValueToArray = (val: string | number | undefined | null, len: number): string[] => {
        const strVal = val === null || val === undefined ? '' : String(val);
        const clean = props.integerOnly ? onlyNumbers(strVal) : strVal;
        const result: string[] = [];
        for (let i = 0; i < len; i++) result.push(clean[i] ?? '');

        return result;
    };

    const values = ref<string[]>(parseValueToArray(props.modelValue, totalLength.value));
    const focusedIndex = ref<number | null>(null);
    const isDone = ref<boolean | null>(props.done ?? null);

    const focusInput = (index: number) => {
        if (index >= 0 && index < totalLength.value) {
            const target = inputRefs.value[index];
            if (target) {
                target.focus();
                target.select?.();
            }
        }
    };

    const onFocus = (index: number) => {
        focusedIndex.value = index;
        emit('focus', index);
    };

    const checkDone = () => {
        const val = values.value.join('');
        const len = totalLength.value;
        if (val.length === len) isDone.value = true;
        else if (val.length > 0) isDone.value = false;
        else if (props.required) isDone.value = false;
        else isDone.value = null;

    };

    const onBlur = (index: number) => {
        if (focusedIndex.value === index) focusedIndex.value = null;

        emit('blur', index);
        checkDone();
    };

    const updateAndEmit = (newValues: string[]) => {
        values.value = newValues;
        const joined = newValues.join('');
        emit('update:modelValue', joined);
        emit('change', joined);

        if (joined.length === totalLength.value && !newValues.includes('')) {
            emit('complete', joined);
            isDone.value = true;
        } else if (isDone.value !== null) checkDone();

    };

    const onInput = (event: Event, index: number) => {
        const target = event.target as HTMLInputElement;
        const raw = target.value;

        if (!raw) {
            const newValues = [...values.value];
            newValues[index] = '';
            updateAndEmit(newValues);
            return;
        }

        const char = raw.slice(-1);
        if (props.integerOnly && !/^\d$/.test(char)) {
            target.value = values.value[index] ?? '';
            return;
        }

        const newValues = [...values.value];
        newValues[index] = char;
        target.value = char;
        updateAndEmit(newValues);

        if (char && index < totalLength.value - 1) nextTick(() => focusInput(index + 1));

    };

    const onKeyDown = (event: KeyboardEvent, index: number) => {
        if (event.key === 'Backspace') {
            event.preventDefault();
            const newValues = [...values.value];
            if (newValues[index] !== '') {
                newValues[index] = '';
                updateAndEmit(newValues);
            } else if (index > 0) {
                newValues[index - 1] = '';
                updateAndEmit(newValues);
                nextTick(() => focusInput(index - 1));
            }
            return;
        }

        if (event.key === 'Delete') {
            event.preventDefault();
            const newValues = [...values.value];
            newValues[index] = '';
            updateAndEmit(newValues);
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            if (index > 0) focusInput(index - 1);
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            if (index < totalLength.value - 1) focusInput(index + 1);
            return;
        }
    };

    const onPaste = (event: ClipboardEvent) => {
        event.preventDefault();
        const pastedText = event.clipboardData?.getData('text') ?? '';
        const cleanText = props.integerOnly ? onlyNumbers(pastedText) : pastedText;
        if (!cleanText) return;

        const total = totalLength.value;
        const newValues = [...values.value];
        const chars = cleanText.slice(0, total).split('');

        for (let i = 0; i < chars.length; i++) newValues[i] = chars[i];


        updateAndEmit(newValues);

        const nextIndex = Math.min(chars.length, total - 1);
        nextTick(() => focusInput(nextIndex));
    };

    const done = computed(() => {
        if (props.done !== undefined) return props.done;
        return isDone.value;
    });

    const error_msg = computed(() => {
        if (props.error) return props.error;
        if (isDone.value === false) {
            const val = values.value.join('');
            if (val.length === 0 && props.required) return 'Campo obrigatório';
            if (val.length > 0 && val.length < totalLength.value) return 'Código incompleto';
            return 'Código inválido';
        }
        return null;
    });

    const clear = () => {
        values.value = Array(totalLength.value).fill('');
        updateAndEmit(values.value);
        focusInput(0);
    };

    watch(
        () => props.modelValue,
        (newVal) => {
            const parsed = parseValueToArray(newVal, totalLength.value);
            if (parsed.join('') !== values.value.join('')) {
                values.value = parsed;
                if (isDone.value !== null) checkDone();
            }
        }
    );

    watch(
        totalLength,
        (newLen) => {
            values.value = parseValueToArray(props.modelValue, newLen);
        }
    );

    onMounted(() => {
        if (props.autofocus) nextTick(() => focusInput(0));

    });

    defineExpose({
        focus: focusInput,
        clear,
        values,
        inputs: inputRefs,
        unmaskedValue: computed(() => values.value.join(''))
    });
</script>

<style lang="scss">
.max-input-otp-base {
    width: auto;

    .max-input-field-div {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        height: auto !important;
        min-height: 48px;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        background: transparent !important;
    }
}

.max-input-otp-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    user-select: none;

    &.is-disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}

.max-input-otp-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.max-input-otp-separator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    color: var(--background-400);
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1;
}

.max-input-otp-cell {
    width: 100%;
    height: 48px;
    border-radius: 8px;
    border: 1px solid var(--background-300);
    background-color: var(--background-0);
    color: var(--background-700);
    font-size: 1.35rem;
    font-weight: 600;
    text-align: center;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
    padding: 0 !important;
    margin: 0;
    caret-color: var(--max-primary-500);

    &::placeholder {
        color: var(--background-400);
        opacity: 0.5;
    }

    &:hover:not(:disabled) {
        border-color: var(--max-primary-400);
    }

    &:focus {
        border-color: var(--max-primary-500) !important;
        box-shadow: 0 0 0 2px var(--max-primary-200) !important;
        background-color: var(--background-0);
    }

    &.has-value {
        border-color: var(--background-400);
    }

    &:disabled {
        background-color: var(--background-100);
        color: var(--background-400);
        cursor: not-allowed;
        border-color: var(--background-200);
    }
}

.max-input-main-div.error {
    .max-input-otp-cell {
        border-color: var(--max-red-600) !important;

        &:focus {
            box-shadow: 0 0 0 2px rgb(220 38 38 / 20%) !important;
        }
    }
}

.max-input-main-div.caution {
    .max-input-otp-cell {
        border-color: var(--orange-600) !important;

        &:focus {
            box-shadow: 0 0 0 2px rgb(234 88 12 / 20%) !important;
        }
    }
}
</style>
