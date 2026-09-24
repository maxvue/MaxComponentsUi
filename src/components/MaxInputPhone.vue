<template>
    <InputBase class="max-input-phone input-phone" v-bind="props" :value="temp_value" :done="done" :error="error" :caution="caution" :label="props.noLabel ? undefined : (props.label ?? 'Telefone')" :icon-right="props.noIcon ? undefined : 'ic:baseline-whatsapp'">
        <template #default="{ inputAttrs }">
            <div class="inputs-div">
                <div
                    ref="select_el"
                    class="max-phone-select"
                    role="combobox"
                    tabindex="0"
                    :aria-expanded="isOpen"
                    :aria-controls="listbox_id"
                    aria-haspopup="listbox"
                    :aria-label="'Código do país: +' + country.value"
                    @click.stop="toggle"
                    @keydown="onTriggerKeydown"
                >
                    <div class="max-phone-select-label">
                        <div class="item-selected">
                            <div class="item-flag">
                                <img :src="'https://flagcdn.com/w40/' + country.sigla.toLowerCase() + '.png'" alt="bandeira" loading="lazy" />
                            </div>
                            <div class="label-flag">+ {{ country.value }}</div>
                        </div>
                    </div>
                </div>
                <input
                    type="tel"
                    inputmode="tel"
                    slot-b
                    v-bind="inputAttrs"
                    v-model="phone"
                    v-maska:unmaskedValue.unmasked="maskValue"
                    :placeholder="country.value === 55 ? '(99) 9 9999 - 9999' : ''"
                    class="max-input-native phone-number-input"
                    :disabled="props.disabled"
                    @focus="onFocus = true"
                    @blur="onFocus = false"
                    @paste="handlePaste"
                />
            </div>

            <Teleport to="body" v-if="isOpen">
                <div class="max-phone-overlay-mask" :style="{ zIndex: maskZIndex }" @click.stop="close"></div>
                <div
                    ref="overlay_el"
                    class="max-phone-select-overlay"
                    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width + 'px', zIndex: overlayZIndex }"
                    @click.stop="() => {}"
                >
                    <div class="max-phone-select-filter">
                        <input
                            ref="filter_el"
                            type="text"
                            role="searchbox"
                            aria-autocomplete="list"
                            :aria-controls="listbox_id"
                            :aria-activedescendant="activeDescendantId"
                            v-model="filter_text"
                            class="max-input-native max-phone-filter-input"
                            :placeholder="'Buscar país ou código'"
                            aria-label="Buscar país ou código"
                            @keydown="onFilterKeydown"
                        />
                    </div>
                    <div class="max-phone-select-list" role="listbox" :id="listbox_id" ref="list_el" @scroll="onListScroll">
                        <div v-if="isVirtual" class="max-phone-select-spacer" :style="{ height: `${totalHeight}px` }" aria-hidden="true" />
                        <div
                            class="max-phone-select-window"
                            :class="{ 'is-virtual': isVirtual }"
                            :style="isVirtual ? { transform: `translateY(${offsetY}px)` } : undefined"
                        >
                            <div
                                v-for="entry in visibleItems"
                                :key="entry.item.sigla"
                                :id="getOptionId(entry.item)"
                                class="max-phone-select-option"
                                role="option"
                                :aria-selected="entry.item.sigla === country.sigla"
                                :aria-label="`${entry.item.label} (+${entry.item.value})`"
                                :class="{ 'is-focused': entry.index === focused_index, 'is-selected': entry.item.sigla === country.sigla }"
                                :style="isVirtual ? { height: `${numericItemHeight}px` } : undefined"
                                @click.stop="selectOption(entry.item)"
                                @mouseenter="focused_index = entry.index"
                            >
                                <slot name="option" :option="entry.item" :selected="entry.item.sigla === country.sigla" :index="entry.index">
                                    <div class="input-phone-label-div">
                                        <img :src="'https://flagcdn.com/w40/' + entry.item.sigla.toLowerCase() + '.png'" alt="flag" loading="lazy" />
                                        <div class="labelz">
                                            <div class="phone-option-label">{{ entry.item.label }}</div>
                                        </div>
                                        <div class="subLabel">( +{{ entry.item?.value }} )</div>
                                    </div>
                                </slot>
                            </div>
                        </div>
                    </div>
                </div>
            </Teleport>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { watchDebounced, refAutoReset } from '@maxvue/max-use';
    import { ref, computed, watch, nextTick, useId, onBeforeUnmount } from 'vue';
    import InputBase from './InputBase.vue';
    import { vMaska } from 'maska/vue';
    import { country_ddi_flags, type DDIFlag } from '../constants/ddiFlags';
    import { useVirtualList } from '../composables/useVirtualList';
    import { useOverlayZIndex } from '../composables/useOverlayZIndex';

    const props = withDefaults(
        defineProps<{
            icon?: string | undefined;
            i?: string | undefined;
            disabled?: boolean | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
            required?: boolean;
            noMessage?: boolean;
            noLabel?: boolean;
            noIcon?: boolean;
            /** Altura de cada linha em px (padrão: 36) */
            itemHeight?: number | string | undefined;
            /** Força ou desativa a virtualização da lista */
            virtualScroll?: boolean | undefined;
            /** Limiar para ativação automática do virtual scroll (padrão: 200) */
            virtualScrollThreshold?: number | undefined;
            /** Tolerância de itens renderizados fora da viewport (overscan) */
            numToleratedItems?: number | undefined;
        }>(),
        {
            done: undefined,
            required: false,
            caution: undefined,
            noLabel: false,
            noIcon: false,
            itemHeight: 36,
            virtualScroll: undefined,
            virtualScrollThreshold: 200,
            numToleratedItems: 5
        }
    );

    const temp_value = computed(() => country.value.value + phone.value.replace(/\D/g, ''));
    const modelValue = defineModel<any>({ default: '' });
    const only_numbers = computed(() => String(temp_value.value).replace(/\D/g, ''));

    const country = ref(country_ddi_flags.find((f) => f.ddi === 55) || country_ddi_flags[0]);
    const phone = ref('');
    const noMask = refAutoReset(false, 50);
    const onFocus = ref(false);

    watch(phone, () => {
        if (phone.value.startsWith('0')) phone.value = phone.value.substring(1);
    });

    function formatBrPhone(digits: string): string {
        const d = digits.replace(/\D/g, '');
        if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)} - ${d.slice(7, 11)}`;
        if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)} - ${d.slice(6, 10)}`;
        return d;
    }

    function applyPastedPhone(rawText: string): boolean {
        const trimmed = rawText.trim();
        const digits = trimmed.replace(/\D/g, '');
        if (!digits) return false;

        let matchedCountry: DDIFlag | undefined;
        let phoneNumber = digits;

        if (trimmed.startsWith('+')) for (let i = 3; i >= 1; i--) {
            if (digits.length > i) {
                const ddi = parseInt(digits.substring(0, i));
                const found = country_ddi_flags.find((f) => f.ddi === ddi);
                if (found) {
                    matchedCountry = found;
                    phoneNumber = digits.substring(i);
                    break;
                }
            }
        }
        else if (digits.length > 11) for (let i = 3; i >= 1; i--) {
            const ddi = parseInt(digits.substring(0, i));
            const found = country_ddi_flags.find((f) => f.ddi === ddi);
            if (found) {
                matchedCountry = found;
                phoneNumber = digits.substring(i);
                break;
            }
        }


        if (matchedCountry) country.value = matchedCountry;
        if (phoneNumber.startsWith('0')) phoneNumber = phoneNumber.substring(1);

        phone.value = country.value.value === 55 ? formatBrPhone(phoneNumber) : phoneNumber;
        return true;
    }

    function handlePaste(event?: ClipboardEvent) {
        const pastedText = event?.clipboardData?.getData?.('text');
        if (pastedText !== undefined && pastedText !== '') {
            if (applyPastedPhone(pastedText)) event?.preventDefault?.();
            return;
        }
        noMask.value = true;
    }

    watch(modelValue, (newVal) => {
        if (!newVal) {
            phone.value = '';
            return;
        }

        const digits = newVal.replace(/\D/g, '');
        if (digits === temp_value.value.replace(/\D/g, '')) return;

        // Tenta encontrar o DDI correspondente (3, 2 ou 1 dígito)
        for (let i = 3; i >= 1; i--) {
            const ddi = parseInt(digits.substring(0, i));
            const found = country_ddi_flags.find((f) => f.ddi === ddi);
            if (found) {
                country.value = found;
                phone.value = digits.substring(i);
                return;
            }
        }

        // Default caso não encontre
        country.value = country_ddi_flags.find((f) => f.ddi === 55) || country_ddi_flags[0];
        phone.value = digits;
    }, { immediate: true });


    watchDebounced(temp_value, () => {
        if (temp_value.value !== modelValue.value) modelValue.value = temp_value.value;
    }, { debounce: 500 });

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ },
            $: { pattern: /[0-9]/, optional: true },
            '@': { pattern: /[a-zA-Z0-9@(.+_-]/ },
            '%': { pattern: /[a-zA-Z0-9@().+_-\s]/, optional: true, repeated: true }
        };

        if (noMask.value) return {
            tokens: tokens,
            mask: '$$$$$$$$$$$$$$$$$$$$$$$$$$$$$'
        };

        if (country.value.value !== 55) return {
            tokens: tokens,
            mask: '%'
        };

        return {
            tokens: tokens,
            mask: only_numbers.value.length > 4 && ['6','7','8','9'].includes(only_numbers.value[4])
                ? '(##) 9 #### - ####$$'
                : '(##) #### - ####$$'
        };
    });

    /*
        Dropdown headless de países — substitui o <Select> do PrimeVue.
        Segue o padrão de overlay já adotado no projeto (MaxPopover):
        Teleport para o body + position fixed calculado por getBoundingClientRect,
        sem introduzir uma biblioteca de posicionamento nova.
    */
    const listbox_id = useId();
    const select_el = ref<HTMLElement | null>(null);
    const overlay_el = ref<HTMLElement | null>(null);
    const filter_el = ref<HTMLInputElement | null>(null);
    const list_el = ref<HTMLElement | null>(null);
    const isOpen = ref(false);
    const filter_text = ref('');
    const focused_index = ref(0);
    const position = ref({ top: 0, left: 0, width: 0 });

    const maskZIndex = useOverlayZIndex({ target: select_el, layer: 'dropdown' });
    const overlayZIndex = computed(() => {
        const val = maskZIndex.value;
        if (typeof val === 'number') return val + 1;
        return `calc(${val} + 1)`;
    });

    // Filtro equivalente ao `:filterFields="['name', 'value']"` do PrimeVue.
    // `value` é numérico, por isso o String() antes de comparar.
    const filtered_options = computed(() => {
        const term = filter_text.value.trim().toLowerCase();
        if (!term) return country_ddi_flags;

        return country_ddi_flags.filter((option) =>
            option.name.toLowerCase().includes(term) || String(option.value).includes(term)
        );
    });

    const getOptionId = (option: DDIFlag): string => `${listbox_id}-opt-${option.sigla.toLowerCase()}`;

    const activeDescendantId = computed(() => {
        if (!isOpen.value || focused_index.value < 0 || !filtered_options.value.length) return undefined;
        const currentOption = filtered_options.value[focused_index.value];
        if (!currentOption) return undefined;
        const isRendered = visibleItems.value.some((entry) => entry.item.sigla === currentOption.sigla);
        return isRendered ? getOptionId(currentOption) : undefined;
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
        return filtered_options.value.length > (props.virtualScrollThreshold ?? 200);
    });

    const {
        visibleItems,
        offsetY,
        totalHeight,
        setViewport,
        scrollToIndex
    } = useVirtualList(filtered_options, {
        itemHeight: numericItemHeight,
        enabled: isVirtual,
        overscan: props.numToleratedItems ?? 5
    });

    function onListScroll(event: Event) {
        const el = event.target as HTMLElement;
        if (el) setViewport(el.scrollTop, el.clientHeight || 300);
    }

    let rafId: number | null = null;

    function updatePosition() {
        const el = select_el.value;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const overlay_height = overlay_el.value?.offsetHeight ?? 300;
        const openUp = rect.bottom + overlay_height > window.innerHeight && rect.top > overlay_height;

        position.value = {
            top: openUp ? rect.top - overlay_height : rect.bottom,
            left: rect.left,
            width: Math.max(rect.width, 260)
        };
    }

    function onScrollOrResize() {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
            updatePosition();
            rafId = null;
        });
    }

    function scrollFocusedIntoView() {
        const container = list_el.value;
        if (!container || focused_index.value < 0) return;

        if (isVirtual.value) {
            const targetScroll = scrollToIndex(focused_index.value, 'auto');
            container.scrollTop = targetScroll;
            return;
        }

        const option = container.children[focused_index.value] as HTMLElement | undefined;
        option?.scrollIntoView({ block: 'nearest' });
    }

    async function open() {
        if (props.disabled) return;

        isOpen.value = true;
        filter_text.value = '';
        focused_index.value = Math.max(0, filtered_options.value.findIndex((o) => o.sigla === country.value.sigla));

        await nextTick();
        updatePosition();
        filter_el.value?.focus();
        scrollFocusedIntoView();

        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);
    }

    function close() {
        if (!isOpen.value) return;

        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        isOpen.value = false;
        window.removeEventListener('scroll', onScrollOrResize, true);
        window.removeEventListener('resize', onScrollOrResize);
    }

    function toggle() {
        if (isOpen.value) close();
        else open();
    }

    function selectOption(option: DDIFlag) {
        country.value = option;
        close();
        select_el.value?.focus();
    }

    function moveFocus(delta: number) {
        const total = filtered_options.value.length;
        if (!total) return;

        focused_index.value = (focused_index.value + delta + total) % total;
        nextTick(scrollFocusedIntoView);
    }

    function onTriggerKeydown(event: KeyboardEvent) {
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault();
            open();
        }
    }

    function onFilterKeydown(event: KeyboardEvent) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveFocus(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveFocus(-1);
        } else if (event.key === 'Home') {
            event.preventDefault();
            focused_index.value = 0;
            nextTick(scrollFocusedIntoView);
        } else if (event.key === 'End') {
            event.preventDefault();
            focused_index.value = Math.max(0, filtered_options.value.length - 1);
            nextTick(scrollFocusedIntoView);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const option = filtered_options.value[focused_index.value];
            if (option) selectOption(option);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            close();
            select_el.value?.focus();
        } else if (event.key === 'Tab') close();
    }

    // Se o filtro encurta a lista, o índice focado pode ficar fora do intervalo.
    watch(filtered_options, () => { focused_index.value = 0; });

    const unmaskedValue = ref('');

    defineExpose({
        unmaskedValue,
        noMask,
        handlePaste
    });

    onBeforeUnmount(close);
