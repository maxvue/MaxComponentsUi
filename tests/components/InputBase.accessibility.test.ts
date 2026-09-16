import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { defineComponent, h } from 'vue';
import InputBase from '../../src/components/InputBase.vue';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import MaxChips from '../../src/components/MaxChips.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import MaxInputPhone from '../../src/components/MaxInputPhone.vue';
import { useInputBaseContext } from '../../src/components/base/inputBaseContext';

const TestChildConsumer = defineComponent({
    name: 'TestChildConsumer',
    setup() {
        const context = useInputBaseContext();
        return { context };
    },
    render() {
        if (!this.context) return h('div', { class: 'no-context' }, 'No context');
        return h('div', {
            class: 'has-context',
            'data-input-id': this.context.inputId.value,
            'data-message-id': this.context.messageId.value,
            'data-is-error': String(this.context.isError.value),
            'data-is-required': String(this.context.isRequired.value),
            'data-has-message': String(this.context.hasMessage.value),
            'data-display-message': this.context.displayMessage.value
        });
    }
});

describe('InputBase Accessibility & WAI-ARIA Contracts', () => {
    describe('Scoped Slot Props Contracts', () => {
        it('provides inputId, messageId, isError, isRequired, hasMessage and displayMessage via scoped slot', () => {
            let capturedProps: any = null;

            mount(InputBase, {
                props: {
                    label: 'Nome de Usuário',
                    required: true,
                    error: 'Campo obrigatório'
                },
                slots: {
                    default: (slotProps: any) => {
                        capturedProps = slotProps;
                        return h('input', {
                            id: slotProps.inputId,
                            'aria-describedby': slotProps.messageId,
                            'aria-invalid': slotProps.isError,
                            'aria-required': slotProps.isRequired
                        });
                    }
                }
            });

            expect(capturedProps).not.toBeNull();
            expect(typeof capturedProps.inputId).toBe('string');
            expect(capturedProps.inputId.length).toBeGreaterThan(0);
            expect(typeof capturedProps.messageId).toBe('string');
            expect(capturedProps.messageId.length).toBeGreaterThan(0);
            expect(capturedProps.isError).toBe(true);
            expect(capturedProps.isRequired).toBe(true);
            expect(capturedProps.hasMessage).toBe(true);
            expect(capturedProps.displayMessage).toBe('Campo obrigatório');
        });

        it('reports isError as false and hasMessage as false when input is valid and clean', () => {
            let capturedProps: any = null;

            mount(InputBase, {
                props: {
                    label: 'E-mail',
                    required: false
                },
                slots: {
                    default: (slotProps: any) => {
                        capturedProps = slotProps;
                        return h('input', { id: slotProps.inputId });
                    }
                }
            });

            expect(capturedProps.isError).toBe(false);
            expect(capturedProps.isRequired).toBe(false);
            expect(capturedProps.hasMessage).toBe(false);
            expect(capturedProps.displayMessage).toBe('');
        });
    });

    describe('Label and Input Associations', () => {
        it('matches label for attribute with the inner input id', () => {
            const wrapper = mount(InputBase, {
                props: { label: 'Telefone Residencial' },
                slots: {
                    default: ({ inputId }: { inputId: string }) => h('input', { id: inputId })
                }
            });

            const label = wrapper.find('label.max-input-label');
            const input = wrapper.find('input');

            expect(label.exists()).toBe(true);
            expect(input.exists()).toBe(true);
            expect(label.attributes('for')).toBe(input.attributes('id'));
        });

        it('associates messageId with input aria-describedby when feedback exists', () => {
            const wrapper = mount(InputBase, {
                props: {
                    label: 'Senha',
                    error: 'Senha muito curta'
                },
                slots: {
                    default: ({ inputId, messageId }: { inputId: string; messageId: string }) =>
                        h('input', { id: inputId, 'aria-describedby': messageId })
                }
            });

            const messageEl = wrapper.find('.input-message');
            const input = wrapper.find('input');

            expect(messageEl.attributes('id')).toBeTruthy();
            expect(input.attributes('aria-describedby')).toBe(messageEl.attributes('id'));
            expect(messageEl.attributes('role')).toBe('alert');
            expect(messageEl.attributes('aria-live')).toBe('polite');
        });
    });

    describe('Provide/Inject Context via useInputBaseContext', () => {
        it('provides reactive context to deep child components inside InputBase', () => {
            const wrapper = mount(InputBase, {
                props: {
                    label: 'Documento',
                    required: true,
                    error: 'CPF inválido'
                },
                slots: {
                    default: () => h(TestChildConsumer)
                }
            });

            const consumer = wrapper.find('.has-context');
            expect(consumer.exists()).toBe(true);
            expect(consumer.attributes('data-is-error')).toBe('true');
            expect(consumer.attributes('data-is-required')).toBe('true');
            expect(consumer.attributes('data-has-message')).toBe('true');
            expect(consumer.attributes('data-display-message')).toBe('CPF inválido');
        });

        it('returns null when useInputBaseContext is invoked outside InputBase', () => {
            const wrapper = mount(TestChildConsumer);
            expect(wrapper.find('.no-context').exists()).toBe(true);
        });
    });

    describe('Integrated Form Components Compliance', () => {
        it('MaxInputText forwards id, aria-describedby, aria-invalid and aria-required', () => {
            const wrapper = mount(MaxInputText, {
                props: {
                    label: 'Sobrenome',
                    required: true,
                    error: 'Sobrenome obrigatório',
                    modelValue: ''
                }
            });

            const input = wrapper.find('input.max-input-native');
            const label = wrapper.find('label.max-input-label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(label.exists()).toBe(true);
            expect(input.attributes('id')).toBe(label.attributes('for'));
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-required')).toBe('true');
        });

        it('MaxInputNumber forwards id, aria-describedby, aria-invalid and aria-required', () => {
            const wrapper = mount(MaxInputNumber, {
                props: {
                    label: 'Idade',
                    required: true,
                    error: 'Valor inválido',
                    modelValue: null
                }
            });

            const input = wrapper.find('input.max-input-native');
            const label = wrapper.find('label.max-input-label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBe(label.attributes('for'));
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-required')).toBe('true');
        });

        it('MaxInputTextArea forwards id, aria-describedby, aria-invalid and aria-required', () => {
            const wrapper = mount(MaxInputTextArea, {
                props: {
                    label: 'Observações',
                    required: true,
                    caution: 'Limite de caracteres próximo',
                    modelValue: ''
                }
            });

            const textarea = wrapper.find('textarea.max-textarea');
            const label = wrapper.find('label.max-input-label');
            const message = wrapper.find('.input-message');

            expect(textarea.exists()).toBe(true);
            expect(textarea.attributes('id')).toBe(label.attributes('for'));
            expect(textarea.attributes('aria-describedby')).toBe(message.attributes('id'));
            expect(textarea.attributes('aria-required')).toBe('true');
        });

        it('MaxChips forwards id, aria-describedby, aria-invalid and aria-required to its input', () => {
            const wrapper = mount(MaxChips, {
                props: {
                    label: 'Tags',
                    required: true,
                    error: 'Selecione ao menos uma tag',
                    modelValue: []
                }
            });

            const input = wrapper.find('input.max-chips-input');
            const label = wrapper.find('label.max-input-label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBe(label.attributes('for'));
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-required')).toBe('true');
        });

        it('MaxInputSelect forwards id, aria-describedby, aria-invalid and aria-required to combobox element', () => {
            const wrapper = mount(MaxInputSelect, {
                props: {
                    label: 'País',
                    required: true,
                    error: 'Selecione um país',
                    options: ['Brasil', 'Argentina', 'Chile'],
                    modelValue: null
                }
            });

            const trigger = wrapper.find('.max-select');
            const label = wrapper.find('label.max-input-label');
            const message = wrapper.find('.input-message');

            expect(trigger.exists()).toBe(true);
            expect(trigger.attributes('id')).toBe(label.attributes('for'));
            expect(trigger.attributes('aria-describedby')).toBe(message.attributes('id'));
            expect(trigger.attributes('aria-invalid')).toBe('true');
            expect(trigger.attributes('aria-required')).toBe('true');
        });

        it('MaxInputDatePicker forwards id, aria-describedby, aria-invalid and aria-required to native input', () => {
            const wrapper = mount(MaxInputDatePicker, {
                props: {
                    label: 'Data de Nascimento',
                    required: true,
                    error: 'Data inválida',
                    modelValue: null
                }
            });

            const input = wrapper.find('input.max-datepicker-input');
            const label = wrapper.find('label.max-input-label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBe(label.attributes('for'));
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-required')).toBe('true');
        });

        it('MaxInputCpfCnpj forwards id, aria-describedby, aria-invalid and aria-required', () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: {
                    label: 'CPF / CNPJ',
                    required: true,
                    error: 'Documento incompleto',
                    modelValue: ''
                }
            });

            const input = wrapper.find('input.max-input-native');
            const label = wrapper.find('label.max-input-label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBe(label.attributes('for'));
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-required')).toBe('true');
        });

        it('MaxInputPhone forwards id, aria-describedby, aria-invalid and aria-required', () => {
            const wrapper = mount(MaxInputPhone, {
                props: {
                    label: 'Telefone Celular',
                    required: true,
                    caution: 'Verifique o DDD informado',
                    modelValue: ''
                }
            });

            const input = wrapper.find('input.max-input-native');
            const label = wrapper.find('label.max-input-label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBe(label.attributes('for'));
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
        });
    });
});
