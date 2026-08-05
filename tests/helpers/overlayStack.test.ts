import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    isTopOverlay,
    lockBodyScroll,
    nextZIndex,
    pushOverlay,
    removeOverlay,
    resetOverlayStack,
    unlockBodyScroll
} from '../../src/helpers/overlayStack';

describe('overlayStack', () => {
    beforeEach(() => {
        resetOverlayStack();
        document.body.style.overflow = '';
    });

    afterEach(() => {
        resetOverlayStack();
        document.body.style.overflow = '';
    });

    describe('z-index', () => {
        it('começa acima do tema (> 1000)', () => {
            // valor absoluto importa: uma base baixa faria os overlays renderizarem
            // ABAIXO de elementos do tema, sem que comparações relativas percebam
            expect(nextZIndex()).toBeGreaterThan(1000);
        });

        it('cada chamada devolve um valor estritamente maior', () => {
            const primeiro = nextZIndex();
            const segundo = nextZIndex();
            const terceiro = nextZIndex();

            expect(segundo).toBeGreaterThan(primeiro);
            expect(terceiro).toBeGreaterThan(segundo);
        });

        it('nunca repete o valor da base (pré-incremento)', () => {
            // com pós-incremento o primeiro overlay receberia a própria base, que é o
            // valor usado como piso — e a máscara (z-1) cairia no nível do tema
            expect(nextZIndex()).not.toBe(1000);
        });
    });

    describe('pilha de overlays', () => {
        it('o último empurrado é o topo', () => {
            const a = Symbol('a');
            const b = Symbol('b');

            pushOverlay(a);
            pushOverlay(b);

            expect(isTopOverlay(b)).toBe(true);
            expect(isTopOverlay(a)).toBe(false);
        });

        it('empurrar o mesmo id duas vezes não duplica: um remove basta', () => {
            const a = Symbol('a');
            const b = Symbol('b');

            pushOverlay(a);
            pushOverlay(b);
            pushOverlay(a); // reentrada: não pode deixar um órfão na pilha

            removeOverlay(a);

            expect(isTopOverlay(b)).toBe(true);
            expect(isTopOverlay(a)).toBe(false);
        });

        it('remover um id do MEIO não afeta o topo', () => {
            const a = Symbol('a');
            const b = Symbol('b');
            const c = Symbol('c');

            pushOverlay(a);
            pushOverlay(b);
            pushOverlay(c);

            removeOverlay(b);

            expect(isTopOverlay(c)).toBe(true);
        });

        it('remover um id do FUNDO não derruba o topo', () => {
            const a = Symbol('a');
            const b = Symbol('b');

            pushOverlay(a);
            pushOverlay(b);

            // remoção por identidade, não por posição: um pop() aqui tiraria b
            removeOverlay(a);

            expect(isTopOverlay(b)).toBe(true);
        });

        it('remover um id ausente não altera a pilha', () => {
            const a = Symbol('a');

            pushOverlay(a);
            removeOverlay(Symbol('nunca-empurrado'));

            expect(isTopOverlay(a)).toBe(true);
        });

        it('pilha vazia não tem topo', () => {
            expect(isTopOverlay(Symbol('a'))).toBe(false);
        });
    });

    describe('trava de scroll com contagem de referências', () => {
        it('trava o body e restaura o valor original', () => {
            document.body.style.overflow = 'scroll';

            lockBodyScroll();
            expect(document.body.style.overflow).toBe('hidden');

            unlockBodyScroll();
            expect(document.body.style.overflow).toBe('scroll');
        });

        it('só destrava quando o último lock é liberado', () => {
            document.body.style.overflow = 'scroll';

            lockBodyScroll();
            lockBodyScroll();
            lockBodyScroll();

            unlockBodyScroll();
            expect(document.body.style.overflow).toBe('hidden');
            unlockBodyScroll();
            expect(document.body.style.overflow).toBe('hidden');

            unlockBodyScroll();
            expect(document.body.style.overflow).toBe('scroll');
        });

        it('o valor original é gravado só na PRIMEIRA trava', () => {
            document.body.style.overflow = 'scroll';

            lockBodyScroll();
            // se a segunda trava regravasse, guardaria 'hidden' e restauraria 'hidden'
            lockBodyScroll();

            unlockBodyScroll();
            unlockBodyScroll();

            expect(document.body.style.overflow).toBe('scroll');
        });

        it('unlock a mais não leva o contador a negativo', () => {
            document.body.style.overflow = 'scroll';

            unlockBodyScroll();
            unlockBodyScroll();
            unlockBodyScroll();

            // com contador negativo, este lock não travaria nada
            lockBodyScroll();
            expect(document.body.style.overflow).toBe('hidden');

            unlockBodyScroll();
            expect(document.body.style.overflow).toBe('scroll');
        });

        it('body sem overflow inline volta a NÃO ter a propriedade', () => {
            document.body.style.overflow = '';

            lockBodyScroll();
            expect(document.body.style.overflow).toBe('hidden');

            unlockBodyScroll();
            // restaurar como 'visible' fixaria uma propriedade que não existia
            expect(document.body.style.overflow).toBe('');
        });

        it('ciclos repetidos não desandam o contador', () => {
            document.body.style.overflow = 'scroll';

            for (let i = 0; i < 5; i++) {
                lockBodyScroll();
                expect(document.body.style.overflow).toBe('hidden');
                unlockBodyScroll();
                expect(document.body.style.overflow).toBe('scroll');
            }
        });
    });
});
