import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxBadgeComponent from '../../src/components/MaxBadgeComponent.vue';

function mountBadge(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
    return mount(MaxBadgeComponent, {
        props,
        slots,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon"></span>',
                    props: ['icon', 'i', 'dark', 'color']
                }
            }
        }
    });
}

describe('MaxBadgeComponent', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente no modo simples', () => {
        const wrapper = mountBadge({ label: 'Ativo' });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.p-badge').exists()).toBe(true);
        expect(wrapper.find('.p-badge').classes()).toContain('p-component');
    });

    it('exibe texto do badge via prop label', () => {
        const wrapper = mountBadge({ label: 'Pendente' });
        expect(wrapper.text()).toContain('Pendente');
    });

    it('exibe texto via aliases (msg, value, text)', () => {
        const wrapper1 = mountBadge({ msg: 'Teste1' });
        expect(wrapper1.text()).toContain('Teste1');

        const wrapper2 = mountBadge({ value: 'Teste2' });
        expect(wrapper2.text()).toContain('Teste2');

        const wrapper3 = mountBadge({ text: 'Teste3' });
        expect(wrapper3.text()).toContain('Teste3');
    });

    it('renderiza modo overlay quando overlay=true', () => {
        const wrapper = mountBadge({ label: '5', overlay: true }, { default: '<button>Notificações</button>' });
        expect(wrapper.find('.p-overlaybadge').exists()).toBe(true);
        expect(wrapper.text()).toContain('Notificações');
        expect(wrapper.find('.p-badge').text()).toBe('5');
    });

    it('adiciona p-badge-dot quando mensagem for vazia', () => {
        const wrapper = mountBadge({});
        expect(wrapper.find('.p-badge').classes()).toContain('p-badge-dot');
    });

    it('adiciona p-badge-circle quando mensagem tiver 1 caractere', () => {
        const wrapper = mountBadge({ value: '1' });
        expect(wrapper.find('.p-badge').classes()).toContain('p-badge-circle');
    });

    it('aplica classe de severity e tamanhos', () => {
        const wrapper = mountBadge({ value: '10', severity: 'success', size: 'large' });
        expect(wrapper.find('.p-badge').classes()).toContain('p-badge-success');
        expect(wrapper.find('.p-badge').classes()).toContain('p-badge-lg');
    });

    it('renderiza ícone quando icon é fornecido', () => {
        const wrapper = mountBadge({ label: 'Status', icon: 'mdi:check' });
        expect(wrapper.find('.max-icon').exists()).toBe(true);
    });

    it('não renderiza ícone quando icon não é fornecido', () => {
        const wrapper = mountBadge({ label: 'Simples' });
        expect(wrapper.find('.max-icon').exists()).toBe(false);
    });

    it('aceita iconColor e iconValue para círculo de cor', () => {
        const wrapper = mountBadge({
            label: 'Status',
            iconColor: '#ff0000',
            iconValue: 'A'
        });
        expect(wrapper.find('.circle-color-badge-text').text()).toContain('A');
    });

    it('não emite marcações do PrimeVue', () => {
        const wrapper = mountBadge({ label: 'Limpo' });
        expect(wrapper.html()).not.toContain('data-pc-name');
    });
});
