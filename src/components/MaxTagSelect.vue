<template>
    <InputBase
        v-bind="{ ...props, ...attrs }"
        class="max-tag-select max-select-tag"
        :class="{ 'is-button-mode': props.isButton }"
        input-click-auto
        no-dropdown
        :no-icon="props.isButton || (attrs as any)?.noIcon"
        :no-status="props.isButton || (attrs as any)?.noStatus"
        native-form-proxy
    >
        <template #default="{ formAttrs, triggerAttrs }">
            <input v-bind="formAttrs" class="max-native-form-proxy" type="text" :value="temp_value ?? ''" tabindex="-1" />
            <div v-if="showPlaceholder" class="tab-placeholder-select">
                {{ placeholderText }}
            </div>

            <div class="max-select-wrapper">
                <div
                    ref="triggerEl"
                    v-bind="triggerAttrs"
                    class="max-select"
                    :class="{ 'is-disabled': props.disabled, 'is-focused': isOpen }"
                    :tabindex="props.disabled || props.isButton ? -1 : 0"
                    :role="props.isButton ? undefined : 'combobox'"
                    :aria-haspopup="props.isButton ? undefined : 'listbox'"
                    :aria-expanded="props.isButton ? undefined : isOpen"
                    :aria-controls="props.isButton ? undefined : (isOpen ? listboxId : undefined)"
                    :aria-activedescendant="props.isButton ? undefined : activeDescendantId"
                    :aria-disabled="!props.isButton && props.disabled ? 'true' : undefined"
                    @click.stop="!props.isButton && toggle($event)"
                    @keydown="!props.isButton && onTriggerKeydown($event)"
                >
                    <div class="max-select-label">
                        <slot name="value">
                            <div
                                class="value-tag-div"
                                :style="getStyleColor(option_selected, false, true)"
                                :color-string="getColorString(option_selected)"
                                v-if="!isButton && hasSelected"
                            >
                                <MaxIcon
                                    :icon="option_selected?.icon ?? null"
                                    :size="option_selected?.icon_size ?? 1"
                                    v-if="option_selected.icon"
                                    :color="getStyleColor(option_selected, false, true).color"
                                />
                                <div
                                    class="tag-value-text"
                                    :style="{ color: getStyleColor(option_selected, false, true).color }"
                                >
                                    {{ option_selected?.[props.optionName] ?? option_selected?.name ?? option_selected?.label }}
                                </div>
                            </div>
                            <div v-else-if="isButton">
                                <MaxIconButton
                                    ref="buttonRef"
                                    :icon="props.i ?? props.icon ?? props.iconLeft"
                                    :size="option_selected?.icon_size ?? 1.8"
                                    :disabled="props.disabled"
                                    :aria-label="buttonAriaLabel"
                                    :aria-haspopup="'listbox'"
                                    :aria-expanded="isOpen"
                                    :aria-controls="isOpen ? listboxId : undefined"
                                    :tabindex="props.disabled ? -1 : 0"
                                    @click.stop="toggle"
                                />
                            </div>
                        </slot>
                    </div>
                </div>

                <button
                    v-if="hasClear && hasSelected && !props.disabled"
                    type="button"
                    class="max-select-clear-btn"
                    aria-label="Limpar seleção"
                    @click.stop="clearSelection"
                >
                    <MaxIcon icon="lucide:x" size="0.85" />
                </button>

                <div v-if="$slots['btn-right']" class="max-tag-select-btn-right">
                    <slot name="btn-right"></slot>
                </div>
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
                        <div v-if="loading" class="max-select-empty-message">
                            Carregando...
                        </div>
                        <template v-else-if="hasOptions">
                            <div v-if="isVirtual" class="max-select-spacer" :style="{ height: `${totalHeight}px` }" aria-hidden="true" />
                            <div
                                class="max-select-list"
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
                                        :style="{ height: `${numericItemHeight}px` }"
                                        role="option"
                                        :aria-selected="isOptionSelected(entry.item.option)"
                                        @click.stop="selectOption(entry.item.option)"
                                        @mouseenter="highlightedIndex = entry.item.selectableIndex"
                                    >
                                        <slot name="option" :option="entry.item.option" :selected="isOptionSelected(entry.item.option)" :index="entry.item.optionIndex">
                                            <div
                                                class="label-tag-div"
                                                :color-string="getColorString(entry.item.option)"
                                                :style="getStyleColor(entry.item.option, highlightedIndex === entry.item.selectableIndex, false, isOptionSelected(entry.item.option))"
                                            >
                                                <MaxIcon
                                                    :icon="entry.item.option['icon']"
                                                    v-if="entry.item.option['icon']"
                                                    :size="entry.item.option?.['iconSize'] ?? '1'"
                                                    :style="{ width: '30px' }"
                                                    :color="getStyleColor(entry.item.option, highlightedIndex === entry.item.selectableIndex, false, isOptionSelected(entry.item.option)).color"
                                                />
                                                <div class="label-tag">
                                                    <div
                                                        class="max-tag-select-option-label"
                                                        style="display: grid; min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                                        v-text="entry.item.option[props.optionLabel] ?? entry.item.option.label"
                                                        :style="{ color: attrs.color }"
                                                    ></div>
                                                </div>
                                                <div class="sub-label-tag" v-text="entry.item.option?.sub_label ?? entry.item.option?.sub ?? entry.item.option?.subLabel"></div>
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
    import { ref, computed, watch, useAttrs, nextTick, type Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import { SelectGroupOptions } from '../types';
    import { getColorFromVar, contrastColor, isBlank, watchDebounced } from '@maxvue/max-use';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import { getOverlayWidth, getOverlayLeft } from '../helpers/useOverlayWidth';
    import { useOutsidePointer } from '../helpers/useOutsidePointer';
    import { useVirtualList } from '../composables/useVirtualList';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Texto de placeholder do campo */
            placeholder?: string | undefined;
            /** Valor selecionado */
            modelValue: any;
            /** Função assíncrona para carregar opções ao abrir o select */
            loadOptions?: () => Promise<any[]>;
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
            hasRemove?: boolean | undefined;
            isButton?: boolean | undefined;
            backgroundColor?: string;
            /** Altura dos itens da lista em px (padrão: 36) */
            itemHeight?: number | string | undefined;
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
            placeholder: undefined,
            default: undefined,
            disabled: false,
            isButton: false,
            backgroundColor: 'var(--background-500)',
            itemHeight: 36,
            virtualScroll: undefined,
            virtualScrollThreshold: 500,
            numToleratedItems: 5
        }
    );

    const getColorString = (item: any) => {
        if (!item) return 'unset';
        return item.background_color ?? item.backgroundColor ?? item.tag_color ?? item.tagColor ?? item['tag-color'] ?? item['background-color'] ?? 'unset';
    };

    const styleColorCache = new Map<string, any>();

    const getAccessibleContrastColor = (bgHex: string): string => {
        try {
            const clean = bgHex.replace('#', '');
            const r = parseInt(clean.substring(0, 2), 16) / 255;
            const g = parseInt(clean.substring(2, 4), 16) / 255;
            const b = parseInt(clean.substring(4, 6), 16) / 255;
            const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
            const lum = a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
            const contrastLight = (1.0 + 0.05) / (lum + 0.05);
            const contrastDark = (lum + 0.05) / 0.057;
            if (contrastLight >= 4.5 && contrastLight >= contrastDark) return '#ffffff';
            if (contrastDark >= 4.5) return '#00152a';
            return contrastDark > contrastLight ? '#000000' : '#ffffff';
        } catch {
            return contrastColor(bgHex);
        }
    };

    const getStyleColor = (item: any, hover: boolean = false, is_value: boolean = false, is_selected: boolean = false) => {
        const color_string = getColorString(item);
        const cacheKey = `${color_string}_${hover}_${is_value}_${is_selected}_${props.backgroundColor}`;
        const cached = styleColorCache.get(cacheKey);
        if (cached) return cached;

        const default_color = is_value ? props.backgroundColor : 'var(--background-500)';

        const color = getColorFromVar(color_string === 'unset' ? default_color : color_string);

        let background = hover ? color.darken(0.2).hexa() : color.hexa();
        let text = getAccessibleContrastColor(background);
        if (color_string === 'unset' && !is_value) if (is_selected) {
            background = hover
                ? 'var(--max-selection-hover-background, var(--max-primary-600, #005F77))'
                : 'var(--max-selection-background, var(--max-primary-500, #00768E))';
            text = hover
                ? 'var(--max-selection-hover-content, #ffffff)'
                : 'var(--max-selection-content, #ffffff)';
        } else {
            background = hover ? 'var(--background-100, #f1f5f9)' : 'transparent';
            text = hover ? 'var(--background-775, #1c2d3e)' : 'var(--background-700, #294056)';
        }


        const style = {
            backgroundColor: background,
            color: text,
            borderRadius: '6px',
            padding: is_value ? '0 8px 0 6px !important' : '0 10px 0 6px !important',
            gap: is_value ? '4px' : 0,
            width: is_value ? '100%' : undefined,
            height: is_value ? '100%' : undefined,
            boxSizing: is_value ? 'border-box' : undefined
        };
        styleColorCache.set(cacheKey, style);
        return style;
    };

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'change': [value: any];
        'clear': [];
        'before-show': [event?: Event];
    }>();

    const temp_value = ref<any>(props.modelValue);
    let skipNextUpdateModelValue = false;

    const listboxId = `max-tag-select-listbox-${Math.random().toString(36).slice(2, 9)}`;
    const highlightedIndex = ref<number>(-1);
    const listContainerEl = ref<HTMLElement | null>(null);

    const hasClear = computed(() => Boolean((attrs as any)?.clearable || (attrs as any)?.isClearable || (attrs as any)?.showClear || props.hasRemove));

    const clearSelection = () => {
        temp_value.value = null;
        emit('update:modelValue', null);
        emit('change', null);
        emit('clear');
    };

    watch(temp_value, (val) => {
        if (skipNextUpdateModelValue) {
            skipNextUpdateModelValue = false;
            return;
        }
        emit('update:modelValue', val);
    });
    watch(() => props.modelValue, (val) => (temp_value.value = val));
    watch(() => props.disabled, (disabled) => {
        if (disabled) hide();
    });

    const isOpen = ref(false);
    const loading = ref(false);
    const optionsField: Ref<any[]> = ref([]);
    const searchQuery = ref('');

    const triggerEl = ref<HTMLElement | null>(null);
    const buttonRef = ref<any>(null);
    const overlayEl = ref<HTMLElement | null>(null);
    const filterInputEl = ref<HTMLInputElement | null>(null);

    const buttonAriaLabel = computed(() => {
        const raw = (attrs['aria-label'] as string) || (attrs.ariaLabel as string) || (attrs.label as string) || (attrs.title as string);
        if (raw && typeof raw === 'string' && raw.trim()) return raw.trim();

        if (props.placeholder && typeof props.placeholder === 'string' && props.placeholder.trim()) return props.placeholder.trim();
        if (attrs.placeholder && typeof attrs.placeholder === 'string' && attrs.placeholder.trim()) return attrs.placeholder.trim();

        if (hasSelected.value) {
            const selectedText = option_selected.value?.[props.optionLabel] ?? option_selected.value?.label ?? option_selected.value?.[props.optionName] ?? option_selected.value?.name;
            if (selectedText) return `Selecionar opção: ${selectedText}`;
        }

        return 'Selecionar opção';
    });

    const focusTrigger = () => {
        if (props.isButton && buttonRef.value) {
            const el = buttonRef.value.$el ?? buttonRef.value;
            if (el && typeof el.focus === 'function') {
                el.focus();
                return;
            }
        }
        triggerEl.value?.focus();
    };

    const getOverlayContentWidth = (currentWidth: number) => {
        const overlay = overlayEl.value;
        if (!overlay) return currentWidth;

        const textElements = overlay.querySelectorAll<HTMLElement>('.max-tag-select-option-label, .sub-label-tag');
        const overflowWidth = Array.from(textElements).reduce(
            (largest, element) => Math.max(largest, element.scrollWidth - element.clientWidth),
            0
        );

        return currentWidth + Math.max(0, overflowWidth);
    };

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

            const width = getOverlayWidth({
                triggerWidth: targetRect.width,
                contentWidth: getOverlayContentWidth(overlayRect.width),
                windowWidth: viewportWidth,
                minWidth: 140,
                maxWidth: 300
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

    const options = computed(() => {
        const list = (optionsField.value && optionsField.value.length > 0) ? optionsField.value : (props.options ?? props.groupOptions ?? []);
        list?.map((option: any) => (option.hover ??= false));
        return list;
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

    const hasSelected = computed(() => Boolean(option_selected.value && Object.keys(option_selected.value).length > 0));

    const placeholderText = computed(() => (props.placeholder !== undefined ? props.placeholder : attrs.placeholder));

    const showPlaceholder = computed(() => placeholderText.value !== undefined && !hasSelected.value);

    const filteredOptions = computed(() => {
        const raw = options.value;
        if (!props.filter || !searchQuery.value.trim()) return raw;

        const q = searchQuery.value.toLowerCase().trim();
        const labelKey = props.optionLabel;

        if (props.groupOptions !== undefined) return (raw as any[])
            .map((group) => {
                if (!group || !Array.isArray(group.items)) return group;
                const items = group.items.filter((item: any) => {
                    const txt = String(item[labelKey] ?? item.label ?? item.name ?? '').toLowerCase();
                    const sub = String(item.sub_label ?? item.sub ?? item.subLabel ?? '').toLowerCase();
                    return txt.includes(q) || sub.includes(q);
                });
                return items.length > 0 ? { ...group, items } : null;
            })
            .filter(Boolean);

        return (raw as any[]).filter((opt: any) => {
            const txt = String(opt[labelKey] ?? opt.label ?? opt.name ?? '').toLowerCase();
            const sub = String(opt.sub_label ?? opt.sub ?? opt.subLabel ?? '').toLowerCase();
            return txt.includes(q) || sub.includes(q);
        });
    });

    type FlatTagEntry =
        | { type: 'group'; label: string; group: any; key: string }
        | { type: 'option'; option: any; selectableIndex: number; key: string; groupIndex: number; optionIndex: number };

    const flattenedItems = computed<FlatTagEntry[]>(() => {
        const raw = filteredOptions.value;
        if (props.groupOptions !== undefined) {
            const result: FlatTagEntry[] = [];
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
                        key: `tag-opt-${gIdx}-${oIdx}-${opt?.[props.optionValue] ?? oIdx}`,
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
            key: `tag-opt-${idx}-${opt?.[props.optionValue] ?? idx}`,
            groupIndex: 0,
            optionIndex: idx
        }));
    });

    const flatSelectableOptions = computed<any[]>(() => {
        if (props.groupOptions !== undefined) return flattenedItems.value
            .filter((e): e is Extract<FlatTagEntry, { type: 'option' }> => e.type === 'option')
            .map((e) => e.option);

        return (filteredOptions.value as any[]) || [];
    });

    const hasOptions = computed(() => {
        if (props.groupOptions !== undefined) return filteredOptions.value.some((g: any) => g?.items?.length > 0);
        return filteredOptions.value.length > 0;
    });

    const numericItemHeight = computed(() => {
        if (typeof props.itemHeight === 'number') return props.itemHeight;
        if (typeof props.itemHeight === 'string') {
            const p = parseFloat(props.itemHeight);
            return isNaN(p) ? 36 : p;
        }
        return 36;
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

    const getFlattenedIndexForHighlighted = () => {
        if (highlightedIndex.value < 0) return -1;
        if (props.groupOptions !== undefined) {
            const found = flattenedItems.value.findIndex(
                (entry) => entry.type === 'option' && entry.selectableIndex === highlightedIndex.value
            );
            return found >= 0 ? found : highlightedIndex.value;
        }
        return highlightedIndex.value;
    };

    const scrollHighlightedIntoView = () => {
        nextTick(() => {
            const container = listContainerEl.value;
            if (!container || highlightedIndex.value < 0) return;

            const flatIdx = getFlattenedIndexForHighlighted();
            const clientH = container.clientHeight || 200;

            if (isVirtual.value) {
                setViewport(container.scrollTop, clientH);
                const targetScroll = scrollToIndex(flatIdx, 'auto');
                container.scrollTop = targetScroll;
                setViewport(targetScroll, clientH);
            } else {
                const h = numericItemHeight.value;
                const targetTop = flatIdx * h;
                const targetBottom = targetTop + h;

                if (targetTop < container.scrollTop) container.scrollTop = targetTop;
                else if (targetBottom > container.scrollTop + clientH) container.scrollTop = targetBottom - clientH;
            }
        });
    };

    watch(isOpen, (open) => {
        if (open) nextTick(() => {
            const container = listContainerEl.value;
            if (container) setViewport(container.scrollTop, container.clientHeight || 200);
            updatePosition();
        });
    });

    const navigateOptions = (step: number) => {
        const total = flatSelectableOptions.value.length;
        if (total === 0) return;

        let next = highlightedIndex.value + step;
        if (next < 0) next = total - 1;
        if (next >= total) next = 0;

        highlightedIndex.value = next;
        scrollHighlightedIntoView();
    };

    async function before_show(event: any) {
        emit('before-show', event);
        if (props.loadOptions) {
            loading.value = true;
            try {
                optionsField.value = await props.loadOptions();
            } finally {
                loading.value = false;
            }
        }
    }

    const toggle = async (event?: any) => {
        if (props.disabled) return;
        if (!isOpen.value) {
            await before_show(event);
            searchQuery.value = '';
            isOpen.value = true;
        } else hide();

    };

    const hide = () => {
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
                    focusTrigger();
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
                    focusTrigger();
                }
                break;
            case 'Escape':
                event.preventDefault();
                hide();
                focusTrigger();
                break;
        }
    };

    useOutsidePointer(isOpen, {
        elements: () => [triggerEl.value, buttonRef.value?.$el ?? buttonRef.value, overlayEl.value].filter(Boolean) as HTMLElement[],
        onClose: () => hide(),
        triggerEl: computed(() => (props.isButton && buttonRef.value ? (buttonRef.value.$el ?? buttonRef.value) : triggerEl.value))
    });

    watch(isOpen, async (open) => {
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


    watchDebounced(
        () => props.modelValue,
        () => {
            if (isBlank(props.modelValue) && props.default !== undefined) temp_value.value = props.default;
        },
        { deep: true, debounce: 500 }
    );
</script>

<style lang="scss" scoped>
    .max-select-tag {
        &.max-input-main-div :deep(.max-input-field-div:focus-within) {
            outline: none !important;
        }

        :deep(.max-input-field-div) {
            width: 100%;

            .input-slot-div {
                margin: 0 !important;
                width: 100% !important;
                padding: 0 !important;

                .value-tag-div {
                    grid-template-columns: auto 1fr auto;
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100%;
                    padding: 0 !important;
                    box-sizing: border-box;
                }
            }
        }

        :deep(.input-slot-div) {
            padding: 0 !important;
        }

        .tab-placeholder-select {
            position: absolute;
            color: var(--background-700);
            font-size: 0.9rem;
            z-index: 1;
            display: grid;
            place-items: center;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .max-select-wrapper {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;

            .max-select-clear-btn {
                position: absolute;
                right: 8px;
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
            width: 100% !important;
            height: 36px !important;
            cursor: pointer;
            display: flex;
            align-items: center;
            outline: none;

            .max-select-label {
                border: none !important;
                display: grid;
                place-items: center start;
                outline: none !important;
                height: 32px !important;
                flex: 1;

                &:focus {
                    border: none !important;
                    outline: none !important;
                    outline-offset: 0 !important;
                    box-shadow: none;
                }

                .value-tag-div {
                    grid-template-columns: auto 1fr auto;
                    place-items: center;
                    padding: unset;
                    display: grid;
                    overflow: hidden;
                    position: relative;
                    width: 100%;
                    height: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                    gap: 4px;

                    :deep(> .max-icon-div) {
                        width: auto !important;

                        .max-icon {
                            padding: 0 !important;
                        }
                    }

                    .tag-value-text {
                        max-width: 100% !important;
                        position: relative;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }
            }
        }

        &.is-button-mode {
            width: auto !important;
            min-width: unset !important;
            border: none !important;
            background: transparent !important;
            padding: 0 !important;

            :deep(.max-input-field-div) {
                border: none !important;
                background: transparent !important;
                padding: 0 !important;
                min-height: unset !important;
                height: auto !important;
                box-shadow: none !important;

                .input-slot-div {
                    padding: 0 !important;
                    margin: 0 !important;
                    width: auto !important;
                }
            }

            .max-select,
            .p-select {
                width: auto !important;
                height: auto !important;
                padding: 0 !important;
                border: none !important;
                background: transparent !important;

                .max-select-label,
                .p-select-label {
                    padding: 0 !important;
                    height: auto !important;
                    border: none !important;
                    background: transparent !important;
                }
            }
        }

        &[small] {
            padding: 0 !important;

            .max-select {
                padding: 0 5px 0 0 !important;

                span {
                    font-size: 0.85rem !important;
                }
            }
        }

        &[flex], &[full] {
            .max-select,
            .max-select .max-select-label,
            .max-select .max-select-label .value-tag-div,
            .max-select .max-select-label .value-tag-div .tag-value-text {
                height: 100% !important;
                max-height: 100% !important;
                display: grid;
            }

            .max-select .max-select-label .value-tag-div .tag-value-text {
                display: grid;
                place-items: center start;
            }
        }
    }

    .max-select-overlay {
        position: fixed;
        box-sizing: border-box;
        z-index: var(--max-layer-dropdown, 1000);
        background: var(--background-0, #fff);
        border: 1px solid var(--surface-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(-10px);

        .max-select-header {
            padding: 6px !important;
            z-index: 1 !important;

            .max-select-filter-container {
                width: 100%;

                .max-select-filter {
                    width: 100%;
                    padding: 4px 8px;
                    border: 1px solid var(--surface-border, #e2e8f0);
                    border-radius: 4px;
                    outline: none;
                    font-size: 0.85rem;
                    background: var(--background-0, #fff);
                    color: var(--background-800, #1e293b);

                    &:focus {
                        border-color: var(--max-primary-500, #00768e);
                    }
                }
            }
        }

        .max-select-list-container {
            position: relative;
            padding: 10px;
            scrollbar-width: thin;
            overflow-y: auto;

            .max-select-spacer {
                width: 100%;
            }

            .max-select-list {
                &.is-virtual {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    right: 10px;
                }

                .max-select-option-group-wrapper {
                    padding: 4px 8px;
                    font-weight: 600;
                    font-size: 0.8rem;
                    color: var(--background-500, #94a3b8);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    user-select: none;
                }

                .max-select-option {
                    cursor: pointer;
                    padding: 2px 4px;
                    min-height: 36px;
                    display: flex;
                    align-items: center;
                    box-sizing: border-box;
                    transition: background-color 0.15s ease, color 0.15s ease;
                    border-radius: 6px;
                    color: var(--background-700, #294056);

                    &.max-select-option-highlighted,
                    &.is-focused,
                    &:hover {
                        background-color: var(--background-100, #f1f5f9) !important;
                        color: var(--background-775, #1c2d3e) !important;
                    }

                    &.max-select-option-selected,
                    &.is-selected {
                        border-radius: 6px;

                        &:not(:has(.label-tag-div[color-string]:not([color-string='unset']))) {
                            background-color: var(--max-selection-background, var(--max-primary-500, #00768e)) !important;
                            color: var(--max-selection-content, #fff) !important;

                            &.max-select-option-highlighted,
                            &.is-focused,
                            &:hover {
                                background-color: var(--max-selection-hover-background, var(--max-primary-600, #005f77)) !important;
                                color: var(--max-selection-hover-content, #fff) !important;
                            }

                            .label-tag-div {
                                color: inherit !important;
                            }

                            .max-tag-select-option-label {
                                color: inherit !important;
                            }

                            .sub-label-tag {
                                color: inherit !important;
                                opacity: 0.85;
                            }
                        }
                    }

                    &:has(.label-tag-div[color-string]:not([color-string='unset'])) {
                        &.max-select-option-selected,
                        &.is-selected {
                            background-color: transparent !important;
                            outline: 2px solid var(--max-selection-background, var(--max-primary-500, #00768e));
                            outline-offset: -2px;

                            &.max-select-option-highlighted,
                            &.is-focused,
                            &:hover {
                                background-color: var(--background-100, #f1f5f9) !important;
                            }
                        }
                    }

                    .category {
                        width: 20px;
                        margin-right: 10px;
                        display: grid;
                        place-items: center;
                        border-radius: 5px;
                    }

                    .label-tag-div {
                        display: grid;
                        grid-template-columns: auto 1fr auto;
                        width: 100% !important;
                        min-width: 0;
                        place-items: center start;
                        gap: 10px;
                        height: 30px;
                        background-color: none !important;

                        .label-tag {
                            place-items: center;
                            display: flex;
                            flex-flow: row nowrap;
                            min-width: 0;
                            overflow: hidden;

                            > div {
                                min-width: 0;
                                max-width: 100%;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                        }

                        .sub-label-tag {
                            padding-left: 1rem;
                            text-align: right;
                            width: 100%;
                            min-width: 0;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                            font-size: 0.85rem;
                        }

                        img {
                            max-height: 20px;
                        }
                    }
                }
            }
        }

        &:has(.label-tag-div) {
            .max-select-list-container {
                max-height: 635px !important;

                .max-select-list {
                    gap: 5px !important;
                    display: flex;
                    flex-direction: column;

                    .max-select-option {
                        padding: 0 !important;
                    }
                }
            }

            &:has(.max-select-header) {
                .max-select-list-container {
                    padding-top: 14px !important;
                }
            }
        }
    }

    [transparent] {
        .max-select {
            background-color: transparent !important;
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
