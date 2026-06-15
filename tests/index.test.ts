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

    it('deve aceitar options customizadas', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        install(app as any, {
            locale: { custom: true },
            theme: { options: { prefix: 'test' } },
            ripple: false
        });

        expect(app.use).toHaveBeenCalled();
    });
});
