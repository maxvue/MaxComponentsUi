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

    it('limita a janela quando o scrollTop excede a altura do conteudo', () => {
        const items = ref(makeItems(20));
        const vl = useVirtualList(items, { itemHeight: ref(50), enabled: ref(true) });

        vl.setViewport(5000, 500); // scrollTop muito alem do fim da lista

        expect(vl.offsetY.value).toBeLessThanOrEqual(vl.totalHeight.value);
        expect(vl.visibleItems.value.length).toBeGreaterThan(0);

        const last = vl.visibleItems.value[vl.visibleItems.value.length - 1];
        expect(last.index).toBe(19);
    });

    it('expõe endIndex e atualiza conforme o scroll', () => {
        const items = ref(makeItems(100));
        const vl = useVirtualList(items, { itemHeight: 40, enabled: true, overscan: 2 });

        vl.setViewport(0, 400); // 10 visiveis + 2 overscan
        expect(vl.startIndex.value).toBe(0);
        expect(vl.endIndex.value).toBe(12);

        vl.setViewport(800, 400); // offset 20 itens
        expect(vl.startIndex.value).toBe(18); // 20 - 2
        expect(vl.endIndex.value).toBe(32); // 20 + 10 + 2
    });

    it('rola deterministicamente com scrollToIndex', () => {
        const items = ref(makeItems(100));
        const vl = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: 0 });

        vl.setViewport(0, 500); // 10 itens visiveis (0 a 9)

        // Item 25 esta abaixo da janela: deve rolar ate coloca-lo visivel no fim da viewport
        const targetScrollEnd = vl.scrollToIndex(25, 'end');
        expect(targetScrollEnd).toBe(26 * 50 - 500); // 1300 - 500 = 800

        // Com align 'start', coloca no topo
        const targetScrollStart = vl.scrollToIndex(25, 'start');
        expect(targetScrollStart).toBe(25 * 50); // 1250

        // Com align 'auto', rolando para um item que ja esta visivel nao altera o scroll
        vl.setViewport(1250, 500);
        const unchangedScroll = vl.scrollToIndex(25, 'auto');
        expect(unchangedScroll).toBe(1250);

        // Clampa ao limite da lista
        const clampedScroll = vl.scrollToIndex(200);
        expect(clampedScroll).toBeLessThanOrEqual(vl.totalHeight.value);
    });

    it('normaliza overscan: default 5, 0, valores negativos, frações, NaN, infinitos e tipos inválidos', () => {
        const items = ref(makeItems(1000));

        // Default ausente -> 5
        const vlDefault = useVirtualList(items, { itemHeight: 50, enabled: true });
        vlDefault.setViewport(5000, 500); // index 100
        expect(vlDefault.startIndex.value).toBe(95);
        expect(vlDefault.endIndex.value).toBe(115);

        // 0 é válido
        const vlZero = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: 0 });
        vlZero.setViewport(5000, 500);
        expect(vlZero.startIndex.value).toBe(100);
        expect(vlZero.endIndex.value).toBe(110);

        // 20 itens por lado
        const vlTwenty = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: 20 });
        vlTwenty.setViewport(5000, 500);
        expect(vlTwenty.startIndex.value).toBe(80);
        expect(vlTwenty.endIndex.value).toBe(130);

        // Negativo -> 0
        const vlNegative = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: -2 });
        vlNegative.setViewport(5000, 500);
        expect(vlNegative.startIndex.value).toBe(100);
        expect(vlNegative.endIndex.value).toBe(110);

        // Fração finita -> piso limitado a 0 (2.9 -> 2)
        const vlFraction = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: 2.9 });
        vlFraction.setViewport(5000, 500);
        expect(vlFraction.startIndex.value).toBe(98);
        expect(vlFraction.endIndex.value).toBe(112);

        // NaN -> 5
        const vlNaN = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: Number.NaN });
        vlNaN.setViewport(5000, 500);
        expect(vlNaN.startIndex.value).toBe(95);
        expect(vlNaN.endIndex.value).toBe(115);

        // Infinity -> 5
        const vlInf = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: Number.POSITIVE_INFINITY });
        vlInf.setViewport(5000, 500);
        expect(vlInf.startIndex.value).toBe(95);
        expect(vlInf.endIndex.value).toBe(115);

        // -Infinity -> 5
        const vlNegInf = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: Number.NEGATIVE_INFINITY });
        vlNegInf.setViewport(5000, 500);
        expect(vlNegInf.startIndex.value).toBe(95);
        expect(vlNegInf.endIndex.value).toBe(115);

        // Tipo não numérico em runtime -> 5
        const vlInvalid = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: '10' as any });
        vlInvalid.setViewport(5000, 500);
        expect(vlInvalid.startIndex.value).toBe(95);
        expect(vlInvalid.endIndex.value).toBe(115);
    });

    it('reage dinamicamente a mudanças no overscan via ref/computed sem novo setViewport', () => {
        const items = ref(makeItems(1000));
        const overscan = ref<number | undefined>(5);
        const vl = useVirtualList(items, { itemHeight: 50, enabled: true, overscan });

        vl.setViewport(5000, 500); // 100 a 110 visíveis
        expect(vl.startIndex.value).toBe(95);
        expect(vl.endIndex.value).toBe(115);
        expect(vl.offsetY.value).toBe(4750);
        expect(vl.totalHeight.value).toBe(50000);

        // Muda para 20
        overscan.value = 20;
        expect(vl.startIndex.value).toBe(80);
        expect(vl.endIndex.value).toBe(130);
        expect(vl.offsetY.value).toBe(4000);
        expect(vl.totalHeight.value).toBe(50000);

        // Muda para 0
        overscan.value = 0;
        expect(vl.startIndex.value).toBe(100);
        expect(vl.endIndex.value).toBe(110);
        expect(vl.offsetY.value).toBe(5000);
        expect(vl.totalHeight.value).toBe(50000);
    });

    it('cobre última linha parcialmente visível em scroll desalinhado (R4)', () => {
        const items = ref(makeItems(1000));

        // scrollTop=25px, viewport=500px, itemHeight=50px, overscan=0
        // Item 0 (0..50) está parcialmente visível (restam 25px dele).
        // Itens 1..9 (50..500) totalmente visíveis.
        // Item 10 (500..550) está parcialmente visível (25px dele na parte inferior: 25+500=525).
        // Totalizando 11 linhas com qualquer porção visível -> índices 0 a 10 (endIndex = 11).
        const vlZero = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: 0 });
        vlZero.setViewport(25, 500);

        expect(vlZero.startIndex.value).toBe(0);
        expect(vlZero.endIndex.value).toBe(11);
        expect(vlZero.visibleItems.value).toHaveLength(11);
        expect(vlZero.visibleItems.value[0].index).toBe(0);
        expect(vlZero.visibleItems.value[10].index).toBe(10);

        // Com overscan 5: 11 linhas visíveis + 5 overscan abaixo = 16 linhas (índices 0 a 15)
        const vlFive = useVirtualList(items, { itemHeight: 50, enabled: true, overscan: 5 });
        vlFive.setViewport(25, 500);

        expect(vlFive.startIndex.value).toBe(0);
        expect(vlFive.endIndex.value).toBe(16);
        expect(vlFive.visibleItems.value).toHaveLength(16);

        // Em scroll desalinhado no meio (scrollTop=5025) com buffer 0:
        // Math.floor(5025/50) = 100.
        // Math.ceil((5025+500)/50) = Math.ceil(5525/50) = 111.
        // Janela: [100, 111) -> 11 itens.
        vlZero.setViewport(5025, 500);
        expect(vlZero.startIndex.value).toBe(100);
        expect(vlZero.endIndex.value).toBe(111);
        expect(vlZero.offsetY.value).toBe(5000);
    });

    it('mantém extremos consistentes: lista vazia, curta e buffer maior que a lista', () => {
        const emptyItems = ref<any[]>([]);
        const vlEmpty = useVirtualList(emptyItems, { itemHeight: 50, enabled: true, overscan: 10 });
        vlEmpty.setViewport(100, 500);
        expect(vlEmpty.startIndex.value).toBe(0);
        expect(vlEmpty.endIndex.value).toBe(0);
        expect(vlEmpty.visibleItems.value).toHaveLength(0);

        const shortItems = ref(makeItems(3));
        const vlShort = useVirtualList(shortItems, { itemHeight: 50, enabled: true, overscan: 50 });
        vlShort.setViewport(0, 500);
        expect(vlShort.startIndex.value).toBe(0);
        expect(vlShort.endIndex.value).toBe(3);
        expect(vlShort.visibleItems.value).toHaveLength(3);
    });
});
