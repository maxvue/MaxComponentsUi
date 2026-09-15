import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createApp, h, ref, type App } from 'vue';
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

let app: App | null = null;
let host: HTMLElement | null = null;

interface BrowserFamily {
    name: string;
    component: any;
    selector: string;
    props?: Record<string, any>;
    nativeText?: boolean;
    nativeFormOwner?: boolean;
}

const families: BrowserFamily[] = [
    { name: 'MaxInputText', component: MaxInputText, selector: 'input.max-input-native', nativeText: true },
    { name: 'MaxInputTextArea', component: MaxInputTextArea, selector: 'textarea', nativeText: true },
    { name: 'MaxInputNumber', component: MaxInputNumber, selector: 'input.max-input-native', nativeText: true },
    { name: 'MaxInputPhone', component: MaxInputPhone, selector: 'input.max-input-native', nativeText: true },
    { name: 'MaxInputPhoneMail', component: MaxInputPhoneMail, selector: 'input.max-input-native', nativeText: true },
    { name: 'MaxInputDatePicker', component: MaxInputDatePicker, selector: 'input.max-datepicker-input', nativeText: true },
    { name: 'MaxInputSearch', component: MaxInputSearch, selector: 'input.max-input-native', nativeText: true },
    { name: 'MaxInputCpfCnpj', component: MaxInputCpfCnpj, selector: 'input.max-input-native', nativeText: true },
    { name: 'MaxInputCep', component: MaxInputCep, selector: 'input.max-input-native', nativeText: true },
    { name: 'MaxInputCreditCard', component: MaxInputCreditCard, selector: 'input.max-base-input', nativeText: true },
    { name: 'MaxInputCreditCardDate', component: MaxInputCreditCardDate, selector: 'input.max-base-input', nativeText: true },
    { name: 'MaxInputCreditCardCvv', component: MaxInputCreditCardCvv, selector: 'input.max-base-input', nativeText: true },
    { name: 'MaxInputCoordinateDecimalLat', component: MaxInputCoordinateDecimalLat, selector: 'input.max-input-native', nativeText: true },
    { name: 'MaxInputCoordinateDecimalLng', component: MaxInputCoordinateDecimalLng, selector: 'input.max-input-native', nativeText: true },
    { name: 'MaxInputSelect', component: MaxInputSelect, selector: '.max-select', props: { options: [] }, nativeFormOwner: true },
    { name: 'MaxInputAutoComplete', component: MaxInputAutoComplete, selector: 'input.max-autocomplete-input', props: { options: [] }, nativeText: true },
    { name: 'MaxInputAutoCompleteApi', component: MaxInputAutoCompleteApi, selector: 'input.max-autocomplete-input', props: { options: [], route: 'api.test' }, nativeText: true },
    { name: 'MaxChips', component: MaxChips, selector: 'input.max-chips-input', props: { modelValue: [] }, nativeText: true },
    { name: 'MaxTagSelect', component: MaxTagSelect, selector: '.max-select', props: { modelValue: [], options: [] }, nativeFormOwner: true },
    { name: 'MaxColorPicker', component: MaxColorPicker, selector: 'input.max-colorpicker-native', props: { modelValue: '#000000' } },
    { name: 'MaxInputIconPicker', component: MaxInputIconPicker, selector: '.icon-picker-trigger', nativeFormOwner: true },
    { name: 'MaxInputOTP', component: MaxInputOTP, selector: '.max-input-otp-container', nativeFormOwner: true },
    { name: 'MaxInputSwitch', component: MaxInputSwitch, selector: '.max-switch-toggle', props: { modelValue: false }, nativeFormOwner: true },
    { name: 'MaxInputTextList', component: MaxInputTextList, selector: 'textarea.code-textarea', nativeText: true },
    { name: 'MaxInputToggle', component: MaxInputToggle, selector: 'input.max-toggleswitch-input', props: { modelValue: false } }
];

