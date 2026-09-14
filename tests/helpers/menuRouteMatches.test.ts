import { describe, expect, it } from 'vitest';
import { isMenuRouteActive } from '../../src/helpers/menuRouteMatches';

describe('isMenuRouteActive', () => {
    it('rejeita entradas vazias', () => {
        expect(isMenuRouteActive(null, 'dashboard')).toBe(false);
        expect(isMenuRouteActive(undefined, 'dashboard')).toBe(false);
        expect(isMenuRouteActive({ details: {} }, '')).toBe(false);
    });

    it('reconhece rota direta e page_component normalizados', () => {
        expect(isMenuRouteActive({ details: { route: 'extract' } }, 'Extract')).toBe(true);
        expect(isMenuRouteActive({ details: { page_component: 'ExtractPage' } }, 'extract_page')).toBe(true);
    });

    it('reconhece matches nos níveis superior e details', () => {
        expect(isMenuRouteActive({ matches: ['transaction_detail'] }, 'TransactionDetail')).toBe(true);
        expect(isMenuRouteActive({ details: { matches: ['statistics'] } }, 'statistics')).toBe(true);
        expect(isMenuRouteActive({ route: 'cash_accounts', matches: ['open_finance'] }, 'open_finance')).toBe(true);
    });

    it('não marca rota não declarada', () => {
        expect(isMenuRouteActive({ details: { route: 'extract' }, matches: ['transaction_detail'] }, 'categories')).toBe(false);
    });
});
