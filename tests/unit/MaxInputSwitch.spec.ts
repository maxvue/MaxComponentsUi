import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MaxInputSwitch from '../../src/components/MaxInputSwitch.vue';

function mountSwitch(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputSwitch, {
        props,
        attrs
    });
}

describe('MaxInputSwitch (Especificação de Acessibilidade WAI-ARIA e Navegação por Teclado)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('Padrão WAI-ARIA Switch', () => {
        it('deve possuir role="switch" no elemento interativo de alternância', () => {
            const wrapper = mountSwitch({ modelValue: false });
            const toggle = wrapper.find('.max-switch-toggle');
            expect(toggle.attributes('role')).toBe('switch');
        });

        it('deve refletir aria-checked="false" quando inativo e aria-checked="true" quando ativo', async () => {
            const wrapper = mountSwitch({ modelValue: false });
            const toggle = wrapper.find('.max-switch-toggle');
            expect(toggle.attributes('aria-checked')).toBe('false');

            await wrapper.setProps({ modelValue: true });
            expect(toggle.attributes('aria-checked')).toBe('true');
        });

        it('deve configurar tabindex="0" quando habilitado para navegação via Tab', () => {
            const wrapper = mountSwitch({ modelValue: false, disabled: false });
            const toggle = wrapper.find('.max-switch-toggle');
            expect(toggle.attributes('tabindex')).toBe('0');
        });

        it('deve configurar tabindex="-1" e aria-disabled="true" quando desabilitado', () => {
            const wrapper = mountSwitch({ modelValue: false, disabled: true });
            const toggle = wrapper.find('.max-switch-toggle');
            expect(toggle.attributes('tabindex')).toBe('-1');
            expect(toggle.attributes('aria-disabled')).toBe('true');
        });
    });

    describe('Navegação e Acionamento por Teclado (WCAG 2.1.1)', () => {
        it('deve alternar o valor de falso para verdadeiro ao pressionar Space', async () => {
            const wrapper = mountSwitch({ modelValue: false });
            const toggle = wrapper.find('.max-switch-toggle');

            await toggle.trigger('keydown.space');
            expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(true);
        });

        it('deve alternar o valor de falso para verdadeiro ao pressionar Enter', async () => {
            const wrapper = mountSwitch({ modelValue: false });
            const toggle = wrapper.find('.max-switch-toggle');

            await toggle.trigger('keydown.enter');
            expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(true);
        });

        it('não deve emitir alterações ao pressionar Space ou Enter quando disabled=true', async () => {
            const wrapper = mountSwitch({ modelValue: false, disabled: true });
            const toggle = wrapper.find('.max-switch-toggle');

            await toggle.trigger('keydown.space');
            await toggle.trigger('keydown.enter');
            expect(wrapper.emitted('update:modelValue')).toBeFalsy();
        });
    });

    describe('Rótulos Acessíveis (aria-label e aria-labelledby)', () => {
        it('deve priorizar prop label para o atributo aria-label', () => {
            const wrapper = mountSwitch({ modelValue: false, label: 'Notificações por e-mail' });
            const toggle = wrapper.find('.max-switch-toggle');
            expect(toggle.attributes('aria-label')).toBe('Notificações por e-mail');
        });

        it('deve utilizar prop question como aria-label se label não for fornecido', () => {
            const wrapper = mountSwitch({ modelValue: false, question: 'Deseja continuar?' });
            const toggle = wrapper.find('.max-switch-toggle');
            expect(toggle.attributes('aria-label')).toBe('Deseja continuar?');
        });

        it('deve associar aria-labelledby aos IDs dos rótulos quando definidos', () => {
            const wrapper = mountSwitch({
                modelValue: false,
                labelLeft: 'Desativado',
                labelRight: 'Ativado'
            });
            const toggle = wrapper.find('.max-switch-toggle');
            const left = wrapper.find('.max-switch-label.left');
            const right = wrapper.find('.max-switch-label.right');

            expect(left.attributes('id')).toBeTruthy();
            expect(right.attributes('id')).toBeTruthy();
            expect(toggle.attributes('aria-labelledby')).toBe(
                `${left.attributes('id')} ${right.attributes('id')}`
            );
        });

        it('deve fornecer fallback "Alternador" quando nenhum rótulo estiver presente', () => {
            const wrapper = mountSwitch({ modelValue: false });
            const toggle = wrapper.find('.max-switch-toggle');
            expect(toggle.attributes('aria-label')).toBe('Alternador');
        });
    });

    describe('Bloqueio e Affordance de Estado Desabilitado', () => {
        it('deve aplicar classe is-disabled no container principal e no toggle', () => {
            const wrapper = mountSwitch({ modelValue: false, disabled: true });
            expect(wrapper.find('.max-switch').classes()).toContain('is-disabled');
            expect(wrapper.find('.max-switch-toggle').classes()).toContain('is-disabled');
        });

        it('não deve emitir ao clicar no toggle central quando disabled=true', async () => {
            const wrapper = mountSwitch({ modelValue: false, disabled: true });
            await wrapper.find('.max-switch-toggle').trigger('click');
            expect(wrapper.emitted('update:modelValue')).toBeFalsy();
        });

        it('não deve emitir ao clicar nos rótulos laterais quando disabled=true', async () => {
            const wrapper = mountSwitch({
                modelValue: false,
                disabled: true,
                labelLeft: 'Não',
                labelRight: 'Sim'
            });
            await wrapper.find('.max-switch-label.left').trigger('click');
            await wrapper.find('.max-switch-label.right').trigger('click');
            expect(wrapper.emitted('update:modelValue')).toBeFalsy();
        });
    });

    describe('Valores Customizados (trueValue e falseValue)', () => {
        it('respeita trueValue e falseValue não-booleanos no acionamento por teclado', async () => {
            const wrapper = mountSwitch({
                modelValue: 'N',
                trueValue: 'S',
                falseValue: 'N'
            });
            const toggle = wrapper.find('.max-switch-toggle');

            await toggle.trigger('keydown.space');
            expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('S');
        });
    });
});
