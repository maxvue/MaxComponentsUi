<template>
    <InputBase class="input-phone" v-bind="props" :value="temp_value" :done="done" :error="error" :caution="caution" :label="props.noLabel ? undefined : props.label ?? ('Telefone' + String(props.noLabel)) " :icon-right="props.noIcon ? undefined : 'ic:baseline-whatsapp'" >
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
                            <img :src="'https://flagcdn.com/w40/' + country.sigla.toLowerCase() + '.png'" alt="bandeira" flex />
                        </div>
                        <div style="color: var(--background-600);">+ {{ country.value }}</div>
                    </div>
                </div>
            </div>
            <input type="text" slot-b v-model="phone" v-maska:unmaskedValue.unmasked="maskValue" flex :placeholder="country.value === 55 ? '(99) 9 9999 - 9999' : ''" p0 class="p-inputtext" @focus="onFocus = true" @blur="onFocus = false" />
        </div>

        <Teleport to="body" v-if="isOpen">
            <div class="max-phone-overlay-mask" @click.stop="close"></div>
            <div
                ref="overlay_el"
                class="max-phone-select-overlay"
                :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width + 'px' }"
                @click.stop="() => {}"
            >
                <div class="max-phone-select-filter">
                    <input
                        ref="filter_el"
                        type="text"
                        v-model="filter_text"
                        class="p-inputtext"
                        :placeholder="'Buscar país ou código'"
                        aria-label="Buscar país ou código"
                        @keydown="onFilterKeydown"
                    />
                </div>
                <div class="max-phone-select-list" role="listbox" :id="listbox_id" ref="list_el">
                    <div
                        v-for="(option, index) in filtered_options"
                        :key="option.sigla"
                        class="max-phone-select-option"
                        role="option"
                        :aria-selected="option.sigla === country.sigla"
                        :class="{ 'is-focused': index === focused_index, 'is-selected': option.sigla === country.sigla }"
                        @click.stop="selectOption(option)"
                        @mousemove="focused_index = index"
                    >
                        <slot name="option" :option="option" :selected="option.sigla === country.sigla" :index="index">
                            <div class="input-phone-label-div">
                                <img :src="'https://flagcdn.com/w40/' + option.sigla.toLowerCase() + '.png'" alt="flag" />
                                <div class="labelz">
                                    <div pt2 elipsis >{{ option.label }}</div>
                                </div>
                                <div class="subLabel">( +{{ option?.value }} )</div>
                            </div>
                        </slot>
                    </div>
                </div>
            </div>
        </Teleport>
    </InputBase>
</template>

<script setup lang="ts">
    import { watchDebounced, refAutoReset } from '@maxvue/max-use';
    import { useMagicKeys } from '@maxvue/max-use';
    import { ref, computed, watch, nextTick, useId, onBeforeUnmount } from 'vue';
    import InputBase from './InputBase.vue';
    import { vMaska } from 'maska/vue';
    import { country_ddi_flags, type DDIFlag } from '../constants/ddiFlags';

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
            noLabel?: boolean;
            noIcon?: boolean;
        }>(),
        { done: undefined, required: false, caution: undefined, noLabel: false, noIcon: false }
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

    const { ctrl, v } = useMagicKeys();
    watch(() => [ctrl.value, v.value], () => noMask.value = ctrl.value && v.value && onFocus.value);

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

    // Filtro equivalente ao `:filterFields="['name', 'value']"` do PrimeVue.
    // `value` é numérico, por isso o String() antes de comparar.
    const filtered_options = computed(() => {
        const term = filter_text.value.trim().toLowerCase();
        if (!term) return country_ddi_flags;

        return country_ddi_flags.filter((option) =>
            option.name.toLowerCase().includes(term) || String(option.value).includes(term)
        );
    });

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

    function scrollFocusedIntoView() {
        const container = list_el.value;
        if (!container) return;

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

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
    }

    function close() {
        if (!isOpen.value) return;

        isOpen.value = false;
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
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
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const option = filtered_options.value[focused_index.value];
            if (option) selectOption(option);
        } else if (event.key === 'Escape' || event.key === 'Tab') close();
    }

    // Se o filtro encurta a lista, o índice focado pode ficar fora do intervalo.
    watch(filtered_options, () => { focused_index.value = 0; });

    onBeforeUnmount(close);
</script>

<style lang="scss">
.input-phone {
    .input-slot {
        grid-template-columns: 1fr;
    }

    .inputs-div {
        display: grid;
        grid-template-columns: 83px 1fr;
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
            width: 80px;
            cursor: pointer;
            outline: none;

            &:focus-visible {
                border-radius: 4px;
                outline: 2px solid var(--max-inputtext-focus-border-color);
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
                    height: 100%;
                    padding-left: 5px;

                    .item-flag {
                        width: 20px;
                        height: 14px;
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
                }
            }
        }

        input {
            border: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
        }
    }

    .p-inputicon {
        transform: translateY(-2px) !important;
    }

    [slot-a] {
        grid-column: 1 !important;
    }

    [slot-b] {
        grid-column: 2 !important;
    }

    .p-inputtext {
        padding: 0 2px !important;
    }
}

.max-phone-overlay-mask {
    position: fixed;
    inset: 0;
    z-index: 1100;
}

.max-phone-select-overlay {
    position: fixed;
    z-index: 1101;
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

            &:focus {
                border-color: var(--max-inputtext-focus-border-color);
                outline: none;
            }
        }
    }

    .max-phone-select-list {
        overflow-y: auto;
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
    }
}

.input-phone-label-div {
    display: grid;
    grid-template-columns: auto 1fr auto;
    width: 100% !important;
    place-items: center start;
    gap: 10px;

    .icon-div {
        color: var(--background-650) !important;
    }

    &:hover {
        .icon-div {
            color: var(--background-650) !important;
        }
    }

    .subLabel {
        color: var(--background-600);
        padding-left: 1rem;
        text-align: right;
        width: 100%;
        font-size: 0.85rem;
    }

    .labelz {
        display: grid;
        place-items: center;
        color: var(--background-750);
    }

    img {
        width: 40px;
        height: 28px;
        border-radius: 5px;
        border: 1px solid rgb(0 0 0 / 20%);
    }
}
</style>
