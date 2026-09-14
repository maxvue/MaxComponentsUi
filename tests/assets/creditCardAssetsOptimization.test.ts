import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {
    loadCardBrandUri,
    loadCardBackgroundUri,
    isCardBrandCached,
    isCardBackgroundCached,
    clearCardAssetsCache,
    resolveCanonicalCardBrand
} from '../../src/helpers/creditCardAssets';

const ASSETS_DIR = path.resolve(__dirname, '../../src/assets/credit-card');

describe('R21 / E11-03: Otimização de Assets SVG e Isolamento de Chunks', () => {
    beforeEach(() => {
        clearCardAssetsCache();
    });

    it('todos os 11 assets SVG de cartão de crédito existem e possuem viewBox preservado', () => {
        const expectedFiles = [
            'card-amex.svg',
            'card-diners.svg',
            'card-discovery.svg',
            'card-elo.svg',
            'card-hipercard.svg',
            'card-jcb.svg',
            'card-maestro.svg',
            'card-mastercard.svg',
            'card-visa.svg',
            'credit-card.svg',
            'credit-card-rear.svg'
        ];

        for (const file of expectedFiles) {
            const filePath = path.join(ASSETS_DIR, file);
            expect(fs.existsSync(filePath), `Arquivo ${file} deve existir`).toBe(true);

            const content = fs.readFileSync(filePath, 'utf-8');
            expect(content).toContain('<svg');
            expect(content).toContain('viewBox');
        }
    });

    it('orçamento de tamanho bruto e comprimido (gzip e brotli) é respeitado para cada asset', () => {
        const files = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.svg'));
        expect(files.length).toBe(11);

        for (const file of files) {
            const content = fs.readFileSync(path.join(ASSETS_DIR, file));
            const rawSize = content.length;
            const gzipSize = zlib.gzipSync(content).length;
            const brotliSize = zlib.brotliCompressSync(content).length;

            // Nenhuma bandeira individual pode exceder 20 KB bruto
            expect(rawSize).toBeLessThan(20 * 1024);
            // Gzip abaixo de 8 KB
            expect(gzipSize).toBeLessThan(8 * 1024);
            // Brotli abaixo de 7 KB
            expect(brotliSize).toBeLessThan(7 * 1024);
        }
    });

    it('carregar uma bandeira específica sob demanda NÃO carrega nem instancia as demais no cache', async () => {
        // Inicialmente nada em cache
        expect(isCardBrandCached('visa')).toBe(false);
        expect(isCardBrandCached('mastercard')).toBe(false);
        expect(isCardBrandCached('amex')).toBe(false);

        // Carrega apenas Visa
        const visaUri = await loadCardBrandUri('visa');
        expect(visaUri).toBeTruthy();
        expect(isCardBrandCached('visa')).toBe(true);

        // Nenhuma outra bandeira deve ter sido carregada ou colocada em cache
        expect(isCardBrandCached('mastercard')).toBe(false);
        expect(isCardBrandCached('amex')).toBe(false);
        expect(isCardBrandCached('elo')).toBe(false);
        expect(isCardBrandCached('hipercard')).toBe(false);
        expect(isCardBrandCached('diners')).toBe(false);
        expect(isCardBrandCached('discover')).toBe(false);
        expect(isCardBrandCached('jcb')).toBe(false);
        expect(isCardBrandCached('maestro')).toBe(false);
        expect(isCardBackgroundCached('front')).toBe(false);
        expect(isCardBackgroundCached('rear')).toBe(false);
    });

    it('carregar o fundo frontal NÃO carrega o fundo de verso', async () => {
        const frontUri = await loadCardBackgroundUri('front');
        expect(frontUri).toBeTruthy();
        expect(isCardBackgroundCached('front')).toBe(true);
        expect(isCardBackgroundCached('rear')).toBe(false);
    });

    it('todas as 9 marcas canônicas resolvem e carregam Data URIs independentes e válidas', async () => {
        const brands = ['amex', 'diners', 'discover', 'elo', 'hipercard', 'jcb', 'maestro', 'mastercard', 'visa'] as const;

        for (const brand of brands) {
            const canonical = resolveCanonicalCardBrand(brand);
            expect(canonical).toBe(brand);

            const uri = await loadCardBrandUri(brand);
            expect(uri).toBeTruthy();
            expect(uri).toMatch(/^data:image\/svg\+xml;base64,/);
        }
    });
});
