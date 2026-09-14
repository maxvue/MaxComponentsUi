<template>
    <div
        ref="parentRef"
        class="max-base-virtual-scroller"
        :role="effectiveRole"
        :aria-label="props.ariaLabel || undefined"
        :aria-labelledby="props.ariaLabelledby || undefined"
        :style="style"
        @scroll="onScroll"
    >
        <div :style="{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }">
            <div
                v-for="virtualRow in virtualizer.getVirtualItems()"
                :key="String(virtualRow.key)"
                :role="effectiveItemRole"
                :aria-setsize="isPositionalRole ? items.length : undefined"
                :aria-posinset="isPositionalRole ? virtualRow.index + 1 : undefined"
                :style="{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                }"
            >
                <slot
                    name="item"
                    :item="items[virtualRow.index]"
                    :options="{
                        index: virtualRow.index,
                        count: items.length,
                        first: virtualRow.index === 0,
                        last: virtualRow.index === items.length - 1,
                        even: virtualRow.index % 2 === 0,
                        odd: virtualRow.index % 2 !== 0
                    }"
                    :aria-props="{
                        role: effectiveItemRole,
                        'aria-setsize': isPositionalRole ? items.length : undefined,
                        'aria-posinset': isPositionalRole ? virtualRow.index + 1 : undefined
                    }"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue';
    import { useVirtualizer } from '@tanstack/vue-virtual';

    const props = withDefaults(
        defineProps<{
            /** coleção completa a virtualizar */
            items?: any[];
            /** altura estimada de cada item, em px */
            itemSize?: number;
            /** estilo aplicado ao container com scroll (ex.: height) */
            style?: Record<string, string> | string;
            /** itens extras renderizados fora da viewport */
            numToleratedItems?: number;
            /** papel ARIA do container com scroll (opcional; padrão neutro sem role) */
            role?: string;
            /** papel ARIA atribuído a cada linha/item (opcional; ex: 'option', 'listitem') */
            itemRole?: string;
            /** rótulo acessível via aria-label */
            ariaLabel?: string;
            /** ID do elemento que rotula este container via aria-labelledby */
            ariaLabelledby?: string;
        }>(),
        {
            items: () => [],
            itemSize: 40,
            style: undefined,
            numToleratedItems: 5,
            role: undefined,
            itemRole: undefined,
            ariaLabel: undefined,
            ariaLabelledby: undefined
        }
    );

    const emit = defineEmits<{
        scroll: [event: Event];
        'scroll-index-change': [payload: { first: number; last: number }];
    }>();

    const parentRef = ref<HTMLElement | null>(null);

    const effectiveRole = computed(() => {
        if (props.role === 'listbox') {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(
                    '[MaxBaseVirtualScroller] role="listbox" não é suportado no scroller base por não possuir contrato de foco, seleção e teclado. Para listbox interativa, utilize MaxListBox.'
                );
            }
            return undefined;
        }
        return props.role || undefined;
    });

    const effectiveItemRole = computed(() => {
        if (props.itemRole === 'option') {
            return undefined;
        }
        return props.itemRole || undefined;
    });

    const isPositionalRole = computed(() => effectiveItemRole.value === 'listitem');

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: props.items.length,
            getScrollElement: () => parentRef.value,
            estimateSize: () => props.itemSize,
            overscan: props.numToleratedItems
        }))
    );

    const onScroll = (event: Event) => {
        emit('scroll', event);
        const range = virtualizer.value.range;
        if (range) emit('scroll-index-change', { first: range.startIndex, last: range.endIndex });
    };

    defineExpose({ scrollToIndex: (i: number) => virtualizer.value.scrollToIndex(i) });
</script>

<style lang="scss" scoped>
    .max-base-virtual-scroller {
        overflow: auto;
    }
</style>
