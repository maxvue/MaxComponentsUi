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

function getPanel() {
    return document.querySelector('.max-base-overlay') as HTMLElement;
}

describe('MaxBaseOverlay', () => {
    let target: HTMLElement;
    let wrapper: VueWrapper | null;
    let origInnerHeight: number;
    let origInnerWidth: number;

    beforeEach(() => {
        target = makeTarget();
        wrapper = null;
        origInnerHeight = window.innerHeight;
        origInnerWidth = window.innerWidth;
    });

    afterEach(() => {
        wrapper?.unmount();
        target.remove();
        document.querySelectorAll('.max-base-overlay').forEach((el) => el.remove());
        Object.defineProperty(window, 'innerHeight', { value: origInnerHeight, configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, configurable: true });
    });

    it('nao renderiza o painel quando visible e false', () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: false, target } });
        expect(document.querySelector('.max-base-overlay')).toBeNull();
    });

    it('teleporta o painel para document.body quando visible e true', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target } });
        await settle();
        const panel = getPanel();
        expect(panel).not.toBeNull();
        expect(document.body.contains(panel)).toBe(true);
        expect(wrapper.find('.max-base-overlay').exists()).toBe(false);
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

        const panel = getPanel();
        panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('clique no gatilho nao fecha via click-outside', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, dismissable: true } });
        await settle();

        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('Escape fecha o overlay e devolve o foco ao gatilho', async () => {
        target.focus();
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, closeOnEscape: true } });
        await settle();

        // simula o ciclo controlado: o pai reage a update:visible fechando de fato
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(wrapper.emitted('update:visible')).toBeTruthy();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);

        await wrapper.setProps({ visible: false });
        await settle();

        expect(document.activeElement).toBe(target);
    });

    it('closeOnEscape false: ESC nao fecha', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, closeOnEscape: false } });
        await settle();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('move o foco para o painel ao abrir (elemento focavel via tabindex)', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target } });
        await settle();

        const panel = getPanel();
        expect(panel.getAttribute('tabindex')).toBe('-1');
        expect(document.activeElement).toBe(panel);
    });

    it('matchTargetWidth aplica min-width igual a largura do gatilho', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target, matchTargetWidth: true } });
        await settle();

        const panel = getPanel();
        expect(panel.style.minWidth).toBe('100px');
    });

    it('flip vertical: abre acima quando nao ha espaco abaixo', async () => {
        Object.defineProperty(window, 'innerHeight', { value: 300, configurable: true });
        const t = makeTarget({ top: 250, bottom: 270, left: 50, right: 150, width: 100, height: 20 });

        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target: t, offset: 4 } });
        await settle();
        mockRect(getPanel(), { width: 120, height: 80 });
        // reposiciona manualmente disparando resize, ja que o rect do painel so fica disponivel apos o mock
        window.dispatchEvent(new Event('resize'));
        await settle();

        const panel = getPanel();
        // espaco abaixo (300-270=30) e menor que a altura do painel (80) e ha espaco suficiente acima (top=250 > 30)
        expect(panel.style.top).toBe(`${250 - 80 - 4}px`);
        t.remove();
    });

    it('flip vertical: abre abaixo quando ha espaco suficiente', async () => {
        Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
        const t = makeTarget({ top: 100, bottom: 120, left: 50, right: 150, width: 100, height: 20 });

        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target: t, offset: 4 } });
        await settle();
        mockRect(getPanel(), { width: 120, height: 80 });
        window.dispatchEvent(new Event('resize'));
        await settle();

        const panel = getPanel();
        expect(panel.style.top).toBe(`${120 + 4}px`);
        t.remove();
    });

    it('align right: alinha a borda direita do painel com a borda direita do gatilho', async () => {
        Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
        const t = makeTarget({ top: 100, bottom: 120, left: 400, right: 500, width: 100, height: 20 });

        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target: t, align: 'right' } });
        await settle();
        mockRect(getPanel(), { width: 150, height: 60 });
        window.dispatchEvent(new Event('resize'));
        await settle();

        const panel = getPanel();
        // esperado: left = t.right - p.width = 500 - 150 = 350
        expect(panel.style.left).toBe('350px');
        t.remove();
    });

    it('clamp horizontal: nao deixa o painel ultrapassar a borda direita da viewport', async () => {
        Object.defineProperty(window, 'innerWidth', { value: 300, configurable: true });
        const t = makeTarget({ top: 100, bottom: 120, left: 250, right: 290, width: 40, height: 20 });

        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target: t, align: 'left' } });
        await settle();
        mockRect(getPanel(), { width: 200, height: 60 });
        window.dispatchEvent(new Event('resize'));
        await settle();

        const panel = getPanel();
        // sem clamp: left = t.left = 250; painel de 200px estouraria a viewport de 300px
        // com clamp: left = min(250, 300 - 200 - 8) = 92
        expect(panel.style.left).toBe('92px');
        t.remove();
    });

    it('z-index cresce a cada reposicionamento/abertura', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target } });
        await settle();
        const firstZ = Number(getPanel().style.zIndex);

        window.dispatchEvent(new Event('resize'));
        await settle();
        const secondZ = Number(getPanel().style.zIndex);

        expect(secondZ).toBeGreaterThan(firstZ);
    });

    it('reposiciona ao redimensionar a janela (listener de resize ativo)', async () => {
        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target } });
        await settle();
        const before = getPanel().style.top;

        mockRect(target, { top: 500, left: 100, right: 200, bottom: 520, width: 100, height: 20 });
        window.dispatchEvent(new Event('resize'));
        await settle();

        const after = getPanel().style.top;
        expect(after).not.toBe(before);
    });

    it('remove todos os listeners ao desmontar, em document E em window (simetria por tipo+handler+capture)', async () => {
        const docAdd = vi.spyOn(document, 'addEventListener');
        const docRemove = vi.spyOn(document, 'removeEventListener');
        const winAdd = vi.spyOn(window, 'addEventListener');
        const winRemove = vi.spyOn(window, 'removeEventListener');

        wrapper = mount(MaxBaseOverlay, { props: { visible: true, target } });
        await settle();

        wrapper.unmount();
        wrapper = null;

        const keyOf = (call: any[]) => `${call[0]}|${String(call[1])}|${JSON.stringify(call[2] ?? false)}`;

        const docAdded = docAdd.mock.calls.map(keyOf);
        const docRemoved = docRemove.mock.calls.map(keyOf);
        const winAdded = winAdd.mock.calls.map(keyOf);
        const winRemoved = winRemove.mock.calls.map(keyOf);

        for (const key of docAdded) expect(docRemoved).toContain(key);
        for (const key of winAdded) expect(winRemoved).toContain(key);

        // garante que o listener de resize especificamente foi registrado e removido em window
        expect(winAdded.some((k) => k.startsWith('resize|'))).toBe(true);
        expect(winRemoved.some((k) => k.startsWith('resize|'))).toBe(true);

        docAdd.mockRestore();
        docRemove.mockRestore();
        winAdd.mockRestore();
        winRemove.mockRestore();
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
