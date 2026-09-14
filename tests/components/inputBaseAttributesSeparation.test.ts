import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputPhone from '../../src/components/MaxInputPhone.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxInputSearch from '../../src/components/MaxInputSearch.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import MaxInputCep from '../../src/components/MaxInputCep.vue';
import MaxInputCreditCard from '../../src/components/MaxInputCreditCard.vue';
import MaxInputCreditCardDate from '../../src/components/MaxInputCreditCardDate.vue';
import MaxInputCreditCardCvv from '../../src/components/MaxInputCreditCardCvv.vue';
import MaxInputCoordinateDecimalLat from '../../src/components/MaxInputCoordinateDecimalLat.vue';
import MaxInputCoordinateDecimalLng from '../../src/components/MaxInputCoordinateDecimalLng.vue';
import MaxInputToggle from '../../src/components/MaxInputToggle.vue';
import MaxInputRadio from '../../src/components/MaxInputRadio.vue';
import MaxInputCheckbox from '../../src/components/MaxInputCheckbox.vue';
import InputBase from '../../src/components/InputBase.vue';

describe('Separação de atributos nativos de controle e wrapper (R04 / F05)', () => {
    describe('Classificação estrita em InputBase', () => {
        it('filtra atributos de controle e ARIA do wrapper raiz e os disponibiliza para o slot', () => {
            const wrapper = mount(InputBase, {
                props: {
                    label: 'Campo Geral'
                },
                attrs: {
                    id: 'custom-input-id',
                    name: 'form_field',
                    disabled: true,
                    required: true,
                    autocomplete: 'off',
                    autocapitalize: 'words',
                    autocorrect: 'on',
                    enterkeyhint: 'send',
                    size: '20',
                    maxlength: '50',
                    minlength: '2',
                    placeholder: 'Digite algo...',
                    'aria-label': 'Rotulo Acessivel',
                    'data-testid': 'base-wrapper-test',
                    class: 'custom-root-class'
                },
                slots: {
                    default: `
                        <template #default="{ inputAttrs }">
                            <input class="slot-native-input" v-bind="inputAttrs" />
                        </template>
                    `
                }
            });

            const rootEl = wrapper.find('.max-input-main-div');
            expect(rootEl.exists()).toBe(true);
            expect(rootEl.classes()).toContain('custom-root-class');
            expect(rootEl.attributes('data-testid')).toBe('base-wrapper-test');

            // Atributos de formulário e ARIA JAMAIS podem permanecer no wrapper
            expect(rootEl.attributes('name')).toBeUndefined();
            expect(rootEl.attributes('disabled')).toBeUndefined();
            expect(rootEl.attributes('required')).toBeUndefined();
            expect(rootEl.attributes('autocomplete')).toBeUndefined();
            expect(rootEl.attributes('autocapitalize')).toBeUndefined();
            expect(rootEl.attributes('autocorrect')).toBeUndefined();
            expect(rootEl.attributes('enterkeyhint')).toBeUndefined();
            expect(rootEl.attributes('size')).toBeUndefined();
            expect(rootEl.attributes('maxlength')).toBeUndefined();
            expect(rootEl.attributes('minlength')).toBeUndefined();
            expect(rootEl.attributes('placeholder')).toBeUndefined();
            expect(rootEl.attributes('aria-label')).toBeUndefined();
            expect(rootEl.attributes('aria-required')).toBeUndefined();

            // Atributos de controle DEVEM ser repassados para o slot
            const inputEl = wrapper.find('.slot-native-input');
            expect(inputEl.exists()).toBe(true);
            expect(inputEl.attributes('id')).toBe('custom-input-id');
            expect(inputEl.attributes('name')).toBe('form_field');
            expect(inputEl.attributes('disabled')).toBeDefined();
            expect(inputEl.attributes('aria-disabled')).toBe('true');
            expect(inputEl.attributes('autocomplete')).toBe('off');
            expect(inputEl.attributes('autocapitalize')).toBe('words');
            expect(inputEl.attributes('autocorrect')).toBe('on');
            expect(inputEl.attributes('enterkeyhint')).toBe('send');
            expect(inputEl.attributes('size')).toBe('20');
            expect(inputEl.attributes('maxlength')).toBe('50');
            expect(inputEl.attributes('minlength')).toBe('2');
            expect(inputEl.attributes('placeholder')).toBe('Digite algo...');
            expect(inputEl.attributes('aria-label')).toBe('Rotulo Acessivel');
            expect(inputEl.attributes('aria-required')).toBe('true');
        });
    });

    describe('Parametrizado nas principais famílias de inputs', () => {
        const inputFamilies = [
            { name: 'MaxInputText', component: MaxInputText, selector: 'input.max-input-native' },
            { name: 'MaxInputTextArea', component: MaxInputTextArea, selector: 'textarea' },
            { name: 'MaxInputNumber', component: MaxInputNumber, selector: 'input.max-input-native' },
            { name: 'MaxInputPhone', component: MaxInputPhone, selector: 'input.max-input-native' },
            { name: 'MaxInputDatePicker', component: MaxInputDatePicker, selector: 'input.max-datepicker-input' },
            { name: 'MaxInputSearch', component: MaxInputSearch, selector: 'input.max-input-native' },
            { name: 'MaxInputCpfCnpj', component: MaxInputCpfCnpj, selector: 'input.max-input-native' },
            { name: 'MaxInputCep', component: MaxInputCep, selector: 'input.max-input-native' },
            { name: 'MaxInputCreditCard', component: MaxInputCreditCard, selector: 'input.max-base-input' },
            { name: 'MaxInputCreditCardDate', component: MaxInputCreditCardDate, selector: 'input.max-base-input' },
            { name: 'MaxInputCreditCardCvv', component: MaxInputCreditCardCvv, selector: 'input.max-base-input' },
            { name: 'MaxInputCoordinateDecimalLat', component: MaxInputCoordinateDecimalLat, selector: 'input.max-input-native' },
            { name: 'MaxInputCoordinateDecimalLng', component: MaxInputCoordinateDecimalLng, selector: 'input.max-input-native' }
        ];

        for (const { name, component, selector } of inputFamilies) it(`${name} separa atributos nativos de controle para o elemento ${selector} e preserva dados no wrapper`, () => {
            const wrapper = mount(component, {
                props: {
                    modelValue: ''
                },
                attrs: {
                    name: `field_${name.toLowerCase()}`,
                    autocomplete: 'off',
                    autocapitalize: 'characters',
                    enterkeyhint: 'next',
                    maxlength: '40',
                    'data-testid': `test-${name.toLowerCase()}`,
                    class: `wrapper-class-${name.toLowerCase()}`
                }
            });

            const rootEl = wrapper.find('.max-input-main-div');
            expect(rootEl.exists(), `${name} deve possuir o wrapper .max-input-main-div`).toBe(true);
            expect(rootEl.classes()).toContain(`wrapper-class-${name.toLowerCase()}`);
            expect(rootEl.attributes('data-testid')).toBe(`test-${name.toLowerCase()}`);

            // Não vaza para o wrapper
            expect(rootEl.attributes('name')).toBeUndefined();
            expect(rootEl.attributes('autocomplete')).toBeUndefined();
            expect(rootEl.attributes('autocapitalize')).toBeUndefined();
            expect(rootEl.attributes('enterkeyhint')).toBeUndefined();
            expect(rootEl.attributes('maxlength')).toBeUndefined();

            // Chega ao elemento de controle nativo
            const controlEl = wrapper.find(selector);
            expect(controlEl.exists(), `${name} deve renderizar o controle ${selector}`).toBe(true);
            expect(controlEl.attributes('name')).toBe(`field_${name.toLowerCase()}`);
            expect(controlEl.attributes('autocomplete')).toBe('off');
            expect(controlEl.attributes('autocapitalize')).toBe('characters');
            expect(controlEl.attributes('enterkeyhint')).toBe('next');
            expect(controlEl.attributes('maxlength')).toBe('40');
        });

    });

    describe('Controles binários e especializados (Toggle, Radio, Checkbox)', () => {
        it('MaxInputToggle encaminha name, disabled e required para o checkbox nativo', () => {
            const wrapper = mount(MaxInputToggle, {
                props: {
                    modelValue: false,
                    name: 'accept_terms',
                    disabled: true,
                    required: true
                },
                attrs: {
                    class: 'toggle-wrapper-class',
                    'data-testid': 'toggle-test'
                }
            });

            const rootEl = wrapper.find('.max-input-toggle');
            expect(rootEl.exists()).toBe(true);
            expect(rootEl.classes()).toContain('toggle-wrapper-class');
            expect(rootEl.attributes('data-testid')).toBe('toggle-test');

            expect(rootEl.attributes('name')).toBeUndefined();
            expect(rootEl.attributes('disabled')).toBeUndefined();
            expect(rootEl.attributes('required')).toBeUndefined();

            const checkboxEl = wrapper.find('input.max-toggleswitch-input');
            expect(checkboxEl.exists()).toBe(true);
            expect(checkboxEl.attributes('name')).toBe('accept_terms');
            expect(checkboxEl.attributes('disabled')).toBeDefined();
            expect(checkboxEl.attributes('required')).toBeDefined();
        });

        it('MaxInputCheckbox encaminha name, disabled e required para o input checkbox nativo', () => {
            const wrapper = mount(MaxInputCheckbox, {
                props: {
                    modelValue: false,
                    name: 'subscribe_newsletter',
                    disabled: true,
                    required: true
                },
                attrs: {
                    class: 'checkbox-wrapper-class',
                    'data-testid': 'chk-test'
                }
            });

            const rootEl = wrapper.find('.max-input-checkbox-wrapper, .max-input-checkbox');
            expect(rootEl.exists()).toBe(true);
            expect(rootEl.attributes('name')).toBeUndefined();
            expect(rootEl.attributes('disabled')).toBeUndefined();

            const input = wrapper.find('input[type="checkbox"]');
            expect(input.exists()).toBe(true);
            expect(input.attributes('name')).toBe('subscribe_newsletter');
            expect(input.attributes('disabled')).toBeDefined();
            expect(input.attributes('required')).toBeDefined();
        });

        it('MaxInputRadio encaminha name, disabled e value para o input radio nativo', () => {
            const wrapper = mount(MaxInputRadio, {
                props: {
                    modelValue: 'opt1',
                    value: 'opt1',
                    name: 'plan_selection',
                    disabled: true
                },
                attrs: {
                    class: 'radio-wrapper-class'
                }
            });

            const rootEl = wrapper.find('.max-input-radio-wrapper, .max-input-radio');
            expect(rootEl.exists()).toBe(true);
            expect(rootEl.attributes('name')).toBeUndefined();

            const input = wrapper.find('input[type="radio"]');
            expect(input.exists()).toBe(true);
            expect(input.attributes('name')).toBe('plan_selection');
            expect(input.attributes('disabled')).toBeDefined();
        });
    });

    describe('Interação com label click e submissão nativa em formulário', () => {
        it('associa label e controle via for/id permitindo foco nativo por clique', async () => {
            const wrapper = mount(MaxInputText, {
                props: {
                    label: 'Nome de Usuário',
                    modelValue: ''
                },
                attachTo: document.body
            });

            const labelEl = wrapper.find('label');
            const inputEl = wrapper.find('input.max-input-native');

            expect(labelEl.exists()).toBe(true);
            expect(inputEl.exists()).toBe(true);

            const forAttr = labelEl.attributes('for');
            const idAttr = inputEl.attributes('id');

            expect(forAttr).toBeDefined();
            expect(idAttr).toBeDefined();
            expect(forAttr).toBe(idAttr);
            expect(document.getElementById(forAttr!)).toBe(inputEl.element);

            wrapper.unmount();
        });

        it('envia dados através de formulário HTML nativo ao submeter com campos nomeados', () => {
            const form = document.createElement('form');
            form.id = 'test-form';
            document.body.appendChild(form);

            const wrapper = mount(MaxInputText, {
                props: {
                    modelValue: 'John Doe'
                },
                attrs: {
                    name: 'customer_name',
                    form: 'test-form'
                },
                attachTo: form
            });

            const inputEl = wrapper.find('input.max-input-native');
            expect(inputEl.attributes('name')).toBe('customer_name');
            expect(inputEl.attributes('form')).toBe('test-form');

            const formData = new FormData(form);
            expect(formData.get('customer_name')).toBe('John Doe');

            wrapper.unmount();
            form.remove();
        });
    });
});
