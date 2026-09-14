import { describe, it, expect, vi } from 'vitest';

describe('Política de console e suíte sem warnings (E12-02)', () => {
    it('permite que testes usem vi.spyOn(console, "warn") localmente sem falhar o teste', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn('Aviso esperado e tratado localmente');

        expect(spy).toHaveBeenCalledWith('Aviso esperado e tratado localmente');
        spy.mockRestore();
    });

    it('permite que testes usem vi.spyOn(console, "error") localmente sem falhar o teste', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        console.error('Erro esperado e tratado localmente');

        expect(spy).toHaveBeenCalledWith('Erro esperado e tratado localmente');
        spy.mockRestore();
    });
});
