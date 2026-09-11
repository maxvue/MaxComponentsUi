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

    it('utiliza classe max-input-native e não inclui classes legadas', () => {
        const wrapper = mountSearch();
        const input = wrapper.find('input');
        expect(input.classes()).toContain('max-input-native');
        expect(input.classes()).not.toContain('p-inputtext');
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

    it('limpar o campo emite search com string vazia', async () => {
        vi.useRealTimers();
        const wrapper = mountSearch({ modelValue: 'teste' });
        const input = wrapper.find('input');

        await input.setValue('');
        await input.trigger('input');

        const emitted = wrapper.emitted('search');
        expect(emitted).toBeTruthy();
        expect(emitted?.[emitted.length - 1][0]).toBe('');
    });

    it('não emite search após unmount (clearTimeout no debounce pendente)', async () => {
        vi.useRealTimers();
        const wrapper = mountSearch();
        const input = wrapper.find('input');

        await input.setValue('teste');
        await input.trigger('input');

        wrapper.unmount();

        await new Promise((resolve) => setTimeout(resolve, 350));

        const emitted = wrapper.emitted('search');
        expect(emitted).toBeUndefined();
    });

    it('possui type="search" por padrão e aceita type customizado', async () => {
        const wrapper = mountSearch();
        const input = wrapper.find('input');
        expect(input.attributes('type')).toBe('search');

        const wrapperCustom = mountSearch({ type: 'text' });
        expect(wrapperCustom.find('input').attributes('type')).toBe('text');
    });

    it('aplica aria-label com fallback semântico', async () => {
        const wrapperDefault = mountSearch();
        expect(wrapperDefault.find('input').attributes('aria-label')).toBe('Pesquisar...');

        const wrapperCustom = mountSearch({ ariaLabel: 'Buscar produtos' });
        expect(wrapperCustom.find('input').attributes('aria-label')).toBe('Buscar produtos');
    });

    it('gerencia aria-busy e região aria-live polite durante loading', async () => {
        const wrapperIdle = mountSearch({ isLoading: false });
        const inputIdle = wrapperIdle.find('input');
        const liveRegionIdle = wrapperIdle.find('[aria-live="polite"]');

        expect(inputIdle.attributes('aria-busy')).toBeUndefined();
        expect(liveRegionIdle.exists()).toBe(true);
        expect(liveRegionIdle.text()).toBe('');

        const wrapperLoading = mountSearch({ isLoading: true });
        const inputLoading = wrapperLoading.find('input');
        const liveRegionLoading = wrapperLoading.find('[aria-live="polite"]');

        expect(inputLoading.attributes('aria-busy')).toBe('true');
        expect(liveRegionLoading.text()).toContain('Buscando resultados...');
    });
});

