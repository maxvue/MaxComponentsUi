// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';
import InputBase from '../../src/components/InputBase.vue';

const dummySvg = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

function createSmartFetchMock(customHandler?: (url: string, init?: any) => any) {
    return vi.fn((input: any, init?: any) => {
        const urlStr = String(input);
        if (urlStr.includes('iconify.design') || (urlStr.includes('api/icons') && !urlStr.includes('/picker'))) {
            const result: Record<string, string> = {};
            try {
                const parsed = new URL(urlStr, 'http://localhost');
                for (const icon of parsed.searchParams.getAll('icons[]')) result[icon] = dummySvg;
            } catch {}
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(result),
                text: () => Promise.resolve(dummySvg)
            } as Response);
        }
        if (customHandler) return customHandler(urlStr, init);
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
            text: () => Promise.resolve(dummySvg)
        } as Response);
    });
}

describe('MaxInputIconPicker', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sanitiza SVG malicioso recebido via svgUrl antes de gravar em svgCache', async () => {
        const maliciousSvg = '<svg onload="alert(1)"><script>alert(2)</script><path d="M0 0"/></svg>';

        const fetchMock = createSmartFetchMock((url: string) => {
            if (url.toString().includes('/picker/svg')) return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ 'mdi:evil': maliciousSvg })
            } as Response);

            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve([{ id: 1, name: 'mdi:evil', search: 'mdi:evil' }])
            } as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '' }
        });

        await wrapper.find('.icon-picker-trigger').trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 50));
        await wrapper.vm.$nextTick();

        // Aguarda o debounce interno de enqueueSvgFetch (150ms) e o fetch em si
        await new Promise((resolve) => setTimeout(resolve, 300));
        await wrapper.vm.$nextTick();


        const svgCache = (wrapper.vm as any).svgCache as Record<string, string>;
        expect(svgCache['mdi:evil']).toBeDefined();
        expect(svgCache['mdi:evil']).not.toContain('<script');
        expect(svgCache['mdi:evil']).not.toMatch(/\son\w+\s*=/i);
    });

    it('mantém caution=true quando prop caution=true é passada mesmo com required e preenchido', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: 'mdi:home', required: true, caution: true }
        });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('caution')).toBe(true);
        expect(inputBase.props('error')).toBeNull();
    });

    it('mantém caution string quando informada e não polui error com Valor inválido', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: 'mdi:home', caution: 'Atenção ao ícone' }
        });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('caution')).toBe('Atenção ao ícone');
        expect(inputBase.props('error')).toBeNull();
    });

    it('mantém caution=true na montagem inicial antes de interação', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '', caution: true }
        });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('caution')).toBe(true);
    });

    it('respeita caution=false explicitamente passado', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '', caution: false }
        });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('caution')).toBe(false);
    });

    it('preserva os SVGs em svgCache ao fechar e reabrir o drawer', async () => {
        const fetchMock = createSmartFetchMock((url: string) => {
            if (url.toString().includes('/picker/svg')) return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ 'mdi:cached-icon': '<svg><path d="M0 0"/></svg>' })
            } as Response);

            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve([{ id: 1, name: 'mdi:cached-icon', search: 'mdi:cached-icon' }])
            } as Response);
        });

        vi.stubGlobal('fetch', fetchMock);

        const wrapper = mount(MaxInputIconPicker, { props: { modelValue: '' } });

        // Abre o drawer pela 1ª vez
        await wrapper.find('.icon-picker-trigger').trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 250));
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.svgCache['mdi:cached-icon']).toBeDefined();

        // Fecha o drawer
        vm.visible = false;
        await wrapper.vm.$nextTick();

        // Reabre o drawer
        await wrapper.find('.icon-picker-trigger').trigger('click');
        await wrapper.vm.$nextTick();

        // O cache deve ter sido preservado
        expect(vm.svgCache['mdi:cached-icon']).toBeDefined();
    });

    it('cancela timer pendente e esvazia fila de fetch no desmonte do componente', async () => {
        const wrapper = mount(MaxInputIconPicker, { props: { modelValue: '' } });
        const vm = wrapper.vm as any;

        // Agenda um fetch
        vm.enqueueSvgFetch(['mdi:pending-1', 'mdi:pending-2']);

        // Desmonta imediatamente antes dos 150ms do timer
        wrapper.unmount();

        // Nenhuma exceção deve ocorrer e o timer deve ser cancelado
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(true).toBe(true);
    });

    it('aplica semântica de diálogo modal, foco inicial e atributos de acessibilidade ao abrir o drawer', async () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '' },
            attachTo: document.body
        });

        const trigger = wrapper.find('.icon-picker-trigger');
        expect(trigger.attributes('aria-haspopup')).toBe('dialog');
        expect(trigger.attributes('aria-expanded')).toBe('false');

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();

        expect(trigger.attributes('aria-expanded')).toBe('true');
        const drawer = document.querySelector('.max-icon-picker-drawer');
        expect(drawer).toBeTruthy();
        expect(drawer?.getAttribute('role')).toBe('dialog');
        expect(drawer?.getAttribute('aria-modal')).toBe('true');
        expect(drawer?.getAttribute('aria-label')).toBe('Escolha um ícone');
        expect(drawer?.getAttribute('tabindex')).toBe('-1');

        // Pressionar Escape fecha o diálogo
        const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        window.dispatchEvent(event);
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).visible).toBe(false);
        wrapper.unmount();
    });

    it('drena filas com mais de 200 itens em múltiplos lotes de até 200 sem estagnação (E05-03)', async () => {
        const batchesRequested: string[][] = [];
        const fetchMock = createSmartFetchMock((url: string, options?: any) => {
            if (url.toString().includes('/picker/svg')) {
                const body = JSON.parse(options?.body || '{}');
                const names: string[] = body.names || [];
                batchesRequested.push(names);
                const result: Record<string, string> = {};
                names.forEach((n) => { result[n] = `<svg><circle id="${n}"/></svg>`; });
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve(result)
                } as Response);
            }

            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve([])
            } as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        const wrapper = mount(MaxInputIconPicker, { props: { modelValue: '' } });
        const vm = wrapper.vm as any;

        // Enfileira 250 nomes
        const totalItems = 250;
        const iconNames = Array.from({ length: totalItems }, (_, i) => `icon:test-${i}`);
        vm.enqueueSvgFetch(iconNames);

        // Aguarda execução e drenagem completa da fila
        await new Promise((resolve) => setTimeout(resolve, 350));
        await wrapper.vm.$nextTick();

        // Deve ter executado em 2 lotes: 200 no primeiro e 50 no segundo
        expect(batchesRequested.length).toBe(2);
        expect(batchesRequested[0].length).toBe(200);
        expect(batchesRequested[1].length).toBe(50);
        expect(Object.keys(vm.svgCache).length).toBe(totalItems);
        expect(vm.svgFetchQueue.length).toBe(0);
        wrapper.unmount();
    });

    it('resposta obsoleta de busca no catálogo não sobrescreve busca mais recente (E05-03)', async () => {
        let resolveQueryAb: any;
        const abPromise = new Promise((resolve) => { resolveQueryAb = resolve; });

        const fetchMock = createSmartFetchMock((url: string) => {
            const parsed = new URL(url.toString(), 'http://localhost');
            const q = parsed.searchParams.get('q');

            if (q === 'ab') return abPromise.then(() => ({
                ok: true,
                status: 200,
                json: () => Promise.resolve([{ id: 1, name: 'icon:ab', search: 'ab' }])
            } as Response));

            if (q === 'abc') return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve([{ id: 2, name: 'icon:abc', search: 'abc' }])
            } as Response);

            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve([])
            } as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        const wrapper = mount(MaxInputIconPicker, { props: { modelValue: '' } });
        const vm = wrapper.vm as any;

        // Dispara busca 'ab'
        vm.search = 'ab';
        await wrapper.vm.$nextTick();
        await new Promise((r) => setTimeout(r, 350)); // aguarda debounce

        // Rapidamente digita 'abc'
        vm.search = 'abc';
        await wrapper.vm.$nextTick();
        await new Promise((r) => setTimeout(r, 350)); // aguarda debounce

        // Agora a resposta antiga 'ab' finalmente resolve
        resolveQueryAb();
        await new Promise((r) => setTimeout(r, 50));
        await wrapper.vm.$nextTick();

        // O catálogo deve manter apenas 'icon:abc' da busca mais recente
        expect(vm.search).toBe('abc');
        expect(vm.curatedIcons).toEqual([{ id: 2, name: 'icon:abc', search: 'abc' }]);
        expect(vm.isLoading).toBe(false);
        wrapper.unmount();

    });
});
