import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxChips from '../../src/components/MaxChips.vue';
import MaxColorPicker from '../../src/components/MaxColorPicker.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import MaxInputCep from '../../src/components/MaxInputCep.vue';
import MaxInputCreditCard from '../../src/components/MaxInputCreditCard.vue';
import MaxInputCreditCardDate from '../../src/components/MaxInputCreditCardDate.vue';
import InputBase from '../../src/components/InputBase.vue';

describe('F06 - Matriz de Validação Compartilhada nos 8 Componentes', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('1. MaxInputText', () => {
        it('mount sem erro, blur para erro, correção imediata e reset externo', async () => {
            const wrapper = mount(MaxInputText, {
                props: { modelValue: '', required: true }
            });
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBeFalsy();

            const input = wrapper.find('input');
            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBe('Campo obrigatório');

            await input.setValue('texto valido');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeFalsy();
            expect(ib.props('done')).toBe(true);
        });
    });

    describe('2. MaxInputNumber', () => {
        it('mount sem erro, blur para erro, correção e reset', async () => {
            const wrapper = mount(MaxInputNumber, {
                props: { modelValue: '', required: true }
            });
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBeFalsy();

            const input = wrapper.find('input');
            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBe('Campo obrigatório');

            await input.setValue('42');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeFalsy();
            expect(ib.props('done')).toBe(true);
        });
    });

    describe('3. MaxChips', () => {
        it('mount sem erro, submit/blur para erro, correção e reset', async () => {
            const wrapper = mount(MaxChips, {
                props: { modelValue: [], required: true }
            });
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBeFalsy();

            const vm = wrapper.vm as any;
            if (vm.validation) {
                vm.validation.onBlur();
                await wrapper.vm.$nextTick();
                expect(ib.props('error')).toBe('Campo obrigatório');

                await wrapper.setProps({ modelValue: ['item1'] });
                await wrapper.vm.$nextTick();
                expect(ib.props('error')).toBeFalsy();

                vm.validation.reset();
                await wrapper.vm.$nextTick();
                expect(vm.validation.touched.value).toBe(false);
            }
        });
    });

    describe('4. MaxColorPicker', () => {
        it('modo eager (immediate): exibe erro quando required e vazio, limpa após preenchimento', async () => {
            const wrapper = mount(MaxColorPicker, {
                props: { modelValue: '', required: true }
            });
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBe('Campo obrigatório');

            await wrapper.setProps({ modelValue: '#ff0000' });
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeFalsy();
            expect(ib.props('done')).toBe(true);
        });
    });

    describe('5. MaxInputCpfCnpj', () => {
        it('mount sem erro, formato incompleto sem erro antes do blur, erro no blur, correção e reset', async () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: { modelValue: '', required: true }
            });
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBeUndefined();

            // Digitando formato incompleto: não deve exibir erro antes de perder foco
            const input = wrapper.find('input');
            await input.setValue('12345');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeUndefined();

            // Ao perder o foco (blur), formato incompleto exibe erro
            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBe('CPF inválido');

            // Correção para CPF válido limpa erro imediatamente
            await input.setValue('52998224725');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeUndefined();
            expect(ib.props('done')).toBe(true);

            // Reset restaura estado limpo
            const vm = wrapper.vm as any;
            vm.reset();
            await wrapper.vm.$nextTick();
            expect(vm.validation.touched.value).toBe(false);
        });
    });

    describe('6. MaxInputCep', () => {
        it('mount sem erro, formato incompleto sem erro antes do blur, erro no blur, correção e reset', async () => {
            const wrapper = mount(MaxInputCep, {
                props: { modelValue: '', required: true }
            });
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBeUndefined();

            // Digitando formato incompleto
            const input = wrapper.find('input');
            await input.setValue('0100');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeUndefined();

            // Ao perder o foco com incompleto
            await input.trigger('blur');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBe('CEP inválido');

            // Correção para CEP válido
            await input.setValue('01001000');
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeUndefined();
            expect(ib.props('done')).toBe(true);

            // Reset
            const vm = wrapper.vm as any;
            vm.reset();
            await wrapper.vm.$nextTick();
            expect(vm.validation.touched.value).toBe(false);
        });
    });

    describe('7. MaxInputCreditCard', () => {
        it('mount sem erro, formato incompleto sem erro antes do blur, erro no blur, correção e reset', async () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: '', required: true }
            });
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBeUndefined();

            // Digitando incompleto
            const vm = wrapper.vm as any;
            vm.unmaskedValue = '411111';
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeUndefined();

            // Blur com incompleto
            vm.checkDone();
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBe('Número de cartão inválido');

            // Correção para cartão válido (Visa test)
            vm.unmaskedValue = '4111111111111111';
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeUndefined();
            expect(ib.props('done')).toBe(true);

            // Reset
            vm.reset();
            await wrapper.vm.$nextTick();
            expect(vm.validation.touched.value).toBe(false);
        });
    });

    describe('8. MaxInputCreditCardDate', () => {
        it('mount sem erro, formato incompleto sem erro antes do blur, erro no blur, correção e reset', async () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                props: { modelValue: '', required: true }
            });
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBeUndefined();

            // Digitando incompleto
            const vm = wrapper.vm as any;
            vm.unmaskedValue = '12';
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeUndefined();

            // Blur com incompleto
            vm.checkDone();
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBe('Validade inválida');

            // Correção para data válida (mês 12, ano 30)
            vm.unmaskedValue = '1230';
            await wrapper.vm.$nextTick();
            expect(ib.props('error')).toBeUndefined();
            expect(ib.props('done')).toBe(true);

            // Reset
            vm.reset();
            await wrapper.vm.$nextTick();
            expect(vm.validation.touched.value).toBe(false);
        });
    });
});
