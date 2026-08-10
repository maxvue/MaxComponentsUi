<template>
    <div
        ref="parentRef"
        class="max-base-virtual-scroller"
        role="listbox"
        :style="style"
        @scroll="onScroll"
    >
        <div :style="{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }">
            <div
                v-for="virtualRow in virtualizer.getVirtualItems()"
                :key="String(virtualRow.key)"
                role="option"
                :aria-setsize="items.length"
                :aria-posinset="virtualRow.index + 1"
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
        }>(),
        { items: () => [], itemSize: 40, style: undefined, numToleratedItems: 5 }
    );

    const emit = defineEmits<{
        scroll: [event: Event];
        'scroll-index-change': [payload: { first: number; last: number }];
    }>();

    const parentRef = ref<HTMLElement | null>(null);

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
