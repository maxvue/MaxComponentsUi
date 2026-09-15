<template>
    <InputBase v-bind="{ ...props, ...attrsWithoutModelProps }" class="max-input-select select_input_div">
        <template #default="{ inputAttrs }">
            <div v-if="showPlaceholder" class="placeholder-select">
                {{ placeholderText }}
            </div>

            <div class="max-select-wrapper">
                <div
                    ref="triggerEl"
                    v-bind="inputAttrs"
                    class="max-select"
                    :class="{ 'is-disabled': props.disabled, 'is-focused': isOpen }"
                    :tabindex="props.disabled ? -1 : 0"
                    role="combobox"
                    aria-haspopup="listbox"
                    :aria-expanded="props.disabled ? false : isOpen"
                    :aria-disabled="props.disabled ? 'true' : undefined"
                    :aria-controls="props.disabled || !isOpen ? undefined : listboxId"
                    :aria-activedescendant="props.disabled ? undefined : activeDescendantId"
                    :aria-busy="loading ? 'true' : undefined"
                    @click.stop="toggle"
                    @keydown="onTriggerKeydown"
                >
                    <div class="max-select-label">
                        <slot name="value" :value="temp_value">
                            <div
                                class="value-div"
                                v-if="hasSelectedOption"
                                :style="{ color: option_selected.color }"
                            >
                                <MaxIcon
                                    :icon="option_selected.icon ?? null"
                                    :size="option_selected.icon_size ?? undefined"
                                    :style="{ paddingRight: option_selected.icon ? '10px' : '0' }"
                                />
                                <span class="value-text">{{ option_selected[props.optionName] ?? option_selected.name ?? option_selected.label }}</span>
                            </div>
                        </slot>
                    </div>

                    <div class="max-select-dropdown" aria-hidden="true">
                        <MaxIcon :icon="loading ? 'svg-spinners:ring-resize' : 'lucide:chevron-down'" size="1" />
                    </div>
                </div>

                <button
                    v-if="isClearable && hasSelectedOption && !props.disabled"
                    type="button"
                    class="max-select-clear-btn"
                    aria-label="Limpar seleção"
                    @click.stop="clearSelection"
                >
                    <MaxIcon icon="lucide:x" size="0.85" />
                </button>
            </div>

            <Teleport to="body" v-if="isOpen">
                <div
                    ref="overlayEl"
                    :id="listboxId"
                    class="max-select-overlay"
                    role="listbox"
                    tabindex="-1"
                    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width }"
                    @click.stop
                >
                    <div v-if="props.filter" class="max-select-header">
                        <div class="max-select-filter-container">
                            <input
                                ref="filterInputEl"
                                type="text"
                                class="max-select-filter"
                                v-model="searchQuery"
                                placeholder="Pesquisar..."
                                role="searchbox"
                                aria-autocomplete="list"
                                :aria-controls="listboxId"
                                :aria-activedescendant="activeDescendantId"
                                autofocus
                                @keydown="onFilterKeydown"
                                @click.stop
                            />
                        </div>
                    </div>

                    <div ref="listContainerEl" class="max-select-list-container" @scroll="onContainerScroll">
                        <div v-if="loading" class="max-select-empty-message" role="status" aria-live="polite">
                            Carregando...
                        </div>
                        <div v-else-if="loadError" class="max-select-empty-message is-error" role="alert">
                            <div>Não foi possível carregar as opções.</div>
                            <button type="button" class="max-select-retry-btn" @click.stop="retryLoad">Tentar novamente</button>
                        </div>
                        <template v-else-if="hasOptions">
                            <div v-if="isVirtual" class="max-select-spacer" :style="{ height: `${totalHeight}px` }" aria-hidden="true" />
                            <div
                                class="max-select-window"
                                :class="{ 'is-virtual': isVirtual }"
                                :style="isVirtual ? { transform: `translateY(${offsetY}px)` } : undefined"
                            >
                                <template v-for="entry in visibleItems" :key="entry.item.key">
                                    <div v-if="entry.item.type === 'group'" class="max-select-option-group-wrapper">
                                        <slot name="optiongroup" :option="entry.item.group">
                                            <div class="label_div max-select-option-group">
                                                <div class="labelz">
                                                    <div>{{ entry.item.label }}</div>
                                                </div>
                                            </div>
                                        </slot>
                                    </div>
                                    <div
                                        v-else
                                        :id="`${listboxId}-opt-${entry.item.selectableIndex}`"
                                        class="max-select-option"
                                        :class="{
                                            'max-select-option-selected is-selected': isOptionSelected(entry.item.option),
                                            'max-select-option-highlighted is-focused': highlightedIndex === entry.item.selectableIndex
                                        }"
                                        :style="{ height: itemHeight }"
                                        role="option"
                                        :aria-selected="isOptionSelected(entry.item.option)"
                                        @click.stop="selectOption(entry.item.option)"
                                        @mouseenter="highlightedIndex = entry.item.selectableIndex"
                                    >
                                        <slot
                                            name="option"
                                            :option="entry.item.option"
                                            :selected="isOptionSelected(entry.item.option)"
                                            :index="entry.item.optionIndex"
                                        >
                                            <div :class="`category ${entry.item.option.category}`" v-if="attrs.category === true">
                                                {{ entry.item.option.category === 'UTILITY' ? 'A' : '' }}{{ entry.item.option.category === 'MARKETING' ? 'B' : '' }}
                                            </div>
                                            <div class="label_div">
                                                <MaxIcon :icon="entry.item.option['icon']" v-if="entry.item.option['icon']" :size="entry.item.option?.['iconSize'] ?? '1'" :style="{ width: '30px' }" />
                                                <div class="labelz">
                                                    <div v-text="entry.item.option[props.optionLabel] ?? entry.item.option.label ?? entry.item.option.name" :style="{ color: attrs.color }"></div>
                                                </div>
                                                <div class="subLabel" v-text="entry.item.option?.sub_label ?? entry.item.option?.sub ?? entry.item.option?.subLabel"></div>
                                                <img v-if="entry.item.option['img']" :src="`/media/images/${entry.item.option['img']}`" alt="Image" class="img-label" />
                                            </div>
                                        </slot>
                                    </div>
                                </template>
                            </div>
                        </template>
                        <div v-else class="max-select-empty-message">
                            {{ attrs.emptyMessage ?? 'Nenhum registro encontrado' }}
                        </div>
                    </div>
                </div>
            </Teleport>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente de seleção (dropdown).
     * Suporta opções simples, agrupadas e carregamento dinâmico via callback.
     */
    import { ref, computed, watch, useAttrs, onBeforeUnmount, nextTick, type Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import { SelectGroupOptions } from '../types';
    import { isBlank } from '@maxvue/max-use';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import { getOverlayWidth, getOverlayLeft } from '../helpers/useOverlayWidth';
    import { useVirtualList } from '../composables/useVirtualList';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor selecionado */
            modelValue: any;
            /** Função assíncrona para carregar opções ao abrir o select */
            loadOptions?: (context?: { signal: AbortSignal }) => Promise<any[]>;
            /** Ícone principal (ex: 'mdi:user') */

            icon?: string | undefined;
            /** Flag que informa o campo do valor */
            optionValue?: string;
            /** Flag que informa o campo do label */
            optionLabel?: string;
            /** Flag que informa o campo do name */
            optionName?: string;
            /** Ícone posicionado à esquerda */
            iconLeft?: string | undefined;
            /** Ícone posicionado à direita */
            iconRight?: string | undefined;
            /** Alias para o ícone principal */
            i?: string | undefined;
            /** Ícone escuro comparado ao fundo */
            iconDark?: boolean | undefined | number | string;
            /** Ícone claro comparado ao fundo */
            iconLight?: boolean | undefined | number | string;
            /** Estado de conclusão/validação */
            done?: boolean | undefined;
            /** Mensagem ou estado de erro */
            error?: string | null | boolean | undefined;
            /** Mensagem ou estado de atenção */
            caution?: string | null | boolean | undefined;
            /** Indica se o campo é obrigatório */
            required?: boolean | undefined;
            /** Oculta a área de mensagem */
            noMessage?: boolean;
            /** Ícone da mensagem de feedback */
            iconMessage?: string | undefined;
            /** Default Value */
            default?: string | number | boolean | null | undefined;
            /** Lista de opções simples [{ name, value, icon, sub_label }] */
            options?: any[];
            /** Lista de opções agrupadas [{ label, items: [] }] */
            groupOptions?: SelectGroupOptions;
            disabled?: boolean | undefined;
            filter?: boolean | undefined;
            placeholder?: string | undefined;
            /** Permite limpar a opção selecionada exibindo um botão de limpeza */
            clearable?: boolean | undefined;
            /** Alias para clearable */
            showClear?: boolean | undefined;
            /** Altura dos itens da lista (em px ou com unidade CSS). Padrão: 27 */
            listHeight?: number | string | undefined;
            /** Força ou desativa a virtualização da lista */
            virtualScroll?: boolean | undefined;
            /** Limiar para ativação automática do virtual scroll (padrão: 500) */
            virtualScrollThreshold?: number | undefined;
            /** Tolerância de itens renderizados fora da viewport (overscan) */
            numToleratedItems?: number | undefined;
        }>(),
        {
            modelValue: null,
            done: undefined,
            optionValue: 'value',
            optionName: 'name',
            filter: false,
            optionLabel: 'label',
            error: undefined,
            caution: undefined,
            required: false,
            default: undefined,
            disabled: false,
            placeholder: undefined,
            clearable: false,
            showClear: false,
            listHeight: 27,
            virtualScroll: undefined,
            virtualScrollThreshold: 500,
            numToleratedItems: 5
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'change': [value: any];
        'clear': [];
        'before-show': [event?: Event];
    }>();

    defineSlots<{
        default?(): any;
        value?(props: { value: any }): any;
        option?(props: { option: any; selected: boolean; index: string | number }): any;
        optiongroup?(props: { option: any }): any;
        header?(): any;
        footer?(): any;
        [key: string]: any;
    }>();

    const temp_value = ref<any>(props.modelValue);
    let skipNextUpdateModelValue = false;

    const listboxId = `max-select-listbox-${Math.random().toString(36).slice(2, 9)}`;
    const highlightedIndex = ref<number>(-1);
    const listContainerEl = ref<HTMLElement | null>(null);

    const numericItemHeight = computed(() => {
        if (typeof props.listHeight === 'number') return props.listHeight;
        if (typeof props.listHeight === 'string') {
            const parsed = parseFloat(props.listHeight);
            return isNaN(parsed) ? 27 : parsed;
        }
        return 27;
    });

    const isClearable = computed(() => Boolean(props.clearable || props.showClear));

    const modelPropKeys = [
        'modelValue',
        'options',
        'optionLabel',
        'optionValue',
        'optionName',
        'groupOptions',
        'loadOptions',
        'default',
        'filter',
        'disabled',
        'clearable',
        'showClear',
        'show-clear',
        'listHeight',
        'list-height'
    ];
    const attrsWithoutModelProps = computed(() => {
        const result: Record<string, any> = {};
        for (const key in attrs) if (!modelPropKeys.includes(key)) result[key] = attrs[key];
        return result;
    });

    const itemHeight = computed(() => {
        if (props.listHeight === undefined || props.listHeight === null || props.listHeight === '') return '27px';

        if (typeof props.listHeight === 'number') return `${props.listHeight}px`;

        const str = String(props.listHeight).trim();
        if (/^\d+(\.\d+)?$/.test(str)) return `${str}px`;

        return str;
    });

    watch(temp_value, (val) => {
        if (skipNextUpdateModelValue) {
            skipNextUpdateModelValue = false;
            return;
        }
        emit('update:modelValue', val);
    });

    watch(
        () => props.modelValue,
        (val) => {
            temp_value.value = val;
            if (isBlank(val) && props.default !== undefined) temp_value.value = props.default;

        },
        { deep: true }
    );

    const isOpen = ref(false);
    const loading = ref(false);
    const optionsField: Ref<any[]> = ref([]);
    const searchQuery = ref('');

    const triggerEl = ref<HTMLElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);
    const filterInputEl = ref<HTMLInputElement | null>(null);

    const { position, updatePosition } = useActiveOverlayPosition({
        target: triggerEl,
        overlay: overlayEl,
        active: isOpen,
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

    const options = computed(() => {
        if (optionsField.value && optionsField.value.length > 0) return optionsField.value;
        if (props.options) return props.options;
        if (props.groupOptions) return props.groupOptions;
        return [];
    });

    const option_selected = computed(() => {
        const valueKey = props.optionValue;

        if (props.options) return props.options.find((opt: any) => opt[valueKey] === temp_value.value) ?? {};

        const groups = Object.values(options.value) as any[];
        for (const group of groups) {
            if (!group || !Array.isArray(group.items)) {
                if (group?.[valueKey] === temp_value.value) return group;
                continue;
            }
            const found = group.items.find((opt: any) => opt[valueKey] === temp_value.value);
            if (found) return found;
        }

        return {};
    });

    const hasSelectedOption = computed(() => Boolean(option_selected.value && Object.keys(option_selected.value).length > 0));

    const placeholderText = computed(() => (props.placeholder !== undefined ? props.placeholder : attrs.placeholder));

    const showPlaceholder = computed(() => placeholderText.value !== undefined && !hasSelectedOption.value);

    function normalizeText(value: any): string {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    const filteredOptions = computed(() => {
        const raw = options.value;
        if (!props.filter || !searchQuery.value.trim()) return raw;

        const q = normalizeText(searchQuery.value);
        const labelKey = props.optionLabel;

        if (props.groupOptions !== undefined) return (raw as any[])
            .map((group) => {
                if (!group || !Array.isArray(group.items)) return group;
                const items = group.items.filter((item: any) => {
                    const txt = normalizeText(item[labelKey] ?? item.label ?? item.name ?? '');
                    const sub = normalizeText(item.sub_label ?? item.sub ?? item.subLabel ?? '');
                    return txt.includes(q) || sub.includes(q);
                });
                return items.length > 0 ? { ...group, items } : null;
            })
            .filter(Boolean);


        return (raw as any[]).filter((opt: any) => {
            const txt = normalizeText(opt[labelKey] ?? opt.label ?? opt.name ?? '');
            const sub = normalizeText(opt.sub_label ?? opt.sub ?? opt.subLabel ?? '');
            return txt.includes(q) || sub.includes(q);
        });
    });

    const hasOptions = computed(() => {
        if (props.groupOptions !== undefined) return filteredOptions.value.some((g: any) => g?.items?.length > 0);

        return filteredOptions.value.length > 0;
    });

    type FlatSelectEntry =
        | { type: 'group'; label: string; group: any; key: string }
        | { type: 'option'; option: any; selectableIndex: number; key: string; groupIndex: number; optionIndex: number };

    const flattenedItems = computed<FlatSelectEntry[]>(() => {
        const raw = filteredOptions.value;
        if (props.groupOptions !== undefined) {
            const result: FlatSelectEntry[] = [];
            let selectableCount = 0;
            const groups = (raw as any[]) || [];
            for (let gIdx = 0; gIdx < groups.length; gIdx++) {
                const grp = groups[gIdx];
                result.push({
                    type: 'group',
                    label: grp?.label ?? '',
                    group: grp,
                    key: `g-${gIdx}-${grp?.label ?? ''}`
                });
                const items = grp?.items && Array.isArray(grp.items) ? grp.items : [];
                for (let oIdx = 0; oIdx < items.length; oIdx++) {
                    const opt = items[oIdx];
                    result.push({
                        type: 'option',
                        option: opt,
                        selectableIndex: selectableCount++,
                        key: `opt-${gIdx}-${oIdx}-${opt?.[props.optionValue] ?? oIdx}`,
                        groupIndex: gIdx,
                        optionIndex: oIdx
                    });
                }
            }
            return result;
        }

        const options = (raw as any[]) || [];
        return options.map((opt, idx) => ({
            type: 'option' as const,
            option: opt,
            selectableIndex: idx,
            key: `opt-${idx}-${opt?.[props.optionValue] ?? idx}`,
            groupIndex: 0,
            optionIndex: idx
        }));
    });

    const flatSelectableOptions = computed<any[]>(() => {
        if (props.groupOptions !== undefined) return flattenedItems.value
            .filter((e): e is Extract<FlatSelectEntry, { type: 'option' }> => e.type === 'option')
            .map((e) => e.option);

        return (filteredOptions.value as any[]) || [];
    });

    const isVirtual = computed(() => {
        if (props.virtualScroll !== undefined) return Boolean(props.virtualScroll);
        return flattenedItems.value.length > (props.virtualScrollThreshold ?? 500);
    });

    const {
        visibleItems,
        offsetY,
        totalHeight,
        setViewport,
        scrollToIndex
    } = useVirtualList(flattenedItems, {
        itemHeight: numericItemHeight,
        enabled: isVirtual,
        overscan: props.numToleratedItems ?? 5
    });

    const onContainerScroll = (e: Event) => {
        const el = e.target as HTMLElement;
        if (el) setViewport(el.scrollTop, el.clientHeight);
    };

    const activeDescendantId = computed(() => {
        if (!isOpen.value || highlightedIndex.value < 0) return undefined;
        return `${listboxId}-opt-${highlightedIndex.value}`;
    });

    const isOptionSelected = (opt: any): boolean => {
        if (!opt || temp_value.value === undefined) return false;
        return opt[props.optionValue] === temp_value.value;
    };

    const scrollHighlightedIntoView = () => {
        nextTick(() => {
            const container = listContainerEl.value;
            if (!container || highlightedIndex.value < 0) return;

            if (isVirtual.value) {
                const flatIdx = flattenedItems.value.findIndex(
                    (e) => e.type === 'option' && e.selectableIndex === highlightedIndex.value
                );
                if (flatIdx >= 0) {
                    const targetScroll = scrollToIndex(flatIdx, 'auto');
                    container.scrollTop = targetScroll;
                }
            } else {
                const h = numericItemHeight.value;
                const targetTop = highlightedIndex.value * h;
                const targetBottom = targetTop + h;

                if (targetTop < container.scrollTop) container.scrollTop = targetTop;
                else if (targetBottom > container.scrollTop + container.clientHeight) container.scrollTop = targetBottom - container.clientHeight;
            }
        });
    };

    const navigateOptions = (step: number) => {
        const total = flatSelectableOptions.value.length;
        if (total === 0) return;

        let next = highlightedIndex.value + step;
        if (next < 0) next = total - 1;
        if (next >= total) next = 0;

        highlightedIndex.value = next;
        scrollHighlightedIntoView();
    };

    const clearSelection = () => {
        skipNextUpdateModelValue = true;
        temp_value.value = null;
        emit('update:modelValue', null);
        emit('change', null);
        emit('clear');
    };

    let loadGeneration = 0;
    let loadAbortController: AbortController | null = null;
    let inFlightLoadPromise: Promise<boolean> | null = null;
    let wantsOpen = false;
    const loadError = ref(false);

    watch(() => props.disabled, (disabled) => {
        if (disabled) hide();
    });

    const retryLoad = (event?: any) => {
        loadError.value = false;
        before_show(event);
    };

    async function before_show(event: any): Promise<boolean> {
        if (!props.loadOptions) {
            emit('before-show', event);
            return true;
        }

        if (inFlightLoadPromise && loading.value) return inFlightLoadPromise;


        emit('before-show', event);
        const generation = ++loadGeneration;
        if (loadAbortController) {
            loadAbortController.abort();
            loadAbortController = null;
        }
        const controller = new AbortController();
        loadAbortController = controller;
        loading.value = true;
        loadError.value = false;
        wantsOpen = true;

        inFlightLoadPromise = (async () => {
            try {
                const res = await props.loadOptions!({ signal: controller.signal });
                if (generation === loadGeneration && wantsOpen && !controller.signal.aborted) {
                    optionsField.value = Array.isArray(res) ? res : [];
                    return true;
                }
                return false;
            } catch (err: any) {
                if (err?.name === 'AbortError') return false;
                if (generation === loadGeneration) loadError.value = true;

                return false;
            } finally {
                if (generation === loadGeneration) {
                    loading.value = false;
                    inFlightLoadPromise = null;
                    if (loadAbortController === controller) loadAbortController = null;
                }
            }
        })();

        return inFlightLoadPromise;
    }

    const toggle = async (event?: any) => {
        if (props.disabled) return;
        if (!isOpen.value) {
            wantsOpen = true;
            loadError.value = false;
            searchQuery.value = '';
            isOpen.value = true;
            await before_show(event);
        } else {
            // Se estiver carregando com promessa em voo, ativações concorrentes compartilham e não fecham
            if (loading.value && inFlightLoadPromise) return;

            hide();
        }
    };

    const hide = () => {
        wantsOpen = false;
        if (loadAbortController) {
            loadAbortController.abort();
            loadAbortController = null;
        }
        loadGeneration++;
        loading.value = false;
        loadError.value = false;
        isOpen.value = false;
    };


    const selectOption = (opt: any) => {
        const val = opt?.[props.optionValue] ?? opt;
        temp_value.value = val;
        emit('change', val);
        hide();
    };

    const onTriggerKeydown = (event: KeyboardEvent) => {
        if (props.disabled) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen.value) toggle();
                else navigateOptions(1);

                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!isOpen.value) toggle();
                else navigateOptions(-1);

                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (!isOpen.value) toggle();
                else if (highlightedIndex.value >= 0 && flatSelectableOptions.value[highlightedIndex.value]) selectOption(flatSelectableOptions.value[highlightedIndex.value]);

                break;
            case 'Home':
                if (isOpen.value && flatSelectableOptions.value.length > 0) {
                    event.preventDefault();
                    highlightedIndex.value = 0;
                    scrollHighlightedIntoView();
                }
                break;
            case 'End':
                if (isOpen.value && flatSelectableOptions.value.length > 0) {
                    event.preventDefault();
                    highlightedIndex.value = flatSelectableOptions.value.length - 1;
                    scrollHighlightedIntoView();
                }
                break;
            case 'Escape':
                if (isOpen.value) {
                    event.preventDefault();
                    hide();
                    triggerEl.value?.focus();
                }
                break;
        }
    };

    const onFilterKeydown = (event: KeyboardEvent) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                navigateOptions(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                navigateOptions(-1);
                break;
            case 'Enter':
                event.preventDefault();
                if (highlightedIndex.value >= 0 && flatSelectableOptions.value[highlightedIndex.value]) {
                    selectOption(flatSelectableOptions.value[highlightedIndex.value]);
                    triggerEl.value?.focus();
                }
                break;
            case 'Escape':
                event.preventDefault();
                hide();
                triggerEl.value?.focus();
                break;
        }
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            hide();
            triggerEl.value?.focus();
        }
    };

    const onDocumentPointerDown = (event: PointerEvent | MouseEvent) => {
        const target = event.target as Node;
        if (overlayEl.value?.contains(target) || triggerEl.value?.contains(target)) return;
        hide();
    };

    watch(isOpen, async (open) => {
        if (typeof window !== 'undefined') if (open) {
            window.addEventListener('keydown', onKeydown);
            document.addEventListener('pointerdown', onDocumentPointerDown);
            document.addEventListener('click', onDocumentPointerDown);
        } else {
            window.removeEventListener('keydown', onKeydown);
            document.removeEventListener('pointerdown', onDocumentPointerDown);
            document.removeEventListener('click', onDocumentPointerDown);
        }


        if (open) {
            const items = flatSelectableOptions.value;
            const selectedIdx = items.findIndex((opt: any) => isOptionSelected(opt));
            highlightedIndex.value = selectedIdx >= 0 ? selectedIdx : (items.length > 0 ? 0 : -1);
            scrollHighlightedIntoView();

            if (props.filter) {
                await nextTick();
                filterInputEl.value?.focus();
            }
        } else highlightedIndex.value = -1;

    });

    watch(searchQuery, () => {
        if (isOpen.value) {
            highlightedIndex.value = flatSelectableOptions.value.length > 0 ? 0 : -1;
            scrollHighlightedIntoView();
        }
    });

    watch(
        () => props.disabled,
        (disabled) => {
            if (disabled && isOpen.value) hide();

        }
    );

    onBeforeUnmount(() => {
        hide();
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', onKeydown);
            document.removeEventListener('pointerdown', onDocumentPointerDown);
            document.removeEventListener('click', onDocumentPointerDown);
        }
    });


    defineExpose({
        isOpen,
        toggle,
        position,
        updatePosition,
        loading,
        loadError,
        optionsField,
        retryLoad
    });
