import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxIcon from '../../src/components/MaxIcon.vue';
import { ref, nextTick } from 'vue';
import { useIconStore } from '../../src/stores/useIcon.Store';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        useElementHover: () => ref(true)
    };
});

function mountIcon(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxIcon, {
        props: { icon: 'mdi:home', ...props },
        attrs
    });
}

describe('MaxIcon', () => {
    let pinia: any;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (pinia) pinia._e.stop();
    });

    it('renderiza corretamente', () => {
        const wrapper = mountIcon();
        expect(wrapper.exists()).toBe(true);
    });

    it('aceita icon via prop icon', () => {
        const wrapper = mountIcon({ icon: 'mdi:check' });
        expect(wrapper.exists()).toBe(true);
    });

    it('aceita icon via prop i (alias)', () => {
        const wrapper = mountIcon({ i: 'mdi:close' });
        expect(wrapper.exists()).toBe(true);
    });

    it('não renderiza quando não tem icon nem i', () => {
        const wrapper = mount(MaxIcon, { props: {} });
        expect(wrapper.find('.max-icon-div').exists()).toBe(false);
    });

    it('aplica tamanho via prop size', () => {
        const wrapper = mountIcon({ size: '2rem' });
        const style = wrapper.find('.max-icon-div').attributes('style');

        expect(style).toBeDefined();
        expect(style).toContain('2rem');
    });

    // Defesa de última linha: o svg interno é width:100%, então um tamanho
    // inválido faz o ícone esticar até o contêiner pai em vez de encolher.
    it.each(['NaNpx', 'small', 'NaN', 'undefined'])('ignora tamanho invalido %s', (size) => {
        const wrapper = mountIcon({ size });
        const style = wrapper.find('.max-icon-div')?.attributes('style') ?? '';

        expect(style).not.toContain('NaN');
        expect(style).toContain('1rem');
    });

    it('aplica cor escura via dark', () => {
        const wrapper = mountIcon({ dark: 0.6 });
        const style = wrapper.find('.max-icon-div').attributes('style');

        expect(style).toBeDefined();
        expect(style).toContain('0.6');
        expect(style).toContain('0, 0, 0');
    });

    it('dark booleano escurece de forma perceptível em relação ao padrão', () => {
        const padrao = mountIcon({}).find('.max-icon-div').attributes('style');
        const escuro = mountIcon({ dark: true }).find('.max-icon-div').attributes('style');

        expect(padrao).toContain('rgba(0, 0, 0, 0.4)');
        expect(escuro).toContain('rgba(0, 0, 0, 0.6)');
    });

    it('aplica cor clara via light', () => {
        const wrapper = mountIcon({ light: 0.8 });
        const style = wrapper.find('.max-icon-div').attributes('style');

        expect(style).toBeDefined();
        expect(style).toContain('0.8');
        expect(style).toContain('255, 255, 255');
    });

    it('exibe sub-ícone checked quando checked=true', () => {
        const wrapper = mountIcon({ checked: true });
        expect(wrapper.find('.sub-icon.checked').exists()).toBe(true);
    });

    it('exibe sub-ícone plus quando plus=true', () => {
        const wrapper = mountIcon({ plus: true });
        expect(wrapper.find('.sub-icon.plus').exists()).toBe(true);
    });

    it('não exibe sub-ícones quando checked e plus são undefined', () => {
        const wrapper = mountIcon();
        expect(wrapper.find('.sub-icon').exists()).toBe(false);
    });

    it('aplica hover_color a partir de hover-* attrs', () => {
        const wrapper = mountIcon({}, { 'hover-red-500': '' });
        const style = wrapper.find('.max-icon-div')?.attributes('style') || '';
        expect(style).toContain('var(--red-500)');
    });

    it('aplica hover_color a partir de props.hoverColor', () => {
        const wrapper = mountIcon({ hoverColor: '#abcdef' });
        const style = wrapper.find('.max-icon-div')?.attributes('style') || '';
        expect(style).toContain('#abcdef');
    });

    it('aplica hover_color calculado automaticamente (getColorFromVar com rgba)', () => {
        const wrapper = mountIcon({ color: 'rgba(100, 100, 100, 0.5)' }, { pointer: '' });
        const style = wrapper.find('.max-icon-div')?.attributes('style') || '';
        expect(style.toUpperCase()).toContain('#646464B3');
    });

    it('aplica hover_color calculado automaticamente (getColorFromVar hex => darken)', () => {
        const wrapper = mountIcon({ color: '#ff0000' }, { pointer: '' });
        const style = wrapper.find('.max-icon-div')?.attributes('style') || '';
        expect(style).toContain('color');
    });

    it('não aplica efeito hover para ícones puramente estáticos', () => {
        const wrapper = mountIcon({ color: '#ff0000' });
        const style = wrapper.find('.max-icon-div')?.attributes('style') || '';
        expect(style).toContain('#ff0000');
    });

    it('solicita o ícone apenas na inicialização e não redispara getIcon quando o cache muda', async () => {
        const store = useIconStore();
        const getIconSpy = vi.spyOn(store, 'getIcon');

        const wrapper = mount(MaxIcon, {
            props: { icon: 'iconmind:log-level-duotone-thin' }
        });

        expect(getIconSpy).toHaveBeenCalledTimes(1);
        expect(getIconSpy).toHaveBeenCalledWith('iconmind:log-level-duotone-thin');

        // Modifica cache da store diretamente
        store.icons_data['iconmind:log-level-duotone-thin'] = '';
        store.icons_data['outro:icone'] = '<svg></svg>';
        await nextTick();

        // O watcher explícito não deve ter redisparado getIcon
        expect(getIconSpy).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    it('redispara getIcon ao alterar a prop do ícone', async () => {
        const store = useIconStore();
        const getIconSpy = vi.spyOn(store, 'getIcon');

        const wrapper = mount(MaxIcon, {
            props: { icon: 'mdi:star' }
        });

        expect(getIconSpy).toHaveBeenCalledWith('mdi:star');

        await wrapper.setProps({ icon: 'mdi:heart' });
        await nextTick();

        expect(getIconSpy).toHaveBeenCalledWith('mdi:heart');
        expect(getIconSpy).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });

    it('várias instâncias com ícone esgotado não recolocam em waiting nem multiplicam requisições', async () => {
        const store = useIconStore();
        store.icons_data['iconmind:log-level-duotone-thin'] = '';

        const wrappers = [
            mount(MaxIcon, { props: { icon: 'iconmind:log-level-duotone-thin' } }),
            mount(MaxIcon, { props: { icon: 'iconmind:log-level-duotone-thin' } }),
            mount(MaxIcon, { props: { icon: 'iconmind:log-level-duotone-thin' } })
        ];

        await nextTick();

        expect(store.icons_data['iconmind:log-level-duotone-thin']).toBe('');
        expect(store.list_icons_waiting_request).not.toContain('iconmind:log-level-duotone-thin');

        wrappers.forEach((w) => w.unmount());
    });

    it('monta mais de 5 nomes distintos e várias instâncias repetidas sem multiplicar GETs', async () => {
        useIconStore();

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
            const urlStr = String(input);
            const result: Record<string, string> = {};
            try {
                const parsed = new URL(urlStr, 'http://localhost');
                for (const icon of parsed.searchParams.getAll('icons[]')) result[icon] = `<svg><path d="M0 0" data-test="${icon}"/></svg>`;
            } catch {}
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(result)
            } as any);
        });

        const iconNames = [
            'mdi:alpha-a', 'mdi:alpha-b', 'mdi:alpha-c', 'mdi:alpha-d', 'mdi:alpha-e',
            'mdi:alpha-f', 'mdi:alpha-g', 'mdi:alpha-h',
            'mdi:alpha-a', 'mdi:alpha-b', 'mdi:alpha-c', 'mdi:alpha-d'
        ];

        const wrappers = iconNames.map((name) => mount(MaxIcon, { props: { icon: name } }));

        await new Promise((r) => setTimeout(r, 250));
        await nextTick();

        const getCalls = fetchSpy.mock.calls.filter((call) => {
            const url = String(call[0]);
            return url.includes('icons%5B%5D=');
        });

        expect(getCalls).toHaveLength(2);

        const call1 = new URL(String(getCalls[0][0]), 'http://localhost').searchParams.getAll('icons[]');
        const call2 = new URL(String(getCalls[1][0]), 'http://localhost').searchParams.getAll('icons[]');

        expect(call1).toHaveLength(5);
        expect(call2).toHaveLength(3);

        wrappers.forEach((w, idx) => {
            const expectedName = iconNames[idx];
            expect(w.html()).toContain(`data-test="${expectedName}"`);
        });

        wrappers.forEach((w) => w.unmount());
        fetchSpy.mockRestore();
    });

    it('descarte de store com múltiplos lotes pendentes evita mutações tardias no componente', async () => {
        const store = useIconStore();

        let resolveFetch: any;
        const fetchPromise = new Promise((resolve) => {
            resolveFetch = resolve;
        });

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => fetchPromise as Promise<Response>);

        const names = ['mdi:batch-t1', 'mdi:batch-t2', 'mdi:batch-t3', 'mdi:batch-t4', 'mdi:batch-t5', 'mdi:batch-t6'];
        const wrappers = names.map((name) => mount(MaxIcon, { props: { icon: name } }));

        await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2), { timeout: 2000 });

        wrappers.forEach((w) => w.unmount());
        store.$dispose();

        resolveFetch({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
                'mdi:batch-t1': '<svg>1</svg>',
                'mdi:batch-t6': '<svg>6</svg>'
            })
        });

        await new Promise((r) => setTimeout(r, 100));

        expect(store.icons_data['mdi:batch-t1']).toBe('waiting');
        expect(store.icons_data['mdi:batch-t6']).toBe('waiting');
        fetchSpy.mockRestore();
    });
});
