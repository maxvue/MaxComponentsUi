import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import InputBase from '../../src/components/InputBase.vue';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputPhone from '../../src/components/MaxInputPhone.vue';
import MaxInputPhoneMail from '../../src/components/MaxInputPhoneMail.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxInputSearch from '../../src/components/MaxInputSearch.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import MaxInputCep from '../../src/components/MaxInputCep.vue';
import MaxInputCreditCard from '../../src/components/MaxInputCreditCard.vue';
import MaxInputCreditCardDate from '../../src/components/MaxInputCreditCardDate.vue';
import MaxInputCreditCardCvv from '../../src/components/MaxInputCreditCardCvv.vue';
import MaxInputCoordinateDecimalLat from '../../src/components/MaxInputCoordinateDecimalLat.vue';
import MaxInputCoordinateDecimalLng from '../../src/components/MaxInputCoordinateDecimalLng.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxInputAutoComplete from '../../src/components/MaxInputAutoComplete.vue';
import MaxInputAutoCompleteApi from '../../src/components/MaxInputAutoCompleteApi.vue';
import MaxChips from '../../src/components/MaxChips.vue';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';
import MaxColorPicker from '../../src/components/MaxColorPicker.vue';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';
import MaxInputOTP from '../../src/components/MaxInputOTP.vue';
import MaxInputSwitch from '../../src/components/MaxInputSwitch.vue';
import MaxInputTextList from '../../src/components/MaxInputTextList.vue';
import MaxInputToggle from '../../src/components/MaxInputToggle.vue';
import MaxInputRadio from '../../src/components/MaxInputRadio.vue';
import MaxInputCheckbox from '../../src/components/MaxInputCheckbox.vue';

interface FamilyConfig {
    name: string;
    component: any;
    selector: string;
    rootSelector?: string;
    props?: Record<string, any>;
    supportsAutofill?: boolean;
}

const inputFamilies: FamilyConfig[] = [
    { name: 'MaxInputText', component: MaxInputText, selector: 'input.max-input-native', supportsAutofill: true },
    { name: 'MaxInputTextArea', component: MaxInputTextArea, selector: 'textarea', supportsAutofill: true },
    { name: 'MaxInputNumber', component: MaxInputNumber, selector: 'input.max-input-native', supportsAutofill: true },
    { name: 'MaxInputPhone', component: MaxInputPhone, selector: 'input.max-input-native', supportsAutofill: true },
    { name: 'MaxInputPhoneMail', component: MaxInputPhoneMail, selector: 'input.max-input-native', supportsAutofill: true },
    { name: 'MaxInputDatePicker', component: MaxInputDatePicker, selector: 'input.max-datepicker-input', supportsAutofill: true },
    { name: 'MaxInputSearch', component: MaxInputSearch, selector: 'input.max-input-native', supportsAutofill: true },
    { name: 'MaxInputCpfCnpj', component: MaxInputCpfCnpj, selector: 'input.max-input-native', supportsAutofill: true },
    { name: 'MaxInputCep', component: MaxInputCep, selector: 'input.max-input-native', supportsAutofill: true },
    { name: 'MaxInputCreditCard', component: MaxInputCreditCard, selector: 'input.max-base-input', supportsAutofill: true },
    { name: 'MaxInputCreditCardDate', component: MaxInputCreditCardDate, selector: 'input.max-base-input', supportsAutofill: true },
    { name: 'MaxInputCreditCardCvv', component: MaxInputCreditCardCvv, selector: 'input.max-base-input', supportsAutofill: true },
    { name: 'MaxInputCoordinateDecimalLat', component: MaxInputCoordinateDecimalLat, selector: 'input.max-input-native', supportsAutofill: true },
    { name: 'MaxInputCoordinateDecimalLng', component: MaxInputCoordinateDecimalLng, selector: 'input.max-input-native', supportsAutofill: true },
    { name: 'MaxInputSelect', component: MaxInputSelect, selector: '.max-select', props: { options: [] } },
    { name: 'MaxInputAutoComplete', component: MaxInputAutoComplete, selector: 'input.max-autocomplete-input', props: { options: [] }, supportsAutofill: true },
    { name: 'MaxInputAutoCompleteApi', component: MaxInputAutoCompleteApi, selector: 'input.max-autocomplete-input', props: { options: [], route: 'api.test' }, supportsAutofill: true },
    { name: 'MaxChips', component: MaxChips, selector: 'input.max-chips-input', props: { modelValue: [] } },
    { name: 'MaxTagSelect', component: MaxTagSelect, selector: '.max-select', props: { modelValue: [], options: [] } },
    { name: 'MaxColorPicker', component: MaxColorPicker, selector: 'input.max-colorpicker-native', props: { modelValue: '#000000' } },
    { name: 'MaxInputIconPicker', component: MaxInputIconPicker, selector: '.icon-picker-trigger' },
    { name: 'MaxInputOTP', component: MaxInputOTP, selector: '.max-input-otp-container' },
    { name: 'MaxInputSwitch', component: MaxInputSwitch, selector: '.max-switch-toggle', props: { modelValue: false } },
    { name: 'MaxInputTextList', component: MaxInputTextList, selector: 'textarea.code-textarea' },
    { name: 'MaxInputToggle', component: MaxInputToggle, selector: 'input.max-toggleswitch-input', rootSelector: '.max-input-toggle', props: { modelValue: false } }
];

