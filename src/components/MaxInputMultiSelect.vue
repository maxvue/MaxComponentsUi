<template>
    <InputBase v-bind="{ ...inputBaseProps, ...attrsWithoutModelProps }" class="max-input-multi-select select_input_div">
        <template #default="{ inputAttrs }">
            <div v-if="showPlaceholder" class="placeholder-select">
                {{ props.placeholder ?? 'Selecione...' }}
            </div>

            <div class="max-select-wrapper">
                <div ref="triggerEl" v-bind="inputAttrs" class="max-select max-multiselect-trigger" :class="{ 'is-disabled': props.disabled, 'is-focused': isOpen }" :tabindex="props.disabled ? -1 : 0" role="combobox" aria-haspopup="listbox" :aria-expanded="props.disabled ? false : isOpen" :aria-disabled="props.disabled ? 'true' : undefined" :aria-controls="props.disabled || !isOpen ? undefined : listboxId" @click.stop="toggle" @keydown="onTriggerKeydown">
                    <div class="max-select-label max-multiselect-display">
                        <slot name="value" :value="selectedValues" :items="selectedOptions">
                            <template v-if="selectedOptions.length > 0">
                                <div v-if="shouldShowSummaryCount" class="max-multiselect-summary">
                                    {{ selectedSummaryText }}
                                </div>
                                <div v-else-if="props.displayMode === 'comma'" class="max-multiselect-comma">
                                    {{ selectedOptions.map(opt => getOptionLabel(opt)).join(', ') }}
                                </div>
                                <div v-else class="max-multiselect-chips">
                                    <span v-for="opt in selectedOptions" :key="getOptionKey(opt)" class="max-multiselect-chip">
                                        <span class="chip-text">{{ getOptionLabel(opt) }}</span>
                                        <button v-if="!props.disabled" type="button" class="chip-remove" :aria-label="`Remover ${getOptionLabel(opt)}`" @click.stop="removeOption(opt)">
                                            <MaxIcon icon="lucide:x" size="0.7" />
                                        </button>
                                    </span>
                                </div>
                            </template>
                        </slot>
                    </div>

                    <div class="max-select-dropdown" aria-hidden="true">
                        <MaxIcon :icon="isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="1" />
                    </div>
                </div>

                <button v-if="props.clearable && selectedValues.length > 0 && !props.disabled" type="button" class="max-select-clear-btn" aria-label="Limpar seleção" @click.stop="clearSelection">
                    <MaxIcon icon="lucide:x" size="0.85" />
                </button>
            </div>

            <Teleport to="body" v-if="isOpen">
                <div ref="overlayEl" :id="listboxId" class="max-select-overlay max-multiselect-overlay" role="listbox" aria-multiselectable="true" tabindex="-1" :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width, zIndex: overlayZIndex }" @click.stop>
                    <div v-if="props.filter || props.selectAll" class="max-multiselect-header">
                        <div v-if="props.filter" class="max-select-filter-container">
                            <input ref="filterInputEl" type="text" autocomplete="off" class="max-select-filter" v-model="searchQuery" :placeholder="props.filterPlaceholder ?? 'Pesquisar...'" role="searchbox" aria-autocomplete="list" @keydown="onFilterKeydown" @click.stop />
                        </div>
                        <div v-if="props.selectAll && filteredOptions.length > 0" class="max-multiselect-select-all-bar">
                            <button type="button" class="max-multiselect-select-all-btn" @click.stop="toggleSelectAll">
                                {{ isAllSelected ? 'Desmarcar todos' : 'Selecionar todos' }}
                            </button>
                        </div>
                    </div>

                    <div ref="listContainerEl" class="max-select-list-container">
                        <template v-if="filteredOptions.length > 0">
                            <div v-for="(opt, idx) in filteredOptions" :key="getOptionKey(opt)" :id="`${listboxId}-opt-${idx}`" class="max-select-option max-multiselect-option" :class="{ 'is-selected': isOptionSelected(opt), 'is-focused': highlightedIndex === idx }" role="option" :aria-selected="isOptionSelected(opt)" @click.stop="toggleOption(opt)" @mouseenter="highlightedIndex = idx">
                                <span class="max-multiselect-checkbox" :class="{ 'is-checked': isOptionSelected(opt) }" aria-hidden="true">
                                    <MaxIcon v-if="isOptionSelected(opt)" icon="lucide:check" size="0.75" />
                                </span>
                                <span class="max-multiselect-option-label">{{ getOptionLabel(opt) }}</span>
                            </div>
                        </template>
                        <div v-else class="max-select-empty-message" role="status">
                            {{ props.emptyMessage ?? 'Nenhum resultado encontrado' }}
                        </div>
                    </div>
                </div>
            </Teleport>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs, useId, nextTick } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import { useOutsidePointer } from '../helpers/useOutsidePointer';

    defineOptions({
        name: 'MaxInputMultiSelect',
        inheritAttrs: false
    });

    export interface MaxInputMultiSelectProps {
        modelValue?: any[];
        options?: any[];
        optionLabel?: string;
        optionValue?: string;
        placeholder?: string;
        filter?: boolean;
        filterPlaceholder?: string;
        clearable?: boolean;
        disabled?: boolean;
        displayMode?: 'chips' | 'comma' | 'count';
        maxSelectedLabels?: number;
        selectAll?: boolean;
        emptyMessage?: string;
        label?: string;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        done?: boolean | null;
        required?: boolean | null;
        message?: string;
        icon?: string;
        iconLeft?: string;
        iconRight?: string;
    }

    const props = withDefaults(defineProps<MaxInputMultiSelectProps>(), {
        modelValue: () => [],
        options: () => [],
        optionLabel: 'label',
        optionValue: 'value',
        placeholder: 'Selecione...',
        filter: false,
        filterPlaceholder: 'Pesquisar...',
        clearable: true,
        disabled: false,
        displayMode: 'chips',
        maxSelectedLabels: 3,
        selectAll: false,
        emptyMessage: 'Nenhum resultado encontrado'
    });

    const emit = defineEmits<{
        'update:modelValue': [value: any[]];
        'change': [value: any[]];
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
        icon: props.icon,
        iconLeft: props.iconLeft,
        iconRight: props.iconRight,
        disabled: props.disabled
    }));

    const listboxId = useId();
    const isOpen = ref(false);
    const searchQuery = ref('');
    const highlightedIndex = ref(-1);

    const triggerEl = ref<HTMLElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);
    const filterInputEl = ref<HTMLInputElement | null>(null);
    const listContainerEl = ref<HTMLElement | null>(null);

    const selectedValues = computed<any[]>(() => {
        if (!Array.isArray(props.modelValue)) return [];
        return props.modelValue;
    });

    const getOptionLabel = (option: any): string => {
        if (option === null || option === undefined) return '';
        if (typeof option === 'object') return String(option[props.optionLabel] ?? option.label ?? option.name ?? '');

        return String(option);
    };

    const getOptionValue = (option: any): any => {
        if (option === null || option === undefined) return option;
        if (typeof option === 'object') return option[props.optionValue] !== undefined ? option[props.optionValue] : (option.value !== undefined ? option.value : option);

        return option;
    };

    const getOptionKey = (option: any): string => {
        const val = getOptionValue(option);
        if (val === null || val === undefined) return String(Math.random());
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    const isOptionSelected = (option: any): boolean => {
        const val = getOptionValue(option);
        return selectedValues.value.some((selected) => {
            if (typeof selected === 'object' && selected !== null && typeof val === 'object' && val !== null) return JSON.stringify(selected) === JSON.stringify(val);

            return selected === val;
        });
    };

    const selectedOptions = computed<any[]>(() => {
        const result: any[] = [];
        for (const selected of selectedValues.value) {
            const matched = props.options.find((opt) => {
                const val = getOptionValue(opt);
                return typeof val === 'object' && val !== null
                    ? JSON.stringify(val) === JSON.stringify(selected)
                    : val === selected;
            });
            if (matched) result.push(matched);
            else result.push(typeof selected === 'object' ? selected : { [props.optionLabel]: String(selected), [props.optionValue]: selected });

        }
        return result;
    });

    const filteredOptions = computed<any[]>(() => {
        if (!props.filter || !searchQuery.value.trim()) return props.options;
        const q = searchQuery.value.toLowerCase().trim();
        return props.options.filter((opt) => getOptionLabel(opt).toLowerCase().includes(q));
    });

    const isAllSelected = computed(() => {
        if (filteredOptions.value.length === 0) return false;
        return filteredOptions.value.every((opt) => isOptionSelected(opt));
    });

    const shouldShowSummaryCount = computed(() => {
        if (props.displayMode === 'count') return true;
        return selectedValues.value.length > props.maxSelectedLabels;
    });

    const selectedSummaryText = computed(() => {
        const count = selectedValues.value.length;
        if (count === 1) return '1 item selecionado';
        return `${count} itens selecionados`;
    });

    const showPlaceholder = computed(() => selectedValues.value.length === 0);

    const toggle = () => {
        if (props.disabled) return;
        if (isOpen.value) close();
        else open();

    };

    const open = () => {
        if (props.disabled) return;
        isOpen.value = true;
        searchQuery.value = '';
        highlightedIndex.value = -1;
        nextTick(() => {
            updatePosition();
            if (props.filter && filterInputEl.value) filterInputEl.value.focus();

        });
    };

    const close = () => {
        isOpen.value = false;
        searchQuery.value = '';
        highlightedIndex.value = -1;
    };

    useOutsidePointer(isOpen, {
        elements: () => [triggerEl.value, overlayEl.value].filter(Boolean) as HTMLElement[],
        onClose: () => close()
    });

    const { position, zIndex: overlayZIndex, updatePosition } = useActiveOverlayPosition({
        target: triggerEl,
        overlay: overlayEl,
        active: isOpen,
        compute: ({ targetRect, overlayRect, viewportWidth, viewportHeight }) => {
            const width = targetRect.width;
            let top = targetRect.bottom + 4;
            const overlayH = overlayRect.height || 220;
            if (top + overlayH > viewportHeight && targetRect.top - overlayH > 0) top = targetRect.top - overlayH - 4;

            return {
                top,
                left: Math.max(8, Math.min(targetRect.left, viewportWidth - width - 8)),
                width: `${width}px`
            };
        }
    });

    const toggleOption = (option: any) => {
        if (props.disabled) return;
        const val = getOptionValue(option);
        let next: any[];
        if (isOptionSelected(option)) next = selectedValues.value.filter((item) => {
            if (typeof item === 'object' && item !== null && typeof val === 'object' && val !== null) return JSON.stringify(item) !== JSON.stringify(val);

            return item !== val;
        });
        else next = [...selectedValues.value, val];

        emit('update:modelValue', next);
        emit('change', next);
    };

    const removeOption = (option: any) => {
        if (props.disabled) return;
        const val = getOptionValue(option);
        const next = selectedValues.value.filter((item) => {
            if (typeof item === 'object' && item !== null && typeof val === 'object' && val !== null) return JSON.stringify(item) !== JSON.stringify(val);

            return item !== val;
        });
        emit('update:modelValue', next);
        emit('change', next);
    };

    const clearSelection = () => {
        if (props.disabled) return;
        emit('update:modelValue', []);
        emit('change', []);
    };

    const toggleSelectAll = () => {
        if (props.disabled) return;
        if (isAllSelected.value) {
            const filteredVals = filteredOptions.value.map(getOptionValue);
            const next = selectedValues.value.filter((item) => !filteredVals.includes(item));
            emit('update:modelValue', next);
            emit('change', next);
        } else {
            const next = [...selectedValues.value];
            for (const opt of filteredOptions.value) {
                const val = getOptionValue(opt);
                if (!next.includes(val)) next.push(val);
            }
            emit('update:modelValue', next);
            emit('change', next);
        }
    };

    const onTriggerKeydown = (e: KeyboardEvent) => {
        if (props.disabled) return;
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isOpen.value) open();
        } else if (e.key === 'Escape') close();

    };

    const onFilterKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            close();
            triggerEl.value?.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (filteredOptions.value.length > 0) highlightedIndex.value = (highlightedIndex.value + 1) % filteredOptions.value.length;

        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (filteredOptions.value.length > 0) highlightedIndex.value = (highlightedIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length;

        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) toggleOption(filteredOptions.value[highlightedIndex.value]);

        }
    };

    watch(() => props.disabled, (val) => {
        if (val && isOpen.value) close();
    });
