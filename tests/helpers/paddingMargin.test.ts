import { describe, it, expect } from 'vitest';
import { paddingMargin } from '../../src/helpers/paddingMargin';

describe('paddingMargin', () => {
    // Padding geral
    it('gera padding geral para "p"', () => {
        expect(paddingMargin(['p', 10])).toEqual({ padding: '10px !important' });
    });

    // Margin geral
    it('gera margin geral para "m"', () => {
        expect(paddingMargin(['m', 20])).toEqual({ margin: '20px !important' });
    });

    // Padding por direção
    it('gera padding-top para "pt"', () => {
        expect(paddingMargin(['pt', 5])).toEqual({ 'padding-top': '5px !important' });
    });

    it('gera padding-bottom para "pb"', () => {
        expect(paddingMargin(['pb', 8])).toEqual({ 'padding-bottom': '8px !important' });
    });

    it('gera padding-left para "pl"', () => {
        expect(paddingMargin(['pl', 12])).toEqual({ 'padding-left': '12px !important' });
    });

    it('gera padding-right para "pr"', () => {
        expect(paddingMargin(['pr', 15])).toEqual({ 'padding-right': '15px !important' });
    });

    // Eixos compostos
    it('gera padding vertical (top + bottom) para "py"', () => {
        expect(paddingMargin(['py', 10])).toEqual({
            'padding-top': '10px !important',
            'padding-bottom': '10px !important'
        });
    });

    it('gera padding horizontal (left + right) para "px"', () => {
        expect(paddingMargin(['px', 10])).toEqual({
            'padding-left': '10px !important',
            'padding-right': '10px !important'
        });
    });

    it('gera margin vertical para "my"', () => {
        expect(paddingMargin(['my', 10])).toEqual({
            'margin-top': '10px !important',
            'margin-bottom': '10px !important'
        });
    });

    it('gera margin horizontal para "mx"', () => {
        expect(paddingMargin(['mx', 10])).toEqual({
            'margin-left': '10px !important',
            'margin-right': '10px !important'
        });
    });

    // Atalho "h" (height = top + bottom) e "w" (width = left + right)
    it('gera padding top + bottom para "ph" (height)', () => {
        expect(paddingMargin(['ph', 8])).toEqual({
            'padding-top': '8px !important',
            'padding-bottom': '8px !important'
        });
    });

    it('gera padding left + right para "pw" (width)', () => {
        expect(paddingMargin(['pw', 8])).toEqual({
            'padding-left': '8px !important',
            'padding-right': '8px !important'
        });
    });

    // Sem p ou m
    it('retorna undefined quando a classe não contém "p" nem "m"', () => {
        expect(paddingMargin(['xyz', 10])).toBeUndefined();
    });

    // Valores com unidade CSS
    it('aceita valores string com unidade', () => {
        expect(paddingMargin(['p', '2rem'])).toEqual({ padding: '2rem !important' });
    });
});
