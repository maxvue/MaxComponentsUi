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
    { name: 'MaxInputSelect', component: MaxInputSelect, selector: '.max-select', props: { options: [] } },
    { name: 'MaxInputAutoComplete', component: MaxInputAutoComplete, selector: 'input.max-autocomplete-input', props: { options: [] }, nativeText: true },
    { name: 'MaxInputAutoCompleteApi', component: MaxInputAutoCompleteApi, selector: 'input.max-autocomplete-input', props: { options: [], route: 'api.test' }, nativeText: true },
    { name: 'MaxChips', component: MaxChips, selector: 'input.max-chips-input', props: { modelValue: [] }, nativeText: true },
    { name: 'MaxTagSelect', component: MaxTagSelect, selector: '.max-select', props: { modelValue: [], options: [] } },
    { name: 'MaxColorPicker', component: MaxColorPicker, selector: 'input.max-colorpicker-native', props: { modelValue: '#000000' } },
    { name: 'MaxInputIconPicker', component: MaxInputIconPicker, selector: '.icon-picker-trigger' },
    { name: 'MaxInputOTP', component: MaxInputOTP, selector: '.max-input-otp-container' },
    { name: 'MaxInputSwitch', component: MaxInputSwitch, selector: '.max-switch-toggle', props: { modelValue: false } },
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
                autocomplete: 'email',
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
            const modelValue = await mountFamily(family);
            const form = host!.querySelector('form')!;
            const wrapper = host!.querySelector('.max-input-main-div, .max-input-toggle')!;
            const label = host!.querySelector('label')!;
            const owner = host!.querySelector(family.selector) as HTMLElement;

            expect(owner, `${family.name}: owner real`).not.toBeNull();
            expect(label.htmlFor, `${family.name}: label aponta ao owner`).toBe(owner.id);
            expect(wrapper.hasAttribute('name'), `${family.name}: name não vaza ao wrapper`).toBe(false);
            expect(wrapper.hasAttribute('disabled'), `${family.name}: disabled não vaza ao wrapper`).toBe(false);
            expect(wrapper.hasAttribute('required'), `${family.name}: required não vaza ao wrapper`).toBe(false);
            expect(owner.getAttribute('aria-required') === 'true' || owner.hasAttribute('required'), `${family.name}: owner recebe required`).toBe(true);
            expect(owner.getAttribute('aria-disabled')).not.toBe('true');

            // Chromium executa o comportamento nativo do rótulo; para owners
            // labelable o foco deve chegar ao próprio controle, sem JS do wrapper.
            label.click();
            if (owner.matches('input, textarea, select, button')) expect(document.activeElement).toBe(owner);

            if (family.nativeText) {
                const input = owner as HTMLInputElement | HTMLTextAreaElement;
                // Um preenchimento programático representa o autofill real;
                // não recebe foco e usa um valor aceito também pelos campos numéricos.
                input.value = '12345';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await nextFrame();
                expect(input.value, `${family.name}: autofill sem foco preserva o valor nativo`).toBeTruthy();
                expect(new FormData(form).has(`field-${family.name}`), `${family.name}: participa do FormData`).toBe(true);
                expect(form.checkValidity(), `${family.name}: required é validável pelo browser`).toBe(true);
            }

            app?.unmount();
            host?.remove();
            app = null;
            host = null;

            await mountFamily(family, true);
            const disabledOwner = host!.querySelector(family.selector) as HTMLElement;
            const disabledWrapper = host!.querySelector('.max-input-main-div, .max-input-toggle')!;
            expect(disabledOwner.hasAttribute('disabled') || disabledOwner.getAttribute('aria-disabled') === 'true', `${family.name}: disabled chega ao owner`).toBe(true);
            expect(disabledWrapper.hasAttribute('disabled'), `${family.name}: disabled não vaza ao wrapper`).toBe(false);

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
