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

    it('deve aceitar options customizadas sem descartar o preset MaxStyle nem o merge de options', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        install(app as any, {
            locale: { custom: true },
            theme: { options: { prefix: 'test' } },
            ripple: false
        });

        expect(app.use).toHaveBeenCalledWith(
            PrimeVue,
            expect.objectContaining({
                locale: { custom: true },
                ripple: false,
                theme: expect.objectContaining({
                    preset: MaxStyle,
                    options: expect.objectContaining({
                        prefix: 'test',
                        darkModeSelector: '.dark'
                    })
                })
            })
        );
    });
});
