import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputMoney from '../../src/components/MaxInputMoney.vue';
import MaxInputCep from '../../src/components/MaxInputCep.vue';
import MaxInputPhone from '../../src/components/MaxInputPhone.vue';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import MaxInputPower from '../../src/components/MaxInputPower.vue';
import MaxInputMonthDays from '../../src/components/MaxInputMonthDays.vue';
import MaxInputDiscount from '../../src/components/MaxInputDiscount.vue';
import MaxChips from '../../src/components/MaxChips.vue';
import MaxInputRG from '../../src/components/MaxInputRG.vue';
import MaxInputDateRange from '../../src/components/MaxInputDateRange.vue';
import MaxInputPhoneMail from '../../src/components/MaxInputPhoneMail.vue';
import MaxInputEmail from '../../src/components/MaxInputEmail.vue';
import MaxInputUrl from '../../src/components/MaxInputUrl.vue';
import MaxInputPassword from '../../src/components/MaxInputPassword.vue';
import MaxInputSlug from '../../src/components/MaxInputSlug.vue';
import MaxInputCredential from '../../src/components/MaxInputCredential.vue';
import MaxInputAutoComplete from '../../src/components/MaxInputAutoComplete.vue';
import MaxInputOTP from '../../src/components/MaxInputOTP.vue';

