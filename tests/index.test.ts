import { describe, it, expect, vi } from 'vitest';
import { install } from '../src/index';
import { MaxStyle } from '../src/styles/style';
import PrimeVue from 'primevue/config';

describe('index install', () => {
    it('deve registrar o PrimeVue com configurações padrão quando nenhuma option for passada', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        install(app as any);

        expect(app.use).toHaveBeenCalledWith(
            PrimeVue,
            expect.objectContaining({
                ripple: true,
                theme: expect.objectContaining({
                    preset: MaxStyle,
                    options: expect.objectContaining({
                        darkModeSelector: '.dark',
                        prefix: 'max'
                    })
                })
            })
        );
        expect(app.directive).toHaveBeenCalledWith('tooltip', expect.anything());
    });

    it('deve aceitar options customizadas sem sobrescrever o preset MaxStyle nem options internas', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        const customLocale = { custom: true };
        install(app as any, {
            locale: customLocale,
            theme: { options: { prefix: 'test' } },
            ripple: false,
            unstyled: true
        });

        expect(app.use).toHaveBeenCalled();
        const primeVueOptions = app.use.mock.calls[0][1];

        expect(primeVueOptions.locale).toBe(customLocale);
        expect(primeVueOptions.ripple).toBe(false);
        expect(primeVueOptions.unstyled).toBe(true);
        expect(primeVueOptions.theme.preset).toBe(MaxStyle);
        expect(primeVueOptions.theme.options.prefix).toBe('test');
        expect(primeVueOptions.theme.options.darkModeSelector).toBe('.dark');
    });

    it('preserva o preset MaxStyle quando o consumidor passa um theme SEM preset', () => {
        const app = { use: vi.fn(), directive: vi.fn() };

        // Caso crítico: o consumidor customiza o theme mas não define preset.
        // Um spread na ordem errada (`preset: MaxStyle` antes de `...userTheme`)
        // não quebra aqui, mas quebra no teste seguinte.
        install(app as any, { theme: { options: { prefix: 'test' } } });

        expect(app.use.mock.calls[0][1].theme.preset).toBe(MaxStyle);
    });

    it('respeita o preset do consumidor quando ele fornece um explicitamente', () => {
        const app = { use: vi.fn(), directive: vi.fn() };
        const customPreset = { custom: 'preset' };

        install(app as any, { theme: { preset: customPreset } });

        expect(app.use.mock.calls[0][1].theme.preset).toBe(customPreset);
    });

    it('não permite que um theme com preset undefined apague o MaxStyle', () => {
        const app = { use: vi.fn(), directive: vi.fn() };

        // Regressão: com `{ preset: MaxStyle, ...userTheme }` o spread de um
        // theme contendo `preset: undefined` sobrescreve o MaxStyle com undefined.
        install(app as any, { theme: { preset: undefined, options: { prefix: 'x' } } });

        expect(app.use.mock.calls[0][1].theme.preset).toBe(MaxStyle);
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

