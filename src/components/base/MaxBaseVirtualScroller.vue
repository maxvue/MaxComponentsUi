<template>
    <div
        ref="parentRef"
        class="max-virtual-scroller p-virtualscroller"
        :style="{ height: scrollHeight, overflow: 'auto' }"
        :role="role"
        :aria-label="ariaLabel"
        @scroll="onScroll"
    >
        <div class="p-virtualscroller-content" :style="{ height: `${totalSize}px`, width: '100%', position: 'relative' }">
            <div
                v-for="row in virtualRows"
                :key="row.index"
                class="p-virtualscroller-item"
                :role="itemRole"
                :aria-setsize="items.length"
                :aria-posinset="row.index + 1"
                :style="{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: `${row.size}px`,
                    transform: `translateY(${row.start}px)`
                }"
            >
                <slot
                    name="item"
                    :item="items[row.index]"
                    :options="optionsFor(row.index)"
                ></slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    /**
     * Lista virtualizada. Substitui o `VirtualScroller` do PrimeVue.
     *
     * Virtualiza apenas o eixo VERTICAL com itens de altura fixa — é o que o único
     * consumidor (MaxInputIconPicker) usa: ele já pré-agrupa os ícones em linhas de 8
     * colunas e passa as linhas como `items`. Grade 2D, altura variável, `lazy` e
     * `showLoader` do PrimeVue não são replicados por não terem consumidor.
     *
     * A virtualização em si vem do `@tanstack/vue-virtual` (já em dependencies):
     * medição, scroll anchoring e recomputação são sutis demais para reimplementar.
     */
    import { computed, nextTick, ref, watch } from 'vue';
    import { useVirtualizer } from '@tanstack/vue-virtual';

    const props = withDefaults(
        defineProps<{
            /** Coleção completa; só uma fatia é renderizada */
            items?: unknown[];
            /** Altura fixa de cada item, em px */
            itemSize?: number;
            /** Altura do container rolável */
            scrollHeight?: string;
            /** Itens extras renderizados fora da viewport (overscan) */
            numToleratedItems?: number;
            /** Papel ARIA do container */
            role?: string;
            /** Papel ARIA de cada item renderizado */
            itemRole?: string;
            /** Rótulo acessível do container */
            ariaLabel?: string;
        }>(),
        {
            items: () => [],
            itemSize: 40,
            scrollHeight: '200px',
            numToleratedItems: 5,
            role: undefined,
            itemRole: undefined,
            ariaLabel: undefined
        }
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

    const virtualRows = computed(() => virtualizer.value.getVirtualItems());
    const totalSize = computed(() => virtualizer.value.getTotalSize());

    /** Mesma forma de `options` do slot `item` do PrimeVue. */
    const optionsFor = (index: number) => ({
        index,
        count: props.items.length,
        first: index === 0,
        last: index === props.items.length - 1,
        even: index % 2 === 0,
        odd: index % 2 !== 0
    });

    let lastFirst = -1;
    let lastLast = -1;

    // Trocar a coleção invalida a janela memorizada: sem isto, uma janela numericamente
    // igual à anterior sobre itens completamente diferentes seria engolida pela dedup.
    watch(
        () => props.items,
        () => {
            lastFirst = -1;
            lastLast = -1;
        }
    );

    /**
     * O consumidor lê `event.target.scrollTop`/`clientHeight`, então o evento precisa
     * vir do elemento que de fato rola — daí o listener estar no container, e não num
     * wrapper interno.
     *
     * `scroll-index-change` reporta a faixa RENDERIZADA (visível ± tolerância), que é
     * a semântica do PrimeVue e a única que não mente sobre o que está montado. Por
     * isso o payload sai do range do próprio virtualizer, e não de aritmética
     * paralela sobre o scrollTop — que divergiria do DOM e erraria a tolerância.
     *
     * A leitura é adiada com `nextTick`: dentro do handler síncrono o virtualizer
     * ainda não recomputou o range para a nova posição, e emitir ali daria sempre a
     * janela ANTERIOR ao scroll.
     */
    const onScroll = async (event: Event) => {
        emit('scroll', event);

        await nextTick();

        const rows = virtualRows.value;

        // Lista vazia (ou ainda sem medição) não tem janela a reportar.
        const first = rows[0]?.index;
        const last = rows[rows.length - 1]?.index;
        if (first === undefined || last === undefined) return;

        if (first === lastFirst && last === lastLast) return;

        lastFirst = first;
        lastLast = last;
        emit('scroll-index-change', { first, last });
    };

    defineExpose({
        scrollToIndex: (index: number) => virtualizer.value.scrollToIndex(index),
        getVirtualItems: () => virtualizer.value.getVirtualItems()
    });
</script>

<style lang="scss">
.max-virtual-scroller {
    scrollbar-width: thin;

    &::-webkit-scrollbar {
        width: 3px;
        height: 3px;
    }
}
</style>
