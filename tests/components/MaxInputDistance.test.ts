import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputDistance from '../../src/components/MaxInputDistance.vue';

function mountDistance(props: Record<string, any> = {}) {
    return mount(MaxInputDistance, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputDistance', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza com unidade metros padrão', () => {
        const wrapper = mountDistance({ modelValue: 120 });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('m');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('120');
    });

    it('permite mudar unidade sem converter o modelo', async () => {
        const wrapper = mountDistance({ modelValue: 50, unit: 'km' });
        expect(wrapper.text()).toContain('km');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('50');

        await wrapper.setProps({ unit: 'cm' });
        expect(wrapper.text()).toContain('cm');
        expect((input.element as HTMLInputElement).value).toBe('50');
    });

    it('valida min=0 padrão', async () => {
        const wrapper = mountDistance();
        const input = wrapper.find('input');

        await input.setValue('-10');
        expect(wrapper.text()).toContain('Valor mínimo permitido é 0');
    });
});
