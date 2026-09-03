<template>
    <InputBase
        v-bind="props"
        :done="props.done ?? isDone"
        :error="props.error ?? error_msg"
        :caution="caution"
        class="max-chips-wrapper"
    >
        <div
            class="max-chips-container p-inputtext p-component"
            :class="{ 'p-disabled': props.disabled, 'p-focus': isFocused }"
            @click="focusInput"
        >
            <ul class="max-chips-list">
                <li
                    v-for="(item, index) in itemsList"
                    :key="getItemKey(item, index)"
                    class="max-chip-token"
                >
                    <slot
                        name="chip"
                        :item="item"
                        :label="resolveChipLabel(item)"
                        :index="index"
                        :remove="() => removeChip(index)"
                    >
                        <span class="max-chip-label">{{ resolveChipLabel(item) }}</span>
                        <button
                            v-if="!props.disabled && props.removable !== false"
                            type="button"
                            class="max-chip-remove-btn"
                            tabindex="-1"
                            :aria-label="'Remover ' + resolveChipLabel(item)"
                            @click.stop="removeChip(index)"
                        >
                            <slot name="removeicon">
                                <MaxIcon icon="material-symbols:close-rounded" :size="0.85" />
                            </slot>
                        </button>
                    </slot>
                </li>
                <li class="max-chips-input-token">
                    <input
                        ref="inputRef"
                        type="text"
                        class="max-chips-input"
                        :placeholder="itemsList.length === 0 ? (props.placeholder ?? '') : ''"
                        :disabled="props.disabled || isMaxReached"
                        :value="inputValue"
                        autocomplete="off"
                        @input="onInput"
                        @keydown="onKeyDown"
                        @paste="onPaste"
                        @focus="onFocus"
                        @blur="onBlur"
                    />
                </li>
            </ul>
        </div>
        <slot></slot>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import type { ChipItem, ChipObjectItem } from '../types';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor do v-model com a lista de chips (strings, números ou objetos) */
            modelValue?: ChipItem[];
            /** Placeholder exibido quando o campo está vazio */
            placeholder?: string;
            /** Permite ou bloqueia valores duplicados (padrão: false) */
            allowDuplicate?: boolean;
            /** Número máximo de chips permitidos */
            max?: number;
            /** Adiciona o chip ao perder o foco do input (padrão: false) */
            addOnBlur?: boolean;
            /** Separador usado para dividir chips (padrão: ',') */
            separator?: string | RegExp;
            /** Força novos itens inseridos como objetos { label, value } mesmo com lista vazia */
            asObject?: boolean;
            /** Função customizada para instanciar novos objetos a partir do texto digitado */
            createItem?: (text: string) => ChipObjectItem;
            /** Permite remover chips individualmente (padrão: true) */
            removable?: boolean;
            /** Ícone opcional */
            icon?: string;
            /** Alias para o ícone */
            i?: string;
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
            /** Valor para comparação */
            targetValue?: string;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean;
            /** Define se o campo é obrigatório */
            required?: boolean;
        }>(),
        {
            modelValue: () => [],
            placeholder: '',
            allowDuplicate: false,
            max: undefined,
            addOnBlur: false,
            separator: ',',
            asObject: false,
            createItem: undefined,
            removable: true,
            disabled: false,
            done: undefined,
            error: undefined,
            caution: undefined,
            required: false
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: ChipItem[]];
        'add': [payload: { value: ChipItem; raw: string }];
        'remove': [payload: { value: ChipItem; index: number }];
        'change': [value: ChipItem[]];
        'focus': [event: FocusEvent];
        'blur': [event: FocusEvent];
    }>();

    const inputRef = ref<HTMLInputElement | null>(null);
    const inputValue = ref<string>('');
    const isFocused = ref<boolean>(false);
    const isDone = ref<boolean | null>(props.done ?? null);

    const itemsList = computed<ChipItem[]>(() => {
        if (!props.modelValue || !Array.isArray(props.modelValue)) return [];
        return props.modelValue;
    });

    const isMaxReached = computed<boolean>(() => {
        if (typeof props.max === 'number' && props.max > 0) return itemsList.value.length >= props.max;

        return false;
    });

    const isRequiredDone = computed(() => {
        return props.required ? itemsList.value.length > 0 : null;
    });

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => {
        return props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false;
    });

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Valor inválido';
    });

    function resolveChipLabel(item: any): string {
        if (item === null || item === undefined) return '';
        if (typeof item === 'string' || typeof item === 'number') return String(item);

        if (typeof item === 'object') {
            const val = item.label ?? item.name ?? item.value ?? item.id;
            return val !== undefined && val !== null ? String(val) : '';
        }
        return String(item);
    }

    function getItemKey(item: any, index: number): string | number {
        if (typeof item === 'object' && item !== null) {
            if (item.id !== undefined && item.id !== null) return `item-id-${item.id}`;
            if (item.value !== undefined && item.value !== null) return `item-val-${item.value}`;
            if (item.name !== undefined && item.name !== null) return `item-name-${item.name}`;
            if (item.label !== undefined && item.label !== null) return `item-label-${item.label}`;
        }
        return `item-${index}-${String(item)}`;
    }

    function focusInput() {
        if (!props.disabled && inputRef.value) inputRef.value.focus();

    }

    function addChip(rawText?: string) {
        const textToProcess = rawText !== undefined ? rawText : (inputValue.value || inputRef.value?.value || '');
        const text = textToProcess.trim();

        if (!text) {
            inputValue.value = '';
            if (inputRef.value) inputRef.value.value = '';
            return;
        }

        if (isMaxReached.value) {
            inputValue.value = '';
            if (inputRef.value) inputRef.value.value = '';
            return;
        }

        if (!props.allowDuplicate) {
            const lowerText = text.toLowerCase();
            const exists = itemsList.value.some((item) => {
                return resolveChipLabel(item).toLowerCase() === lowerText;
            });
            if (exists) {
                inputValue.value = '';
                if (inputRef.value) inputRef.value.value = '';
                return;
            }
        }

        const isObjectArray = itemsList.value.length > 0 && typeof itemsList.value[0] === 'object';

        let newItem: ChipItem = text;
        if (isObjectArray || props.asObject) newItem = props.createItem ? props.createItem(text) : { label: text, value: text };


        const updated = [...itemsList.value, newItem];
        emit('update:modelValue', updated);
        emit('add', { value: newItem, raw: text });
        emit('change', updated);

        inputValue.value = '';
        if (inputRef.value) inputRef.value.value = '';

    }

    function addMultipleChips(texts: string[]) {
        let currentList = [...itemsList.value];
        const isObjectArray = currentList.length > 0 && typeof currentList[0] === 'object';

        for (const raw of texts) {
            const text = raw.trim();
            if (!text) continue;

            if (typeof props.max === 'number' && props.max > 0 && currentList.length >= props.max) break;


            if (!props.allowDuplicate) {
                const lowerText = text.toLowerCase();
                const exists = currentList.some((item) => resolveChipLabel(item).toLowerCase() === lowerText);
                if (exists) continue;
            }

            let newItem: ChipItem = text;
            if (isObjectArray || props.asObject) newItem = props.createItem ? props.createItem(text) : { label: text, value: text };


            currentList.push(newItem);
            emit('add', { value: newItem, raw: text });
        }

        emit('update:modelValue', currentList);
        emit('change', currentList);
        inputValue.value = '';
        if (inputRef.value) inputRef.value.value = '';

    }

    function removeChip(index: number) {
        if (props.disabled || props.removable === false) return;
        if (index < 0 || index >= itemsList.value.length) return;

        const removedItem = itemsList.value[index];
        const updated = itemsList.value.filter((_, i) => i !== index);

        emit('update:modelValue', updated);
        emit('remove', { value: removedItem, index });
        emit('change', updated);
    }

    function onInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const val = target.value;

        const separator = props.separator ?? ',';
        const hasSep = typeof separator === 'string' ? val.includes(separator) : separator.test(val);

        if (hasSep) {
            const parts = typeof separator === 'string' ? val.split(separator) : val.split(separator);
            const toAdd = parts.slice(0, -1);
            const remaining = parts[parts.length - 1] ?? '';

            if (toAdd.length > 0) addMultipleChips(toAdd);

            inputValue.value = remaining;
            if (inputRef.value) inputRef.value.value = remaining;

        } else inputValue.value = val;

    }

    function onKeyDown(event: KeyboardEvent) {
        const key = event.key;
        const keyCode = event.keyCode || event.which;

        if (key === 'Enter' || key === 'enter' || keyCode === 13) {
            event.preventDefault();
            addChip(inputValue.value || (event.target as HTMLInputElement)?.value);
        } else if (key === 'Backspace' || keyCode === 8) {
            const currentVal = inputValue.value || (event.target as HTMLInputElement)?.value || '';
            if (currentVal === '' && itemsList.value.length > 0) removeChip(itemsList.value.length - 1);

        } else if (typeof props.separator === 'string' && key === props.separator) {
            event.preventDefault();
            addChip(inputValue.value || (event.target as HTMLInputElement)?.value);
        }
    }

    function onPaste(event: ClipboardEvent) {
        event.preventDefault();
        const text = event.clipboardData?.getData('text') ?? '';
        if (!text) return;

        const separator = props.separator ?? ',';
        const parts = typeof separator === 'string' ? text.split(separator) : text.split(separator);

        if (parts.length > 1) addMultipleChips(parts);
        else addChip(text);

    }

    function onFocus(event: FocusEvent) {
        isFocused.value = true;
        emit('focus', event);
    }

    function onBlur(event: FocusEvent) {
        isFocused.value = false;
        if (props.addOnBlur && inputValue.value.trim()) addChip(inputValue.value);

        isDone.value = testIsDone();
        emit('blur', event);
    }

    function clear() {
        emit('update:modelValue', []);
        emit('change', []);
        inputValue.value = '';
        if (inputRef.value) inputRef.value.value = '';

    }

    defineExpose({
        inputRef,
        focus: focusInput,
        blur: () => inputRef.value?.blur(),
        items: itemsList,
        count: computed(() => itemsList.value.length),
        addChip,
        removeChip,
        clear
    });
