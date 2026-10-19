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
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
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
});
