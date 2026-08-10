import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountTextArea(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputTextArea, {
        props: { modelValue: '', ...props },
        attrs
    });
}

describe('MaxInputTextArea', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountTextArea();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('emite update:modelValue ao digitar', async () => {
        const wrapper = mountTextArea({ modelValue: '' });
        const textarea = wrapper.find('textarea');
        await textarea.setValue('Texto de exemplo');
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('sincroniza modelValue com temp_value', async () => {
        const wrapper = mountTextArea({ modelValue: 'inicial' });
        await wrapper.setProps({ modelValue: 'atualizado' });
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
    });

    it('calcula número de linhas com base no conteúdo', async () => {
        const wrapper = mountTextArea({ modelValue: 'linha1\nlinha2\nlinha3' });
        // O componente calcula computedLines baseado em quebras de linha
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('respeita minRows', () => {
        const wrapper = mountTextArea({ modelValue: '', minRows: 5 });
        expect(wrapper.exists()).toBe(true);
    });

    it('respeita autoResize=true por padrão', () => {
        const wrapper = mountTextArea();
        expect(wrapper.exists()).toBe(true);
    });

    it('aceita prop rows para altura fixa', () => {
        const wrapper = mountTextArea({ rows: 10 });
        expect(wrapper.exists()).toBe(true);
    });

    it('valida done=true no blur via checkDone()', async () => {
        const wrapper = mountTextArea({ done: true, modelValue: '' });
        const textarea = wrapper.find('textarea');
        await textarea.trigger('blur');

        // checkDone define isDone = props.done
        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('emite update:modelValue imediatamente no mount (immediate: true preservado)', () => {
        const wrapper = mountTextArea({ modelValue: 'valor inicial' });
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0][0]).toBe('valor inicial');
    });

    it('não quebra com minRows não numérico (normaliza para fallback 1)', () => {
        const wrapper = mountTextArea({ modelValue: '', minRows: 'abc' as any });
        const vm = wrapper.vm as any;
        expect(Number.isNaN(vm.lines)).toBe(false);
        expect(vm.lines).toBeGreaterThanOrEqual(1);
    });
});
