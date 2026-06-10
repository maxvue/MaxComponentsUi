import { describe, it, expect } from 'vitest';
import { country_ddi_flags } from '../../src/constants/ddiFlags';
import type { DDIFlag } from '../../src/constants/ddiFlags';

describe('ddiFlags', () => {
    it('contém pelo menos 200 países', () => {
        expect(country_ddi_flags.length).toBeGreaterThanOrEqual(200);
    });

    it('contém o Brasil com DDI 55 e sigla BR', () => {
        const brasil = country_ddi_flags.find((c: DDIFlag) => c.sigla === 'BR');
        expect(brasil).toBeDefined();
        expect(brasil!.ddi).toBe(55);
        expect(brasil!.name).toBe('Brasil');
        expect(brasil!.value).toBe(55);
    });

    it('todos os itens possuem campos obrigatórios preenchidos', () => {
        for (const item of country_ddi_flags) {
            expect(item.ddi).toBeDefined();
            expect(typeof item.ddi).toBe('number');
            expect(item.name).toBeTruthy();
            expect(item.sigla).toBeTruthy();
            expect(typeof item.value).toBe('number');
        }
    });

    it('siglas são strings de 2 caracteres', () => {
        for (const item of country_ddi_flags) {
            expect(item.sigla).toHaveLength(2);
        }
    });

    it('DDI do Brasil (55) é único na lista', () => {
        const brasilEntries = country_ddi_flags.filter((c: DDIFlag) => c.sigla === 'BR');
        expect(brasilEntries).toHaveLength(1);
    });

    it('contém países-chave como EUA, Portugal e Argentina', () => {
        const eua = country_ddi_flags.find((c: DDIFlag) => c.sigla === 'US');
        const portugal = country_ddi_flags.find((c: DDIFlag) => c.sigla === 'PT');
        const argentina = country_ddi_flags.find((c: DDIFlag) => c.sigla === 'AR');

        expect(eua).toBeDefined();
        expect(eua!.ddi).toBe(1);

        expect(portugal).toBeDefined();
        expect(portugal!.ddi).toBe(351);

        expect(argentina).toBeDefined();
        expect(argentina!.ddi).toBe(54);
    });
});
