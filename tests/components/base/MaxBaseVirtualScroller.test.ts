import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import MaxBaseVirtualScroller from '../../../src/components/base/MaxBaseVirtualScroller.vue';

async function settle() {
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
    await nextTick();
}

function makeItems(count: number) {
    return Array.from({ length: count }, (_, i) => `item-${i}`);
}

// happy-dom nao faz layout: sem isto, clientHeight e getBoundingClientRect
// retornam 0 e o virtualizador nao consegue calcular quantos itens cabem na
// viewport, entao renderiza tudo (ou nada) — o oposto do que estamos testando.
function stubViewport(el: HTMLElement, height: number) {
    Object.defineProperty(el, 'clientHeight', { value: height, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
    el.getBoundingClientRect = () => ({
        top: 0, left: 0, right: 0, bottom: height, width: 300, height, x: 0, y: 0,
        toJSON: () => ({})
    } as DOMRect);
}

describe('MaxBaseVirtualScroller', () => {
    let wrapper: VueWrapper | null;

    beforeEach(() => {
        wrapper = null;
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('renderiza o container com o style informado', () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(5), itemSize: 40, style: { height: '200px' } }
        });
        const root = wrapper.find('.max-base-virtual-scroller');
        expect(root.attributes('style')).toContain('height: 200px');
    });

    it('com 1000 itens, renderiza muito menos que 1000 nos (virtualizacao real)', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(1000), itemSize: 40, style: { height: '200px' } },
            slots: { item: '<div class="row-item">{{ params.item }}</div>' }
        });
        stubViewport(wrapper.element as HTMLElement, 200);
        await settle();

        const rendered = wrapper.findAll('.row-item').length;
        expect(rendered).toBeGreaterThan(0);
        expect(rendered).toBeLessThan(100);
    });

    it('o slot item recebe o item e os options corretos', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(10), itemSize: 40, style: { height: '400px' } },
            slots: {
                item: `<template #item="{ item, options }">
                    <div class="row-item" :data-index="options.index" :data-count="options.count">{{ item }}</div>
                </template>`
            }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        const first = wrapper.find('.row-item');
        expect(first.exists()).toBe(true);
        expect(first.text()).toBe('item-0');
        expect(first.attributes('data-count')).toBe('10');
    });

    it('options.first e true apenas no indice 0', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(10), itemSize: 40, style: { height: '400px' } },
            slots: {
                item: `<template #item="{ options }">
                    <div class="row-item" :data-first="options.first">{{ options.index }}</div>
                </template>`
            }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        const rows = wrapper.findAll('.row-item');
        const firstFlags = rows.map((r) => ({ index: Number(r.text()), first: r.attributes('data-first') }));
        const trueOnes = firstFlags.filter((f) => f.first === 'true');
        expect(trueOnes).toHaveLength(1);
        expect(trueOnes[0].index).toBe(0);
    });

    it('lista vazia nao quebra', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: [], itemSize: 40, style: { height: '200px' } },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 200);
        await settle();

        expect(wrapper.findAll('.row-item')).toHaveLength(0);
    });

    it('mudar items reativamente atualiza a renderizacao', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(3), itemSize: 40, style: { height: '400px' } },
            slots: {
                item: '<template #item="{ item }"><div class="row-item">{{ item }}</div></template>'
            }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        expect(wrapper.findAll('.row-item')).toHaveLength(3);

        await wrapper.setProps({ items: makeItems(2) });
        await settle();

        expect(wrapper.findAll('.row-item')).toHaveLength(2);
    });

    it('expoe scrollToIndex chamavel', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(100), itemSize: 40, style: { height: '400px' } },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        expect(typeof wrapper.vm.scrollToIndex).toBe('function');
        expect(() => wrapper.vm.scrollToIndex(50)).not.toThrow();
    });

    it('aplica role="listbox" no container e role="option" com aria-setsize/aria-posinset em cada item', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(5), itemSize: 40, style: { height: '400px' } },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        expect(wrapper.find('.max-base-virtual-scroller').attributes('role')).toBe('listbox');

        const options = wrapper.findAll('[role="option"]');
        expect(options.length).toBeGreaterThan(0);
        expect(options[0].attributes('aria-setsize')).toBe('5');
        expect(options[0].attributes('aria-posinset')).toBe('1');
    });

    it('emite scroll ao rolar o container', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(100), itemSize: 40, style: { height: '400px' } },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        await wrapper.find('.max-base-virtual-scroller').trigger('scroll');
        expect(wrapper.emitted('scroll')).toBeTruthy();
    });

    it('nao emite classes ou dependencias do PrimeVue', () => {
        const html = require('fs').readFileSync(
            require('path').resolve(__dirname, '../../../src/components/base/MaxBaseVirtualScroller.vue'),
            'utf-8'
        );
        expect(html).not.toContain('primevue');
        expect(html).not.toContain('@primeuix');
        expect(/\.p-[a-z-]/.test(html)).toBe(false);
    });
});
