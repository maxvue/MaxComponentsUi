import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const assetsDir = path.resolve(__dirname, '../../src/assets/credit-card');

function getFileSize(filePath: string): number {
    return fs.statSync(filePath).size;
}

function getGzipSize(content: Buffer): number {
    return zlib.gzipSync(content).length;
}

function getBrotliSize(content: Buffer): number {
    return zlib.brotliCompressSync(content).length;
}

describe('SVG Pipeline & Budgets', () => {
    const files = fs.readdirSync(assetsDir).filter((file) => file.endsWith('.svg'));
    const budgets = {
        raw: 15000,
        gzip: 6000,
        brotli: 5000
    };

    it('should have SVG files to test', () => {
        expect(files.length).toBeGreaterThan(0);
    });

    for (const file of files) describe(`SVG: ${file}`, () => {
        const filePath = path.join(assetsDir, file);
        const content = fs.readFileSync(filePath);

        const rawSize = getFileSize(filePath);
        const gzipSize = getGzipSize(content);
        const brotliSize = getBrotliSize(content);

        it(`raw size should be under ${budgets.raw} bytes (Current: ${rawSize})`, () => {
            expect(rawSize).toBeLessThanOrEqual(budgets.raw);
        });

        it(`gzip size should be under ${budgets.gzip} bytes (Current: ${gzipSize})`, () => {
            expect(gzipSize).toBeLessThanOrEqual(budgets.gzip);
        });

        it(`brotli size should be under ${budgets.brotli} bytes (Current: ${brotliSize})`, () => {
            expect(brotliSize).toBeLessThanOrEqual(budgets.brotli);
        });
    });


    it('should demonstrate tree-shaking capability for credit card flags', async () => {
        // Verifica que SVGs individuais são importados como módulos separados
        const amex = await import('../../src/assets/credit-card/card-amex.svg?raw');
        expect(amex.default).toContain('<svg');
        expect(amex.default).toContain('viewBox');

        // Confirma que o módulo individual do amex não inclui conteúdo nem identificadores de outras bandeiras
        expect(amex.default).not.toContain('card-visa');
        expect(amex.default).not.toContain('card-jcb');
    });
});
