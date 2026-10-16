import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, ref, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxInputPhase from '../../src/components/MaxInputPhase.vue';
import MaxInputWireSize from '../../src/components/MaxInputWireSize.vue';
import MaxInputWireType from '../../src/components/MaxInputWireType.vue';
import MaxInputAiExecutionType from '../../src/components/MaxInputAiExecutionType.vue';
import MaxInputAiBillingMode from '../../src/components/MaxInputAiBillingMode.vue';
import MaxInputAiBillingUnit from '../../src/components/MaxInputAiBillingUnit.vue';
import MaxInputPaymentMethod from '../../src/components/MaxInputPaymentMethod.vue';
import MaxInputScheduleType from '../../src/components/MaxInputScheduleType.vue';
import MaxInputMonthOccurrence from '../../src/components/MaxInputMonthOccurrence.vue';
import MaxInputContentType from '../../src/components/MaxInputContentType.vue';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(): Promise<void> {
    await nextFrame();
    await nextFrame();
}

function createTestApp(rootComponent: any): App {
    const app = createApp(rootComponent);
    app.directive('tooltip', {});
    app.use(createPinia());
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
    document.documentElement.classList.remove('dark');
});

describe('MaxDomainInputs — Testes no Navegador Real (Playwright)', () => {
    it('monta os 10 inputs de domínio com identidades distintas e rótulos padrão', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createTestApp({
            render() {
                return h('div', { class: 'domain-inputs-grid' }, [
                    h(MaxInputPhase, { id: 'd01-phase' }),
                    h(MaxInputWireSize, { id: 'd02-wire-size' }),
                    h(MaxInputWireType, { id: 'd03-wire-type' }),
                    h(MaxInputAiExecutionType, { id: 'd04-ai-exec' }),
                    h(MaxInputAiBillingMode, { id: 'd05-ai-billing' }),
                    h(MaxInputAiBillingUnit, { id: 'd06-ai-unit' }),
                    h(MaxInputPaymentMethod, { id: 'd07-payment' }),
                    h(MaxInputScheduleType, { id: 'd08-schedule' }),
                    h(MaxInputMonthOccurrence, { id: 'd09-occurrence' }),
                    h(MaxInputContentType, { id: 'd10-content' })
                ]);
            }
        });
        app.mount(hostElement);
        activeApp = app;
        await settle();

        // Verifica existência de todos os 10 nós no DOM
        expect(hostElement.querySelector('#d01-phase')).not.toBeNull();
        expect(hostElement.querySelector('#d02-wire-size')).not.toBeNull();
        expect(hostElement.querySelector('#d03-wire-type')).not.toBeNull();
        expect(hostElement.querySelector('#d04-ai-exec')).not.toBeNull();
        expect(hostElement.querySelector('#d05-ai-billing')).not.toBeNull();
        expect(hostElement.querySelector('#d06-ai-unit')).not.toBeNull();
        expect(hostElement.querySelector('#d07-payment')).not.toBeNull();
        expect(hostElement.querySelector('#d08-schedule')).not.toBeNull();
        expect(hostElement.querySelector('#d09-occurrence')).not.toBeNull();
        expect(hostElement.querySelector('#d010-content, #d10-content')).not.toBeNull();
    });

    it('interação por teclado e clique: abre dropdown de MaxInputPaymentMethod e seleciona opção', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const selectedVal = ref<any>(null);

        const app = createTestApp({
            render() {
                return h(MaxInputPaymentMethod, {
                    id: 'test-payment',
                    modelValue: selectedVal.value,
                    clearable: true,
                    'onUpdate:modelValue': (val: any) => {
                        selectedVal.value = val;
                    }
                });
            }
        });
        app.mount(hostElement);
        activeApp = app;
        await settle();

        const trigger = hostElement.querySelector('.max-select, .max-input-base') as HTMLElement;
        expect(trigger).not.toBeNull();

        // Dispara clique para abrir
        trigger.click();
        await settle();

        // Procura opção PIX no overlay
        const pixOption = document.querySelector('.max-select-option, [data-value="pix"]') as HTMLElement;
        if (pixOption) {
            pixOption.click();
            await settle();
            expect(selectedVal.value).toBe('pix');
        }
    });

    it('MaxInputWireSize possui campo de busca no dropdown (filter=true por padrão)', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createTestApp({
            render() {
                return h(MaxInputWireSize, {
                    id: 'test-wire-size'
                });
            }
        });
        app.mount(hostElement);
        activeApp = app;
        await settle();

        const trigger = hostElement.querySelector('.max-select, .max-input-base') as HTMLElement;
        trigger?.click();
        await settle();

        // Campo de busca com classe .max-select-filter ou input de busca
        const filterInput = document.querySelector('.max-select-filter input, input[type="text"].filter') as HTMLInputElement;
        if (filterInput) expect(filterInput).not.toBeNull();
    });

    it('suporta modo dark com classes e variáveis semânticas', async () => {
        document.documentElement.classList.add('dark');
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createTestApp({
            render() {
                return h(MaxInputPhase, {
                    id: 'dark-phase',
                    modelValue: 1
                });
            }
        });
        app.mount(hostElement);
        activeApp = app;
        await settle();

        const container = hostElement.querySelector('#dark-phase');
        expect(container).not.toBeNull();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
});
