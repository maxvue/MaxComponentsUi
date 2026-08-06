import { describe, it, expect, vi, beforeEach } from 'vitest';
import { install } from '../src/index';
import Tooltip from '../src/directives/tooltip';

// Após a migração o install() NÃO chama mais app.use(PrimeVue): ele aplica o tema
// direto como custom properties no :root e registra a diretiva de tooltip própria.
describe('index install', () => {
    beforeEach(() => {
        document.documentElement.removeAttribute('style');
    });

    it('registra a diretiva tooltip própria (sem PrimeVue)', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        install(app as any);

        expect(app.directive).toHaveBeenCalledWith('tooltip', Tooltip);
        // O plugin do PrimeVue foi removido — nenhum app.use() deve mais acontecer.
        expect(app.use).not.toHaveBeenCalled();
    });

    it('aplica o tema Max como custom properties no documento', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        expect(document.documentElement.style.getPropertyValue('--max-primary-500')).toBe('');

        install(app as any);

        const root = document.documentElement.style;
        expect(root.getPropertyValue('--max-primary-500')).toBe('#00768E');
        expect(root.getPropertyValue('--p-primary-500')).toBe('#00768E');
        expect(root.getPropertyValue('--max-danger-500')).toBe('#EF4444');
        expect(root.getPropertyValue('--max-success-500')).toBe('#10B981');
    });

    it('aceita options customizadas sem quebrar', () => {
        const app = {
            use: vi.fn(),
            directive: vi.fn()
        };

        install(app as any, {
            locale: { custom: true },
            theme: { options: { prefix: 'test' } },
            ripple: false
        });

        expect(app.directive).toHaveBeenCalledWith('tooltip', Tooltip);
        expect(document.documentElement.style.getPropertyValue('--max-primary-500')).toBe('#00768E');
    });
});
