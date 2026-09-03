<template>
    <InputBase v-bind="props" class="if" :value="temp_value" :done="isDone" :error="props.error" :caution="caution">
        <div ref="ac" class="p-autocomplete" :class="{ 'p-disabled': props.disabled }">
            <input
                ref="inputEl"
                type="text"
                class="p-inputtext p-autocomplete-input"
                :value="displayedText"
                :placeholder="props.placeholder ?? 'SELECIONE'"
                :disabled="props.disabled"
                :spellcheck="props.spellcheck"
                autocomplete="off"
                @input="onInput"
                @change="onChange"
                @focus="onFocus"
                @blur="onBlur"
                @keydown.down.prevent="onArrowDown"
                @keydown.up.prevent="onArrowUp"
                @keydown.enter.prevent="onEnter"
                @keydown.esc.prevent="hide"
            />
        </div>

        <Teleport to="body">
            <div v-if="isOpen && filtered_values.length > 0" class="max-autocomplete-backdrop" @click="hide">
                <div
                    ref="overlayEl"
                    class="p-autocomplete-overlay"
                    role="listbox"
                    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width }"
                    @click.stop
                >
                    <div class="p-autocomplete-list-container">
                        <ul class="p-autocomplete-list">
                            <li
                                v-for="(option, index) in filtered_values"
                                :key="index"
                                class="p-autocomplete-item"
                                :class="{ 'p-autocomplete-item-active': activeIndex === index }"
                                role="option"
                                @click.stop="selectOption(option)"
                                @mouseenter="activeIndex = index"
                            >
                                <slot name="option" :option="option" :index="index">
                                    <div class="autocomplete-item-select">
                                        <div class="autocomplete-item-select-label">
                                            {{ option[props.optionLabel ?? 'label'] ?? option.label ?? option.name }}
                                        </div>
                                        <div class="autocomplete-item-select-sub-label">
                                            {{ option.subLabel ?? option.sublabel ?? option['sub-label'] }}
                                        </div>
                                    </div>
                                </slot>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </Teleport>
    </InputBase>
</template>

