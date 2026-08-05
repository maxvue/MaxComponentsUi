import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputText from '../../src/components/MaxInputText.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountInputText(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputText, {
        props: { modelValue: '', ...props },
        attrs
    });
}

describe('MaxInputText', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountInputText({ label: 'Nome' });
        expect(wrapper.exists()).toBe(true);
    });

    it('emite update:modelValue ao alterar o valor do input', async () => {
        const wrapper = mountInputText();
        const input = wrapper.find('input');
        await input.setValue('Teste');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual(['Teste']);
    });

    it('atualiza o valor interno quando modelValue muda externamente', async () => {
        const wrapper = mountInputText({ modelValue: 'inicial' });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('inicial');

        await wrapper.setProps({ modelValue: 'atualizado' });
        expect((input.element as HTMLInputElement).value).toBe('atualizado');
    });

    it('valida done=true ao blur quando required e preenchido', async () => {
        const wrapper = mountInputText({ required: true, modelValue: 'preenchido' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('done')).toBe(true);
    });

    it('valida erro de campo obrigatório ao blur quando vazio', async () => {
        const wrapper = mountInputText({ required: true, modelValue: '' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Campo obrigatório');
    });

    it('valida erro por targetValue diferente', async () => {
        const wrapper = mountInputText({ targetValue: 'Correto', modelValue: 'Incorreto' }, { error_msg: 'Erro customizado' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Erro customizado');
    });

    it('valida erro genérico (Valor inválido) quando done=false explícito', async () => {
        const wrapper = mountInputText({ done: false, modelValue: 'Texto' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Valor inválido');
    });

    it('InputBase continua sendo o elemento mais externo', () => {
        const wrapper = mountInputText({ label: 'Nome' });

        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
        expect(wrapper.element.classList).toContain('max-input-main-div');
    });

    it('fluid continua gerando a classe p-inputtext-fluid', () => {
        const wrapper = mountInputText();

        // apps consumidoras estilizam por esses seletores
        expect(wrapper.find('input').classes()).toContain('p-inputtext-fluid');
        expect(wrapper.find('input').classes()).toContain('p-inputtext');
        expect(wrapper.find('input').classes()).toContain('p-component');
    });

    it('targetValue divergente sem errMsg mostra "Valor esperado: ..."', async () => {
        // a mensagem lê o valor de attrs (target_value / target-value), não da prop
        const wrapper = mountInputText(
            { targetValue: 'Correto', modelValue: 'Incorreto' },
            { target_value: 'Correto' }
        );
        await wrapper.find('input').trigger('blur');

        expect(wrapper.findComponent(InputBase).props('error')).toBe('Valor esperado: Correto');
    });

    it('attrs.errMsg sobrescreve a mensagem padrão de obrigatório', async () => {
        const wrapper = mountInputText({ required: true, modelValue: '' }, { errMsg: 'Preencha isto' });
        await wrapper.find('input').trigger('blur');

        expect(wrapper.findComponent(InputBase).props('error')).toBe('Preencha isto');
    });

    it('atributo externo continua caindo na raiz do InputBase (como antes)', () => {
        // Contrato PRÉ-EXISTENTE, medido no componente antes da migração: o InputBase
        // não declara inheritAttrs:false, então atributos externos vão para a <div>
        // raiz — nunca chegaram ao <input>. A migração preserva isso.
        const wrapper = mountInputText({}, { autocomplete: 'off', 'data-teste': 'x' });

        expect(wrapper.attributes('autocomplete')).toBe('off');
        expect(wrapper.attributes('data-teste')).toBe('x');

        // e o outro lado do contrato: não migraram para o <input>
        expect(wrapper.find('input').attributes('autocomplete')).toBeUndefined();
        expect(wrapper.find('input').attributes('data-teste')).toBeUndefined();
    });

    it('props do Max NÃO vazam como atributos do <input>', () => {
        const wrapper = mountInputText({ label: 'Nome', msg: 'dica', iconMessage: 'mdi:info', targetValue: 'X' });
        const input = wrapper.find('input');

        // antes, o v-bind="props" despejava tudo no <input>, gerando atributos inválidos
        expect(input.attributes('label')).toBeUndefined();
        expect(input.attributes('msg')).toBeUndefined();
        expect(input.attributes('iconmessage')).toBeUndefined();
        expect(input.attributes('targetvalue')).toBeUndefined();
    });

    it('type e placeholder continuam chegando ao <input>', () => {
        const wrapper = mountInputText({ type: 'email', placeholder: 'seu@email' });
        const input = wrapper.find('input');

        expect(input.attributes('type')).toBe('email');
        expect(input.attributes('placeholder')).toBe('seu@email');
    });

    it('disabled chega ao <input> e aplica p-disabled', () => {
        const wrapper = mountInputText({ disabled: true });
        const input = wrapper.find('input');

        expect(input.attributes('disabled')).toBeDefined();
        expect(input.classes()).toContain('p-disabled');
    });

    it('não resta marcação de componente PrimeVue no markup', () => {
        const wrapper = mountInputText({ label: 'Nome' });

        // data-pc-name/data-pc-section eram os marcadores que a lib injetava
        expect(wrapper.html()).not.toContain('data-pc-name');
        expect(wrapper.html()).not.toContain('data-pc-section');
    });

    it('required + targetValue divergente: a comparação tem precedência', async () => {
        // trava a ordem da cascata de testIsDone (isEqual antes de isRequiredDone)
        const wrapper = mountInputText({ required: true, targetValue: 'Correto', modelValue: 'Errado' });
        await wrapper.find('input').trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('done')).toBe(false);
        // a mensagem também segue a comparação, não a obrigatoriedade
        expect(inputBase.props('error')).toBe('Valor esperado: undefined');
        expect(inputBase.props('error')).not.toBe('Campo obrigatório');
    });

    it('prop caution explícita só vira caution quando o campo não está válido', async () => {
        // com isDone true, a prop caution sozinha não deve acionar o estado
        const wrapper = mountInputText({ caution: true, required: true, modelValue: 'preenchido' });
        await wrapper.find('input').trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('done')).toBe(true);
        expect(inputBase.props('caution')).toBe(false);
    });

    it('vazio + required + targetValue: a mensagem da comparação vem primeiro', async () => {
        // aqui isEqual E isRequiredDone falham juntos; a ordem dos ifs de error_msg
        // decide qual mensagem sai
        const wrapper = mountInputText({ required: true, targetValue: 'Correto', modelValue: '' });
        await wrapper.find('input').trigger('blur');

        expect(wrapper.findComponent(InputBase).props('error')).toBe('Valor esperado: undefined');
    });

    it('sem caution não há mensagem de erro', () => {
        // a guarda `if (!caution.value) return null` do error_msg
        const wrapper = mountInputText({ required: true, modelValue: 'preenchido' });

        expect(wrapper.findComponent(InputBase).props('error')).toBeNull();
    });

    it('caution é repassado ao InputBase', async () => {
        const wrapper = mountInputText({ required: true, modelValue: '' });
        await wrapper.find('input').trigger('blur');

        expect(wrapper.findComponent(InputBase).props('caution')).toBe(true);
    });
});
