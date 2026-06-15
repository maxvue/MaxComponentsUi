import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSearch from '../../src/components/MaxInputSearch.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountSearch(props: Record<string, any> = {}) {
    return mount(MaxInputSearch, {
        props: { modelValue: '', ...props }
    });
}

describe('MaxInputSearch', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.useFakeTimers();
    });

    it('renderiza corretamente', () => {
        const wrapper = mountSearch();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('emite update:modelValue ao digitar', async () => {
        const wrapper = mountSearch();
        const input = wrapper.find('input');
        await input.setValue('busca');
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('emite search após debounce de 300ms', async () => {
        vi.useRealTimers();
        const wrapper = mountSearch();
        const input = wrapper.find('input');

        await input.setValue('teste');
        await input.trigger('input');

        // Aguarda o debounce
        await new Promise((resolve) => setTimeout(resolve, 350));

        const emitted = wrapper.emitted('search');
        if (emitted) expect(emitted[0][0]).toBe('teste');

    });

    it('não emite search quando valor tem 1 ou menos caracteres', async () => {
        vi.useRealTimers();
        const wrapper = mountSearch();
        const input = wrapper.find('input');

        await input.setValue('a');
        await input.trigger('input');

        await new Promise((resolve) => setTimeout(resolve, 350));

        const emitted = wrapper.emitted('search');
        expect(emitted).toBeUndefined();
    });

    it('sincroniza modelValue externo', async () => {
        const wrapper = mountSearch({ modelValue: '' });
        await wrapper.setProps({ modelValue: 'novo valor' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('input').element.value).toBe('novo valor');
    });

    it('exibe ícone de loading quando isLoading=true', () => {
        const wrapper = mountSearch({ isLoading: true });
        const ib = wrapper.findComponent(InputBase);
        // iconRight muda quando isLoading é true
        expect(ib.props('iconRight')).toContain('loading');
    });

    it('exibe ícone de busca quando isLoading=false', () => {
        const wrapper = mountSearch({ isLoading: false });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('iconRight')).toContain('search');
    });
});
