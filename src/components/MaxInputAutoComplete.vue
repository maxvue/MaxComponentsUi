<template>
    <InputBase v-bind="props" class="if" :value="temp_value" :done="isDone" :error="props.error" :caution="caution">
        <div ref="triggerRef" class="p-autocomplete p-component w-full">
            <MaxBaseInput
                type="text"
                v-bind="attrs"
                v-model="displayInputText"
                :placeholder="props.placeholder ?? 'SELECIONE'"
                :disabled="props.disabled"
                role="combobox"
                :aria-expanded="overlayVisible"
                :aria-controls="panelId"
                autocomplete="off"
                @input="onInput"
                @focus="onFocus"
                @blur="onBlur"
                @keydown="onKeydown"
            />
        </div>

        <MaxBaseOverlay
            v-model:visible="overlayVisible"
            :target="triggerRef"
            match-target-width
        >
            <div class="p-autocomplete-overlay p-component" :id="panelId">
                <ul class="p-autocomplete-list p-select-list" role="listbox">
                    <li
                        v-for="(opt, idx) in filtered_values"
                        :key="idx"
                        class="p-autocomplete-option p-select-option"
                        role="option"
                        @click.stop="selectOption(opt)"
                    >
                        <slot name="option" :option="opt" :index="idx">
                            <div class="autocomplete-item-select">
                                <div class="autocomplete-item-select-label">{{ opt[props.optionLabel ?? 'name'] ?? opt.label ?? opt.name }}</div>
                                <div class="autocomplete-item-select-sub-label">{{ opt.subLabel ?? opt.sublabel ?? opt['sub-label'] }}</div>
                            </div>
                        </slot>
                    </li>
                    <li v-if="filtered_values.length === 0" class="p-autocomplete-empty-message p-select-empty-message">
                        Nenhum resultado encontrado
                    </li>
                </ul>
            </div>
        </MaxBaseOverlay>
    </InputBase>
</template>

<script setup lang="ts">
    import { hasContent, toSearchableString, Random } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxBaseInput from './base/MaxBaseInput.vue';
    import MaxBaseOverlay from './base/MaxBaseOverlay.vue';

    const attrs: any = useAttrs();
    const panelId = `p-autocomplete-panel-${Random()}`;
    const triggerRef = ref<HTMLElement | null>(null);
    const overlayVisible = ref(false);

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
        }>(),
        { modelValue: '', options: () => [], done: undefined, error: undefined, required: false, caution: undefined, optionLabel: 'name' }
    );

    const list = computed(() => props.options ?? []);
    const temp_value: Ref = ref(props.modelValue);
    const filtered_values: Ref<any[]> = ref([]);
    const inputText = ref('');

    const displayInputText = computed({
        get() {
            if (typeof temp_value.value === 'string' && temp_value.value !== '') return temp_value.value;
            if (temp_value.value && typeof temp_value.value === 'object') return temp_value.value[props.optionLabel ?? 'name'] ?? temp_value.value.label ?? temp_value.value.name ?? '';

            return inputText.value;
        },
        set(val: string) {
            inputText.value = val;
            if (typeof temp_value.value === 'object') temp_value.value = val;

        }
    });

    const temp_value_string = computed(() => {
        if (temp_value.value && typeof temp_value.value === 'string') return temp_value.value;
        if (temp_value.value && typeof temp_value.value === 'object') return temp_value.value?.value ?? temp_value.value?.label ?? temp_value.value?.id ?? temp_value.value[props.optionValue ?? 'value'] ?? '';
        return inputText.value;
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

    const emit = defineEmits(['update:modelValue', 'complete', 'blur', 'focus']);

    watch(temp_value, () => {
        isDone.value = testIsDone();
        if (temp_value.value && typeof temp_value.value !== 'string') emit('update:modelValue', temp_value.value);
    });

    watch(() => props.modelValue, () => temp_value.value = props.modelValue);

    const search = () => {
        const query = toSearchableString(inputText.value || temp_value_string.value);
        filtered_values.value = list.value.filter((item: any) => {
            const searchStr = (item.value ?? '') + (item.label ?? '') + (item.name ?? '') + (item[props.optionValue ?? 'value'] ?? '');
            return toSearchableString(searchStr).toLowerCase().includes(query.toLowerCase());
        });
        emit('complete', { query });
    };

    const onInput = () => {
        search();
        overlayVisible.value = true;
    };

    const onFocus = (event: FocusEvent) => {
        search();
        overlayVisible.value = true;
        emit('focus', event);
    };

    const onBlur = (event: FocusEvent) => {
        setTimeout(() => {
            overlayVisible.value = false;
            isDone.value = testIsDone();
            emit('blur', event);
        }, 150);
    };

    const selectOption = (opt: any) => {
        temp_value.value = opt;
        emit('update:modelValue', opt);
        overlayVisible.value = false;
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') overlayVisible.value = false;

    };
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

        .p-autocomplete-option-group {
            position: sticky !important;
            top: 40px !important;
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

    .p-autocomplete-overlay {
        width: auto !important;
        background-color: var(--background-0, #fff);
        border: 1px solid var(--max-border-color, #e2e8f0);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgb(0 0 0 / 10%);

        .p-virtualscroller {
            width: auto !important;
            overflow-x: hidden;
            contain: content !important;

            .p-virtualscroller-content {
                position: relative !important;
            }
        }
    }

    .text-centereds {
        input {
            padding-left: 32px !important;
        }
    }

    .ref-div {
        position: absolute;
        width: 0;
        height: 0;
        top: 0;
        left: 0;
        z-index: -10;
    }
</style>
