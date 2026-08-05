import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { vMaska } from 'maska/vue';
import MaxBaseInput from '../../../src/components/base/MaxBaseInput.vue';

describe('MaxBaseInput', () => {
    it('renderiza um <input> como elemento raiz, sem wrapper envolvente', () => {
        const wrapper = mount(MaxBaseInput);
        expect(wrapper.element.tagName).toBe('INPUT');
        // wrapper.element resolve para o componente interno independente de haver um
        // elemento externo; o html() renderizado é quem denuncia um wrapper acidental.
        expect(wrapper.html().trim().startsWith('<input')).toBe(true);
        expect(wrapper.find('div').exists()).toBe(false);
    });

    it('aplica as classes p-inputtext e p-component', () => {
        const wrapper = mount(MaxBaseInput);
        expect(wrapper.classes()).toContain('p-inputtext');
        expect(wrapper.classes()).toContain('p-component');
    });

    it('aplica p-filled quando há valor e remove quando vazio', async () => {
        const wrapper = mount(MaxBaseInput, { props: { modelValue: 'algo' } });
        expect(wrapper.classes()).toContain('p-filled');

        await wrapper.setProps({ modelValue: '' });
        expect(wrapper.classes()).not.toContain('p-filled');
    });

    it('digitar emite update:modelValue com o valor novo', async () => {
        const wrapper = mount(MaxBaseInput);
        const inputEl = wrapper.element as HTMLInputElement;
        inputEl.value = 'novo texto';
        await wrapper.trigger('input');
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['novo texto']);
        expect(wrapper.emitted('input')).toBeTruthy();
    });

    it('mudança na prop modelValue reflete no input.value', async () => {
        const wrapper = mount(MaxBaseInput, { props: { modelValue: 'inicial' } });
        expect((wrapper.element as HTMLInputElement).value).toBe('inicial');

        await wrapper.setProps({ modelValue: 'atualizado' });
        expect((wrapper.element as HTMLInputElement).value).toBe('atualizado');
    });

    it('emite blur e focus', async () => {
        const wrapper = mount(MaxBaseInput);
        await wrapper.trigger('focus');
        expect(wrapper.emitted('focus')).toBeTruthy();

        await wrapper.trigger('blur');
        expect(wrapper.emitted('blur')).toBeTruthy();
    });

    it('fluid aplica p-inputtext-fluid; size small/large aplica p-inputtext-sm/lg', () => {
        const fluidWrapper = mount(MaxBaseInput, { props: { fluid: true } });
        expect(fluidWrapper.classes()).toContain('p-inputtext-fluid');

        const smallWrapper = mount(MaxBaseInput, { props: { size: 'small' } });
        expect(smallWrapper.classes()).toContain('p-inputtext-sm');

        const largeWrapper = mount(MaxBaseInput, { props: { size: 'large' } });
        expect(largeWrapper.classes()).toContain('p-inputtext-lg');
    });

    it('invalid aplica classe p-invalid e aria-invalid=true', () => {
        const wrapper = mount(MaxBaseInput, { props: { invalid: true } });
        expect(wrapper.classes()).toContain('p-invalid');
        expect(wrapper.attributes('aria-invalid')).toBe('true');
    });

    it('não aplica aria-invalid quando invalid é false', () => {
        const wrapper = mount(MaxBaseInput, { props: { invalid: false } });
        expect(wrapper.attributes('aria-invalid')).toBeUndefined();
    });

    it('disabled aplica atributo disabled e classe p-disabled', () => {
        const wrapper = mount(MaxBaseInput, { props: { disabled: true } });
        expect(wrapper.attributes('disabled')).toBeDefined();
        expect(wrapper.classes()).toContain('p-disabled');
    });

    it('atributos herdados (placeholder, type, maxlength) chegam ao <input>', () => {
        const wrapper = mount(MaxBaseInput, {
            attrs: { placeholder: 'digite aqui', type: 'email', maxlength: '10' }
        });
        expect(wrapper.attributes('placeholder')).toBe('digite aqui');
        expect(wrapper.attributes('type')).toBe('email');
        expect(wrapper.attributes('maxlength')).toBe('10');
    });

    it('expõe $el e focus() via defineExpose', () => {
        const wrapper = mount(MaxBaseInput);
        expect(wrapper.vm.$el).toBeTruthy();
        expect(typeof wrapper.vm.focus).toBe('function');
    });

    it('integração com v-maska: a máscara é aplicada ao elemento raiz', async () => {
        const wrapper = mount(
            {
                components: { MaxBaseInput },
                template: '<MaxBaseInput v-maska="\'##.###-###\'" model-value="" />'
            },
            { global: { directives: { maska: vMaska } } }
        );

        const input = wrapper.find('input');
        await input.setValue('12345678');

        expect((input.element as HTMLInputElement).value).toBe('12.345-678');
    });
});
