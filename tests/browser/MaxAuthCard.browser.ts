import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createApp, h, ref, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxAuthCard from '../../src/components/MaxAuthCard.vue';

let app: App | null = null;
let host: HTMLElement | null = null;

async function mountAuthCard() {
    const submissions: unknown[] = [];
    const email = ref('');
    const password = ref('');
    host = document.createElement('div');
    document.body.append(host);
    app = createApp({
        render: () => h(MaxAuthCard, {
            email: email.value,
            password: password.value,
            'onUpdate:email': (value: string) => { email.value = value; },
            'onUpdate:password': (value: string) => { password.value = value; },
            onSubmit: (payload: unknown) => submissions.push(payload)
        })
    });
    app.use(createPinia());
    app.component('router-link', { render: () => h('a') });
    app.directive('tooltip', {});
    app.mount(host);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return submissions;
}

afterEach(() => {
    app?.unmount();
    host?.remove();
    app = null;
    host = null;
});

describe('MaxAuthCard no Chromium (R14 / E09-01)', () => {
    it('Enter e autofill usam somente o submit nativo e emitem uma vez por submissão', async () => {
        const submissions = await mountAuthCard();
        const form = host!.querySelector('form') as HTMLFormElement;
        const email = host!.querySelector('input[type="email"]') as HTMLInputElement;
        const password = host!.querySelector('input[type="password"]') as HTMLInputElement;
        const submitButton = host!.querySelector('button[type="submit"]') as HTMLButtonElement;

        expect(form).not.toBeNull();
        expect(submitButton).not.toBeNull();
        expect(submitButton.hasAttribute('action')).toBe(false);

        await userEvent.click(email);
        await userEvent.keyboard('pessoa@empresa.com');
        await userEvent.click(password);
        await userEvent.keyboard('senha-enter{Enter}');
        expect(submissions).toHaveLength(1);

        // Autofill altera o valor nativo e notifica o v-model antes de requestSubmit.
        email.value = 'autofill@empresa.com';
        email.dispatchEvent(new Event('input', { bubbles: true }));
        password.value = 'senha-autofill';
        password.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        form.requestSubmit();
        await new Promise((resolve) => requestAnimationFrame(resolve));

        expect(submissions).toHaveLength(2);
    });
});