</script>

<style lang="scss" scoped>
.input-phone {
    :deep(.input-slot) {
        grid-template-columns: 1fr;
    }

    .inputs-div {
        display: grid;
        grid-template-columns: auto 1fr;
        width: 100%;
        position: relative;
        grid-column: 1 !important;
        place-items: center;
        height: 36px !important;

        &:focus-within {
            border-color: var(--max-inputtext-focus-border-color);
        }

        .max-phone-select {
            height: 36px;
            background-color: transparent !important;
            border: none !important;
            cursor: pointer;
            outline: none;

            &:focus-visible {
                border-radius: 4px;

                /* Foco canônico: --max-focus-ring-color adapta em dark mode */
                outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
            }

            .max-phone-select-label {
                height: 36px;
                background-color: transparent !important;
                padding: 0 !important;
                position: relative;

                .item-selected {
                    display: grid;
                    grid-template-columns: 25px 1fr;
                    place-items: center;
                    height: 100% !important;
                    padding: 2px 2px 2px 5px;
                    gap: 5px;

                    .item-flag {
                        width: 20px;
                        height: 15px !important;
                        display: grid;
                        place-items: center;
                        border-radius: 5px;
                        overflow: hidden;
                        left: 0;
                        font-size: 1rem;

                        img {
                            width: 21px;
                            aspect-ratio: 3/2;
                        }
                    }

                    .label-flag {
                        height: 16px !important;
                        color: var(--background-750);
                    }
                }
            }
        }

        input,
        .phone-number-input {
            border: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
            display: flex;
        }
    }

    :deep(.max-input-icon),
    :deep(.icon-right) {
        transform: translateY(-2px) !important;
    }

    [slot-a] {
        grid-column: 1 !important;
    }

    [slot-b] {
        grid-column: 2 !important;
    }

    :deep(.max-input-native) {
        padding: 0 2px !important;
    }
}

