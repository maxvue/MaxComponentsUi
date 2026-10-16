import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSocialPlatform from '../../src/components/MaxInputSocialPlatform.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

function mountSocialPlatform(props: Record<string, any> = {}) {
    return mount(MaxInputSocialPlatform, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputSocialPlatform', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com opções padrão', () => {
        const wrapper = mountSocialPlatform({ modelValue: 'instagram' });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(MaxInputSelect).exists()).toBe(true);
        expect(wrapper.text()).toContain('Instagram');
    });

    it('preserva a opção Outra com valor string vazia \'\' distinto de null', async () => {
        const wrapper = mountSocialPlatform({ modelValue: '' });
        expect(wrapper.text()).toContain('Outra');

        const select = wrapper.findComponent(MaxInputSelect);
        await select.vm.$emit('update:modelValue', '');

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual(['']);
    });

    it('emite null ao limpar a seleção', async () => {
        const wrapper = mountSocialPlatform({ modelValue: 'facebook' });
        const select = wrapper.findComponent(MaxInputSelect);
        await select.vm.$emit('clear');

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([null]);
    });

    it('suporta opções personalizadas substituindo as padrões', () => {
        const customOptions = [
            { name: 'LinkedIn', value: 'linkedin' },
            { name: 'Twitter / X', value: 'x' }
        ];
        const wrapper = mountSocialPlatform({ modelValue: 'linkedin', options: customOptions });
        expect(wrapper.text()).toContain('LinkedIn');
    });

    it('preserva valor externo desconhecido sem descarte silencioso', () => {
        const wrapper = mountSocialPlatform({ modelValue: 'tiktok' });
        expect(wrapper.text()).toContain('tiktok');
    });
});
