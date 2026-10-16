import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxInputOccupation from '../../src/components/MaxInputOccupation.vue';
import MaxInputFinancingTerm from '../../src/components/MaxInputFinancingTerm.vue';
import MaxInputFinancingGracePeriod from '../../src/components/MaxInputFinancingGracePeriod.vue';
import MaxInputServicePricingUnit from '../../src/components/MaxInputServicePricingUnit.vue';
import MaxInputServiceAudience from '../../src/components/MaxInputServiceAudience.vue';
import MaxInputInverterType from '../../src/components/MaxInputInverterType.vue';
import MaxInputMonitoringAuthType from '../../src/components/MaxInputMonitoringAuthType.vue';
import MaxInputMonitoringCredentialFlow from '../../src/components/MaxInputMonitoringCredentialFlow.vue';
import MaxInputConsumerUnit from '../../src/components/MaxInputConsumerUnit.vue';
import MaxInputAiModelStatus from '../../src/components/MaxInputAiModelStatus.vue';
import MaxInputAiPriceItemType from '../../src/components/MaxInputAiPriceItemType.vue';
import MaxInputAiCacheOperation from '../../src/components/MaxInputAiCacheOperation.vue';
import MaxInputRagSourceType from '../../src/components/MaxInputRagSourceType.vue';
import MaxInputColorPalette from '../../src/components/MaxInputColorPalette.vue';
import MaxInputScheduleRules from '../../src/components/MaxInputScheduleRules.vue';

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

describe('SpecializedInputs — Testes no Navegador Real (Playwright)', () => {
    it('monta os 15 inputs especializados no DOM com seus rótulos padrão', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createTestApp({
            render() {
                return h('div', { class: 'specialized-inputs-container' }, [
                    h(MaxInputOccupation, { id: 's01-occupation' }),
                    h(MaxInputFinancingTerm, { id: 's02-financing-term' }),
                    h(MaxInputFinancingGracePeriod, { id: 's03-grace-period' }),
                    h(MaxInputServicePricingUnit, { id: 's04-pricing-unit' }),
                    h(MaxInputServiceAudience, { id: 's05-audience' }),
                    h(MaxInputInverterType, { id: 's06-inverter-type' }),
                    h(MaxInputMonitoringAuthType, { id: 's07-auth-type' }),
                    h(MaxInputMonitoringCredentialFlow, { id: 's08-flow' }),
                    h(MaxInputConsumerUnit, { id: 's09-consumer-unit' }),
                    h(MaxInputAiModelStatus, { id: 's10-ai-status' }),
                    h(MaxInputAiPriceItemType, { id: 's11-price-type' }),
                    h(MaxInputAiCacheOperation, { id: 's12-cache-op' }),
                    h(MaxInputRagSourceType, { id: 's13-rag-source' }),
                    h(MaxInputColorPalette, { id: 's14-palette' }),
                    h(MaxInputScheduleRules, { id: 's15-schedule-rules' })
                ]);
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const container = hostElement.querySelector('.specialized-inputs-container');
        expect(container).not.toBeNull();

        // Verifica que labels e grupos esperados estão montados
        expect(hostElement.textContent).toContain('Ocupação');
        expect(hostElement.textContent).toContain('Prazo do financiamento');
        expect(hostElement.textContent).toContain('Carência da primeira parcela');
        expect(hostElement.textContent).toContain('Unidade de preço do serviço');
        expect(hostElement.textContent).toContain('Público do serviço');
        expect(hostElement.textContent).toContain('Tipo de inversor');
        expect(hostElement.textContent).toContain('Tipo de autenticação');
        expect(hostElement.textContent).toContain('Fluxo de credencial');
        expect(hostElement.textContent).toContain('Unidade consumidora (UC)');
        expect(hostElement.textContent).toContain('Situação do modelo');
        expect(hostElement.textContent).toContain('Modalidade de preço de IA');
        expect(hostElement.textContent).toContain('Operação de cache');
        expect(hostElement.textContent).toContain('Tipo de fonte RAG');
        expect(hostElement.textContent).toContain('Paleta de cores');
        expect(hostElement.textContent).toContain('Agendamento');
    });
});
