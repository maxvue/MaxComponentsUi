<template>
    <InputBase
        v-bind="props"
        :done="props.done ?? isDone"
        :error="props.error ?? error_msg"
        :caution="caution"
        class="max-input-icon-picker"
        @click.stop="openDrawer"
    >
        <div
            ref="triggerRef"
            class="icon-picker-trigger"
            :class="{ 'is-disabled': props.disabled }"
            role="button"
            :tabindex="props.disabled ? -1 : 0"
            aria-haspopup="dialog"
            :aria-expanded="visible"
            :aria-label="modelValue ? `Ícone selecionado: ${modelValue}. Clique para alterar` : 'Escolha um ícone'"
            @keydown.enter.prevent="openDrawer"
            @keydown.space.prevent="openDrawer"
        >
            <MaxIcon
                :i="modelValue || 'tabler:icons-filled'"
                size="1.2"
                :color="modelValue && props.color ? props.color : undefined"
                :dark="!modelValue ? 0.3 : 0.5"
            />
            <span class="trigger-label">{{ modelValue || props.placeholder || 'Escolha um ícone' }}</span>
            <MaxIcon i="mdi:chevron-down" size="0.9" :dark="0.4" />
        </div>
    </InputBase>

    <Teleport to="body" v-if="visible">
        <div class="max-icon-picker-drawer-backdrop" @click="closeDrawer" @keydown.esc="closeDrawer">
            <div
                ref="drawerEl"
                class="max-icon-picker-drawer p-drawer-bottom"
                role="dialog"
                aria-modal="true"
                aria-label="Escolha um ícone"
                @click.stop
            >
                <div class="p-drawer-header">
                    <span class="p-drawer-title">Escolha um ícone</span>
                    <button
                        type="button"
                        class="p-drawer-close-button"
                        aria-label="Fechar seletor de ícones"
                        @click="closeDrawer"
                    >
                        <MaxIcon i="mdi:close" size="1.2" />
                    </button>
                </div>

                <div class="p-drawer-content">
                    <div class="picker-search-area">
                        <input
                            ref="searchInputRef"
                            type="text"
                            class="picker-search-input"
                            v-model="search"
                            placeholder="Pesquisar ícones..."
                        />
                    </div>

                    <div v-if="isLoading" class="picker-state-area">
                        <MaxIcon i="svg-spinners:ring-resize" size="2" :dark="0.4" />
                    </div>

                    <div v-else-if="flatIcons.length === 0 && search.length >= 2" class="picker-state-area">
                        Nenhum ícone encontrado para "{{ search }}"
                    </div>

                    <div v-else-if="flatIcons.length === 0 && !isLoading" class="picker-state-area">
                        <MaxIcon i="svg-spinners:ring-resize" size="2" :dark="0.4" />
                    </div>

                    <div
                        v-else
                        ref="scrollerEl"
                        class="icon-virtual-list"
                        @scroll="onScrollerScroll"
                    >
                        <div
                            class="icon-virtual-spacer"
                            :style="{ height: `${totalHeight}px` }"
                            aria-hidden="true"
                        />
                        <div
                            class="icon-virtual-window"
                            :style="{ transform: `translateY(${offsetY}px)` }"
                        >
                            <div
                                v-for="entry in visibleItems"
                                :key="entry.index"
                                class="icon-row"
                                :data-row-index="entry.index"
                            >
                                <button
                                    v-for="icon in entry.item"
                                    :key="icon.name"
                                    type="button"
                                    class="icon-cell"
                                    :class="{ selected: modelValue === icon.name }"
                                    :aria-label="`Selecionar ícone ${icon.name}`"
                                    :title="icon.name"
                                    @click.stop="selectIcon(icon.name)"
                                >
                                    <div
                                        v-if="svgCache[icon.name]"
                                        class="picker-icon-svg"
                                        v-html="svgCache[icon.name]"
                                    />
                                    <div v-else class="picker-icon-placeholder" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
    import { hasContent, watchDebounced } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs, nextTick, onBeforeUnmount } from 'vue';
    import type { Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import { sanitizeSvg } from '../helpers/sanitizeSvg';
    import { useVirtualList } from '../composables/useVirtualList';

    const COLS = 8;
    const ROW_HEIGHT = 40;
    const OVERSCAN_ROWS = 4;

    interface IconEntry {
        id: number;
        name: string;
        search: string;
    }

    const attrs: any = useAttrs();

    const modelValue = defineModel<string>({ default: '' });

    const props = withDefaults(
        defineProps<{
            /** Cor aplicada ao ícone selecionado no trigger */
            color?: string;
            /** Desabilita o campo */
            disabled?: boolean;
            /** Ativa estilo FloatLabel */
            float?: boolean;
            /** Mensagem de feedback (alias) */
            msg?: string;
            /** Mensagem de feedback */
            message?: string;
            /** Ícone da mensagem de feedback */
            iconMessage?: string;
            /** Rótulo do campo */
            label?: string;
            /** Estado de conclusão/validação manual */
            done?: boolean;
            /** Mensagem ou estado de erro */
            error?: string | boolean;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean;
            /** Define se o campo é obrigatório */
            required?: boolean;
            /** Texto de placeholder quando nenhum ícone está selecionado */
            placeholder?: string;
            /** URL base para listar/buscar ícones curados */
            listUrl?: string;
            /** URL para buscar SVGs dos ícones curados via POST */
            svgUrl?: string;
        }>(),
        {
            done: undefined,
            required: false,
            caution: undefined,
            disabled: false,
            error: undefined,
            listUrl: '/api/icons/picker',
            svgUrl: '/api/icons/picker/svg'
        }
    );

    const visible = ref(false);
    const triggerRef = ref<HTMLElement | null>(null);
    const searchInputRef = ref<HTMLInputElement | null>(null);
    const drawerEl = ref<HTMLElement | null>(null);
    const search = ref('');
    const curatedIcons = ref<IconEntry[]>([]);
    const isLoading = ref(false);
    const isDone: Ref = ref(props.done ?? null);

    /** Cache local de SVGs: name → svg string */
    const svgCache = ref<Record<string, string>>({});

    /** Fila de nomes aguardando fetch de SVG */
    let svgFetchQueue: string[] = [];
    let svgFetchTimer: ReturnType<typeof setTimeout> | null = null;

    const isRequiredDone = computed(() => (props.required ? hasContent(modelValue.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => (
        props.caution !== undefined
            ? props.caution
            : isDone.value === false
    ));

    const error_msg = computed(() => {
        if (isDone.value !== false) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Valor inválido';
    });

    const flatIcons = computed<IconEntry[]>(() => curatedIcons.value);

    const toRows = (icons: IconEntry[]): IconEntry[][] => {
        const result: IconEntry[][] = [];
        for (let i = 0; i < icons.length; i += COLS) result.push(icons.slice(i, i + COLS));
        return result;
    };

    const rows = computed<IconEntry[][]>(() => toRows(flatIcons.value));

    const scrollerEl = ref<HTMLElement | null>(null);
    const isVirtualActive = computed(() => rows.value.length > 0);

    const { visibleItems, offsetY, totalHeight, setViewport } = useVirtualList(rows, {
        itemHeight: computed(() => ROW_HEIGHT),
        enabled: isVirtualActive,
        overscan: OVERSCAN_ROWS
    });

    /**
     * Enfileira nomes de ícones para fetch de SVG com debounce de 150ms.
     * Respeita o limite de 200 por request.
     */
    const enqueueSvgFetch = (names: string[]) => {
        const pending = names.filter((n) => !svgCache.value[n] && !svgFetchQueue.includes(n));
        if (pending.length === 0) return;
        svgFetchQueue.push(...pending);

        if (svgFetchTimer !== null) clearTimeout(svgFetchTimer);
        svgFetchTimer = setTimeout(async () => {
            const batch = svgFetchQueue.splice(0, 200);
            svgFetchTimer = null;
            if (batch.length === 0) return;

            try {
                const res = await fetch(props.svgUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ names: batch })
                });
                const data: Record<string, string> = await res.json();
                const sanitized_data: Record<string, string> = {};
                for (const name in data) sanitized_data[name] = sanitizeSvg(data[name]);
                svgCache.value = { ...svgCache.value, ...sanitized_data };
            } catch {
                // Silencia erros de rede; ícones ficam sem SVG temporariamente
            }

            // Se ficaram itens na fila após o splice, reagenda
            if (svgFetchQueue.length > 0) enqueueSvgFetch([]);
        }, 150);
    };

    /**
     * Ao scrollar a lista, coleta os ícones visíveis e solicita os SVGs ausentes.
     */
    const onScrollerScroll = (event: Event) => {
        const el = event.target as HTMLElement;
        if (!el) return;

        setViewport(el.scrollTop, el.clientHeight || 400);

        const iconsToFetch: string[] = [];
        for (const entry of visibleItems.value) for (const icon of entry.item) iconsToFetch.push(icon.name);


        enqueueSvgFetch(iconsToFetch);
    };

    /**
     * Pré-carrega SVGs das primeiras linhas visíveis ao montar a lista.
     */
    const preloadInitialSvgs = () => {
        setViewport(0, scrollerEl.value?.clientHeight || 400);
        const names: string[] = [];
        for (const entry of visibleItems.value) for (const icon of entry.item) names.push(icon.name);


        enqueueSvgFetch(names);
    };

    /**
     * Busca a lista curada de ícones no backend.
     */
    const fetchCuratedIcons = async (query?: string) => {
        isLoading.value = true;
        try {
            const url = query
                ? `${props.listUrl}?q=${encodeURIComponent(query)}`
                : props.listUrl;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            const data: IconEntry[] = await res.json();
            curatedIcons.value = Array.isArray(data) ? data : [];
        } catch {
            curatedIcons.value = [];
        } finally {
            isLoading.value = false;
            await nextTick();
            preloadInitialSvgs();
        }
    };

    const openDrawer = () => {
        if (props.disabled) return;
        search.value = '';
        curatedIcons.value = [];
        // svgCache é preservado entre aberturas da gaveta para evitar re-downloads
        svgFetchQueue = [];
        if (svgFetchTimer !== null) {
            clearTimeout(svgFetchTimer);
            svgFetchTimer = null;
        }
        visible.value = true;
        fetchCuratedIcons();
    };

    const closeDrawer = () => {
        visible.value = false;
        nextTick(() => {
            triggerRef.value?.focus();
        });
    };

    const selectIcon = (iconName: string) => {
        modelValue.value = iconName;
        isDone.value = testIsDone();
        closeDrawer();
    };

    const onGlobalKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && visible.value) closeDrawer();

    };

    watch(visible, async (val) => {
        if (val) {
            if (typeof window !== 'undefined') window.addEventListener('keydown', onGlobalKeydown);
            await nextTick();
            searchInputRef.value?.focus();
        } else {
            if (typeof window !== 'undefined') window.removeEventListener('keydown', onGlobalKeydown);
            nextTick(() => {
                triggerRef.value?.focus();
            });
        }
    });

    watchDebounced(
        () => search.value,
        async (val: string) => {
            if (scrollerEl.value) scrollerEl.value.scrollTop = 0;
            setViewport(0, scrollerEl.value?.clientHeight || 400);
            if (val.length < 2) {
                await fetchCuratedIcons();
                return;
            }
            await fetchCuratedIcons(val);
        },
        { debounce: 400 }
    );

    watch(modelValue, () => {
        isDone.value = testIsDone();
    });

    onBeforeUnmount(() => {
        if (typeof window !== 'undefined') window.removeEventListener('keydown', onGlobalKeydown);
        if (svgFetchTimer !== null) {
            clearTimeout(svgFetchTimer);
            svgFetchTimer = null;
        }
        svgFetchQueue = [];
    });

    defineEmits<{
        'update:modelValue': [value: string];
    }>();
