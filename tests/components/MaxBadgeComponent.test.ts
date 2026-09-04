import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxBadgeComponent from '../../src/components/MaxBadgeComponent.vue';

function mountBadge(props: Record<string, any> = {}) {
    return mount(MaxBadgeComponent, {
        props,
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

    it('renderiza corretamente', () => {
        const wrapper = mountBadge({ label: 'Ativo' });
        expect(wrapper.exists()).toBe(true);
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

    it('NÃO renderiza .circle-color-badge quando iconColor e iconValue não são fornecidos', () => {
        const wrapper = mountBadge({ label: 'Simples' });
        expect(wrapper.find('.circle-color-badge').exists()).toBe(false);
    });
});