describe('Resolução de sugestões e autocomplete (spec §3.1)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('Componentes com fallthrough e repasse padrão', () => {
        const standardComponents = [
            { name: 'MaxInputText', component: MaxInputText, selector: 'input', props: { modelValue: '' } },
            { name: 'MaxInputNumber', component: MaxInputNumber, selector: 'input', props: { modelValue: 0 } },
            { name: 'MaxInputMoney', component: MaxInputMoney, selector: 'input', props: { modelValue: 0 } },
            { name: 'MaxInputCep', component: MaxInputCep, selector: 'input', props: { modelValue: '' } },
            { name: 'MaxInputPhone', component: MaxInputPhone, selector: 'input.phone-number-input', props: { modelValue: '' } },
            { name: 'MaxInputTextArea', component: MaxInputTextArea, selector: 'textarea', props: { modelValue: '' } },
            { name: 'MaxInputPower', component: MaxInputPower, selector: 'input', props: { modelValue: 0 } },
            { name: 'MaxInputMonthDays', component: MaxInputMonthDays, selector: 'input', props: { modelValue: [] } },
            { name: 'MaxInputDiscount', component: MaxInputDiscount, selector: 'input.max-discount-input', props: { modelValue: 0 } },
            { name: 'MaxChips', component: MaxChips, selector: 'input.max-chips-input', props: { modelValue: [] } }
        ];

        standardComponents.forEach(({ name, component, selector, props }) => {
            describe(name, () => {
                it('renderiza autocomplete="off" por padrão', () => {
                    const wrapper = mount(component as any, { props: props as any });
                    const input = wrapper.find(selector);
                    expect(input.exists()).toBe(true);
                    expect(input.attributes('autocomplete')).toBe('off');
                });

                it('omite o atributo autocomplete quando suggestions é true', () => {
                    const wrapper = mount(component as any, { props: { ...props, suggestions: true } as any });
                    const input = wrapper.find(selector);
                    expect(input.exists()).toBe(true);
                    expect(input.attributes('autocomplete')).toBeUndefined();
                });

                it('preserva autocomplete explícito passado pelo consumidor', () => {
                    const wrapper = mount(component as any, {
                        props: props as any,
                        attrs: { autocomplete: 'address-line1' }
                    });
                    const input = wrapper.find(selector);
                    expect(input.exists()).toBe(true);
                    expect(input.attributes('autocomplete')).toBe('address-line1');
                });

                it('não vaza atributo HTML suggestions para o nó operável', () => {
                    const wrapper = mount(component as any, { props: { ...props, suggestions: true } as any });
                    const input = wrapper.find(selector);
                    expect(input.attributes('suggestions')).toBeUndefined();
                });
            });
        });
    });

    describe('MaxInputPhoneMail (sem vazar atributo HTML)', () => {
        it('renderiza autocomplete="off" por padrão', () => {
            const wrapper = mount(MaxInputPhoneMail, { props: { modelValue: '' } });
            const input = wrapper.find('input');
            expect(input.attributes('autocomplete')).toBe('off');
        });

        it('omite o atributo autocomplete quando suggestions é true', () => {
            const wrapper = mount(MaxInputPhoneMail, { props: { modelValue: '', suggestions: true } });
            const input = wrapper.find('input');
            expect(input.attributes('autocomplete')).toBeUndefined();
        });

        it('preserva autocomplete explícito', () => {
            const wrapper = mount(MaxInputPhoneMail, {
                props: { modelValue: '' },
                attrs: { autocomplete: 'username' }
            });
            const input = wrapper.find('input');
            expect(input.attributes('autocomplete')).toBe('username');
        });

        it('não renderiza atributo HTML suggestions no input', () => {
            const wrapper = mount(MaxInputPhoneMail, { props: { modelValue: '', suggestions: true } });
            const input = wrapper.find('input');
            expect(input.attributes('suggestions')).toBeUndefined();
        });
    });

    describe('MaxInputRG (múltiplos campos)', () => {
        it('todas as caixas renderizam autocomplete="off" por padrão', () => {
            const wrapper = mount(MaxInputRG, {
                props: { modelValue: '', showIssuer: true, showUf: true }
            });
            const inputs = wrapper.findAll('input');
            expect(inputs).toHaveLength(3);
            for (const input of inputs) expect(input.attributes('autocomplete')).toBe('off');
        });

        it('todas as caixas omitem autocomplete quando suggestions é true', () => {
            const wrapper = mount(MaxInputRG, {
                props: { modelValue: '', showIssuer: true, showUf: true, suggestions: true }
            });
            const inputs = wrapper.findAll('input');
            expect(inputs).toHaveLength(3);
            for (const input of inputs) expect(input.attributes('autocomplete')).toBeUndefined();
        });

        it('todas as caixas preservam autocomplete explícito', () => {
            const wrapper = mount(MaxInputRG, {
                props: { modelValue: '', showIssuer: true, showUf: true },
                attrs: { autocomplete: 'off' }
            });
            const inputs = wrapper.findAll('input');
            for (const input of inputs) expect(input.attributes('autocomplete')).toBe('off');
        });
    });

    describe('MaxInputDateRange (caixas de início e fim)', () => {
        it('ambas as caixas renderizam autocomplete="off" por padrão', () => {
            const wrapper = mount(MaxInputDateRange);
            const inputs = wrapper.findAll('input');
            expect(inputs).toHaveLength(2);
            for (const input of inputs) expect(input.attributes('autocomplete')).toBe('off');
        });

        it('ambas as caixas omitem autocomplete quando suggestions é true', () => {
            const wrapper = mount(MaxInputDateRange, {
                props: { suggestions: true }
            });
            const inputs = wrapper.findAll('input');
            expect(inputs).toHaveLength(2);
            for (const input of inputs) expect(input.attributes('autocomplete')).toBeUndefined();
        });
    });

    describe('Inputs semânticos com tokens específicos', () => {
        describe('MaxInputEmail', () => {
            it('renderiza autocomplete="off" por padrão', () => {
                const wrapper = mount(MaxInputEmail, { props: { modelValue: '' } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('off');
            });

            it('renderiza autocomplete="email" com suggestions=true', () => {
                const wrapper = mount(MaxInputEmail, { props: { modelValue: '', suggestions: true } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('email');
            });

            it('permite sobrescrever com autocomplete explícito', () => {
                const wrapper = mount(MaxInputEmail, { props: { modelValue: '', autocomplete: 'username' } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('username');
            });
        });

        describe('MaxInputUrl', () => {
            it('renderiza autocomplete="off" por padrão', () => {
                const wrapper = mount(MaxInputUrl, { props: { modelValue: '' } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('off');
            });

            it('renderiza autocomplete="url" com suggestions=true', () => {
                const wrapper = mount(MaxInputUrl, { props: { modelValue: '', suggestions: true } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('url');
            });

            it('permite sobrescrever com autocomplete explícito', () => {
                const wrapper = mount(MaxInputUrl, { props: { modelValue: '', autocomplete: 'web' } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('web');
            });
        });

        describe('MaxInputPassword', () => {
            it('renderiza autocomplete="off" por padrão', () => {
                const wrapper = mount(MaxInputPassword, { props: { modelValue: '' } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('off');
            });

            it('renderiza autocomplete="current-password" com suggestions=true', () => {
                const wrapper = mount(MaxInputPassword, { props: { modelValue: '', suggestions: true } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('current-password');
            });

            it('permite sobrescrever com new-password', () => {
                const wrapper = mount(MaxInputPassword, { props: { modelValue: '', autocomplete: 'new-password' } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('new-password');
            });
        });

        describe('MaxInputSlug', () => {
            it('renderiza autocomplete="off" por padrão', () => {
                const wrapper = mount(MaxInputSlug, { props: { modelValue: '' } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('off');
            });

            it('omite autocomplete com suggestions=true', () => {
                const wrapper = mount(MaxInputSlug, { props: { modelValue: '', suggestions: true } });
                expect(wrapper.find('input').attributes('autocomplete')).toBeUndefined();
            });

            it('permite sobrescrever com autocomplete explícito', () => {
                const wrapper = mount(MaxInputSlug, { props: { modelValue: '', autocomplete: 'my-slug' } });
                expect(wrapper.find('input').attributes('autocomplete')).toBe('my-slug');
            });
        });
    });

    describe('Exceções (fora de escopo de suggestions)', () => {
        it('MaxInputCredential permanece sempre autocomplete="off"', () => {
            const wrapper = mount(MaxInputCredential, { props: { modelValue: '', suggestions: true } });
            expect(wrapper.find('input').attributes('autocomplete')).toBe('off');
        });

        it('MaxInputAutoComplete permanece sempre autocomplete="off"', () => {
            const wrapper = mount(MaxInputAutoComplete, {
                props: { modelValue: '', options: ['Opção 1', 'Opção 2'], suggestions: true }
            });
            expect(wrapper.find('input').attributes('autocomplete')).toBe('off');
        });

        it('MaxInputOTP mantém one-time-code na 1ª casa e off nas demais', () => {
            const wrapper = mount(MaxInputOTP, { props: { modelValue: '', length: 4 } });
            const inputs = wrapper.findAll('input');
            expect(inputs).toHaveLength(4);
            expect(inputs[0].attributes('autocomplete')).toBe('one-time-code');
            expect(inputs[1].attributes('autocomplete')).toBe('off');
            expect(inputs[2].attributes('autocomplete')).toBe('off');
            expect(inputs[3].attributes('autocomplete')).toBe('off');
        });
    });
});