</script>

<style lang="scss" scoped>
.max-input-icon-picker {
    .icon-picker-trigger {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        height: 36px;
        width: 100%;
        cursor: pointer;

        &:focus-visible {
            outline: 2px solid var(--max-primary-500, #00768e);
            outline-offset: 1px;
        }

        &.is-disabled {
            cursor: not-allowed;
            opacity: 0.6;
        }

        .trigger-label {
            flex: 1;
            font-size: 0.875rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.max-icon-picker-drawer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    background: rgb(0 0 0 / 40%);
    display: flex;
    align-items: flex-end;

    .max-icon-picker-drawer {
        height: 90dvh;
        width: 100%;
        background: var(--background-0, #fff);
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        box-shadow: 0 -4px 24px rgb(0 0 0 / 20%);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: drawer-slide-up 0.25s ease-out;

        .p-drawer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid var(--surface-border);

            .p-drawer-title {
                font-weight: 600;
                font-size: 1.1rem;
                color: var(--background-775);
            }

            .p-drawer-close-button {
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 6px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--background-700);

                &:hover {
                    background: var(--background-100, #f1f5f9);
                    color: var(--background-775);
                }
            }
        }

        .p-drawer-content {
            flex: 1;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            overflow: hidden;

            .picker-search-area {
                padding: 0 0 14px;

                .picker-search-input {
                    width: 100%;
                    height: 38px;
                    padding: 0 12px;
                    border: 1px solid var(--surface-border);
                    border-radius: 8px;
                    outline: none;
                    font-size: 0.9rem;
                    color: var(--background-700);

                    &::placeholder {
                        color: var(--background-650);
                    }
                }
            }

            .picker-state-area {
                display: flex;
                align-items: center;
                justify-content: center;
                height: calc(90dvh - 140px);
                color: var(--background-650);
                font-size: 0.9rem;
                gap: 0.5rem;
            }

            .icon-virtual-list {
                position: relative;
                width: 100%;
                height: calc(90dvh - 140px);
                overflow-y: auto;
                scrollbar-width: thin;

                .icon-virtual-spacer {
                    width: 100%;
                    pointer-events: none;
                }

                .icon-virtual-window {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    display: flex;
                    flex-direction: column;

                    .icon-row {
                        display: grid;
                        grid-template-columns: repeat(8, 1fr);
                        height: 40px;
                        align-items: center;

                        .icon-cell {
                            display: grid;
                            place-items: center;
                            height: 40px;
                            border-radius: 6px;
                            background: none;
                            border: none;
                            padding: 0;
                            cursor: pointer;
                            transition: background-color 0.15s ease;

                            &:focus-visible {
                                outline: 2px solid var(--max-primary-500, #00768E);
                                outline-offset: 1px;
                                border-radius: 4px;
                            }

                            &:hover {
                                background-color: var(--background-100);
                            }

                            &.selected {
                                background-color: var(--max-primary-50);

                                .picker-icon-svg {
                                    color: var(--max-primary-600, #005F77);
                                }
                            }

                            .picker-icon-svg {
                                display: grid;
                                place-items: center;
                                width: 1.5rem;
                                height: 1.5rem;
                                color: var(--background-700, rgb(0 0 0 / 50%));

                                svg {
                                    min-width: 100% !important;
                                    min-height: 100% !important;
                                    max-width: 100% !important;
                                    max-height: 100% !important;
                                }
                            }

                            .picker-icon-placeholder {
                                width: 1.5rem;
                                height: 1.5rem;
                                border-radius: 4px;
                                background-color: var(--background-100);
                            }
                        }
                    }
                }
            }
        }
    }
}


@keyframes drawer-slide-up {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}
</style>
