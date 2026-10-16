import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import MaxAlert from '../../src/components/MaxAlert.vue';
import MaxQueryState from '../../src/components/MaxQueryState.vue';
import MaxFormValidationSummary from '../../src/components/MaxFormValidationSummary.vue';
import MaxSegmentedControl from '../../src/components/MaxSegmentedControl.vue';
import MaxPeriodNavigator from '../../src/components/MaxPeriodNavigator.vue';
import MaxProgressBar from '../../src/components/MaxProgressBar.vue';
import MaxFilterBar from '../../src/components/MaxFilterBar.vue';
import MaxCalendar from '../../src/components/MaxCalendar.vue';

describe('Reusable Components - Hidratação no Cliente', () => {
    let container: HTMLDivElement;
    let warnSpy: any;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        if (container.parentNode) container.parentNode.removeChild(container);

        warnSpy.mockRestore();
    });

    const hydrateTest = async (component: any, props: any, slots?: any) => {
        const ssrApp = createSSRApp({
            render: () => h(component, props, slots)
        });
        const ssrHtml = await renderToString(ssrApp);
        container.innerHTML = ssrHtml;

        const clientApp = createSSRApp({
            render: () => h(component, props, slots)
        });
        clientApp.mount(container);

        const hydrationWarnings = warnSpy.mock.calls.filter((call: any[]) =>
            typeof call[0] === 'string' && call[0].toLowerCase().includes('hydration')
        );
        expect(hydrationWarnings).toHaveLength(0);
        clientApp.unmount();
    };

    it('hidrata MaxAlert sem warnings de hidratação', async () => {
        await hydrateTest(MaxAlert, { title: 'Alerta', message: 'Texto' });
    });

    it('hidrata MaxQueryState em estado ready-empty sem warnings', async () => {
        await hydrateTest(MaxQueryState, { state: 'ready-empty', message: 'Sem registros' });
    });

    it('hidrata MaxFormValidationSummary sem warnings', async () => {
        await hydrateTest(MaxFormValidationSummary, {
            errors: [{ key: '1', label: 'Campo', message: 'Erro' }]
        });
    });

    it('hidrata MaxSegmentedControl sem warnings', async () => {
        await hydrateTest(MaxSegmentedControl, {
            modelValue: 'op1',
            ariaLabel: 'Controle',
            options: [{ value: 'op1', label: 'Opção 1' }]
        });
    });

    it('hidrata MaxPeriodNavigator sem warnings', async () => {
        await hydrateTest(MaxPeriodNavigator, {
            modelValue: { year: 2026, month: 10 }
        });
    });

    it('hidrata MaxProgressBar sem warnings', async () => {
        await hydrateTest(MaxProgressBar, {
            value: 50,
            max: 100,
            ariaLabel: 'Barra'
        });
    });

    it('hidrata MaxFilterBar sem warnings', async () => {
        await hydrateTest(MaxFilterBar, {
            activeCount: 1,
            showApply: true
        });
    });

    it('hidrata MaxCalendar sem warnings', async () => {
        await hydrateTest(MaxCalendar, {
            period: { year: 2026, month: 10 }
        });
    });
});