describe('Separação de atributos nativos de controle e wrapper (R04 / F05)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });
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

    describe('Cobertura integral das 25 famílias de componentes de entrada', () => {
        it('a matriz contém exatamente as 25 famílias sem redução artificial', () => {
            expect(inputFamilies.length).toBe(25);
        });

        for (const family of inputFamilies) {
            const { name, component, selector, rootSelector, props: customProps } = family;
            const expectedRootSelector = rootSelector || '.max-input-main-div';

            it(`${name}: separa atributos de controle para o nó operável e preserva classe/dados no wrapper`, () => {
                const wrapper = mount(component, {
                    props: {
                        modelValue: '',
                        ...customProps
                    },
                    attrs: {
                        name: `field_${name.toLowerCase()}`,
                        autocomplete: 'off',
                        'data-testid': `test-${name.toLowerCase()}`,
                        class: `wrapper-class-${name.toLowerCase()}`
                    }
                });

                const rootEl = wrapper.find(expectedRootSelector);
                expect(rootEl.exists(), `${name} deve possuir o wrapper ${expectedRootSelector}`).toBe(true);
                expect(rootEl.classes()).toContain(`wrapper-class-${name.toLowerCase()}`);
                expect(rootEl.attributes('data-testid')).toBe(`test-${name.toLowerCase()}`);

                // Não vaza atributos de controle para o wrapper
                expect(rootEl.attributes('name'), `${name} não deve ter "name" no wrapper`).toBeUndefined();
                expect(rootEl.attributes('autocomplete'), `${name} não deve ter "autocomplete" no wrapper`).toBeUndefined();
                expect(rootEl.attributes('disabled'), `${name} não deve ter "disabled" no wrapper`).toBeUndefined();
                expect(rootEl.attributes('required'), `${name} não deve ter "required" no wrapper`).toBeUndefined();

                // Chega ao elemento operável
                const controlEl = wrapper.find(selector);
                expect(controlEl.exists(), `${name} deve renderizar o nó operável ${selector}`).toBe(true);
                expect(controlEl.attributes('name')).toBe(`field_${name.toLowerCase()}`);
            });

            it(`${name}: propaga disabled e required para o elemento operável sem poluir a raiz`, () => {
                const wrapper = mount(component, {
                    props: {
                        modelValue: '',
                        disabled: true,
                        required: true,
                        ...customProps
                    }
                });

                const rootEl = wrapper.find(expectedRootSelector);
                expect(rootEl.exists()).toBe(true);
                expect(rootEl.attributes('disabled'), `${name} root não deve ter attr disabled`).toBeUndefined();
                expect(rootEl.attributes('required'), `${name} root não deve ter attr required`).toBeUndefined();

                const controlEl = wrapper.find(selector);
                expect(controlEl.exists()).toBe(true);

                const isDisabled = controlEl.attributes('disabled') !== undefined || controlEl.attributes('aria-disabled') === 'true';
                const isRequired = controlEl.attributes('required') !== undefined || controlEl.attributes('aria-required') === 'true';

                expect(isDisabled, `${name} deve marcar disabled/aria-disabled no nó operável`).toBe(true);
                expect(isRequired, `${name} deve marcar required/aria-required no nó operável`).toBe(true);
            });

            it(`${name}: clique no rótulo (label click) transfere foco ao controle sem chamada manual de focus()`, async () => {
                const wrapper = mount(component, {
                    attachTo: document.body,
                    props: {
                        modelValue: '',
                        label: `Rótulo ${name}`,
                        ...customProps
                    }
                });

                const labelEl = wrapper.find('label');
                expect(labelEl.exists(), `${name} deve renderizar o label`).toBe(true);

                const controlEl = wrapper.find(selector);
                expect(controlEl.exists(), `${name} deve possuir o controle ${selector}`).toBe(true);

                // Dispara clique no label sem chamar focus() manualmente
                await labelEl.trigger('click');

                // Verifica se o elemento ativo é o próprio nó operável ou um elemento interativo dentro dele
                const activeEl = document.activeElement;
                const isFocusedDirectly = activeEl === controlEl.element;
                const isFocusedInside = controlEl.element.contains(activeEl);

                expect(isFocusedDirectly || isFocusedInside, `${name} deve focar o controle operável após clique no rótulo`).toBe(true);

                wrapper.unmount();
            });
        }
    });

    describe('Suporte a autofill (autocomplete) nas famílias de texto', () => {
        const textFamilies = inputFamilies.filter((f) => f.supportsAutofill);

        for (const { name, component, selector, props: customProps } of textFamilies) it(`${name}: propaga autocomplete para o elemento interativo de entrada`, () => {
            const wrapper = mount(component, {
                props: {
                    modelValue: '',
                    ...customProps
                },
                attrs: {
                    autocomplete: 'email'
                }
            });

            const controlEl = wrapper.find(selector);
            expect(controlEl.exists()).toBe(true);
            expect(controlEl.attributes('autocomplete')).toBe('email');

            const rootEl = wrapper.find('.max-input-main-div');
            expect(rootEl.attributes('autocomplete')).toBeUndefined();
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

        it('envia dados através de formulário HTML nativo ao submeter com múltiplos campos nomeados de famílias distintas', () => {
            const form = document.createElement('form');
            form.id = 'test-multi-form';
            document.body.appendChild(form);

            const wrapperText = mount(MaxInputText, {
                props: { modelValue: 'John Doe' },
                attrs: { name: 'customer_name', form: 'test-multi-form' },
                attachTo: form
            });

            const wrapperTextArea = mount(MaxInputTextArea, {
                props: { modelValue: 'Observações de teste detalhadas' },
                attrs: { name: 'customer_notes', form: 'test-multi-form' },
                attachTo: form
            });

            const wrapperNumber = mount(MaxInputNumber, {
                props: { modelValue: 42 },
                attrs: { name: 'customer_age', form: 'test-multi-form' },
                attachTo: form
            });

            const wrapperToggle = mount(MaxInputToggle, {
                props: { modelValue: true },
                attrs: { name: 'customer_newsletter', form: 'test-multi-form' },
                attachTo: form
            });

            const inputNative = wrapperText.find('input.max-input-native');
            expect(inputNative.attributes('name')).toBe('customer_name');
            expect(inputNative.attributes('form')).toBe('test-multi-form');

            const textareaNative = wrapperTextArea.find('textarea');
            expect(textareaNative.attributes('name')).toBe('customer_notes');
            expect(textareaNative.attributes('form')).toBe('test-multi-form');

            const numberNative = wrapperNumber.find('input.max-input-native');
            expect(numberNative.attributes('name')).toBe('customer_age');
            expect(numberNative.attributes('form')).toBe('test-multi-form');

            const formData = new FormData(form);
            expect(formData.get('customer_name')).toBe('John Doe');
            expect(formData.get('customer_notes')).toBe('Observações de teste detalhadas');
            expect(formData.get('customer_age')).toBe('42');

            wrapperText.unmount();
            wrapperTextArea.unmount();
            wrapperNumber.unmount();
            wrapperToggle.unmount();
            form.remove();
        });
    });

    describe('MaxInputBirthday: isolamento fora da contagem canônica de 25 famílias', () => {
        it('mantém a contagem canônica estritamente em 25 famílias sem incluir Birthday', () => {
            expect(inputFamilies.length).toBe(25);
            expect(inputFamilies.some((f) => f.name === 'MaxInputBirthday')).toBe(false);
        });

        it('MaxInputBirthday separa atributos de controle e preserva wrapper sem vazamento', async () => {
            const { default: MaxInputBirthday } = await import('../../src/components/MaxInputBirthday.vue');

            const wrapper = mount(MaxInputBirthday, {
                props: {
                    modelValue: '1995-05-20',
                    label: 'Data de Nascimento',
                    disabled: true,
                    required: true
                },
                attrs: {
                    name: 'birthday_field',
                    'data-testid': 'birthday-test-wrapper',
                    class: 'custom-birthday-class'
                }
            });

            const rootEl = wrapper.find('.max-input-birthday');
            expect(rootEl.exists()).toBe(true);
            expect(rootEl.classes()).toContain('custom-birthday-class');
            expect(rootEl.attributes('data-testid')).toBe('birthday-test-wrapper');

            // Wrapper não deve reter atributos operáveis
            expect(rootEl.attributes('name')).toBeUndefined();
            expect(rootEl.attributes('disabled')).toBeUndefined();
            expect(rootEl.attributes('required')).toBeUndefined();

            // Segmentos internos refletem estado desabilitado
            const dayBtn = wrapper.find('.max-birthday-segment--day');
            expect(dayBtn.exists()).toBe(true);
            expect(dayBtn.attributes('disabled')).toBeDefined();

            wrapper.unmount();
        });
    });
});