</script>

<style lang="scss" scoped>
.select_input_div {
    &[small] {
        padding: 0 !important;

        .max-select {
            padding: 0 5px 0 0 !important;

            span {
                font-size: 0.85rem !important;
            }
        }
    }

    .placeholder-select {
        position: absolute;
        padding-left: 7px !important;
        color: var(--background-700);
        font-size: 0.9rem;
    }

    .max-select-wrapper {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;

        .max-select-clear-btn {
            position: absolute;
            right: 32px;
            background: transparent;
            border: none;
            padding: 0 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--background-500);
            transition: color 0.15s ease, transform 0.15s ease;
            z-index: 2;

            &:hover {
                color: var(--max-danger-500, #ef4444);
                transform: scale(1.1);
            }
        }
    }

    .max-select {
        width: 100%;
        height: 36px !important;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        outline: none;

        .max-select-label {
            border: none !important;
            padding: 0 10px !important;
            display: grid;
            place-items: center start;
            outline: none !important;
            height: 36px !important;
            flex: 1;

            &:focus {
                border: none !important;
                outline: none !important;
                outline-offset: 0 !important;
                box-shadow: none;
            }

            .value-div {
                display: grid;
                grid-template-columns: auto 1fr;
                place-items: center;

                .value-text {
                    color: var(--background-775);
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    max-width: 100%;
                    overflow: hidden;
                }
            }
        }

        .max-select-clear-btn {
            background: transparent;
            border: none;
            padding: 0 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--background-500);
            transition: color 0.15s ease, transform 0.15s ease;
            z-index: 1;

            &:hover {
                color: var(--max-danger-500, #ef4444);
                transform: scale(1.1);
            }
        }

        .max-select-dropdown {
            padding-right: 13px;
            display: flex;
            align-items: center;
            color: var(--background-600, #94a3b8);
        }
    }

    &.in-line,
    &[input-click]:not([input-click='false']) {
        .max-select,
        .max-select-label {
            height: 20px !important;
            min-height: 20px !important;
        }
    }

    &[transparent] {
        .max-select {
            background-color: transparent !important;
        }
    }
}

.max-select-overlay {
    position: fixed;
    z-index: 9999;
    background: var(--background-0, #fff);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    max-height: 280px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .max-select-header {
        padding: 6px;
        border-bottom: 1px solid var(--surface-border);
        background: var(--background-0, #fff);
        box-shadow: none !important;

        .max-select-filter-container {
            width: 100%;

            .max-select-filter {
                width: 100%;
                padding: 4px 8px;
                border: 1px solid var(--surface-border);
                border-radius: 4px;
                outline: none;
                font-size: 0.85rem;
                background: var(--background-50, #f8fafc);

                &:focus {
                    border-color: var(--max-primary-500, #00768E);
                }
            }
        }
    }

    .max-select-list-container {
        position: relative;
        overflow-y: auto;
        max-height: 240px;
        scrollbar-width: thin;

        .max-select-spacer {
            width: 100%;
        }

        .max-select-window {
            &.is-virtual {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
            }
        }

        ::-webkit-scrollbar {
            width: 3px;
            height: 3px;
        }

        .max-select-empty-message {
            padding: 8px 12px;
            color: var(--background-700);
            font-size: 0.85rem;

            &.is-error {
                color: var(--max-danger-500, #ef4444);
            }

            .max-select-retry-btn {
                margin-top: 0.4rem;
                display: inline-block;
                padding: 0.25rem 0.6rem;
                border-radius: 4px;
                background: var(--max-primary-500, #00768e);
                color: #fff;
                border: none;
                cursor: pointer;
                font-size: 0.8rem;

                &:hover {
                    background: var(--max-primary-600, #005f77);
                }
            }
        }


        .max-select-option-group {
            font-weight: 600;
            padding: 6px 10px;
            font-size: 0.8rem;
            color: var(--background-750);
            background: var(--background-50, #f8fafc);
        }

        .max-select-option {
            display: flex;
            align-items: center;
            padding: 0 10px;
            min-height: 36px;
            box-sizing: border-box;
            cursor: pointer;
            font-size: 0.85rem;
            color: var(--background-700);
            transition: background-color 0.15s ease;

            &.max-select-option-highlighted,
            &.is-focused,
            &:hover {
                background-color: var(--background-100, #f1f5f9) !important;
                color: var(--max-primary-600, #005F77);

                &.max-select-option-selected,
                &.is-selected {
                    background-color: var(--max-selection-hover-background, var(--max-primary-700, #004860)) !important;
                    color: var(--max-selection-hover-content, var(--background-0)) !important;

                    .icon-div {
                        color: var(--max-selection-hover-content, var(--background-200)) !important;
                    }

                    .labelz,
                    .subLabel {
                        color: var(--max-selection-hover-content, var(--background-0));
                    }
                }
            }

            &.max-select-option-selected,
            &.is-selected {
                background-color: var(--max-selection-background, var(--max-primary-600, #005F77)) !important;
                color: var(--max-selection-content, var(--background-0)) !important;
                font-weight: 500;

                &:hover {
                    background-color: var(--max-selection-hover-background, var(--max-primary-700, #004860)) !important;
                    color: var(--max-selection-hover-content, var(--background-0)) !important;
                }

                .icon-div {
                    color: var(--max-selection-content, var(--background-200)) !important;
                }

                .labelz,
                .subLabel {
                    color: var(--max-selection-content, var(--background-0));
                }
            }

            .labelz,
            .subLabel {
                color: var(--background-700);
            }

            .category {
                width: 20px;
                margin-right: 10px;
                display: grid;
                place-items: center;
                border-radius: 5px;

                &.UTILITY {
                    background-color: var(--blue-200);
                    color: var(--blue-600);
                }

                &.MARKETING {
                    background-color: var(--orange-200);
                    color: var(--red-b-500);
                }
            }
        }

        .label_div {
            display: grid;
            grid-template-columns: auto 1fr auto;
            width: 100% !important;
            place-items: center start;
            gap: 10px;

            .icon-div {
                color: var(--background-700) !important;
            }

            &:hover {
                .icon-div {
                    color: var(--background-700) !important;
                }
            }

            .subLabel {
                color: var(--background-700);
                padding-left: 1rem;
                text-align: right;
                width: 100%;
                font-size: 0.85rem;
            }

            .labelz {
                display: grid;
                place-items: center;
                color: var(--background-775);
            }

            img {
                max-height: 20px;
            }
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