async function nextFrame(): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function mountNativeForm(disabled = false) {
    const modelValue = ref('');
    let submitCount = 0;
    host = document.createElement('div');
    document.body.append(host);

    app = createApp({
        render: () => h('form', {
            id: 'input-base-native-form',
            onSubmit: (event: SubmitEvent) => {
                event.preventDefault();
                submitCount += 1;
            }
        }, [
            h(MaxInputText, {
                modelValue: modelValue.value,
                'onUpdate:modelValue': (value: string | number | undefined) => { modelValue.value = String(value ?? ''); },
                label: 'E-mail para autofill',
                name: 'email',
                autocomplete: 'email',
                required: true,
                disabled
            })
        ])
    });
    app.use(createPinia());
    app.directive('tooltip', {});
    app.mount(host);
    await nextFrame();
    return { modelValue, getSubmitCount: () => submitCount };
}

async function mountFamily(family: BrowserFamily, disabled = false) {
    const modelValue = ref(family.props?.modelValue ?? '');
    host = document.createElement('div');
    document.body.append(host);
    app = createApp({
        render: () => h('form', { id: `form-${family.name}`, novalidate: true }, [
            h(family.component, {
                modelValue: modelValue.value,
                'onUpdate:modelValue': (value: unknown) => { modelValue.value = value as any; },
                label: `Rótulo ${family.name}`,
                name: `field-${family.name}`,
                // Somente campos textuais têm semântica de autofill de e-mail.
                // Proxies de controles compostos não devem anunciar e-mail.
                autocomplete: family.nativeText ? 'email' : 'off',
                required: true,
                disabled,
                ...(family.props ?? {})
            })
        ])
    });
    app.use(createPinia());
    app.directive('tooltip', {});
    app.mount(host);
    await nextFrame();
    return modelValue;
}

afterEach(() => {
    app?.unmount();
    host?.remove();
    app = null;
    host = null;
});