</script>

<style lang="scss">
    .max-chips-wrapper {
        .max-chips-container {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            padding: 4px 8px;
            min-height: 42px;
            width: 100%;
            cursor: text;
            box-sizing: border-box;
            background: transparent;
            border: none;

            .max-chips-list {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 6px;
                list-style: none;
                padding: 0;
                margin: 0;
                width: 100%;

                .max-chip-token {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background-color: var(--background-200);
                    color: var(--background-800);
                    border-radius: 6px;
                    padding: 2px 8px;
                    font-size: 0.875rem;
                    line-height: 1.4;
                    max-width: 100%;
                    overflow-wrap: break-word;
                    transition: background-color 0.15s ease;

                    .max-chip-label {
                        display: inline-block;
                    }

                    .max-chip-remove-btn {
                        background: none;
                        border: none;
                        padding: 0;
                        margin: 0;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        color: var(--background-600);
                        border-radius: 50%;
                        line-height: 1;
                        transition: color 0.15s ease, transform 0.15s ease;

                        &:hover {
                            color: var(--red-600);
                        }
                    }
                }

                .max-chips-input-token {
                    display: inline-flex;
                    flex: 1 1 60px;
                    min-width: 60px;

                    .max-chips-input {
                        width: 100%;
                        border: none !important;
                        outline: none !important;
                        box-shadow: none !important;
                        background: transparent !important;
                        padding: 2px 4px;
                        font-size: 0.875rem;
                        color: inherit;

                        &::placeholder {
                            color: var(--background-400);
                        }

                        &:disabled {
                            cursor: not-allowed;
                            opacity: 0.6;
                        }
                    }
                }
            }
        }
    }

    .dark {
        .max-chips-wrapper {
            .max-chips-container {
                .max-chips-list {
                    .max-chip-token {
                        background-color: var(--background-700);
                        color: var(--background-100);

                        .max-chip-remove-btn {
                            color: var(--background-400);

                            &:hover {
                                color: var(--red-400);
                            }
                        }
                    }

                    .max-chips-input-token {
                        .max-chips-input {
                            &::placeholder {
                                color: var(--background-500);
                            }
                        }
                    }
                }
            }
        }
    }
</style>
