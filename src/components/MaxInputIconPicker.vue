<template>
    <InputBase
        v-bind="props"
        :done="props.done ?? isDone"
        :error="props.error ?? error_msg"
        :caution="caution"
        class="max-input-icon-picker"
        @click.stop="openDrawer"
    >
        <template #default="{ inputAttrs }">
            <div
                ref="triggerRef"
                v-bind="inputAttrs"
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
        </template>
    </InputBase>

    <Teleport to="body" v-if="visible">
        <div class="max-icon-picker-drawer-backdrop" @click="closeDrawer" @keydown.esc="closeDrawer">
            <div
                ref="drawerEl"
                class="max-icon-picker-drawer p-drawer-bottom"
                role="dialog"
                :aria-modal="isTop ? 'true' : undefined"
                :aria-hidden="!isTop ? 'true' : undefined"
                :inert="!isTop ? true : undefined"
                aria-label="Escolha um ícone"
                tabindex="-1"
                @click.stop
                @keydown="isTop ? trap.onKeydown($event) : undefined"
            >
                <div class="max-icon-picker-header p-drawer-header">
                    <span class="max-icon-picker-title p-drawer-title">Escolha um ícone</span>
                    <button
                        type="button"
                        class="max-icon-picker-close-button p-drawer-close-button"
                        aria-label="Fechar seletor de ícones"
                        @click="closeDrawer"
                    >
                        <MaxIcon i="mdi:close" size="1.2" />
                    </button>
                </div>

                <div class="max-icon-picker-content p-drawer-content">
                    <div class="picker-search-area">
                        <input
                            ref="searchInputRef"
                            type="text"
                            class="picker-search-input"
                            v-model="search"
                            placeholder="Pesquisar ícones..."
                        />
                    </div>

                    <div v-if="isLoading" class="picker-state-area" role="status" aria-live="polite">
                        <MaxIcon i="svg-spinners:ring-resize" size="2" :dark="0.4" />
                        <span class="picker-state-text">Carregando ícones...</span>
                    </div>

                    <div v-else-if="hasLoadError" class="picker-state-area is-error" role="alert">
                        <div class="picker-state-text">Não foi possível carregar os ícones.</div>
                        <button type="button" class="picker-retry-btn" @click="fetchCuratedIcons(search)">
                            Tentar novamente
                        </button>
                    </div>

                    <div v-else-if="flatIcons.length === 0" class="picker-state-area">
                        {{ search.length >= 2 ? `Nenhum ícone encontrado para "${search}"` : 'Nenhum ícone disponível' }}
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
    import { ref, computed, watch, useAttrs, nextTick, onBeforeUnmount, useId } from 'vue';
    import type { Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import { sanitizeSvg } from '../helpers/sanitizeSvg';
    import { useVirtualList } from '../composables/useVirtualList';
    import { useFocusTrap } from '../helpers/useFocusTrap';
    import { useModalStore } from '../stores/useModal.Store';
    import { useScrollLock } from '../helpers/useScrollLock';

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
            /** Oculta a mensagem de feedback e remove a reserva vertical */
            noMessage?: boolean;
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
    const trap = useFocusTrap(drawerEl, { onEscape: () => closeDrawer() });
    const modalStore = useModalStore();
    const modalId = 'max-icon-picker-' + useId();
    const isTop = computed(() => modalStore.isTop(modalId));
    const scrollLock = useScrollLock(modalId);
    const search = ref('');
    const curatedIcons = ref<IconEntry[]>([]);
    const isLoading = ref(false);
    const hasLoadError = ref(false);
    const isDone: Ref = ref(props.done ?? null);


    /** Cache local de SVGs: name → svg string */
    const svgCache = ref<Record<string, string>>({});

    /** Fila de nomes aguardando fetch de SVG */
    let svgFetchQueue: string[] = [];
    let svgFetchTimer: ReturnType<typeof setTimeout> | null = null;
    let isDraining = false;

    let catalogGeneration = 0;
    let catalogAbortController: AbortController | null = null;

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
     * Agenda a drenagem da fila em lotes limitados a 200 itens por requisição.
     */
    const scheduleDrain = (delay = 150) => {
        if (svgFetchTimer !== null || isDraining) return;
        svgFetchTimer = setTimeout(() => {
            svgFetchTimer = null;
            drainQueue();
        }, delay);
    };

    /**
     * Drena a fila de requisições de SVG em lotes de no máximo 200 itens.
     */
    const drainQueue = async () => {
        if (svgFetchQueue.length === 0 || isDraining) return;
        isDraining = true;

        try {
            while (svgFetchQueue.length > 0) {
                const batch = svgFetchQueue.splice(0, 200);
                if (batch.length === 0) break;

                try {
                    const res = await fetch(props.svgUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ names: batch })
                    });
                    if (res.ok !== false) {
                        const data = await res.json();
                        if (data && typeof data === 'object') {
                            const sanitized_data: Record<string, string> = {};
                            for (const name in data) if (typeof data[name] === 'string') {
                                const clean = sanitizeSvg(data[name]);
                                if (clean) sanitized_data[name] = clean;
                            }

                            svgCache.value = { ...svgCache.value, ...sanitized_data };
                        }
                    }
                } catch {
                    // Silencia erro de rede no lote individual
                }
            }
        } finally {
            isDraining = false;
            if (svgFetchQueue.length > 0) scheduleDrain(50);
        }
    };

    /**
     * Enfileira nomes de ícones para fetch de SVG, garantindo deduplicação e agendamento.
     */
    const enqueueSvgFetch = (names: string[]) => {
        const pending = names.filter((n) => !svgCache.value[n] && !svgFetchQueue.includes(n));
        if (pending.length === 0) return;
        svgFetchQueue.push(...pending);
        scheduleDrain(150);
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
     * Busca a lista curada de ícones no backend protegida por identificador de geração
     * e AbortController para prevenir que respostas obsoletas sobrescrevam a busca atual.
     */
    const fetchCuratedIcons = async (query?: string) => {
        if (catalogAbortController) {
            catalogAbortController.abort();
            catalogAbortController = null;
        }

        const generation = ++catalogGeneration;
        const controller = new AbortController();
        catalogAbortController = controller;
        isLoading.value = true;
        hasLoadError.value = false;

        try {
            const url = query
                ? `${props.listUrl}?q=${encodeURIComponent(query)}`
                : props.listUrl;
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
            if (res.ok === false) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (generation === catalogGeneration) {
                curatedIcons.value = Array.isArray(data) ? data : [];
                isLoading.value = false;
                hasLoadError.value = false;
                await nextTick();
                preloadInitialSvgs();
            }
        } catch (err: any) {
            if (err?.name === 'AbortError') return;
            if (generation === catalogGeneration) {
                curatedIcons.value = [];
                isLoading.value = false;
                hasLoadError.value = true;
            }
        } finally {
            if (generation === catalogGeneration) {
                isLoading.value = false;
                if (catalogAbortController === controller) catalogAbortController = null;
            }
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
        trap.activate();
        fetchCuratedIcons();
    };

    const closeDrawer = () => {
        if (catalogAbortController) {
            catalogAbortController.abort();
            catalogAbortController = null;
        }
        catalogGeneration++;
        isLoading.value = false;
        visible.value = false;
        trap.deactivate();
        nextTick(() => {
            triggerRef.value?.focus();
        });
    };

    const selectIcon = (iconName: string) => {
        modelValue.value = iconName;
        isDone.value = testIsDone();
        closeDrawer();
    };


    watch(visible, async (val) => {
        if (val) {
            modalStore.push(modalId);
            scrollLock.lock();

            trap.activate();
            await nextTick();
            searchInputRef.value?.focus();
        } else {
            modalStore.remove(modalId);
            scrollLock.unlock();

            trap.deactivate();
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
        if (visible.value) {
            modalStore.remove(modalId);
            scrollLock.unlock();
        }
        trap.deactivate();

        if (svgFetchTimer !== null) {
            clearTimeout(svgFetchTimer);
            svgFetchTimer = null;
        }
        if (catalogAbortController) {
            catalogAbortController.abort();
            catalogAbortController = null;
        }
        catalogGeneration++;
        svgFetchQueue = [];
    });

    defineExpose({
        enqueueSvgFetch,
        svgCache,
        svgFetchQueue,
        visible,
        search,
        isLoading,
        hasLoadError,
        fetchCuratedIcons,
        retryLoad: () => fetchCuratedIcons(search.value),
        openDrawer,
        closeDrawer,
        openDialog: openDrawer,
        closeDialog: closeDrawer
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
    z-index: var(--max-layer-modal, 1310);
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

        .max-icon-picker-header,
        .p-drawer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid var(--surface-border);

            .max-icon-picker-title,
            .p-drawer-title {
                font-weight: 600;
                font-size: 1.1rem;
                color: var(--background-775);
            }

            .max-icon-picker-close-button,
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

        .max-icon-picker-content,
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
                        color: var(--background-700);
                    }
                }
            }

            .picker-state-area {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: calc(90dvh - 140px);
                color: var(--background-700);
                font-size: 0.9rem;
                gap: 0.5rem;

                &.is-error {
                    color: var(--max-danger-500, #ef4444);
                }

                .picker-retry-btn {
                    margin-top: 0.5rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 6px;
                    background: var(--max-primary-500, #00768e);
                    color: #fff;
                    border: none;
                    cursor: pointer;
                    font-size: 0.85rem;

                    &:hover {
                        background: var(--max-primary-600, #005f77);
                    }
                }
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
                                background-color: var(--blue-50);

                                .picker-icon-svg {
                                    color: var(--blue-800);
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

@media (prefers-reduced-motion: reduce) {
    .icon-picker-mobile-drawer {
        animation: none !important;
    }
}
</style>