describe('InputBase no Chromium (R04 / E03-02)', () => {
    it('executa a matriz Chromium das 25 famílias no owner real', async () => {
        expect(families).toHaveLength(25);

        for (const family of families) {
            await mountFamily(family);
            const form = host!.querySelector('form')!;
            const wrapper = host!.querySelector('.max-input-main-div, .max-input-toggle')!;
            const label = host!.querySelector('label')!;
            const owner = host!.querySelector(family.selector) as HTMLElement;
            const formOwner = (family.nativeFormOwner ? host!.querySelector('.max-native-form-proxy') : owner) as HTMLInputElement;

            expect(owner, `${family.name}: owner real`).not.toBeNull();
            expect(formOwner, `${family.name}: owner nativo`).not.toBeNull();
            expect(label.htmlFor, `${family.name}: label aponta ao owner`).toBe(formOwner.id);
            expect(wrapper.hasAttribute('name'), `${family.name}: name não vaza ao wrapper`).toBe(false);
            expect(wrapper.hasAttribute('disabled'), `${family.name}: disabled não vaza ao wrapper`).toBe(false);
            expect(wrapper.hasAttribute('required'), `${family.name}: required não vaza ao wrapper`).toBe(false);
            expect(formOwner.getAttribute('aria-required') === 'true' || formOwner.hasAttribute('required'), `${family.name}: owner recebe required`).toBe(true);
            expect(owner.getAttribute('aria-disabled')).not.toBe('true');

            // A prova negativa impede que `required` vire somente ARIA. O input
            // color é exceção do HTML: seu valor nunca é vazio por definição.
            if (family.name !== 'MaxColorPicker') {
                expect(form.checkValidity(), `${family.name}: required vazio bloqueia o formulário`).toBe(false);
                expect(formOwner.validity.valid, `${family.name}: owner vazio é inválido nativamente`).toBe(false);
            }

            // Clique do usuário no label usa o algoritmo nativo `for`/`id`.
            // Nos compostos, o proxy recebe o foco e o :focus-within do
            // InputBase fornece o anel visual, sem chamar focus no wrapper.
            await userEvent.click(label);
            expect(document.activeElement, `${family.name}: label foca o owner nativo`).toBe(formOwner);

            if (family.nativeText) {
                const input = owner as HTMLInputElement | HTMLTextAreaElement;
                // `fill` opera no Chromium por teclado/eventos reais; não há
                // atribuição de `.value` nem dispatch sintético de `input`.
                const browserValue = family.name === 'MaxInputCoordinateDecimalLat' || family.name === 'MaxInputCoordinateDecimalLng'
                    ? '-22.12345'
                    : '12345';
                await userEvent.fill(input, browserValue);
                await nextFrame();
                expect(input.value, `${family.name}: preenchimento nativo preserva o valor`).toBeTruthy();
                expect(new FormData(form).has(`field-${family.name}`), `${family.name}: participa do FormData`).toBe(true);
                expect(form.checkValidity(), `${family.name}: required é validável pelo browser`).toBe(true);
            }

            if (family.name === 'MaxColorPicker') {
                // `input[type=color]` sempre possui uma cor válida; a prova
                // positiva é a serialização nativa, não uma atribuição manual.
                expect(new FormData(form).get(`field-${family.name}`), `${family.name}: serializa a cor nativa`).toBe('#000000');
                expect(form.checkValidity(), `${family.name}: participa da validação nativa`).toBe(true);
            }

            if (family.nativeFormOwner) {
                // A associação não é uma sonda: o owner nativo é a origem de
                // FormData e da constraint validation nos controles compostos.
                if (family.name === 'MaxInputToggle') {
                    await userEvent.click(owner);
                    await nextFrame();
                } else if (formOwner.type === 'checkbox') formOwner.checked = true;
                else formOwner.value = 'valor-nativo';
                expect(new FormData(form).has(`field-${family.name}`), `${family.name}: participa do FormData pelo owner nativo`).toBe(true);
                if (family.name === 'MaxInputToggle') expect(new FormData(form).get(`field-${family.name}`), `${family.name}: Toggle marcado serializa valor`).not.toBeNull();
                expect(form.checkValidity(), `${family.name}: required é validável pelo browser`).toBe(true);
            }

            app?.unmount();
            host?.remove();
            app = null;
            host = null;

            await mountFamily(family, true);
            const disabledOwner = host!.querySelector(family.selector) as HTMLElement;
            const disabledFormOwner = (family.nativeFormOwner ? host!.querySelector('.max-native-form-proxy') : disabledOwner) as HTMLInputElement;
            const disabledWrapper = host!.querySelector('.max-input-main-div, .max-input-toggle')!;
            expect(disabledFormOwner.hasAttribute('disabled') || disabledFormOwner.getAttribute('aria-disabled') === 'true', `${family.name}: disabled chega ao owner`).toBe(true);
            expect(disabledWrapper.hasAttribute('disabled'), `${family.name}: disabled não vaza ao wrapper`).toBe(false);
            const disabledForm = host!.querySelector('form')!;
            expect(new FormData(disabledForm).has(`field-${family.name}`), `${family.name}: disabled é excluído nativamente do FormData`).toBe(false);

            app?.unmount();
            host?.remove();
            app = null;
            host = null;
        }
    });

    it('delega label, required, disabled, owner, autofill e submit ao navegador sem foco manual no wrapper', async () => {
        const state = await mountNativeForm();
        const form = host!.querySelector('form')!;
        const label = host!.querySelector('label')!;
        const input = host!.querySelector('input.max-input-native') as HTMLInputElement;
        const wrapper = host!.querySelector('.max-input-main-div')!;

        expect(label.htmlFor).toBe(input.id);
        expect(input.name).toBe('email');
        expect(input.autocomplete).toBe('email');
        expect(input.required).toBe(true);
        expect(wrapper.hasAttribute('name')).toBe(false);
        expect(wrapper.hasAttribute('autocomplete')).toBe(false);
        expect(wrapper.hasAttribute('required')).toBe(false);

        // Clique real no label: o browser aplica a associação for/id nativa.
        await userEvent.click(label);
        expect(document.activeElement).toBe(input);

        // Autofill não recebe foco: alterações nativas e input atualizam o v-model.
        input.value = 'autofill@empresa.com';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await nextFrame();
        expect(state.modelValue.value).toBe('autofill@empresa.com');
        expect(new FormData(form).get('email')).toBe('autofill@empresa.com');

        form.requestSubmit();
        await nextFrame();
        expect(state.getSubmitCount()).toBe(1);

        app?.unmount();
        host?.remove();
        app = null;
        host = null;

        await mountNativeForm(true);
        const disabledInput = host!.querySelector('input.max-input-native') as HTMLInputElement;
        const disabledWrapper = host!.querySelector('.max-input-main-div')!;
        expect(disabledInput.disabled).toBe(true);
        expect(disabledInput.getAttribute('aria-disabled')).toBe('true');
        expect(disabledWrapper.hasAttribute('disabled')).toBe(false);
    });
});