</script>

<style lang="scss" scoped>
    .max-multiselect-trigger {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 36px;
        width: 100%;
        padding: 4px 8px;
    }

    .max-multiselect-display {
        flex: 1;
        display: flex;
        align-items: center;
        overflow: hidden;
    }

    .max-multiselect-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        max-width: 100%;
    }

    .max-multiselect-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: var(--max-primary-50, rgb(0 118 142 / 10%));
        color: var(--max-primary-700, #004860);
        border: 1px solid var(--max-primary-200, rgb(0 118 142 / 25%));
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        padding: 2px 6px;
        line-height: 1.2;
    }

    .chip-remove {
        background: transparent;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: currentcolor;
        opacity: 0.7;

        &:hover {
            opacity: 1;
        }
    }

    .max-multiselect-summary,
    .max-multiselect-comma {
        font-size: 13px;
        color: var(--max-neutral-800, #1f2937);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .max-multiselect-overlay {
        position: fixed;
        background: var(--background-0, #fff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 6px;
        box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
        max-height: 280px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .max-multiselect-header {
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        padding: 6px 8px;
        background: var(--background-50, #f9fafb);
    }

    .max-multiselect-select-all-bar {
        margin-top: 4px;
    }

    .max-multiselect-select-all-btn {
        background: transparent;
        border: none;
        color: var(--max-primary-500, #00768e);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        padding: 2px 4px;

        &:hover {
            text-decoration: underline;
        }
    }

    .max-multiselect-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        font-size: 13px;
        cursor: pointer;
        transition: background-color 0.15s;

        &:hover,
        &.is-focused {
            background-color: var(--background-100, #f3f4f6);
        }

        &.is-selected {
            background-color: var(--max-primary-50, rgb(0 118 142 / 8%));
            color: var(--max-primary-600, #005f77);
            font-weight: 500;
        }
    }

    .max-multiselect-checkbox {
        width: 16px;
        height: 16px;
        border: 1px solid var(--border-color, #cbd5e1);
        border-radius: 3px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--background-0, #fff);
        color: #fff;
        transition: all 0.15s;

        &.is-checked {
            background: var(--max-primary-500, #00768e);
            border-color: var(--max-primary-500, #00768e);
        }
    }

    .max-multiselect-option-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    @media (prefers-reduced-motion: reduce) {
        .max-multiselect-option,
        .max-multiselect-checkbox {
            transition: none;
        }
    }
</style>
