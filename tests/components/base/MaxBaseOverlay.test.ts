import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import MaxBaseOverlay from '../../../src/components/base/MaxBaseOverlay.vue';

async function settle() {
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
    await nextTick();
    await nextTick();
}

function mockRect(el: HTMLElement, rect: Partial<DOMRect>) {
    el.getBoundingClientRect = () => ({
        top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0,
        toJSON: () => ({}),
        ...rect
    } as DOMRect);
}

function makeTarget(rect: Partial<DOMRect> = {}) {
    const target = document.createElement('button');
    document.body.appendChild(target);
    mockRect(target, { top: 100, left: 100, right: 200, bottom: 120, width: 100, height: 20, ...rect });
    return target;
}

describe('MaxBaseOverlay', () => {
    let target: HTMLElement;
    let wrapper: VueWrapper | null;

    beforeEach(() => {
        target = makeTarget();
        wrapper = null;
    });

    afterEach(() => {
        wrapper?.unmount();
        target.remove();
        document.querySelectorAll('.max-base-overlay').forEach((el) => el.remove());
    });

    it('nao renderiza o painel quando visible e false', () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: false, target } });
        expect(document.querySelector('.max-base-overlay')).toBeNull();
    });

    it('teleporta o painel para document.body quando visible e true', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target } });
        await settle();
        const panel = document.querySelector('.max-base-overlay');
        expect(panel).not.toBeNull();
        expect(panel?.parentElement).toBe(document.body);
    });

    it('emite before-show e show ao abrir', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: false, target } });
        await wrapper.setProps({ visible: true });
        await settle();
        expect(wrapper.emitted('before-show')).toBeTruthy();
        expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('emite before-hide e hide ao fechar', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target } });
        await settle();
        await wrapper.setProps({ visible: false });
        expect(wrapper.emitted('before-hide')).toBeTruthy();
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('clique fora fecha com dismissable true e emite update:visible false', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, dismissable: true } });
        await settle();

        const outside = document.createElement('div');
        document.body.appendChild(outside);
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeTruthy();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
        outside.remove();
    });

    it('clique dentro do painel nao fecha', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, dismissable: true } });
        await settle();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('clique no gatilho nao fecha via click-outside', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, dismissable: true } });
        await settle();

        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('Escape fecha o overlay', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, closeOnEscape: true } });
        await settle();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        expect(wrapper.emitted('update:visible')).toBeTruthy();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('closeOnEscape false: ESC nao fecha', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, closeOnEscape: false } });
        await settle();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('matchTargetWidth aplica min-width igual a largura do gatilho', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, matchTargetWidth: true } });
        await settle();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.minWidth).toBe('100px');
    });

    it('remove todos os listeners ao desmontar (simetria add/remove)', async () => {
        const addSpy = vi.spyOn(document, 'addEventListener');
        const removeSpy = vi.spyOn(document, 'removeEventListener');

        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target } });
        await settle();

        wrapper.unmount();
        wrapper = null;

        const addedTypes = addSpy.mock.calls.map((c) => c[0]);
        const removedTypes = removeSpy.mock.calls.map((c) => c[0]);

        for (const type of new Set(addedTypes)) expect(removedTypes).toContain(type);


        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it('nao emite classes ou dependencias do PrimeVue', () => {
        const html = require('fs').readFileSync(
            require('path').resolve(__dirname, '../../../src/components/base/MaxBaseOverlay.vue'),
            'utf-8'
        );
        expect(html).not.toContain('primevue');
        expect(html).not.toContain('@primeuix');
        expect(/\.p-[a-z-]/.test(html)).toBe(false);
    });
});
