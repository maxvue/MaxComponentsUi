import { describe, it, expect } from 'vitest';
import { ref, computed } from 'vue';
import { useVirtualList } from '../../src/composables/useVirtualList';

function makeItems(n: number) {
    return Array.from({ length: n }, (_, i) => ({ id: i, label: `Item ${i}` }));
}

describe('useVirtualList', () => {
    it('retorna todos os itens quando desabilitado', () => {
        const items = ref(makeItems(1000));
        const vl = useVirtualList(items, { itemHeight: ref(44), enabled: ref(false) });

        vl.setViewport(0, 400);

        expect(vl.visibleItems.value).toHaveLength(1000);
        expect(vl.offsetY.value).toBe(0);
    });

    it('calcula a altura total pela quantidade de itens', () => {
        const items = ref(makeItems(100));
        const vl = useVirtualList(items, { itemHeight: ref(44), enabled: ref(true) });

        expect(vl.totalHeight.value).toBe(4400);
    });

    it('retorna apenas a janela visivel mais o overscan', () => {
        const items = ref(makeItems(1000));
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true), overscan: 5 });

        // viewport de 500px = 10 itens visiveis, no topo da lista
        vl.setViewport(0, 500);

        // 10 visiveis + 5 de overscan abaixo (nao ha itens acima do indice 0)
        expect(vl.startIndex.value).toBe(0);
        expect(vl.visibleItems.value).toHaveLength(15);
        expect(vl.visibleItems.value[0].index).toBe(0);
    });

    it('desloca a janela conforme o scrollTop', () => {
        const items = ref(makeItems(1000));
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true), overscan: 5 });

        // rolou 100 itens para baixo
        vl.setViewport(5000, 500);

        expect(vl.startIndex.value).toBe(95); // 100 - overscan
        expect(vl.offsetY.value).toBe(4750); // 95 * 50
        expect(vl.visibleItems.value[0].index).toBe(95);
        expect(vl.visibleItems.value).toHaveLength(20); // 5 acima + 10 visiveis + 5 abaixo
    });

    it('nao ultrapassa o fim da lista', () => {
        const items = ref(makeItems(20));
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true), overscan: 5 });

        vl.setViewport(900, 500); // alem do fim

        const last = vl.visibleItems.value[vl.visibleItems.value.length - 1];
        expect(last.index).toBe(19);
    });

    it('lida com lista menor que o viewport', () => {
        const items = ref(makeItems(3));
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true) });

        vl.setViewport(0, 500);

        expect(vl.visibleItems.value).toHaveLength(3);
        expect(vl.startIndex.value).toBe(0);
        expect(vl.offsetY.value).toBe(0);
    });

    it('lida com lista vazia', () => {
        const items = ref<any[]>([]);
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true) });

        vl.setViewport(0, 500);

        expect(vl.visibleItems.value).toHaveLength(0);
        expect(vl.totalHeight.value).toBe(0);
    });

    it('reage a mudanca de enabled sem recriar o composable', () => {
        const items = ref(makeItems(1000));
        const enabled = ref(true);
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: computed(() => enabled.value) });

        vl.setViewport(0, 500);
        const virtualizedCount = vl.visibleItems.value.length;

        enabled.value = false;

        expect(virtualizedCount).toBeLessThan(1000);
        expect(vl.visibleItems.value).toHaveLength(1000);
    });
});
