import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxChart from '../../src/components/MaxChart.vue';

// happy-dom não implementa a API de canvas 2d usada pelo chart.js, então mockamos
// `chart.js/auto` diretamente (import dinâmico dentro do componente).
const destroyMock = vi.fn();
const updateMock = vi.fn();
const getElementsAtEventForModeMock = vi.fn(() => []);
const toBase64ImageMock = vi.fn(() => 'data:image/png;base64,fake');

class FakeChart {
    destroy = destroyMock;
    update = updateMock;
    getElementsAtEventForMode = getElementsAtEventForModeMock;
    toBase64Image = toBase64ImageMock;

    constructor(public canvas: any, public config: any) {}
}

vi.mock('chart.js/auto', () => ({
    default: FakeChart
}));

function mountChart(props: Record<string, any> = {}) {
    return mount(MaxChart, {
        props: { data: { labels: ['a', 'b'], datasets: [{ data: [1, 2] }] }, ...props }
    });
}

describe('MaxChart', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('cria a instância do chart.js ao montar quando data é informado', async () => {
        const wrapper = mountChart();
        await flushPromises();

        expect(wrapper.vm.getChart()).toBeInstanceOf(FakeChart);
    });

    it('não cria instância quando data é null', async () => {
        const wrapper = mountChart({ data: null });
        await flushPromises();

        expect(wrapper.vm.getChart()).toBeNull();
    });

    it('emite loaded com a instância do chart após montar', async () => {
        const wrapper = mountChart();
        await flushPromises();

        expect(wrapper.emitted('loaded')).toBeTruthy();
        expect(wrapper.emitted('loaded')![0][0]).toBeInstanceOf(FakeChart);
    });

    it('passa o type e as opções base para a config do chart.js', async () => {
        const wrapper = mountChart({ type: 'bar', options: { plugins: { legend: { display: false } } } });
        await flushPromises();

        const chart = wrapper.vm.getChart() as unknown as FakeChart;
        expect(chart.config.type).toBe('bar');
        expect(chart.config.options.maintainAspectRatio).toBe(false);
        expect(chart.config.options.plugins.legend.display).toBe(false);
    });

    it('recria a instância (destroy + novo Chart) quando os dados mudam', async () => {
        const wrapper = mountChart();
        await flushPromises();

        await wrapper.setProps({ data: { labels: ['x'], datasets: [{ data: [9] }] } });
        await flushPromises();

        expect(destroyMock).toHaveBeenCalled();
        expect(wrapper.vm.getChart()).toBeInstanceOf(FakeChart);
    });

    it('destrói a instância ao desmontar', async () => {
        const wrapper = mountChart();
        await flushPromises();

        wrapper.unmount();

        expect(destroyMock).toHaveBeenCalled();
    });

    it('refresh() chama update() na instância do chart', async () => {
        const wrapper = mountChart();
        await flushPromises();

        wrapper.vm.refresh();

        expect(updateMock).toHaveBeenCalled();
    });

    it('toBase64Image() delega para a instância do chart', async () => {
        const wrapper = mountChart();
        await flushPromises();

        expect(wrapper.vm.toBase64Image()).toBe('data:image/png;base64,fake');
    });
});
