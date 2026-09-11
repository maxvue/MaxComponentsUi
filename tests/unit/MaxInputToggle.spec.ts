import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputToggle from '../../src/components/MaxInputToggle.vue';

function mountToggle(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputToggle, {
        props,
        attrs
    });
}

describe('MaxInputToggle (Especificação de Associação Acessível e A11y)', () => {
    describe('Associação Formal de Rótulo e Input (WCAG 1.3.1 e 4.1.2)', () => {
        it('associa o rótulo ao input checkbox através de atributos id e for correspondentes', () => {
            const wrapper = mountToggle(
                { modelValue: false },
                { label: 'Habilitar notificações' }
            );

            const label = wrapper.find('label.input-toggle-field-label-div');
            expect(label.exists()).toBe(true);
            const forId = label.attributes('for');
            expect(forId).toBeTruthy();

            const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
            expect(input.attributes('id')).toBe(forId);

            const toggleContainer = wrapper.find('label.max-toggleswitch');
            expect(toggleContainer.attributes('for')).toBe(forId);
        });

        it('adota id explicitamente fornecido via atributos para a associação', () => {
            const customId = 'toggle-notificacoes-sms';
            const wrapper = mountToggle(
                { modelValue: false },
                { id: customId, label: 'Notificações SMS' }
            );

            const label = wrapper.find('label.input-toggle-field-label-div');
            const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');

            expect(label.attributes('for')).toBe(customId);
            expect(input.attributes('id')).toBe(customId);
        });

        it('remove aria-label redundante quando o rótulo visível está formalmente associado', () => {
            const wrapper = mountToggle(
                { modelValue: false },
                { label: 'Receber novidades' }
            );

            const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
            expect(input.attributes('aria-label')).toBeUndefined();
        });

        it('fornece fallback de aria-label quando nenhum rótulo textual for fornecido', () => {
            const wrapper = mountToggle({ modelValue: false });
            const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
            expect(input.attributes('aria-label')).toBe('Alternar opção');
        });
    });

    describe('Interação e Alternância de Valores', () => {
        it('emite update:modelValue ao alternar o checkbox nativo', async () => {
            const wrapper = mountToggle({ modelValue: false });
            const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');

            await input.setValue(true);
            expect(wrapper.emitted('update:modelValue')).toBeTruthy();
            expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(true);

            await input.setValue(false);
            expect(wrapper.emitted('update:modelValue')?.[1][0]).toBe(false);
        });

        it('respeita trueValue e falseValue customizados', async () => {
            const wrapper = mountToggle({
                modelValue: 'OFF',
                trueValue: 'ON',
                falseValue: 'OFF'
            });
            const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');

            await input.setValue(true);
            expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('ON');

            await input.setValue(false);
            expect(wrapper.emitted('update:modelValue')?.[1][0]).toBe('OFF');
        });

        it('exibe e ativa visualmente os rótulos de estado trueLabel e falseLabel', async () => {
            const wrapper = mountToggle({
                modelValue: false,
                trueLabel: 'Ativado',
                falseLabel: 'Desativado'
            });

            const labels = wrapper.findAll('.input-toggle-field-label');
            expect(labels).toHaveLength(2);
            expect(labels[0].text()).toBe('Desativado');
            expect(labels[0].classes()).toContain('active');
            expect(labels[1].text()).toBe('Ativado');
            expect(labels[1].classes()).not.toContain('active');

            await wrapper.setProps({ modelValue: true });
            expect(labels[0].classes()).not.toContain('active');
            expect(labels[1].classes()).toContain('active');
        });

        it('reconhece aliases labelLeft e labelRight espelhando o MaxInputSwitch', () => {
            const wrapper = mountToggle({
                modelValue: false,
                labelLeft: 'Não',
                labelRight: 'Sim'
            });

            const labels = wrapper.findAll('.input-toggle-field-label');
            expect(labels[0].text()).toBe('Não');
            expect(labels[1].text()).toBe('Sim');
        });
    });
});
