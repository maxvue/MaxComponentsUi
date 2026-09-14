<template>
    <InputBase v-bind="props" class="max-input-auto-complete if" :value="temp_value" :done="isDone" :error="props.error" :caution="caution">
        <template #default="{ inputAttrs }">
            <div ref="ac" class="max-autocomplete" :class="{ 'is-disabled': props.disabled }">
                <input
                    ref="inputEl"
                    type="text"
                    class="max-input-native max-autocomplete-input"
                    v-bind="inputAttrs"
                    :value="displayedText"
                    :placeholder="props.placeholder ?? 'SELECIONE'"
                    :disabled="props.disabled"
                    :spellcheck="props.spellcheck"
                    autocomplete="off"
                    role="combobox"
                    aria-autocomplete="list"
                    :aria-expanded="isOpen && filtered_values.length > 0"
                    :aria-controls="isOpen && filtered_values.length > 0 ? listboxId : undefined"
                    :aria-activedescendant="isOpen && activeIndex >= 0 && activeIndex < filtered_values.length && isItemMounted ? `${listboxId}-opt-${activeIndex}` : undefined"
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

            <Teleport to="body" v-if="isOpen && filtered_values.length > 0">
                <div
                    ref="overlayEl"
                    :id="listboxId"
                    class="max-autocomplete-overlay"
                    role="listbox"
                    :aria-label="props.label || props.placeholder || 'Sugestões'"
                    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width }"
                    @click.stop
                    @scroll="onOverlayScroll"
                >
                    <div class="max-autocomplete-list-container">
                        <div v-if="isVirtual" class="max-autocomplete-spacer" :style="{ height: `${totalHeight}px` }" aria-hidden="true" />
                        <ul
                            class="max-autocomplete-list"
                            :class="{ 'is-virtual': isVirtual }"
                            :style="isVirtual ? { transform: `translateY(${offsetY}px)` } : undefined"
                        >
                            <li
                                v-for="entry in visibleItems"
                                :key="entry.index"
                                :id="`${listboxId}-opt-${entry.index}`"
                                class="max-autocomplete-item"
                                :class="{ 'max-autocomplete-item-active': activeIndex === entry.index }"
                                role="option"
                                :aria-selected="isOptionSelected(entry.item) ? 'true' : 'false'"
                                @click.stop="selectOption(entry.item)"
                                @mouseenter="activeIndex = entry.index"
                            >
                                <slot name="option" :option="entry.item" :index="entry.index">
                                    <div class="autocomplete-item-select">
                                        <div class="autocomplete-item-select-label">
                                            {{ entry.item[props.optionLabel ?? 'label'] ?? entry.item.label ?? entry.item.name }}
                                        </div>
                                        <div class="autocomplete-item-select-sub-label">
                                            {{ entry.item.subLabel ?? entry.item.sublabel ?? entry.item['sub-label'] }}
                                        </div>
                                    </div>
                                </slot>
                            </li>
                        </ul>
                    </div>
                </div>
            </Teleport>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { hasContent, toSearchableString } from '@maxvue/max-use';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import { getOverlayWidth, getOverlayLeft } from '../helpers/useOverlayWidth';
    import { useVirtualList } from '../composables/useVirtualList';
    import type { Ref } from 'vue';
    import { ref, computed, watch, nextTick, useId } from 'vue';
    import InputBase from './InputBase.vue';
    import { useOutsidePointer } from '../helpers/useOutsidePointer';

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
            /** Altura de cada linha em px (padrão: 40) */
            itemHeight?: number | string | undefined;
            /** Força ou desativa a virtualização da lista */
            virtualScroll?: boolean | undefined;
            /** Limiar para ativação automática do virtual scroll (padrão: 500) */
            virtualScrollThreshold?: number | undefined;
            /** Tolerância de itens renderizados fora da viewport (overscan) */
            numToleratedItems?: number | undefined;
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
            restoreOnInvalid: true,
            itemHeight: 40,
            virtualScroll: undefined,
            virtualScrollThreshold: 500,
            numToleratedItems: 5
        }
    );

    const listboxId = useId();
    const list = computed(() => props.options ?? []);
    const temp_value = ref<any>(props.modelValue);
    const filtered_values = ref<any[]>([]);
    const input_text = ref<string>('');
    const last_valid = ref<any>(props.modelValue && typeof props.modelValue !== 'string' ? props.modelValue : null);

    const numericItemHeight = computed(() => {
        if (typeof props.itemHeight === 'number') return props.itemHeight;
        if (typeof props.itemHeight === 'string') {
            const p = parseFloat(props.itemHeight);
            return isNaN(p) ? 40 : p;
        }
        return 40;
    });

    const isVirtual = computed(() => {
        if (props.virtualScroll !== undefined) return Boolean(props.virtualScroll);
        return filtered_values.value.length > (props.virtualScrollThreshold ?? 500);
    });

    const {
        visibleItems,
        offsetY,
        totalHeight,
        setViewport,
        scrollToIndex
    } = useVirtualList(filtered_values, {
        itemHeight: numericItemHeight,
        enabled: isVirtual,
        overscan: props.numToleratedItems ?? 5
    });

    const onOverlayScroll = (e: Event) => {
        const el = e.target as HTMLElement;
        if (el) setViewport(el.scrollTop, el.clientHeight);
    };

    const ac = ref<HTMLElement | null>(null);
    const inputEl = ref<HTMLInputElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);
    const isOpen = ref(false);
    const activeIndex = ref<number>(-1);

    const isItemMounted = computed(() => {
        if (!isVirtual.value) return true;
        return visibleItems.value.some((entry) => entry.index === activeIndex.value);
    });

    watch(filtered_values, (newVals) => {
        if (activeIndex.value >= newVals.length) activeIndex.value = -1;

    });

    const isOverlayActive = computed(() => isOpen.value && filtered_values.value.length > 0);
    const { position } = useActiveOverlayPosition({
        target: ac,
        overlay: overlayEl,
        active: isOverlayActive,
        compute: (ctx) => {
            const { targetRect, overlayRect, viewportWidth, viewportHeight } = ctx;
            const targetX = targetRect.left;
            const targetY = targetRect.top;
            const targetH = targetRect.height;
            const overlayH = overlayRect.height || 200;

            const width = getOverlayWidth({ triggerWidth: targetRect.width, windowWidth: viewportWidth });
            let top = targetY + targetH + 2;

            if (top + overlayH > viewportHeight && targetY - overlayH > 0) top = targetY - overlayH - 2;


            return {
                top,
                left: getOverlayLeft(targetX, width, viewportWidth),
                width: width + 'px'
            };
        }
    });

    const displayedText = computed(() => {
        if (!temp_value.value) return '';
        if (typeof temp_value.value === 'string') {
            const opt = list.value.find((item: any) => item[props.optionValue ?? 'value'] === temp_value.value || item.id === temp_value.value || item.value === temp_value.value);
            if (opt) {
                const labelKey = props.optionLabel ?? 'name';
                return opt[labelKey] ?? opt.label ?? opt.name ?? opt.value ?? '';
            }
            return temp_value.value;
        }
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

    const caution = computed(() => (props.caution !== undefined ? props.caution : isDone.value === false));

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'complete': [event?: any];
        'blur': [event?: any];
    }>();

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
        if (!props.forceSelection) emit('update:modelValue', val);

    };

    const onFocus = () => {
        if (typeof temp_value.value === 'string' && temp_value.value) {
            search();
            isOpen.value = filtered_values.value.length > 0;
        }
    };

    const onBlur = () => {
        if (!props.forceSelection) emit('update:modelValue', temp_value.value);

        isDone.value = testIsDone();
        emit('blur');
        setTimeout(() => {
            if (isOpen.value) hide();
        }, 150);
    };

    const isOptionSelected = (option: any): boolean => {
        const target = (temp_value.value && typeof temp_value.value !== 'string')
            ? temp_value.value
            : (last_valid.value ?? props.modelValue);
        if (!target) return false;
        const valKey = props.optionValue ?? 'value';
        if (typeof target === 'object') {
            if (target[valKey] !== undefined && option[valKey] !== undefined) return target[valKey] === option[valKey];

            if (target.id !== undefined && option.id !== undefined) return target.id === option.id;

            if (target.value !== undefined && option.value !== undefined) return target.value === option.value;

            return option === target;
        }
        if (typeof target === 'string') return option[valKey] === target || option.id === target || option.value === target;

        return option === target;
    };

    const onChange = () => {
        if (props.forceSelection) {
            if (typeof temp_value.value === 'string') if (input_text.value && props.restoreOnInvalid && last_valid.value) {
                temp_value.value = last_valid.value;
                input_text.value = '';
            } else {
                input_text.value = '';
                last_valid.value = null;
                temp_value.value = null;
                emit('update:modelValue', null);
            }

        } else emit('update:modelValue', temp_value.value);
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
        if (activeIndex.value < filtered_values.value.length - 1) {
            activeIndex.value++;
            if (isVirtual.value) {
                const targetScroll = scrollToIndex(activeIndex.value, 'auto');
                if (overlayEl.value) overlayEl.value.scrollTop = targetScroll;
            }
        }
    };

    const onArrowUp = () => {
        if (activeIndex.value > 0) {
            activeIndex.value--;
            if (isVirtual.value) {
                const targetScroll = scrollToIndex(activeIndex.value, 'auto');
                if (overlayEl.value) overlayEl.value.scrollTop = targetScroll;
            }
        }
    };

    const onEnter = () => {
        if (isOpen.value && activeIndex.value >= 0 && activeIndex.value < filtered_values.value.length) selectOption(filtered_values.value[activeIndex.value]);
        else if (!props.forceSelection) {
            hide();
            emit('update:modelValue', temp_value.value);
        }
    };

    watch(isOpen, (open) => {
        if (open) nextTick(() => {
            const el = overlayEl.value;
            if (el) setViewport(el.scrollTop, el.clientHeight);
        });

    });

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
        if (novo) {
            if (!props.forceSelection) emit('update:modelValue', novo);

            return;
        }

        // Daqui para baixo o valor foi zerado. Só interessa quando havia algo antes.
        if (!antigo) return;

        if (input_text.value) {
            if (props.forceSelection && props.restoreOnInvalid && last_valid.value) {
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

    useOutsidePointer(isOpen, {
        elements: () => [overlayEl.value, ac.value],
        onClose: () => hide(),
        closeOnEscape: true,
        triggerEl: ac
    });
</script>

<style lang="scss" scoped>
.max-input-auto-complete {
    .max-autocomplete {
        width: 100%;
        position: relative;
        display: flex;
        align-items: center;

        .max-autocomplete-input {
            width: 100%;
            height: 36px;
            border: none;
            outline: none;
            background: transparent;
            font-size: 0.9rem;
            color: var(--background-700);
            padding: 0 10px;
        }
    }

    &.text-centereds {
        :deep(input) {
            padding-left: 32px !important;
        }
    }
}

.max-autocomplete-overlay {
    position: fixed;
    z-index: var(--z-dropdown, 1000);
    background: var(--background-0, #fff);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    max-height: 240px;
    overflow-y: auto;
    scrollbar-width: thin;

    .max-autocomplete-list-container {
        position: relative;
    }

    .max-autocomplete-spacer {
        width: 100%;
    }

    .max-autocomplete-list {
        list-style: none;
        margin: 0;
        padding: 4px 0;

        &.is-virtual {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
        }

        .max-autocomplete-item {
            cursor: pointer;

            &:hover,
            &.max-autocomplete-item-active {
                background-color: var(--background-100, #f1f5f9);
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
                    color: var(--background-700);
                }

                .autocomplete-item-select-sub-label {
                    display: grid;
                    place-items: center;
                    font-size: 0.8rem;
                    min-width: 15px;
                    color: var(--background-650);
                }
            }
        }
    }
}
</style>
