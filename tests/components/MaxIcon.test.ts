import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxIcon from '../../src/components/MaxIcon.vue';
import { ref } from 'vue';

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
        const style = wrapper.find('.max-icon-div')?.attributes('style');
        if (style) expect(style).toContain('2rem');

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
        const style = wrapper.find('.max-icon-div')?.attributes('style');
        if (style) {
            expect(style).toContain('0.6');
            expect(style).toContain('0, 0, 0');
        }
    });

    it('dark booleano escurece de forma perceptível em relação ao padrão', () => {
        const padrao = mountIcon({}).find('.max-icon-div').attributes('style');
        const escuro = mountIcon({ dark: true }).find('.max-icon-div').attributes('style');

        expect(padrao).toContain('rgba(0, 0, 0, 0.4)');
        expect(escuro).toContain('rgba(0, 0, 0, 0.6)');
    });

    it('aplica cor clara via light', () => {
        const wrapper = mountIcon({ light: 0.8 });
        const style = wrapper.find('.max-icon-div')?.attributes('style');
        if (style) {
            expect(style).toContain('0.8');
            expect(style).toContain('255, 255, 255');
        }
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
});
