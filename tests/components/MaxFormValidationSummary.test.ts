import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxFormValidationSummary from '../../src/components/MaxFormValidationSummary.vue';

describe('MaxFormValidationSummary.vue', () => {
    it('não deve renderizar quando a lista de erros for vazia e não houver generalError', () => {
        const wrapper = mount(MaxFormValidationSummary, {
            props: {
                errors: []
            }
        });
        expect(wrapper.find('.max-form-validation-summary').exists()).toBe(false);
    });

    it('deve renderizar com generalError e erros de campos', () => {
        const wrapper = mount(MaxFormValidationSummary, {
            props: {
                title: 'Erros no formulário',
                generalError: 'Falha geral ao salvar os dados.',
                errors: [
                    { key: 'email', label: 'E-mail', message: 'E-mail inválido', inputId: 'field-email' },
                    { key: 'cpf', label: 'CPF', message: 'CPF obrigatório', inputId: 'field-cpf' }
                ]
            }
        });
        expect(wrapper.find('.max-form-validation-summary').exists()).toBe(true);
        expect(wrapper.text()).toContain('Erros no formulário');
        expect(wrapper.text()).toContain('Falha geral ao salvar os dados.');
        expect(wrapper.text()).toContain('E-mail:');
        expect(wrapper.text()).toContain('E-mail inválido');
        expect(wrapper.text()).toContain('CPF:');
        expect(wrapper.text()).toContain('CPF obrigatório');
    });

    it('deve emitir navigate e tentar focar o campo quando o usuário clicar no item de erro', async () => {
        const inputEl = document.createElement('input');
        inputEl.id = 'field-email';
        inputEl.focus = vi.fn();
        inputEl.scrollIntoView = vi.fn();
        document.body.appendChild(inputEl);

        const wrapper = mount(MaxFormValidationSummary, {
            props: {
                errors: [
                    { key: 'email', label: 'E-mail', message: 'E-mail inválido', inputId: 'field-email' }
                ],
                focusField: true
            },
            attachTo: document.body
        });

        const link = wrapper.find('.max-form-validation-summary__link');
        expect(link.exists()).toBe(true);
        await link.trigger('click');

        expect(wrapper.emitted('navigate')).toHaveLength(1);
        expect(wrapper.emitted('navigate')?.[0]).toEqual(['field-email']);
        expect(inputEl.focus).toHaveBeenCalled();
        expect(inputEl.scrollIntoView).toHaveBeenCalled();

        document.body.removeChild(inputEl);
        wrapper.unmount();
    });

    it('não deve focar o campo quando focusField for false', async () => {
        const inputEl = document.createElement('input');
        inputEl.id = 'field-phone';
        inputEl.focus = vi.fn();
        document.body.appendChild(inputEl);

        const wrapper = mount(MaxFormValidationSummary, {
            props: {
                errors: [
                    { key: 'phone', label: 'Telefone', message: 'Telefone inválido', inputId: 'field-phone' }
                ],
                focusField: false
            }
        });

        const link = wrapper.find('.max-form-validation-summary__link');
        await link.trigger('click');

        expect(wrapper.emitted('navigate')).toHaveLength(1);
        expect(inputEl.focus).not.toHaveBeenCalled();

        document.body.removeChild(inputEl);
    });

    it('deve focar o container do resumo ao chamar o método exposto focusSummary', () => {
        const wrapper = mount(MaxFormValidationSummary, {
            props: {
                errors: [{ key: '1', label: 'Campo', message: 'Erro' }]
            },
            attachTo: document.body
        });

        const summaryEl = wrapper.find('.max-form-validation-summary').element as HTMLElement;
        const focusSpy = vi.spyOn(summaryEl, 'focus');

        wrapper.vm.focusSummary();
        expect(focusSpy).toHaveBeenCalled();

        wrapper.unmount();
    });
});
