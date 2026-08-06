<template>
    <InputBase
        v-bind="props"
        :done="props.done ?? isDone"
        :error="props.error ?? error_msg"
        :caution="caution"
        class="max-input-icon-picker"
        @click.stop="openDrawer"
    >
        <div class="icon-picker-trigger p-inputtext" pointer :class="{ 'is-disabled': props.disabled }">
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

    <Teleport to="body" :disabled="!visible">
        <div v-if="visible" class="max-icon-picker-drawer-backdrop" @click="visible = false">
            <div class="max-icon-picker-drawer p-component" role="dialog" aria-modal="true" @click.stop>
                <div class="picker-header">
                    <h3>Escolha um ícone</h3>
                    <button type="button" aria-label="Fechar" class="close-btn" @click="visible = false">×</button>
                </div>
                <div class="picker-search-area">
                    <MaxBaseInput v-model="search" placeholder="Pesquisar ícones..." />
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

                <MaxBaseVirtualScroller
                    v-else
                    :items="rows"
                    :itemSize="40"
                    :height="360"
                    class="icon-virtual-list"
                    @scroll="onScrollerScroll"
                >
                    <template #item="{ item, options }">
                        <div class="icon-row" :data-row-index="options.index">
                            <div
                                v-for="icon in (item as IconEntry[])"
                                :key="icon.name"
                                class="icon-cell"
                                :class="{ selected: modelValue === icon.name }"
                                @click.stop="selectIcon(icon.name)"
                                :aria-label="icon.name"
                                pointer
                            >
                                <div
                                    v-if="svgCache[icon.name]"
                                    class="picker-icon-svg"
                                    v-html="svgCache[icon.name]"
                                />
                                <div v-else class="picker-icon-placeholder" />
                            </div>
                        </div>
                    </template>
                </MaxBaseVirtualScroller>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
    import { hasContent, watchDebounced } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs, nextTick } from 'vue';
    import type { Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxBaseInput from './base/MaxBaseInput.vue';
    import MaxBaseVirtualScroller from './base/MaxBaseVirtualScroller.vue';

    const COLS = 8;

    interface IconEntry {
        id: number;
        name: string;
        search: string;
    }

    const attrs: any = useAttrs();

    const modelValue = defineModel<string>({ default: '' });

    const props = withDefaults(
        defineProps<{
            color?: string;
            disabled?: boolean;
            float?: boolean;
            msg?: string;
            message?: string;
            iconMessage?: string;
            label?: string;
            done?: boolean;
            error?: string | boolean;
            caution?: string | boolean;
            required?: boolean;
            placeholder?: string;
            listUrl?: string;
            svgUrl?: string;
        }>(),
        {
            done: undefined,
            required: false,
            caution: undefined,
            disabled: false,
            error: undefined,
            listUrl: 'https://engeapp.com.br/api/icons/picker',
            svgUrl: 'https://engeapp.com.br/api/icons/picker/svg'
        }
    );

    const visible = ref(false);
    const search = ref('');
    const curatedIcons = ref<IconEntry[]>([]);
    const isLoading = ref(false);
    const isDone: Ref = ref(props.done ?? null);

    const svgCache = ref<Record<string, string>>({});

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
            ? props.caution && isDone.value === false
            : isDone.value === false
    ));

    const error_msg = computed(() => {
        if (!caution.value) return null;
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
                svgCache.value = { ...svgCache.value, ...data };
            } catch {
                // Silencia erros de rede
            }

            if (svgFetchQueue.length > 0) enqueueSvgFetch([]);
        }, 150);
    };

    const onScrollerScroll = (event: Event) => {
        const el = event.target as HTMLElement;
        if (!el) return;
        const scrollTop = el.scrollTop;
        const clientHeight = el.clientHeight;
        const itemSize = 40;

        const firstRow = Math.floor(scrollTop / itemSize);
        const visibleRows = Math.ceil(clientHeight / itemSize) + 2;
        const lastRow = firstRow + visibleRows;

        const visibleIcons: string[] = [];
        for (let r = firstRow; r <= lastRow && r < rows.value.length; r++) for (const icon of rows.value[r]) visibleIcons.push(icon.name);

        enqueueSvgFetch(visibleIcons);
    };

    const preloadInitialSvgs = () => {
        const initialRows = Math.ceil(600 / 40) + 2;
        const names: string[] = [];
        for (let r = 0; r < initialRows && r < rows.value.length; r++) for (const icon of rows.value[r]) names.push(icon.name);

        enqueueSvgFetch(names);
    };

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
        svgCache.value = {};
        svgFetchQueue = [];
        if (svgFetchTimer !== null) { clearTimeout(svgFetchTimer); svgFetchTimer = null; }
        visible.value = true;
        fetchCuratedIcons();
    };

    const selectIcon = (iconName: string) => {
        modelValue.value = iconName;
        isDone.value = testIsDone();
        visible.value = false;
    };

    watchDebounced(() => search.value, async (val: string) => {
        if (val.length < 2) {
            await fetchCuratedIcons();
            return;
        }
        await fetchCuratedIcons(val);
    }, { debounce: 400 });

    watch(modelValue, () => {
        isDone.value = testIsDone();
    });

    defineEmits<{
        'update:modelValue': [value: string];
    }>();
</script>

<style lang="scss">
.max-input-icon-picker {
    .icon-picker-trigger {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        height: 36px;
        width: 100%;
        cursor: pointer;

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
    background-color: rgb(0 0 0 / 40%);
    z-index: 9999;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.max-icon-picker-drawer {
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    background-color: var(--background-0, #fff);
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -4px 16px rgb(0 0 0 / 15%);
    padding: 16px;
    display: flex;
    flex-direction: column;

    .picker-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;

        h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 1.4rem;
            cursor: pointer;
            color: var(--background-600);
        }
    }

    .picker-search-area {
        padding-bottom: 12px;
    }

    .picker-state-area {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: var(--background-500);
        font-size: 0.9rem;
        gap: 0.5rem;
    }

    .icon-virtual-list {
        width: 100%;
    }

    .icon-row {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        height: 40px;
        align-items: center;
    }

    .icon-cell {
        display: grid;
        place-items: center;
        height: 40px;
        border-radius: 6px;
        transition: background-color 0.15s ease;

        &:hover {
            background-color: var(--background-100);
        }

        &.selected {
            background-color: var(--max-primary-100);

            .picker-icon-svg {
                color: var(--max-primary-600);
            }
        }

        .picker-icon-svg {
            display: grid;
            place-items: center;
            width: 1.5rem;
            height: 1.5rem;
            color: rgb(0 0 0 / 50%);

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
</style>
