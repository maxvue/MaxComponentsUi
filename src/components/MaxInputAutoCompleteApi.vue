<template>
    <InputBase v-bind="props" :done="isDone" :error="props.error" :caution="props.caution">
        <div ref="ac" class="p-autocomplete" :class="{ 'p-disabled': props.disabled }">
            <input
                ref="inputEl"
                type="text"
                class="p-inputtext p-autocomplete-input"
                :value="displayedText"
                :placeholder="props.placeholder ?? 'SELECIONE'"
                :disabled="props.disabled"
                autocomplete="off"
                @input="onInput"
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
                    :style="{ top: position.top + 'px', left: position.left + 'px', minWidth: position.minWidth }"
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
                                        <div class="autocomplete-item-select-label">{{ option.model ?? option.label ?? option[props.optionLabel ?? 'label'] }}</div>
                                        <div class="autocomplete-item-select-sub-label">{{ option.sub_label ?? option.subLabel ?? option['sub-label'] }}</div>
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
    /**
     * Componente Autocomplete que busca sugestões de uma API.
     * Integra-se com as rotas do backend Max para busca dinâmica.
     */
    import { hasContent, toSearchableString, getCachedApiIDB, keyExists, isBlank, size, isEqual, useElementBounding, useElementSize, useWindowSize } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, onBeforeUnmount } from 'vue';
    import InputBase from './InputBase.vue';

    interface Props {
        modelValue?: any;
        route: string;
        i?: string | undefined;
        data?: any;
        icon?: string | undefined;
        msg?: string | undefined;
        message?: string | undefined;
        iconMessage?: string | undefined;
        placeholder?: string | undefined;
        label?: string | undefined;
        done?: string | boolean | null | undefined;
        error?: string | boolean | null | undefined;
        caution?: string | boolean | null | undefined;
        required?: boolean | null | undefined;
        disabled?: boolean | undefined;
        optionValue?: string | undefined;
        optionLabel?: string | undefined;
        dropdownMode?: string;
        multiple?: boolean;
        variant?: any;
        minLength?: number;
        delay?: number;
        forceSelection?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        modelValue: '',
        done: undefined,
        data: {},
        required: false,
        caution: undefined,
        dropdownMode: 'blank',
        optionLabel: 'label',
        multiple: false,
        variant: null,
        minLength: 1,
        delay: 300,
        forceSelection: false
    });

    const temp_value: Ref = ref(props.modelValue);
    const list: Ref<any[]> = ref([]);
    const filtered_values: Ref<any[]> = ref([]);
    const isOpen = ref(false);
    const activeIndex = ref<number>(-1);

    const ac = ref<HTMLElement | null>(null);
    const inputEl = ref<HTMLInputElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);

    const { x, y, width: width_btn, height: height_btn } = useElementBounding(ac as any);
    const { width: width_el, height: height_el } = useElementSize(overlayEl as any);
    const { width: window_width, height: window_height } = useWindowSize();

    const position = computed(() => {
        const targetX = x.value;
        const targetY = y.value;
        const targetW = width_btn.value;
        const targetH = height_btn.value;

        let top = targetY + targetH + 2;
        let left = targetX;
        const minW = Math.max(targetW, 160);

        if (top + (height_el.value || 200) > window_height.value && targetY - (height_el.value || 200) > 0) top = targetY - (height_el.value || 200) - 2;


        if (left + (width_el.value || minW) > window_width.value) left = Math.max(10, window_width.value - (width_el.value || minW) - 10);


        return {
            top,
            left,
            minWidth: minW + 'px'
        };
    });

    const displayedText = computed(() => {
        if (!temp_value.value) return '';
        if (typeof temp_value.value === 'string') return temp_value.value;
        const opt = temp_value.value;
        return opt.model ?? opt.label ?? opt[props.optionLabel ?? 'label'] ?? opt.name ?? opt.value ?? '';
    });

    watch(() => props.data, (newValue, oldValue) => {
        if (isBlank(props.data) && isBlank(newValue) || isEqual(newValue, oldValue)) return;

        const data_sent = keyExists(['files', 'file'], temp_value.value) ? { ...temp_value.value } : temp_value.value;
        if (keyExists(['files', 'file'], temp_value.value)) {
            data_sent['files'] = [];
            data_sent['file'] = [];
        }

        const applyList = (res: any) => {
            if (isBlank(res) || size(res) === 0) return;
            list.value = res;
            search();
        };

        getCachedApiIDB(props.route, { ...(props.data ?? {}), input_value: data_sent }, null, undefined, applyList).then(applyList);
        return;
    }, { deep: true, immediate: true });

    const emit = defineEmits(['update:modelValue', 'complete', 'blur']);

    const temp_value_string = computed(() => {
        if (temp_value.value && typeof temp_value.value === 'string') return temp_value.value;
        if (temp_value.value && typeof temp_value.value === 'object') return temp_value.value?.value ?? temp_value.value?.label ?? temp_value.value?.id ?? temp_value.value[props.optionValue ?? 'value'] ?? '';
        return '';
    });

    const isDone = ref<string | boolean | null | undefined>(props.done ?? null);
    const isRequiredDone = computed(() => (props.required ? hasContent(temp_value_string.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const search = () => {
        if (hasContent(list.value as any)) filtered_values.value = (list.value as any[]).filter((item: any) => {
            const searchStr = (item.value ?? '') + (item.label ?? '') + (item.sub_label ?? '') + (item.name ?? '') + (item[props.optionValue ?? 'value'] ?? '');
            return toSearchableString(searchStr).toLowerCase().includes(toSearchableString(temp_value_string.value));
        });

        emit('complete');
    };

    const hide = () => {
        isOpen.value = false;
        activeIndex.value = -1;
    };

    const onInput = (event: Event) => {
        const val = (event.target as HTMLInputElement).value;
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

    const selectOption = (item: any) => {
        temp_value.value = item;
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

    watch(temp_value, () => {
        search();
        isDone.value = testIsDone();
        if (temp_value.value && typeof temp_value.value !== 'string') emit('update:modelValue', temp_value.value);
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
        font-size: 0.9em;
        min-width: 15px;
        color: var(--background-500);
    }
}
</style>
