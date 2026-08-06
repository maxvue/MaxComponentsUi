import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';
import InputBase from '../../src/components/InputBase.vue';

let activeWrapper: any = null;

function mountIconPicker(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    activeWrapper = mount(MaxInputIconPicker, {
        props: { modelValue: '', ...props },
        attrs,
        attachTo: document.body
    });
    return activeWrapper;
}

describe('MaxInputIconPicker', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
            json: () => Promise.resolve([
                { id: 1, name: 'mdi:home', search: 'home' },
                { id: 2, name: 'mdi:user', search: 'user' }
            ])
        })));
    });

    afterEach(() => {
        if (activeWrapper) {
            activeWrapper.unmount();
            activeWrapper = null;
        }
        vi.unstubAllGlobals();
    });

    it('renderiza corretamente com InputBase sem PrimeVue', () => {
        const wrapper = mountIconPicker();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
        expect(wrapper.html()).not.toContain('data-pc-name');
    });

    it('exibe o rótulo do ícone selecionado ou o placeholder', () => {
        const wrapperWithVal = mountIconPicker({ modelValue: 'mdi:home' });
        expect(wrapperWithVal.find('.trigger-label').text()).toBe('mdi:home');

        const wrapperPlaceholder = mountIconPicker({ placeholder: 'Escolha' });
        expect(wrapperPlaceholder.find('.trigger-label').text()).toBe('Escolha');
    });

    it('não abre se disabled for true', async () => {
        const wrapper = mountIconPicker({ disabled: true });
        await wrapper.find('.icon-picker-trigger').trigger('click');
        expect(document.body.querySelector('.max-icon-picker-drawer')).toBeNull();
    });

    it('abrir o drawer dispara busca de ícones', async () => {
        const wrapper = mountIconPicker();
        await wrapper.find('.icon-picker-trigger').trigger('click');
        await wrapper.vm.$nextTick();

        expect(global.fetch).toHaveBeenCalledWith('https://engeapp.com.br/api/icons/picker', expect.any(Object));
    });
});
