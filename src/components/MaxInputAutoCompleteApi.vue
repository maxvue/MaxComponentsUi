<template>
    <InputBase v-bind="props" :done="isDone" :error="props.error" :caution="props.caution" class="max-input-auto-complete-api">
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
                    :autocomplete="inputAttrs?.autocomplete ?? 'off'"
                    role="combobox"
                    aria-autocomplete="list"
                    :aria-expanded="isOverlayActive"
                    :aria-controls="isOverlayActive ? listboxId : undefined"
                    :aria-activedescendant="isOverlayActive && activeIndex >= 0 && activeIndex < filtered_values.length ? `${listboxId}-opt-${activeIndex}` : undefined"
                    :aria-busy="isLoading"
                    @input="onInput"
                    @focus="onFocus"
                    @blur="onBlur"
                    @keydown.down.prevent="onArrowDown"
                    @keydown.up.prevent="onArrowUp"
                    @keydown.enter.prevent="onEnter"
                    @keydown.esc.prevent="hide"
                />
            </div>

            <Teleport to="body" v-if="isOverlayActive">
                <div
                    ref="overlayEl"
                    :id="listboxId"
                    class="max-autocomplete-overlay"
                    role="listbox"
                    :aria-label="props.label || props.placeholder || 'Sugestões'"
                    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width, zIndex: overlayZIndex }"
                    @click.stop
                    @scroll="onOverlayScroll"
                >
                    <div v-if="isLoading" class="max-autocomplete-status max-autocomplete-loading" role="status" aria-live="polite">
                        <slot name="loading">
                            <i class="max-icon-spinner animate-spin" />
                            <span>Buscando sugestões...</span>
                        </slot>
                    </div>
                    <div v-else-if="hasError" class="max-autocomplete-status max-autocomplete-error" role="alert">
                        <slot name="error" :retry="fetchData">
                            <span class="max-autocomplete-error-msg">{{ errorMessage || 'Falha ao buscar sugestões.' }}</span>
                            <button type="button" class="max-autocomplete-retry-btn" @click.stop="fetchData">
                                Tentar novamente
                            </button>
                        </slot>
                    </div>
                    <div v-else-if="filtered_values.length === 0" class="max-autocomplete-status max-autocomplete-empty" role="status">
                        <slot name="empty">
                            <span>Nenhum resultado encontrado.</span>
                        </slot>
                    </div>
                    <div v-else class="max-autocomplete-list-container">
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
                                        <div class="autocomplete-item-select-label">{{ entry.item.model ?? entry.item.label ?? entry.item[props.optionLabel ?? 'label'] }}</div>
                                        <div class="autocomplete-item-select-sub-label">{{ entry.item.sub_label ?? entry.item.subLabel ?? entry.item['sub-label'] }}</div>
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
    /**
     * Componente Autocomplete que busca sugestões de uma API.
     * Integra-se com as rotas do backend Max para busca dinâmica.
     */
    import { hasContent, toSearchableString, getCachedApiIDB, isBlank, size, isEqual } from '@maxvue/max-use';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import { getOverlayWidth, getOverlayLeft } from '../helpers/useOverlayWidth';
    import { useOutsidePointer } from '../helpers/useOutsidePointer';
    import { useVirtualList } from '../composables/useVirtualList';
    import type { Ref } from 'vue';
    import { ref, computed, watch, nextTick, onBeforeUnmount, useId } from 'vue';
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
        noMessage?: boolean;
        disabled?: boolean | undefined;
        optionValue?: string | undefined;
        optionLabel?: string | undefined;
        dropdownMode?: string;
        multiple?: boolean;
        variant?: any;
        minLength?: number;
        delay?: number;
        forceSelection?: boolean;
        /** Altura de cada linha em px (padrão: 40) */
        itemHeight?: number | string | undefined;
        /** Força ou desativa a virtualização da lista */
        virtualScroll?: boolean | undefined;
        /** Limiar para ativação automática do virtual scroll (padrão: 500) */
        virtualScrollThreshold?: number | undefined;
        /** Tolerância de itens renderizados fora da viewport (overscan) */
        numToleratedItems?: number | undefined;
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
        forceSelection: false,
        itemHeight: 40,
        virtualScroll: undefined,
        virtualScrollThreshold: 500,
        numToleratedItems: 5
    });

    const listboxId = useId();
    const temp_value: Ref = ref(props.modelValue);
    const last_valid = ref<any>(props.modelValue && typeof props.modelValue !== 'string' ? props.modelValue : null);
    const list: Ref<any[]> = ref([]);
    const filtered_values: Ref<any[]> = ref([]);
    const isOpen = ref(false);
    const activeIndex = ref<number>(-1);

    watch(() => props.modelValue, (val) => {
        if (val && typeof val !== 'string') last_valid.value = val;
    });

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

    const isOverlayActive = computed(() => {
        if (!isOpen.value) return false;
        return isLoading.value || hasError.value || filtered_values.value.length > 0 || hasSearched.value;
    });
    const getOverlayContentWidth = (currentWidth: number) => {
        const overlay = overlayEl.value;
        const baseWidth = currentWidth > 0 ? currentWidth : (overlay?.scrollWidth ?? (ac.value as any)?.getBoundingClientRect?.().width ?? 160);
        if (!overlay) return baseWidth;

        const textElements = overlay.querySelectorAll<HTMLElement>('.autocomplete-item-select-label, .autocomplete-item-select-sub-label');
        const overflowWidth = Array.from(textElements).reduce(
            (largest, element) => Math.max(largest, element.scrollWidth - element.clientWidth),
            0
        );

        const optionElements = overlay.querySelectorAll<HTMLElement>('.max-autocomplete-item');
        const itemOverflow = Array.from(optionElements).reduce(
            (largest, element) => Math.max(largest, element.scrollWidth - element.clientWidth),
            0
        );

        return baseWidth + Math.max(0, overflowWidth, itemOverflow);
    };

    const { position, zIndex: overlayZIndex } = useActiveOverlayPosition({
        target: ac,
        overlay: overlayEl,
        active: isOverlayActive,
        compute: (ctx) => {
            const { targetRect, overlayRect, viewportWidth, viewportHeight } = ctx;
            const targetX = targetRect.left;
            const targetY = targetRect.top;
            const targetH = targetRect.height;
            const overlayH = overlayRect.height || 200;

            const width = getOverlayWidth({
                triggerWidth: targetRect.width,
                contentWidth: getOverlayContentWidth(overlayRect.width),
                windowWidth: viewportWidth
            });
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
        if (typeof temp_value.value === 'string') return temp_value.value;
        const opt = temp_value.value;
        return opt.model ?? opt.label ?? opt[props.optionLabel ?? 'label'] ?? opt.name ?? opt.value ?? '';
    });

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
        if (typeof target === 'string') return option[valKey] === target || option.id === target || option.value === target || option.model === target;
        return option === target;
    };

    let requestGeneration = 0;
    let currentAbortController: AbortController | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const isLoading = ref(false);
    const hasError = ref(false);
    const errorMessage = ref<string | null>(null);
    const hasSearched = ref(false);

    const clearScheduler = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
    };

    const abortInFlight = () => {
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
        }
    };

    const executeFetch = () => {
        if (isBlank(props.route)) return;
        if (isBlank(props.data)) return;

        const input_value = typeof temp_value.value === 'string' ? temp_value.value : '';
        if (input_value.length < props.minLength) {
            abortInFlight();
            isLoading.value = false;
            return;
        }

        abortInFlight();
        const generation = ++requestGeneration;

        const controller = new AbortController();
        currentAbortController = controller;

        isLoading.value = true;
        hasError.value = false;
        errorMessage.value = null;

        const requestParams = { ...(props.data ?? {}), input_value };

        const applyIfCurrent = (res: any) => {
            if (generation !== requestGeneration || controller.signal.aborted) return;
            isLoading.value = false;
            hasSearched.value = true;
            if (isBlank(res) || size(res) === 0) {
                list.value = [];
                search();
                return;
            }
            if (isEqual(list.value, res)) return;
            list.value = res;
            search();
        };

        (getCachedApiIDB as any)(
            props.route,
            requestParams,
            null,
            undefined,
            applyIfCurrent,
            { signal: controller.signal }
        ).then((res: any) => {
            if (controller.signal.aborted) return;
            applyIfCurrent(res);
        }).catch((err: any) => {
            if (controller.signal.aborted || err?.name === 'AbortError') return;
            if (generation === requestGeneration) {
                isLoading.value = false;
                hasError.value = true;
                errorMessage.value = err?.message || 'Falha ao buscar sugestões.';
            }
        });
    };

    const scheduleFetch = (immediate: boolean = false) => {
        clearScheduler();

        if (isBlank(props.route) || isBlank(props.data)) {
            abortInFlight();
            isLoading.value = false;
            return;
        }

        const input_value = typeof temp_value.value === 'string' ? temp_value.value : '';
        if (input_value.length < props.minLength) {
            abortInFlight();
            isLoading.value = false;
            return;
        }

        const delay = props.delay ?? 300;
        if (immediate || delay <= 0) executeFetch();
        else debounceTimer = setTimeout(() => {
            executeFetch();
        }, delay);
    };

    const fetchData = () => {
        scheduleFetch(true);
    };

    watch(
        [() => props.route, () => props.data],
        ([newRoute, newData], [oldRoute, oldData] = ['', {}]) => {
            if (isBlank(newRoute)) return;
            if (isBlank(newData)) return;
            if (isEqual(newData, oldData) && newRoute === oldRoute) return;
            scheduleFetch();
        },
        { deep: true, immediate: true }
    );

    watch(() => props.minLength, () => {
        scheduleFetch();
    });

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'complete': [event?: any];
        'blur': [event?: any];
    }>();

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
        else filtered_values.value = [];

        emit('complete');
    };

    const hide = () => {
        isOpen.value = false;
        activeIndex.value = -1;
    };

    const onInput = (event: Event) => {
        const val = (event.target as HTMLInputElement).value;
        temp_value.value = val;
        isOpen.value = temp_value_string.value.length >= props.minLength;
    };

    const onFocus = () => {
        if (typeof temp_value.value === 'string' && temp_value.value.length >= props.minLength) {
            search();
            isOpen.value = true;
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
        last_valid.value = item;
        temp_value.value = item;
        hide();
    };

    const onArrowDown = () => {
        if (!isOpen.value) {
            search();
            isOpen.value = true;
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
    };

    watch(isOpen, (open) => {
        if (open) nextTick(() => {
            const el = overlayEl.value;
            if (el) setViewport(el.scrollTop, el.clientHeight);
        });

    });

    watch(temp_value, (newVal) => {
        search();
        isDone.value = testIsDone();
        if (temp_value.value && typeof temp_value.value !== 'string') emit('update:modelValue', temp_value.value);
        if (typeof newVal === 'string') scheduleFetch();
    }, { flush: 'sync' });

    useOutsidePointer(isOpen, {
        elements: () => [ac.value, overlayEl.value],
        onClose: () => hide(),
        triggerEl: inputEl
    });

    onBeforeUnmount(() => {
        clearScheduler();
        abortInFlight();
        requestGeneration++;


    });

    defineExpose({
        temp_value,
        temp_value_string,
        list,
        filtered_values,
        isOpen,
        testIsDone,
        isDone,
        search,
        isLoading,
        hasError,
        errorMessage,
        fetchData,
        scheduleFetch
    });
</script>

<style lang="scss" scoped>
.max-input-auto-complete-api {
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
}

.max-autocomplete-overlay {
    position: fixed;
    box-sizing: border-box;
    width: max-content;
    max-width: min(500px, calc(100vw - 50px));
    z-index: var(--z-dropdown, 1000);
    background: var(--background-0, #fff);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    max-height: 240px;
    overflow-y: auto;
    scrollbar-width: thin;

    .max-autocomplete-status {
        padding: 12px 16px;
        font-size: 0.875rem;
        color: var(--background-700, #64748b);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        text-align: center;

        &.max-autocomplete-loading {
            color: var(--max-primary-500, #00768e);

            .animate-spin {
                animation: spin 1s linear infinite;
            }
        }

        &.max-autocomplete-error {
            color: var(--max-danger-500, #ef4444);
            flex-direction: column;
            gap: 6px;

            .max-autocomplete-error-msg {
                max-width: 100%;
                overflow-wrap: break-word;
            }

            .max-autocomplete-retry-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 4px 10px;
                font-size: 0.8rem;
                font-family: inherit;
                color: var(--max-primary-500, #00768e);
                background: transparent;
                border: 1px solid var(--max-primary-500, #00768e);
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.15s ease, color 0.15s ease;

                &:hover {
                    background: var(--blue-50, #f0fdfa);
                    color: var(--max-primary-600, #005f77);
                }

                &:focus-visible {
                    outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
                    outline-offset: 1px;
                }
            }
        }

        &.max-autocomplete-empty {
            color: var(--background-500, #94a3b8);
            font-style: italic;
        }
    }

    .max-autocomplete-list-container {
        position: relative;

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
                        font-size: 0.9em;
                        min-width: 15px;
                        color: var(--background-650);
                    }
                }
            }
        }
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .loading-spinner {
        animation-duration: 4s;
    }
}
</style>
