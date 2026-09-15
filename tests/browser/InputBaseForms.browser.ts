import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createApp, h, ref, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxInputText from '../../src/components/MaxInputText.vue';

let app: App | null = null;
let host: HTMLElement | null = null;

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

afterEach(() => {
    app?.unmount();
    host?.remove();
    app = null;
    host = null;
});

describe('InputBase no Chromium (R04 / E03-02)', () => {
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
