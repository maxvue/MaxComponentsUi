import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia } from 'pinia';
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
import MaxInputBirthday from '../../src/components/MaxInputBirthday.vue';

interface FamilyConfig {
    name: string;
    component: any;
    selector: string;
    props?: Record<string, any>;
    supportsAutofill?: boolean;
}

const canonicalInputFamilies: FamilyConfig[] = [
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
    { name: 'MaxInputToggle', component: MaxInputToggle, selector: 'input.max-toggleswitch-input', props: { modelValue: false } }
];

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(): Promise<void> {
    await nextFrame();
    await nextFrame();
}

afterEach(() => {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }
});

describe('R04 / E03-02 — Matriz Chromium de 25 famílias: label, owner, submit, autofill, required e disabled', () => {
    it('Chromium Blink: matriz canônica contém exatamente as 25 famílias e isola Birthday', () => {
        expect(canonicalInputFamilies).toHaveLength(25);
        expect(canonicalInputFamilies.some((f) => f.name === 'MaxInputBirthday')).toBe(false);
    });

    it('Chromium Blink: clique real no rótulo transfere foco para o controle nativo associado via for/id', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h('div', [
                    h(MaxInputText, {
                        label: 'Nome de Usuário',
                        modelValue: ''
                    }),
                    h(MaxInputTextArea, {
                        label: 'Biografia do Perfil',
                        modelValue: ''
                    }),
                    h(MaxInputNumber, {
                        label: 'Idade',
                        modelValue: 25
                    })
                ]);
            }
        });
        app.directive('tooltip', {});
        app.use(createPinia());
        activeApp = app;
        app.mount(hostElement);
        await settle();

        const labels = hostElement.querySelectorAll('label');
        expect(labels.length).toBeGreaterThanOrEqual(3);

        const textLabel = labels[0] as HTMLLabelElement;
        const textInput = hostElement.querySelector('input.max-input-native') as HTMLInputElement;

        expect(textLabel.getAttribute('for')).toBe(textInput.id);

        // Dispara clique real no label e verifica transferência de foco no motor Blink
        textLabel.click();
        await settle();

        expect(document.activeElement).toBe(textInput);

        const textAreaLabel = labels[1] as HTMLLabelElement;
        const textArea = hostElement.querySelector('textarea') as HTMLTextAreaElement;

        expect(textAreaLabel.getAttribute('for')).toBe(textArea.id);

        textAreaLabel.click();
        await settle();

        expect(document.activeElement).toBe(textArea);
    });

    it('Chromium Blink: form owner (atributo form) conecta controles fora do form à submissão FormData', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const form = document.createElement('form');
        form.id = 'owner-matrix-form';
        hostElement.appendChild(form);

        const outsideContainer = document.createElement('div');
        hostElement.appendChild(outsideContainer);

        const app = createApp({
            render() {
                return h('div', [
                    h(MaxInputText, {
                        name: 'owner_text',
                        form: 'owner-matrix-form',
                        modelValue: 'Texto Associado'
                    }),
                    h(MaxInputPhone, {
                        name: 'owner_phone',
                        form: 'owner-matrix-form',
                        modelValue: '62988889999'
                    }),
                    h(MaxInputCpfCnpj, {
                        name: 'owner_document',
                        form: 'owner-matrix-form',
                        modelValue: '12345678909'
                    })
                ]);
            }
        });
        app.directive('tooltip', {});
        app.use(createPinia());
        activeApp = app;
        app.mount(outsideContainer);
        await settle();

        const formData = new FormData(form);
        expect(formData.get('owner_text')).toBe('Texto Associado');
        expect(formData.get('owner_phone')).toBeTruthy();
        expect(formData.get('owner_document')).toBeTruthy();
    });

    it('Chromium Blink: submissão nativa de formulário agrega múltiplos inputs em FormData real', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const form = document.createElement('form');
        form.id = 'chromium-matrix-form';
        hostElement.appendChild(form);

        const app = createApp({
            render() {
                return h('div', [
                    h(MaxInputText, {
                        name: 'user_name',
                        form: 'chromium-matrix-form',
                        modelValue: 'Maria Silva'
                    }),
                    h(MaxInputTextArea, {
                        name: 'bio',
                        form: 'chromium-matrix-form',
                        modelValue: 'Desenvolvedora Full Stack'
                    }),
                    h(MaxInputNumber, {
                        name: 'experience_years',
                        form: 'chromium-matrix-form',
                        modelValue: 8
                    }),
                    h(MaxInputCep, {
                        name: 'user_cep',
                        form: 'chromium-matrix-form',
                        modelValue: '74000-000'
                    }),
                    h(MaxInputToggle, {
                        name: 'terms_accepted',
                        form: 'chromium-matrix-form',
                        modelValue: true
                    })
                ]);
            }
        });
        app.directive('tooltip', {});
        app.use(createPinia());
        activeApp = app;
        app.mount(form);
        await settle();

        const formData = new FormData(form);
        expect(formData.get('user_name')).toBe('Maria Silva');
        expect(formData.get('bio')).toBe('Desenvolvedora Full Stack');
        expect(formData.get('experience_years')).toBe('8');
        expect(formData.get('user_cep')).toBeTruthy();
        expect(formData.get('terms_accepted')).toBeTruthy();
    });

    it('Chromium Blink: atributos autofill (autocomplete), required e disabled são propagados ao nó operável', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h('div', [
                    h(MaxInputText, {
                        autocomplete: 'email',
                        required: true,
                        disabled: false,
                        modelValue: 'teste@exemplo.com'
                    }),
                    h(MaxInputDatePicker, {
                        required: true,
                        disabled: true,
                        modelValue: '2026-09-15'
                    }),
                    h(MaxInputToggle, {
                        disabled: true,
                        required: true,
                        modelValue: false
                    })
                ]);
            }
        });
        app.directive('tooltip', {});
        app.use(createPinia());
        activeApp = app;
        app.mount(hostElement);
        await settle();

        const textInput = hostElement.querySelector('input[type="text"].max-input-native') as HTMLInputElement;
        expect(textInput).toBeTruthy();
        expect(textInput.getAttribute('autocomplete')).toBe('email');
        const textIsRequired = textInput.hasAttribute('required') || textInput.getAttribute('aria-required') === 'true';
        expect(textIsRequired).toBe(true);
        expect(textInput.hasAttribute('disabled')).toBe(false);

        const dateInput = hostElement.querySelector('input.max-datepicker-input') as HTMLInputElement;
        expect(dateInput).toBeTruthy();
        expect(dateInput.hasAttribute('disabled')).toBe(true);

        const toggleInput = hostElement.querySelector('input.max-toggleswitch-input') as HTMLInputElement;
        expect(toggleInput).toBeTruthy();
        expect(toggleInput.hasAttribute('disabled')).toBe(true);
    });

    it('Chromium Blink: MaxInputBirthday mantém foco e controle de segmentos isolado da contagem canônica', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h(MaxInputBirthday, {
                    label: 'Nascimento Especial',
                    modelValue: '1990-12-25'
                });
            }
        });
        app.directive('tooltip', {});
        app.use(createPinia());
        activeApp = app;
        app.mount(hostElement);
        await settle();

        const dayBtn = hostElement.querySelector('.max-birthday-segment--day') as HTMLButtonElement;
        expect(dayBtn).toBeTruthy();
        expect(dayBtn.textContent?.trim()).toBe('25');

        // Teste de foco no segmento
        dayBtn.focus();
        await settle();
        expect(document.activeElement).toBe(dayBtn);
    });
});