.max-phone-overlay-mask {
    position: fixed;
    inset: 0;
    z-index: var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000));
}

.max-phone-select-overlay {
    position: fixed;
    z-index: calc(var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000)) + 1);
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    max-height: 300px;
    border: 1px solid var(--background-300);
    border-radius: 6px;
    background-color: var(--background-0);
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);

    .max-phone-select-filter {
        padding: 6px;
        border-bottom: 1px solid var(--background-300);

        input {
            width: 100%;
            padding: 4px 6px !important;
            border: 1px solid var(--background-300);
            border-radius: 4px;
            background-color: transparent;
            color: var(--background-750);

            &::placeholder {
                color: var(--background-500);
            }

            &:focus {
                border-color: var(--max-inputtext-focus-border-color);
                outline: none;
            }
        }
    }

    .max-phone-select-list {
        position: relative;
        overflow-y: auto;

        .max-phone-select-spacer {
            width: 100%;
        }

        .max-phone-select-window {
            &.is-virtual {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
            }
        }

        .max-phone-select-option {
            display: grid !important;
            gap: 0 !important;
            padding: 4px 8px;
            cursor: pointer;

            &.is-focused {
                background-color: var(--background-100);
            }

            &.is-selected {
                background-color: var(--background-200);
            }

            .input-phone-label-div {
                display: grid;
                grid-template-columns: auto 1fr auto;
                width: 100% !important;
                place-items: center start;
                gap: 10px;

                .icon-div {
                    color: var(--background-750) !important;
                }

                &:hover {
                    .icon-div {
                        color: var(--background-750) !important;
                    }
                }

                .subLabel {
                    color: var(--background-750);
                    padding-left: 1rem;
                    text-align: right;
                    width: 100%;
                    font-size: 0.85rem;
                }

                .labelz {
                    display: grid;
                    place-items: center;
                    color: var(--background-750);

                    .phone-option-label {
                        padding-top: 2px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                }

                img {
                    width: 40px;
                    height: 28px;
                    border-radius: 5px;
                    border: 1px solid rgb(0 0 0 / 20%);
                }
            }
        }
    }
}
</style>
