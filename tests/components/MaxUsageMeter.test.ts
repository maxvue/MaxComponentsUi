import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxUsageMeter from '../../src/components/MaxUsageMeter.vue';

describe('MaxUsageMeter', () => {
    it('trata limite zero sem compor barra inválida', () => {
        const wrapper = mount(MaxUsageMeter, { props: { used: 2, limit: 0, label: 'Cota' } });
        expect(wrapper.text()).toContain('Limite zero');
        expect(wrapper.findComponent({ name: 'MaxProgressBar' }).exists()).toBe(false);
    });

    it('trata limite nulo como consumo indisponível', () => {
        const wrapper = mount(MaxUsageMeter, { props: { used: 12, limit: null, label: 'Cota' } });
        expect(wrapper.text()).toContain('Consumo indisponível');
        expect(wrapper.text()).not.toContain('12');
    });
});
