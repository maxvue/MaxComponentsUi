import { describe, it, expect, vi, afterEach } from 'vitest';
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

    it('detecta e falha quando matcher negativo é utilizado e há aviso sob spy não assertado', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn('Aviso real emitido');

        expect(spy).not.toHaveBeenCalledWith('Outro aviso qualquer');

        expect(() => verifyConsoleClean()).toThrow(/não consumiu\/assertou todas as chamadas/);
        spy.mockRestore();
    });

    it('detecta warning tardio emitido depois de uma asserção sob spy', async () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        console.warn('Aviso esperado inicialmente');
        expect(spy).toHaveBeenCalledWith('Aviso esperado inicialmente');

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                console.warn('Aviso tardio não consumido');
                resolve();
            }, 0);
        });

        expect(() => verifyConsoleClean()).toThrow(/Aviso tardio não consumido/);
        spy.mockRestore();
    });

    it('detecta error tardio emitido depois de uma asserção sob spy', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        console.error('Erro esperado inicialmente');
        expect(spy).toHaveBeenCalledWith('Erro esperado inicialmente');

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                console.error('Erro tardio não consumido');
                resolve();
            }, 0);
        });

        expect(() => verifyConsoleClean()).toThrow(/Erro tardio não consumido/);
        spy.mockRestore();
    });

    describe('emissão posterior ao corpo do teste', () => {
        afterEach(async () => {
            // Este é o teardown do caso, não o corpo do teste: reproduz uma
            // emissão que chega quando o componente já devolveu o controle.
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            expect(() => verifyConsoleClean()).toThrow(/tardio no teardown/);
        });

        it('rejeita warning tardio mesmo quando o spy já foi consumido', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            console.warn('Aviso consumido antes do teardown');
            expect(spy).toHaveBeenCalledWith('Aviso consumido antes do teardown');

            setTimeout(() => console.warn('Aviso tardio no teardown'), 0);
        });
    });
});
