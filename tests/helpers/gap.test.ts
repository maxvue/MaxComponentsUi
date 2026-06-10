import { describe, it, expect } from 'vitest';
import { gap } from '../../src/helpers/gap';

describe('gap', () => {
    it('retorna objeto vazio quando params tem menos de 3 itens', () => {
        expect(gap(['gap', 'row'])).toEqual({});
        expect(gap(['gap'])).toEqual({});
        expect(gap([])).toEqual({});
    });

    it('retorna objeto vazio quando terceiro item está vazio', () => {
        expect(gap(['gap', 'row', ''])).toEqual({});
    });

    it('retorna row-gap quando segundo parâmetro é "row"', () => {
        expect(gap(['class', 'row', '10'])).toEqual({ 'row-gap': '10px !important' });
    });

    it('retorna row-gap com case insensitive', () => {
        expect(gap(['class', 'ROW', '15'])).toEqual({ 'row-gap': '15px !important' });
        expect(gap(['class', 'Row', '20'])).toEqual({ 'row-gap': '20px !important' });
    });

    it('retorna column-gap quando segundo parâmetro é "gap"', () => {
        expect(gap(['class', 'gap', '15'])).toEqual({ 'column-gap': '15px !important' });
    });

    it('retorna column-gap com case insensitive', () => {
        expect(gap(['class', 'GAP', '12'])).toEqual({ 'column-gap': '12px !important' });
    });

    it('retorna gap genérico para outros valores', () => {
        expect(gap(['class', 'other', '20'])).toEqual({ gap: '20px' });
    });

    it('remove caractere ":" do valor', () => {
        expect(gap(['class', 'row', ':10'])).toEqual({ 'row-gap': '10px !important' });
    });

    it('respeita valores com unidade CSS', () => {
        expect(gap(['class', 'other', '2rem'])).toEqual({ gap: '2rem' });
    });
});
