import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxInputEntity from '../../src/components/MaxInputEntity.vue';
import MaxInputGender from '../../src/components/MaxInputGender.vue';
import MaxInputWeekday from '../../src/components/MaxInputWeekday.vue';
import MaxInputMonth from '../../src/components/MaxInputMonth.vue';
import MaxInputTime from '../../src/components/MaxInputTime.vue';
import MaxInputYear from '../../src/components/MaxInputYear.vue';
import MaxInputEmail from '../../src/components/MaxInputEmail.vue';
import MaxInputUrl from '../../src/components/MaxInputUrl.vue';
import MaxInputPassword from '../../src/components/MaxInputPassword.vue';
import MaxInputSlug from '../../src/components/MaxInputSlug.vue';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(): Promise<void> {
    await nextFrame();
    await nextFrame();
}

function mountTestApp(renderFn: () => any): App {
    const app = createApp({ render: renderFn });
    app.directive('tooltip', {});
    app.use(createPinia());
    app.mount(hostElement!);
    activeApp = app;
    return app;
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

describe('Browser: dez novos inputs semânticos — acessibilidade e interação real', () => {
    it('associa corretamente label e controle nativo via for/id nos inputs textuais', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        mountTestApp(() => h('div', [
            h(MaxInputEmail, { label: 'E-mail Pessoal', modelValue: '' }),
            h(MaxInputUrl, { label: 'Website Oficial', modelValue: '' }),
            h(MaxInputPassword, { label: 'Senha de Acesso', modelValue: '' }),
            h(MaxInputSlug, { label: 'Identificador do Recurso', modelValue: '' })
        ]));
        await settle();

        const labels = hostElement.querySelectorAll('label');
        expect(labels.length).toBe(4);

        for (const label of Array.from(labels)) {
            const forId = label.getAttribute('for');
            expect(forId).toBeTruthy();
            const targetInput = hostElement.querySelector(`#${forId}`);
            expect(targetInput).toBeTruthy();
        }
    });

    it('associa corretamente label e combobox nos seis seletores semânticos', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        mountTestApp(() => h('div', [
            h(MaxInputEntity, { label: 'Entidade Fiscal', modelValue: null }),
            h(MaxInputGender, { label: 'Gênero Cadastral', modelValue: null }),
            h(MaxInputWeekday, { label: 'Dia Preferido', modelValue: null }),
            h(MaxInputMonth, { label: 'Mês de Referência', modelValue: null }),
            h(MaxInputTime, { label: 'Horário de Início', modelValue: null }),
            h(MaxInputYear, { label: 'Ano Base', modelValue: null })
        ]));
        await settle();

        const labels = hostElement.querySelectorAll('label');
        expect(labels.length).toBe(6);

        for (const label of Array.from(labels)) {
            const forId = label.getAttribute('for');
            expect(forId).toBeTruthy();
            const combobox = hostElement.querySelector(`[id="${forId}"]`);
            expect(combobox).toBeTruthy();
            expect(combobox?.getAttribute('role')).toBe('combobox');
        }
    });

    it('MaxInputPassword: alternância de visibilidade altera type sem submeter form e respeita disabled', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        let formSubmitted = false;
        mountTestApp(() => h('form', {
            onSubmit: (e: Event) => {
                e.preventDefault();
                formSubmitted = true;
            }
        }, [
            h(MaxInputPassword, {
                label: 'Senha Protegida',
                modelValue: 'segredo123',
                toggleVisibility: true
            })
        ]));
        await settle();

        const input = hostElement.querySelector('input') as HTMLInputElement;
        const toggleBtn = hostElement.querySelector('button.max-password-toggle') as HTMLButtonElement;

        expect(input.type).toBe('password');
        expect(toggleBtn).toBeTruthy();
        expect(toggleBtn.getAttribute('type')).toBe('button');

        // Clica no toggle
        toggleBtn.click();
        await settle();

        expect(input.type).toBe('text');
        expect(formSubmitted).toBe(false);

        // Clica novamente
        toggleBtn.click();
        await settle();

        expect(input.type).toBe('password');
        expect(formSubmitted).toBe(false);
    });

    it('conecta aria-invalid e mensagem de feedback após blur com valor inválido', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        mountTestApp(() => h('div', [
            h(MaxInputEmail, {
                label: 'E-mail',
                modelValue: 'invalido',
                required: true
            })
        ]));
        await settle();

        const input = hostElement.querySelector('input') as HTMLInputElement;
        input.dispatchEvent(new FocusEvent('blur'));
        await settle();

        const errorDiv = hostElement.querySelector('.input-message');
        expect(errorDiv).toBeTruthy();
        expect(errorDiv?.textContent).toContain('E-mail inválido');
        expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('respeita estado disabled impedindo interação', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        mountTestApp(() => h('div', [
            h(MaxInputEmail, { label: 'E-mail', modelValue: '', disabled: true }),
            h(MaxInputPassword, { label: 'Senha', modelValue: '', disabled: true })
        ]));
        await settle();

        const inputs = hostElement.querySelectorAll('input');
        expect(inputs.length).toBe(2);
        for (const input of Array.from(inputs)) {
            expect(input.disabled).toBe(true);
            expect(input.getAttribute('aria-disabled')).toBe('true');
        }

        const toggleBtn = hostElement.querySelector('button.max-password-toggle') as HTMLButtonElement;
        expect(toggleBtn.disabled).toBe(true);
    });
});