<script setup lang="ts">
    import { hasContent, toSearchableString, useElementBounding, useElementSize, useWindowSize } from '@maxvue/max-use';
    import { getOverlayWidth, getOverlayLeft } from '../helpers/useOverlayWidth';
    import type { Ref } from 'vue';
    import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
    import InputBase from './InputBase.vue';

    const props = withDefaults(
        defineProps<{
            modelValue: any;
            options: any;
            icon?: string | undefined;
            i?: string | undefined;
            disabled?: boolean | undefined;
            optionLabel?: string | undefined;
            optionValue?: string | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            placeholder?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
            required?: boolean;
            forceSelection?: boolean;
            restoreOnInvalid?: boolean;
            spellcheck?: boolean | undefined;
        }>(),
        {
            modelValue: '',
            options: () => [],
            done: undefined,
            error: undefined,
            required: false,
            caution: undefined,
            optionLabel: 'name',
            forceSelection: true,
            restoreOnInvalid: true
        }
    );

    const list = computed(() => props.options ?? []);
    const temp_value = ref<any>(props.modelValue);
    const filtered_values = ref<any[]>([]);
    const input_text = ref<string>('');
    const last_valid = ref<any>(props.modelValue && typeof props.modelValue !== 'string' ? props.modelValue : null);

    const ac = ref<HTMLElement | null>(null);
    const inputEl = ref<HTMLInputElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);
    const isOpen = ref(false);
    const activeIndex = ref<number>(-1);

    const { x, y, width: width_btn, height: height_btn } = useElementBounding(ac as any);
    const { height: height_el } = useElementSize(overlayEl as any);
    const { width: window_width, height: window_height } = useWindowSize();

    const position = computed(() => {
        const targetX = x.value;
        const targetY = y.value;
        const targetH = height_btn.value;

        const width = getOverlayWidth({ triggerWidth: width_btn.value, windowWidth: window_width.value });

        let top = targetY + targetH + 2;

        if (top + (height_el.value || 200) > window_height.value && targetY - (height_el.value || 200) > 0) top = targetY - (height_el.value || 200) - 2;


        return {
            top,
            left: getOverlayLeft(targetX, width, window_width.value),
            width: width + 'px'
        };
    });

    const displayedText = computed(() => {
        if (!temp_value.value) return '';
        if (typeof temp_value.value === 'string') return temp_value.value;
        const opt = temp_value.value;
        const labelKey = props.optionLabel ?? 'name';
        return opt[labelKey] ?? opt.label ?? opt.name ?? opt.value ?? '';
    });

    const temp_value_string = computed(() => {
        if (temp_value.value && typeof temp_value.value === 'string') return temp_value.value;
        if (temp_value.value && typeof temp_value.value === 'object') return temp_value.value?.value ?? temp_value.value?.label ?? temp_value.value?.id ?? temp_value.value[props.optionValue ?? 'value'] ?? '';
        return '';
    });

    const isDone: Ref = ref(props.done ?? null);
    const isRequiredDone = computed(() => (props.required ? hasContent(temp_value_string.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

    const emit = defineEmits(['update:modelValue', 'complete', 'blur']);

    const search = () => {
        const query = toSearchableString(typeof temp_value.value === 'string' ? temp_value.value : temp_value_string.value);
        filtered_values.value = list.value.filter((item: any) => {
            const s = (item.value ?? '') + (item.label ?? '') + (item.name ?? '') + (item[props.optionValue ?? 'value'] ?? '');
            return toSearchableString(s).toLowerCase().includes(query.toLowerCase());
        });
        emit('complete');
    };

    const hide = () => {
        isOpen.value = false;
        activeIndex.value = -1;
    };

    const onInput = (event: Event) => {
        const val = (event.target as HTMLInputElement).value;
        input_text.value = val;
        temp_value.value = val;
        search();
        isOpen.value = filtered_values.value.length > 0;
    };

    const onFocus = () => {
        if (typeof temp_value.value === 'string' && temp_value.value) {
            search();
            isOpen.value = filtered_values.value.length > 0;
        }
    };

    const onBlur = () => {
        isDone.value = testIsDone();
        emit('blur');
        setTimeout(() => {
            if (isOpen.value) hide();
        }, 150);
    };

    const onChange = () => {
        if (props.forceSelection) if (typeof temp_value.value === 'string') if (input_text.value) if (props.restoreOnInvalid && last_valid.value) {
            temp_value.value = last_valid.value;
            input_text.value = '';
        } else {
            input_text.value = '';
            last_valid.value = null;
            temp_value.value = null;
            emit('update:modelValue', null);
        }
        else {
            last_valid.value = null;
            temp_value.value = null;
            emit('update:modelValue', null);
        }


    };

    const selectOption = (item: any) => {
        temp_value.value = item;
        last_valid.value = item;
        input_text.value = '';
        hide();
    };

    const onArrowDown = () => {
        if (!isOpen.value) {
            search();
            isOpen.value = filtered_values.value.length > 0;
            return;
        }
        if (activeIndex.value < filtered_values.value.length - 1) activeIndex.value++;

    };

    const onArrowUp = () => {
        if (activeIndex.value > 0) activeIndex.value--;

    };

    const onEnter = () => {
        if (isOpen.value && activeIndex.value >= 0 && activeIndex.value < filtered_values.value.length) selectOption(filtered_values.value[activeIndex.value]);

    };

    watch(temp_value, (novo: any, antigo: any) => {
        isDone.value = testIsDone();

        // Seleção de uma opção (ou valor não-string vindo de fora): estado válido.
        if (novo && typeof novo !== 'string') {
            last_valid.value = novo;
            input_text.value = '';
            emit('update:modelValue', novo);
            return;
        }

        // Digitação livre em andamento: mantém a string no v-model.
        if (novo) return;

        // Daqui para baixo o valor foi zerado. Só interessa quando havia algo antes.
        if (!antigo) return;

        if (input_text.value) {
            if (props.restoreOnInvalid && last_valid.value) {
                nextTick(() => {
                    temp_value.value = last_valid.value;
                    input_text.value = '';
                });
                return;
            }
            input_text.value = '';
            last_valid.value = null;
            emit('update:modelValue', null);
            return;
        }

        // Limpeza intencional: nunca restaurar.
        last_valid.value = null;
        emit('update:modelValue', null);
    });

    watch(() => props.modelValue, () => {
        temp_value.value = props.modelValue;
        if (props.modelValue && typeof props.modelValue !== 'string') last_valid.value = props.modelValue;
    });

    const onGlobalKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen.value) hide();

    };

    if (typeof window !== 'undefined') window.addEventListener('keydown', onGlobalKeydown);


    onBeforeUnmount(() => {
        if (typeof window !== 'undefined') window.removeEventListener('keydown', onGlobalKeydown);

    });
</script>

<style lang="scss">
    .main-div-input-auto-complete-api {
        width: 100% !important;

        .p-autocomplete {
            width: 100% !important;
        }

        .p-inputtext {
            width: 100% !important;
        }

        .input-auto-complete-api {
            width: 100% !important;

            input {
                width: 100% !important;
            }
        }

        .icon-input-auto-complete-api {
            position: absolute !important;
            width: 20px;
            right: 8px;
            top: calc(50% + 1px);
            color: var(--background-500);
            transform: translateY(-50%);
            z-index: 9;
            pointer-events: none;
        }
    }

    .p-autocomplete {
        width: 100%;
        position: relative;
        display: flex;
        align-items: center;

        .p-autocomplete-input {
            width: 100%;
            height: 36px;
            border: none;
            outline: none;
            background: transparent;
            font-size: 0.9rem;
            color: var(--text-c, #334155);
            padding: 0 10px;
        }
    }

    .autocomplete-item-select {
        height: 40px;
        padding: 10px;
        position: relative;
        display: grid;
        place-items: center start;
        grid-template-columns: 1fr auto;
        gap: 25px;
        width: 100%;

        .autocomplete-item-select-label {
            font-size: 0.9rem;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .autocomplete-item-select-sub-label {
            display: grid;
            place-items: center;
            font-size: 0.8rem;
            min-width: 15px;
            color: var(--background-500);
        }
    }

    .max-autocomplete-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1100;
        background: transparent;
    }

    .p-autocomplete-overlay {
        position: fixed;
        z-index: 1101;
        background: var(--background-0, #fff);
        border: 1px solid var(--surface-border, #e2e8f0);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
        max-height: 240px;
        overflow-y: auto;
        scrollbar-width: thin;

        .p-autocomplete-list {
            list-style: none;
            margin: 0;
            padding: 4px 0;

            .p-autocomplete-item {
                cursor: pointer;

                &:hover, &.p-autocomplete-item-active {
                    background-color: var(--background-100, #f1f5f9);
                }
            }
        }
    }

    .text-centereds {
        input {
            padding-left: 32px !important;
        }
    }
</style>
