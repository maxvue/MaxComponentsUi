import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    loadCardBrandUri,
    loadCardBackgroundUri,
    isCardBrandCached,
    isCardBackgroundCached,
    clearCardAssetsCache,
    resolveCanonicalCardBrand,
    resolveCanonicalAssetKey,
    _setBrandLoaderForTest,
    _setBackgroundLoaderForTest,
    type CanonicalCardBrand
} from '../../src/helpers/creditCardAssets';

const ALL_BRANDS: CanonicalCardBrand[] = [
    'amex',
    'diners',
    'discover',
    'elo',
    'hipercard',
    'jcb',
    'maestro',
    'mastercard',
    'visa'
];

const DIST_DIR = path.resolve(__dirname, '../../dist');

describe('creditCardAssets - Isolamento Modular Rigoroso (tests/unit)', () => {
    beforeEach(() => {
        clearCardAssetsCache();
    });

    describe('Isolamento de Execução de Loaders', () => {
        it('carregar Visa executa EXCLUSIVAMENTE o loader de Visa e zero loaders de outras bandeiras', async () => {
            const spies: Record<CanonicalCardBrand, ReturnType<typeof vi.fn>> = {
                amex: vi.fn(() => Promise.resolve({ default: '<svg id="mock-amex"></svg>' })),
                diners: vi.fn(() => Promise.resolve({ default: '<svg id="mock-diners"></svg>' })),
                discover: vi.fn(() => Promise.resolve({ default: '<svg id="mock-discover"></svg>' })),
                elo: vi.fn(() => Promise.resolve({ default: '<svg id="mock-elo"></svg>' })),
                hipercard: vi.fn(() => Promise.resolve({ default: '<svg id="mock-hipercard"></svg>' })),
                jcb: vi.fn(() => Promise.resolve({ default: '<svg id="mock-jcb"></svg>' })),
                maestro: vi.fn(() => Promise.resolve({ default: '<svg id="mock-maestro"></svg>' })),
                mastercard: vi.fn(() => Promise.resolve({ default: '<svg id="mock-mastercard"></svg>' })),
                visa: vi.fn(() => Promise.resolve({ default: '<svg id="mock-visa"></svg>' }))
            };

            for (const brand of ALL_BRANDS) _setBrandLoaderForTest(brand, spies[brand] as unknown as () => Promise<{ default: string }>);
            // Invoca apenas Visa
            const visaUri = await loadCardBrandUri('visa');
            expect(visaUri).toBeTruthy();
            expect(isCardBrandCached('visa')).toBe(true);

            // Loader do Visa foi chamado exatamente 1 vez
            expect(spies.visa).toHaveBeenCalledTimes(1);

            // NENHUM dos outros loaders foi chamado nem colocado em cache
            const otherBrands = ALL_BRANDS.filter((b) => b !== 'visa');
            for (const other of otherBrands) {
                expect(isCardBrandCached(other)).toBe(false);
                expect(
                    spies[other],
                    `Loader da bandeira ${other} NÃO deveria ter sido chamado ao carregar Visa`
                ).toHaveBeenCalledTimes(0);
            }

            // Segunda chamada para Visa utiliza cache: zero chamadas adicionais ao loader
            const cachedVisaUri = await loadCardBrandUri('visa');
            expect(cachedVisaUri).toBe(visaUri);
            expect(spies.visa).toHaveBeenCalledTimes(1);
        });

        it('carregar fundo frontal não invoca loader de verso nem loaders de bandeiras', async () => {
            const frontSpy = vi.fn(() => Promise.resolve({ default: '<svg id="mock-front"></svg>' }));
            const rearSpy = vi.fn(() => Promise.resolve({ default: '<svg id="mock-rear"></svg>' }));

            _setBackgroundLoaderForTest('front', frontSpy);
            _setBackgroundLoaderForTest('rear', rearSpy);

            const frontUri = await loadCardBackgroundUri('front');
            expect(frontUri).toBeTruthy();

            expect(frontSpy).toHaveBeenCalledTimes(1);
            expect(rearSpy).toHaveBeenCalledTimes(0);
            expect(isCardBackgroundCached('front')).toBe(true);
            expect(isCardBackgroundCached('rear')).toBe(false);
        });
    });

    describe('Resolução Canônica e Deduplicação de Aliases', () => {
        it('aliases apontam para o mesmo loader canônico sem duplicação', async () => {
            const amexSpy = vi.fn(() => Promise.resolve({ default: '<svg id="mock-amex"></svg>' }));
            _setBrandLoaderForTest('amex', amexSpy);

            const uriAmex = await loadCardBrandUri('amex');
            const uriAlias = await loadCardBrandUri('american-express');
            const uriPrefixed = await loadCardBrandUri('card-american-express');

            expect(uriAlias).toBe(uriAmex);
            expect(uriPrefixed).toBe(uriAmex);
            expect(amexSpy).toHaveBeenCalledTimes(1);
        });

        it('resolveCanonicalAssetKey mapeia todos os aliases para chaves de arquivo canônicas', () => {
            expect(resolveCanonicalAssetKey('american-express')).toBe('card-amex');
            expect(resolveCanonicalAssetKey('diners-club')).toBe('card-diners');
            expect(resolveCanonicalAssetKey('hiper')).toBe('card-hipercard');
            expect(resolveCanonicalAssetKey('visa')).toBe('card-visa');
            expect(resolveCanonicalAssetKey('discovery')).toBe('card-discovery');
        });

        it('resolveCanonicalCardBrand normaliza case e espaços em branco', () => {
            expect(resolveCanonicalCardBrand('  VISA  ')).toBe('visa');
            expect(resolveCanonicalCardBrand('MasterCard')).toBe('mastercard');
            expect(resolveCanonicalCardBrand('JCB')).toBe('jcb');
            expect(resolveCanonicalCardBrand('')).toBeNull();
            expect(resolveCanonicalCardBrand(null)).toBeNull();
        });
    });

    describe('Garantia de Não Contaminação no Build Distribuído', () => {
        it('o chunk distribuído de Visa não contém identificadores de outras bandeiras', () => {
            if (fs.existsSync(DIST_DIR)) {
                const distFiles = fs.readdirSync(DIST_DIR);
                const visaChunkFile = distFiles.find((f) => f.startsWith('card-visa-') && f.endsWith('.js'));
                expect(visaChunkFile).toBeDefined();

                const content = fs.readFileSync(path.join(DIST_DIR, visaChunkFile!), 'utf-8');

                // Confirma que é o SVG do Visa
                expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');

                // Garante ausência dos outros nomes de arquivos de bandeira
                const otherAssets = ['card-amex', 'card-diners', 'card-elo', 'card-hipercard', 'card-jcb', 'card-mastercard'];
                for (const asset of otherAssets) expect(content).not.toContain(asset);

            }
        });
    });
});
