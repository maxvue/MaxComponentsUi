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
});

