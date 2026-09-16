import { describe, it, expect, vi } from 'vitest';
import { allowConsoleWarn, allowConsoleError, verifyConsoleClean } from '../helpers/consolePolicy';

describe('Política de console e suíte sem warnings (E12-02)', () => {
    it('permite que testes usem vi.spyOn(console, "warn") localmente quando consomem a asserção', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn('Aviso esperado e tratado localmente');

        expect(spy).toHaveBeenCalledWith('Aviso esperado e tratado localmente');
        spy.mockRestore();
    });

    it('permite que testes usem vi.spyOn(console, "error") localmente quando consomem a asserção', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        console.error('Erro esperado e tratado localmente');

        expect(spy).toHaveBeenCalledWith('Erro esperado e tratado localmente');
        spy.mockRestore();
    });

    it('permite allowlist explícita via allowConsoleWarn sem precisar de spy', () => {
        allowConsoleWarn('Aviso autorizado via allowlist');
        console.warn('Aviso autorizado via allowlist para teste específico');
    });

    it('permite allowlist explícita via allowConsoleError sem precisar de spy', () => {
        allowConsoleError(/Erro autorizado/);
        console.error('Erro autorizado por regex na allowlist');
    });

    it('suporta múltiplos consumos sequenciais com toHaveBeenCalledTimes', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn('Mensagem 1');
        console.warn('Mensagem 2');

        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
    });

    it('detecta e falha quando chamada de console.warn sob vi.spyOn não é assertada', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn('Aviso não tratado e não assertado');

        // verifyConsoleClean deve disparar exceção porque a chamada sob o spy não foi assertada
        expect(() => verifyConsoleClean()).toThrow(/não consumiu\/assertou todas as chamadas/);
        spy.mockRestore();
    });

    it('detecta e falha quando chamada de console.error sob vi.spyOn não é assertada', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        console.error('Erro crítico não assertado');

        expect(() => verifyConsoleClean()).toThrow(/não consumiu\/assertou todas as chamadas/);
        spy.mockRestore();
    });

    it('detecta e falha quando chamada direta não autorizada ocorre sem spy', () => {
        console.warn('Aviso direto sem spy e sem allowlist');
        expect(() => verifyConsoleClean()).toThrow(/Teste emitiu console\.warn inesperado/);
    });

    it('detecta e falha quando houve múltiplos avisos sob spy mas apenas um foi consumido com toHaveBeenCalledWith', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn('Aviso 1 esperado');
        console.warn('Aviso 2 inesperado e não assertado');

        expect(spy).toHaveBeenCalledWith('Aviso 1 esperado');

        expect(() => verifyConsoleClean()).toThrow(/não consumiu\/assertou todas as chamadas/);
        spy.mockRestore();
    });

    it('detecta e falha quando spy tem chamadas apenas lidas via propriedade sem asserção explícita', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn('Aviso apenas inspecionado sem asserção');

        // Apenas leitura da propriedade sem expect(...)
        const _len = spy.mock.calls.length;
        const _call = spy.mock.calls[0];

        expect(() => verifyConsoleClean()).toThrow(/não consumiu\/assertou todas as chamadas/);
        spy.mockRestore();
    });

    it('permite consumo explícito de chamadas sob spy via consumeSpyCalls', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn('Aviso drenado intencionalmente');

        (globalThis as any).consumeSpyCalls(spy);

        expect(() => verifyConsoleClean()).not.toThrow();
        spy.mockRestore();
    });

    it('R02 / E01-04: reprova chamada de AbortError ou ERR_CANCELED sem spy ou allowlist explícita (sem bypass global)', () => {
        console.error('DOMException [AbortError]: The operation was aborted');
        expect(() => verifyConsoleClean()).toThrow(/Teste emitiu console\.error inesperado/);

        console.error('AxiosError: ERR_CANCELED');
        expect(() => verifyConsoleClean()).toThrow(/Teste emitiu console\.error inesperado/);
    });

    it('R02 / E01-04: permite AbortError somente quando autorizado explicitamente via allowConsoleError local', () => {
        allowConsoleError('AbortError');
        console.error('DOMException [AbortError]: Operação cancelada intencionalmente');

        expect(() => verifyConsoleClean()).not.toThrow();
    });
});
