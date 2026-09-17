import { describe, it, expect } from 'vitest';
import { getOverlayWidth, getOverlayLeft, MAX_OVERLAY_WIDTH } from '../../src/helpers/useOverlayWidth';

describe('getOverlayWidth', () => {
    it('acompanha a largura do campo quando ela está entre o piso e o teto', () => {
        expect(getOverlayWidth({ triggerWidth: 260, windowWidth: 1280 })).toBe(260);
    });

    it('aplica o piso em campos estreitos', () => {
        expect(getOverlayWidth({ triggerWidth: 40, windowWidth: 1280 })).toBe(160);
    });

    it('aplica o teto em campos largos', () => {
        // Caso do bug: campo de largura cheia gerava overlay atravessando a tela.
        expect(getOverlayWidth({ triggerWidth: 1100, windowWidth: 1280 })).toBe(MAX_OVERLAY_WIDTH);
    });

    it('encolhe para caber em viewport estreita respeitando calc(100vw - 50px)', () => {
        expect(getOverlayWidth({ triggerWidth: 1100, windowWidth: 320 })).toBe(270);
    });

    it('respeita piso e teto customizados', () => {
        expect(getOverlayWidth({ triggerWidth: 50, windowWidth: 1280, minWidth: 140 })).toBe(140);
        expect(getOverlayWidth({ triggerWidth: 900, windowWidth: 1280, maxWidth: 450 })).toBe(450);
    });

    it('acompanha a largura intrínseca do conteúdo sem ultrapassar o teto', () => {
        expect(getOverlayWidth({ triggerWidth: 180, contentWidth: 260, windowWidth: 1280, maxWidth: 300 })).toBe(260);
        expect(getOverlayWidth({ triggerWidth: 180, contentWidth: 480, windowWidth: 1280, maxWidth: 300 })).toBe(300);
        expect(getOverlayWidth({ triggerWidth: 180, contentWidth: 480, windowWidth: 1280 })).toBe(480);
        expect(getOverlayWidth({ triggerWidth: 180, contentWidth: 700, windowWidth: 1280 })).toBe(500);
    });

    it('nunca devolve largura maior que a viewport útil: min(500px, calc(100vw - 50px))', () => {
        for (const w of [320, 400, 768, 1024, 1920]) {
            const width = getOverlayWidth({ triggerWidth: 5000, windowWidth: w });
            expect(width).toBeLessThanOrEqual(Math.min(500, Math.max(160, w - 50)));
        }
    });
});

describe('getOverlayLeft', () => {
    it('mantém alinhado ao campo quando cabe', () => {
        expect(getOverlayLeft(100, 300, 1280)).toBe(100);
    });

    it('reposiciona à esquerda quando vazaria pela direita', () => {
        // 1100 + 300 = 1400 > 1280 -> encosta na margem direita
        expect(getOverlayLeft(1100, 300, 1280)).toBe(1280 - 300 - 10);
    });

    it('nunca ultrapassa a borda esquerda', () => {
        expect(getOverlayLeft(0, 5000, 320)).toBe(10);
    });

    it('o overlay nunca vaza pela direita', () => {
        const width = getOverlayWidth({ triggerWidth: 1100, windowWidth: 400 });
        const left = getOverlayLeft(350, width, 400);
        expect(left + width).toBeLessThanOrEqual(400);
    });
});
