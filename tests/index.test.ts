import { describe, it, expect, vi } from 'vitest';
import { install } from '../src/index';

describe('index install', () => {
    it('deve registrar a diretiva tooltip e não invocar app.use (sem PrimeVue)', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        install(app as any);

        expect(app.use).not.toHaveBeenCalled();
        expect(app.directive).toHaveBeenCalledWith('tooltip', expect.anything());
    });

    it('exporta MaxStyle e ptBR diretamente', async () => {
        const indexExports = await import('../src/index');
        expect(indexExports.MaxStyle).toBeDefined();
        expect(indexExports.MaxStyle.semantic).toBeDefined();
        expect(indexExports.MaxStyle.semantic.primary).toBeDefined();
        expect(indexExports.ptBR).toBeDefined();
        expect(indexExports.ptBR.accept).toBe('Aceitar');
        expect(indexExports.ptBR.reject).toBe('Cancelar');
        expect(indexExports.ptBR.dayNames).toHaveLength(7);
        expect(indexExports.maxComponentsPtBR).toBeDefined();
        expect(indexExports.maxComponentsPtBR.pdfView.loading).toBe('Carregando PDF');
        expect(indexExports.maxComponentsPtBR.pdfView.progress).toBe('Progresso de carregamento do PDF');
    });

    it('exporta MaxBadgeButtonsGroup e seus aliases', async () => {
        const indexExports = await import('../src/index');
        expect(indexExports.MaxBadgeButtonsGroup).toBeDefined();
        expect(indexExports.MaxBadgeButtonGroup).toBeDefined();
        expect(indexExports.BadgeButtonsGroup).toBeDefined();
        expect(indexExports.BadgeButtonGroup).toBeDefined();
        expect(indexExports.MaxBadgeButtonGroup).toBe(indexExports.MaxBadgeButtonsGroup);
        expect(indexExports.BadgeButtonsGroup).toBe(indexExports.MaxBadgeButtonsGroup);
        expect(indexExports.BadgeButtonGroup).toBe(indexExports.MaxBadgeButtonsGroup);
    });

    it('exporta os dez novos componentes reutilizáveis e seus aliases canônicos', async () => {
        const indexExports = await import('../src/index');

        const pairs: [string, string][] = [
            ['MaxAlert', 'Alert'],
            ['MaxQueryState', 'QueryState'],
            ['MaxFormValidationSummary', 'FormValidationSummary'],
            ['MaxSegmentedControl', 'SegmentedControl'],
            ['MaxPeriodNavigator', 'PeriodNavigator'],
            ['MaxProgressBar', 'ProgressBar'],
            ['MaxFilterBar', 'FilterBar'],
            ['MaxFilePreview', 'FilePreview'],
            ['MaxMarkdownViewer', 'MarkdownViewer'],
            ['MaxCalendar', 'Calendar']
        ];

        for (const [canonical, alias] of pairs) {
            expect((indexExports as any)[canonical]).toBeDefined();
            expect((indexExports as any)[alias]).toBeDefined();
            expect((indexExports as any)[alias]).toBe((indexExports as any)[canonical]);
        }

        expect(indexExports.sanitizeMarkdownHtml).toBeDefined();
        expect(indexExports.isSafeMarkdownUrl).toBeDefined();
        expect(indexExports.escapeHtml).toBeDefined();
    });
});


