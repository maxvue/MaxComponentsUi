import { describe, it, expect, vi } from 'vitest';
import { install } from '../src/index';

describe('index install', () => {
    it('deve registrar o PrimeVue e a diretiva tooltip', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        install(app as any);

        expect(app.use).toHaveBeenCalled();
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
        expect(primeVueOptions.theme.preset).toBeDefined();
        expect(primeVueOptions.theme.options.prefix).toBe('test');
        expect(primeVueOptions.theme.options.darkModeSelector).toBe('.dark');
    });
});
