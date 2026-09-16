import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxInputToggle from '../../src/components/MaxInputToggle.vue';
import MaxInputBirthday from '../../src/components/MaxInputBirthday.vue';

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

describe('R04 / E03-02 — Matriz Chromium de Formulário: label, owner, submit, autofill, required e disabled', () => {
    it('Chromium Blink: clique real no rótulo transfere foco para o controle nativo associado via for/id', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h(MaxInputText, {
                    label: 'Nome de Usuário',
                    modelValue: ''
                });
            }
        });
        app.directive('tooltip', {});
        app.use(createPinia());
        activeApp = app;
        app.mount(hostElement);
        await settle();

        const label = hostElement.querySelector('label') as HTMLLabelElement;
        const input = hostElement.querySelector('input.max-input-native') as HTMLInputElement;

        expect(label).toBeTruthy();
        expect(input).toBeTruthy();
        expect(label.getAttribute('for')).toBe(input.id);

        // Dispara clique real no label e verifica transferência de foco no motor Blink
        label.click();
        await settle();

        expect(document.activeElement).toBe(input);
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
