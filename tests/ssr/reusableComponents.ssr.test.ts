// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import MaxAlert from '../../src/components/MaxAlert.vue';
import MaxQueryState from '../../src/components/MaxQueryState.vue';
import MaxFormValidationSummary from '../../src/components/MaxFormValidationSummary.vue';
import MaxSegmentedControl from '../../src/components/MaxSegmentedControl.vue';
import MaxPeriodNavigator from '../../src/components/MaxPeriodNavigator.vue';
import MaxProgressBar from '../../src/components/MaxProgressBar.vue';
import MaxFilterBar from '../../src/components/MaxFilterBar.vue';
import MaxFilePreview from '../../src/components/MaxFilePreview.vue';
import MaxMarkdownViewer from '../../src/components/MaxMarkdownViewer.vue';
import MaxCalendar from '../../src/components/MaxCalendar.vue';
import Tooltip from '../../src/directives/tooltip';

function createSSRTestApp(component: any, props?: any) {
    const app = createSSRApp({
        render: () => h(component, props)
    });
    app.directive('tooltip', Tooltip);
    return app;
}

describe('Reusable Components SSR - Renderização pura em Node.js', () => {
    it('garante que o ambiente é Node puro sem globals do navegador', () => {
        expect(typeof window).toBe('undefined');
        expect(typeof document).toBe('undefined');
    });

    it('renderiza MaxAlert em SSR sem erros', async () => {
        const app = createSSRTestApp(MaxAlert, { title: 'Alerta SSR', message: 'Mensagem de teste' });
        const html = await renderToString(app);
        expect(html).toContain('Alerta SSR');
        expect(html).toContain('Mensagem de teste');
    });

    it('renderiza MaxQueryState em SSR sem erros', async () => {
        const app = createSSRTestApp(MaxQueryState, { state: 'ready-empty', message: 'Vazio SSR' });
        const html = await renderToString(app);
        expect(html).toContain('Vazio SSR');
    });

    it('renderiza MaxFormValidationSummary em SSR sem erros', async () => {
        const app = createSSRTestApp(MaxFormValidationSummary, {
            errors: [{ key: '1', label: 'Campo', message: 'Erro SSR' }]
        });
        const html = await renderToString(app);
        expect(html).toContain('Campo:');
        expect(html).toContain('Erro SSR');
    });

    it('renderiza MaxSegmentedControl em SSR sem erros', async () => {
        const app = createSSRTestApp(MaxSegmentedControl, {
            modelValue: 'op1',
            ariaLabel: 'Opções SSR',
            options: [{ value: 'op1', label: 'Opção 1' }, { value: 'op2', label: 'Opção 2' }]
        });
        const html = await renderToString(app);
        expect(html).toContain('Opção 1');
        expect(html).toContain('Opção 2');
    });

    it('renderiza MaxPeriodNavigator em SSR sem erros', async () => {
        const app = createSSRTestApp(MaxPeriodNavigator, {
            modelValue: { year: 2026, month: 10 }
        });
        const html = await renderToString(app);
        expect(html).toContain('Outubro de 2026');
    });

    it('renderiza MaxProgressBar em SSR sem erros', async () => {
        const app = createSSRTestApp(MaxProgressBar, {
            value: 70,
            max: 100,
            ariaLabel: 'Progresso SSR'
        });
        const html = await renderToString(app);
        expect(html).toContain('role="progressbar"');
        expect(html).toContain('aria-valuenow="70"');
    });

    it('renderiza MaxFilterBar em SSR sem erros', async () => {
        const app = createSSRTestApp(MaxFilterBar, {
            activeCount: 2,
            showApply: true
        });
        const html = await renderToString(app);
        expect(html).toContain('2 filtros ativos');
    });

    it('renderiza MaxFilePreview em SSR para arquivo remoto sem erros', async () => {
        const app = createSSRTestApp(MaxFilePreview, {
            file: {
                kind: 'remote',
                id: 'r1',
                name: 'documento.pdf',
                size: 1024,
                url: 'https://example.com/doc.pdf'
            }
        });
        const html = await renderToString(app);
        expect(html).toContain('documento.pdf');
    });

    it('renderiza MaxMarkdownViewer em SSR com fallback de texto puro sem erros', async () => {
        const app = createSSRTestApp(MaxMarkdownViewer, {
            source: 'Texto seguro SSR',
            renderMarkdown: (s: string) => `<p>${s}</p>`
        });
        const html = await renderToString(app);
        expect(typeof html).toBe('string');
        expect(html).toContain('Texto seguro SSR');
    });

    it('renderiza MaxCalendar em SSR sem erros', async () => {
        const app = createSSRTestApp(MaxCalendar, {
            period: { year: 2026, month: 10 }
        });
        const html = await renderToString(app);
        expect(html).toContain('Dom');
        expect(html).toContain('Seg');
        expect(html).toContain('role="grid"');
    });
});
