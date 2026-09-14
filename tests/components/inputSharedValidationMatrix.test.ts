import { describe, it, expect, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import InputBase from '../../src/components/InputBase.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import MaxInputCep from '../../src/components/MaxInputCep.vue';
import MaxInputCreditCard from '../../src/components/MaxInputCreditCard.vue';
import MaxInputCreditCardDate from '../../src/components/MaxInputCreditCardDate.vue';

interface InputAdapterPublicInstance {
    submit: () => boolean;
    reset: () => void;
    onBlur: () => void;
    done: boolean | null;
    caution: boolean;
    resolvedError: string | boolean | null | undefined;
}

function getExposed(wrapper: VueWrapper): InputAdapterPublicInstance {
    return wrapper.vm as unknown as InputAdapterPublicInstance;
}

describe('Matriz Compartilhada de Validação de Adaptadores de Entrada (R05 / F06 / E03-03)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('MaxInputCpfCnpj', () => {
        const VALID_CPF = '52998224725';
        const INCOMPLETE_CPF = '52998';

        it('mount: estado inicial neutro quando required=true e vazio (sem erro nem aria-invalid)', () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: '', required: true, cpf: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBeUndefined();
            expect(input.attributes('aria-invalid')).toBeUndefined();
        });

        it('blur: ativa erro de campo obrigatório e marca aria-invalid="true" após perda de foco', async () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: '', required: true, cpf: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            await input.trigger('blur');
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBe('Campo obrigatório');
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('submit: método imperativo valida e ativa erro de campo obrigatório sem necessidade de blur prévio', async () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: '', required: true, cpf: true }
            });
            const exposed = getExposed(wrapper);
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            const isValid = exposed.submit();
            await wrapper.vm.$nextTick();

            expect(isValid).toBe(false);
            expect(inputBase.props('error')).toBe('Campo obrigatório');
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('valor incompleto: ativa mensagem de documento inválido após interação', async () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: INCOMPLETE_CPF, cpf: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            await input.trigger('blur');
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBe('CPF inválido');
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('correção: limpa o erro imediatamente quando o valor atinge um formato válido', async () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: INCOMPLETE_CPF, cpf: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(inputBase.props('error')).toBe('CPF inválido');

            await wrapper.setProps({ modelValue: VALID_CPF });
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBeUndefined();
            expect(inputBase.props('done')).toBe(true);
            expect(input.attributes('aria-invalid')).toBeUndefined();
        });

        it('contrato booleano: prop error=true é preservada e ativa aria-invalid no input', () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: '', error: true, cpf: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBe(true);
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('contrato string: prop error com mensagem customizada é repassada para o InputBase', () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: '', error: 'Documento já cadastrado', cpf: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBe('Documento já cadastrado');
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('precedência e reset externo: alteração de error para false ou undefined limpa o erro externo', async () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: VALID_CPF, error: true, cpf: true }
            });
            const inputBase = wrapper.findComponent(InputBase);

            expect(inputBase.props('error')).toBe(true);

            await wrapper.setProps({ error: false });
            await wrapper.vm.$nextTick();
            expect(inputBase.props('error')).toBeUndefined();

            await wrapper.setProps({ error: undefined });
            await wrapper.vm.$nextTick();
            expect(inputBase.props('error')).toBeUndefined();
        });

        it('reset do componente pai: ao limpar modelValue para vazio, retorna ao estado neutro', async () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: '', required: true, cpf: true }
            });
            const input = wrapper.find('input');
            const inputBase = wrapper.findComponent(InputBase);

            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(inputBase.props('error')).toBe('Campo obrigatório');

            const exposed = getExposed(wrapper);
            exposed.reset();
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBeUndefined();
            expect(input.attributes('aria-invalid')).toBeUndefined();
        });
    });

    describe('MaxInputCep', () => {
        const VALID_CEP = '01001000';
        const INCOMPLETE_CEP = '0100';

        it('mount: estado inicial neutro quando required=true e vazio', () => {
            const wrapper = mount(MaxInputCep, {
                props: { modelValue: '', required: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBeUndefined();
            expect(input.attributes('aria-invalid')).toBeUndefined();
        });

        it('blur: ativa erro de campo obrigatório após perda de foco em campo vazio', async () => {
            const wrapper = mount(MaxInputCep, {
                props: { modelValue: '', required: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            await input.trigger('blur');
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBe('Campo obrigatório');
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('submit: validação programática aciona erro de campo obrigatório', async () => {
            const wrapper = mount(MaxInputCep, {
                props: { modelValue: '', required: true }
            });
            const exposed = getExposed(wrapper);
            const inputBase = wrapper.findComponent(InputBase);

            const isValid = exposed.submit();
            await wrapper.vm.$nextTick();

            expect(isValid).toBe(false);
            expect(inputBase.props('error')).toBe('Campo obrigatório');
        });

        it('valor incompleto: exibe CEP inválido', async () => {
            const wrapper = mount(MaxInputCep, {
                props: { modelValue: INCOMPLETE_CEP }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBe('CEP inválido');
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('correção: limpa erro ao atingir 8 dígitos válidos', async () => {
            const wrapper = mount(MaxInputCep, {
                props: { modelValue: INCOMPLETE_CEP }
            });
            const inputBase = wrapper.findComponent(InputBase);

            expect(inputBase.props('error')).toBe('CEP inválido');

            await wrapper.setProps({ modelValue: VALID_CEP });
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBeUndefined();
            expect(inputBase.props('done')).toBe(true);
        });

        it('contrato booleano: error=true repassa true para InputBase e marca aria-invalid', () => {
            const wrapper = mount(MaxInputCep, {
                props: { modelValue: VALID_CEP, error: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBe(true);
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('contrato string: error com texto customizado repassa string para InputBase', () => {
            const wrapper = mount(MaxInputCep, {
                props: { modelValue: VALID_CEP, error: 'Região fora da área de entrega' }
            });
            const inputBase = wrapper.findComponent(InputBase);

            expect(inputBase.props('error')).toBe('Região fora da área de entrega');
        });

        it('reset externo: reset() restaura estado neutro sem erros', async () => {
            const wrapper = mount(MaxInputCep, {
                props: { modelValue: '', required: true }
            });
            const input = wrapper.find('input');
            const inputBase = wrapper.findComponent(InputBase);

            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(inputBase.props('error')).toBe('Campo obrigatório');

            const exposed = getExposed(wrapper);
            exposed.reset();
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBeUndefined();
        });
    });

    describe('MaxInputCreditCard', () => {
        const VALID_CARD = '4111111111111111';
        const INCOMPLETE_CARD = '411111';

        it('mount: estado neutro quando required=true e vazio', () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: '', required: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBeUndefined();
            expect(input.attributes('aria-invalid')).toBeUndefined();
        });

        it('blur: ativa erro de campo obrigatório após blur em campo vazio', async () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: '', required: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            await input.trigger('blur');
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBe('Campo obrigatório');
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('submit: validação programática ativa erro de campo obrigatório', async () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: '', required: true }
            });
            const exposed = getExposed(wrapper);
            const inputBase = wrapper.findComponent(InputBase);

            const isValid = exposed.submit();
            await wrapper.vm.$nextTick();

            expect(isValid).toBe(false);
            expect(inputBase.props('error')).toBe('Campo obrigatório');
        });

        it('valor incompleto: marca erro de número de cartão inválido após blur', async () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: INCOMPLETE_CARD }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            await input.trigger('blur');
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBe('Número de cartão inválido');
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('correção: limpa erro quando o número de cartão se torna válido', async () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: INCOMPLETE_CARD }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(inputBase.props('error')).toBe('Número de cartão inválido');

            await wrapper.setProps({ modelValue: VALID_CARD });
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBeUndefined();
            expect(inputBase.props('done')).toBe(true);
        });

        it('contrato booleano: error=true repassa true para InputBase e marca aria-invalid', () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: VALID_CARD, error: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBe(true);
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('contrato string: error com texto repassa string customizada para InputBase', () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: VALID_CARD, error: 'Bandeira não suportada' }
            });
            const inputBase = wrapper.findComponent(InputBase);

            expect(inputBase.props('error')).toBe('Bandeira não suportada');
        });

        it('reset externo: reset() restaura estado neutro sem erros', async () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: '', required: true }
            });
            const input = wrapper.find('input');
            const inputBase = wrapper.findComponent(InputBase);

            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(inputBase.props('error')).toBe('Campo obrigatório');

            const exposed = getExposed(wrapper);
            exposed.reset();
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBeUndefined();
        });
    });

    describe('MaxInputCreditCardDate', () => {
        const VALID_DATE = '1230';
        const INCOMPLETE_DATE = '12';
        const INVALID_MONTH = '1330';

        it('mount: estado neutro quando required=true e vazio', () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                props: { modelValue: '', required: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBeUndefined();
            expect(input.attributes('aria-invalid')).toBeUndefined();
        });

        it('blur: ativa erro de campo obrigatório após blur em campo vazio', async () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                props: { modelValue: '', required: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            await input.trigger('blur');
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBe('Campo obrigatório');
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('submit: validação programática ativa erro de campo obrigatório', async () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                props: { modelValue: '', required: true }
            });
            const exposed = getExposed(wrapper);
            const inputBase = wrapper.findComponent(InputBase);

            const isValid = exposed.submit();
            await wrapper.vm.$nextTick();

            expect(isValid).toBe(false);
            expect(inputBase.props('error')).toBe('Campo obrigatório');
        });

        it('valor incompleto ou mês inválido: marca erro de validade inválida após blur', async () => {
            const wrapperIncomplete = mount(MaxInputCreditCardDate, {
                props: { modelValue: INCOMPLETE_DATE }
            });
            await wrapperIncomplete.find('input').trigger('blur');
            await wrapperIncomplete.vm.$nextTick();
            expect(wrapperIncomplete.findComponent(InputBase).props('error')).toBe('Validade inválida');

            const wrapperInvalidMonth = mount(MaxInputCreditCardDate, {
                props: { modelValue: INVALID_MONTH }
            });
            await wrapperInvalidMonth.find('input').trigger('blur');
            await wrapperInvalidMonth.vm.$nextTick();
            expect(wrapperInvalidMonth.findComponent(InputBase).props('error')).toBe('Validade inválida');
        });

        it('correção: limpa erro quando a validade se torna válida', async () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                props: { modelValue: INCOMPLETE_DATE }
            });
            const inputBase = wrapper.findComponent(InputBase);

            await wrapper.find('input').trigger('blur');
            await wrapper.vm.$nextTick();
            expect(inputBase.props('error')).toBe('Validade inválida');

            await wrapper.setProps({ modelValue: VALID_DATE });
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBeUndefined();
            expect(inputBase.props('done')).toBe(true);
        });

        it('contrato booleano: error=true repassa true para InputBase e marca aria-invalid', () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                props: { modelValue: VALID_DATE, error: true }
            });
            const inputBase = wrapper.findComponent(InputBase);
            const input = wrapper.find('input');

            expect(inputBase.props('error')).toBe(true);
            expect(input.attributes('aria-invalid')).toBe('true');
        });

        it('contrato string: error com texto repassa string customizada para InputBase', () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                props: { modelValue: VALID_DATE, error: 'Cartão vencido' }
            });
            const inputBase = wrapper.findComponent(InputBase);

            expect(inputBase.props('error')).toBe('Cartão vencido');
        });

        it('reset externo: reset() restaura estado neutro sem erros', async () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                props: { modelValue: '', required: true }
            });
            const input = wrapper.find('input');
            const inputBase = wrapper.findComponent(InputBase);

            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(inputBase.props('error')).toBe('Campo obrigatório');

            const exposed = getExposed(wrapper);
            exposed.reset();
            await wrapper.vm.$nextTick();

            expect(inputBase.props('error')).toBeUndefined();
        });
    });
});
