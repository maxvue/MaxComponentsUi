<template>
    <div
        ref="parentRef"
        class="max-base-virtual-scroller"
        :role="props.role || undefined"
        :aria-label="props.ariaLabel || undefined"
        :aria-labelledby="props.ariaLabelledby || undefined"
        :aria-activedescendant="validActivedescendant || undefined"
        :style="style"
        @scroll="onScroll"
    >
        <div :style="{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }">
            <div
                v-for="virtualRow in virtualizer.getVirtualItems()"
                :key="String(virtualRow.key)"
                :role="itemRole || undefined"
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
                        role: itemRole || undefined,
                        'aria-setsize': isPositionalRole ? items.length : undefined,
                        'aria-posinset': isPositionalRole ? virtualRow.index + 1 : undefined
                    }"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watchEffect, onMounted, nextTick } from 'vue';
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
            /** ID do item atualmente ativo para foco virtual */
            ariaActivedescendant?: string;
        }>(),
        {
            items: () => [],
            itemSize: 40,
            style: undefined,
            numToleratedItems: 5,
            role: undefined,
            itemRole: undefined,
            ariaLabel: undefined,
            ariaLabelledby: undefined,
            ariaActivedescendant: undefined
        }
    );

    const emit = defineEmits<{
        scroll: [event: Event];
        'scroll-index-change': [payload: { first: number; last: number }];
    }>();

    const parentRef = ref<HTMLElement | null>(null);
    const validActivedescendant = ref<string | null>(null);

    const isPositionalRole = computed(() => props.itemRole === 'option' || props.itemRole === 'listitem');

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

    onMounted(() => {
        if (props.role === 'listbox' && !props.ariaLabel && !props.ariaLabelledby) console.warn('[MaxBaseVirtualScroller] O papel "listbox" exige um nome acessível via aria-label ou aria-labelledby.');

    });

    watchEffect(() => {
        if (!props.ariaActivedescendant || !parentRef.value) {
            validActivedescendant.value = null;
            return;
        }

        const activeId = props.ariaActivedescendant;
        nextTick(() => {
            if (parentRef.value) {
                const element = parentRef.value.querySelector(`#${CSS.escape(activeId)}`);
                validActivedescendant.value = element ? activeId : null;
            } else validActivedescendant.value = null;

        });
    });

    defineExpose({ scrollToIndex: (i: number) => virtualizer.value.scrollToIndex(i) });
</script>

<style lang="scss" scoped>
    .max-base-virtual-scroller {
        overflow: auto;
    }
</style>
