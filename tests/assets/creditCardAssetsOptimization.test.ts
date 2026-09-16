import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { optimize } from 'svgo';
import svgoConfig from '../../svgo.config.mjs';
import {
    loadCardBrandUri,
    loadCardBackgroundUri,
    isCardBrandCached,
    isCardBackgroundCached,
    clearCardAssetsCache,
    resolveCanonicalCardBrand
} from '../../src/helpers/creditCardAssets';

const ASSETS_DIR = path.resolve(__dirname, '../../src/assets/credit-card');
const DIST_DIR = path.resolve(__dirname, '../../dist');

/**
 * Função utilitária para inspeção de segurança de conteúdo SVG.
 * Rejeita scripts inline, handlers on*, tags perigosas e esquemas de URL não autorizados.
 */
function inspectSvgSecurity(svgContent: string): { isSafe: boolean; violations: string[] } {
    const violations: string[] = [];

    if (/<script\b[^>]*>/i.test(svgContent)) violations.push('Tag <script> inline detectada');

    if (/<foreignObject\b[^>]*>/i.test(svgContent)) violations.push('Tag <foreignObject> detectada');

    if (/\son\w+\s*=/i.test(svgContent)) violations.push('Handler de evento on* inline detectado');

    if (/javascript:/i.test(svgContent)) violations.push('Protocolo javascript: inseguro detectado');

    if (/data:\s*text\/html/i.test(svgContent)) violations.push('URI data:text/html insegura detectada');

    if (/(?:href|xlink:href|src)\s*=\s*["'](?!http:\/\/www\.w3\.org\/)https?:/i.test(svgContent)) violations.push('URL externa absoluta não autorizada detectada');


    return {
        isSafe: violations.length === 0,
        violations
    };
}

describe('R21 / F27: Otimização de Assets SVG, Segurança e Isolamento Modular', () => {
    beforeEach(() => {
        clearCardAssetsCache();
    });

    describe('Estrutura e Preservação de ViewBox', () => {
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

        it('não existem arquivos físicos redundantes no diretório de assets (exatamente 11 arquivos)', () => {
            const files = fs.readdirSync(ASSETS_DIR);
            expect(files.length).toBe(11);

            // Confirma ausência dos 3 arquivos duplicados legados
            expect(files).not.toContain('card-american-express.svg');
            expect(files).not.toContain('card-diners-club.svg');
            expect(files).not.toContain('card-hiper.svg');
        });
    });

    describe('Idempotência da Otimização SVGO', () => {
        it('todos os 11 arquivos SVG são 100% idempotentes sob a configuração do svgo.config.mjs', () => {
            const files = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.svg'));
            expect(files.length).toBe(11);

            for (const file of files) {
                const filePath = path.join(ASSETS_DIR, file);
                const originalContent = fs.readFileSync(filePath, 'utf-8');

                const optimized = optimize(originalContent, {
                    path: filePath,
                    ...(svgoConfig as Record<string, unknown>)
                } as Parameters<typeof optimize>[1]);

                expect((optimized as { error?: unknown }).error).toBeUndefined();
                expect(
                    optimized.data,
                    `Arquivo ${file} deve ser idêntico à saída do SVGO (idempotência perfeita)`
                ).toBe(originalContent);
            }
        });
    });

    describe('Auditoria de Segurança dos SVGs', () => {
        it('todos os 11 arquivos SVG estão isentos de scripts inline, handlers e URLs inseguras', () => {
            const files = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.svg'));
            expect(files.length).toBe(11);

            for (const file of files) {
                const content = fs.readFileSync(path.join(ASSETS_DIR, file), 'utf-8');
                const audit = inspectSvgSecurity(content);

                expect(
                    audit.isSafe,
                    `Arquivo ${file} falhou na auditoria de segurança: ${audit.violations.join(', ')}`
                ).toBe(true);
                expect(audit.violations).toEqual([]);
            }
        });

        it('fixtures negativas adversariais: detector rejeita injeções maliciosas em SVGs', () => {
            const maliciousCases = [
                {
                    name: 'script inline clássico',
                    svg: '<svg viewBox="0 0 100 100"><script>alert(1)</script></svg>',
                    expectedViolation: 'Tag <script> inline detectada'
                },
                {
                    name: 'handler onload em elemento rect',
                    svg: '<svg viewBox="0 0 100 100"><rect onload="stealCookies()" width="10" height="10"/></svg>',
                    expectedViolation: 'Handler de evento on* inline detectado'
                },
                {
                    name: 'handler onclick em elemento path',
                    svg: '<svg viewBox="0 0 100 100"><path onclick="doEvil()" d="M0 0"/></svg>',
                    expectedViolation: 'Handler de evento on* inline detectado'
                },
                {
                    name: 'link com protocolo javascript:',
                    svg: '<svg viewBox="0 0 100 100"><a href="javascript:alert(document.domain)"><text>Clique</text></a></svg>',
                    expectedViolation: 'Protocolo javascript: inseguro detectado'
                },
                {
                    name: 'tag foreignObject para injeção HTML',
                    svg: '<svg viewBox="0 0 100 100"><foreignObject width="100" height="100"><iframe src="about:blank"></iframe></foreignObject></svg>',
                    expectedViolation: 'Tag <foreignObject> detectada'
                },
                {
                    name: 'url externa arbitrária em xlink:href',
                    svg: '<svg viewBox="0 0 100 100"><image href="https://attacker.com/leak.png"/></svg>',
                    expectedViolation: 'URL externa absoluta não autorizada detectada'
                }
            ];

            for (const testCase of maliciousCases) {
                const audit = inspectSvgSecurity(testCase.svg);
                expect(
                    audit.isSafe,
                    `Caso adversarial "${testCase.name}" deveria ter sido marcado como inseguro`
                ).toBe(false);
                expect(
                    audit.violations,
                    `Caso adversarial "${testCase.name}" deveria conter a violação esperada`
                ).toContain(testCase.expectedViolation);
            }
        });
    });

    describe('Orçamentos Estritos de Tamanho (Bruto, Gzip e Brotli)', () => {
        it('orçamento individual é respeitado por cada asset (< 20 KB bruto, < 8 KB gzip, < 7 KB brotli)', () => {
            const files = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.svg'));
            expect(files.length).toBe(11);

            for (const file of files) {
                const content = fs.readFileSync(path.join(ASSETS_DIR, file));
                const rawSize = content.length;
                const gzipSize = zlib.gzipSync(content).length;
                const brotliSize = zlib.brotliCompressSync(content).length;

                expect(rawSize, `${file} excedeu o teto bruto de 20 KB`).toBeLessThan(20 * 1024);
                expect(gzipSize, `${file} excedeu o teto gzip de 8 KB`).toBeLessThan(8 * 1024);
                expect(brotliSize, `${file} excedeu o teto brotli de 7 KB`).toBeLessThan(7 * 1024);
            }
        });

        it('card-jcb.svg mantém redução drástica em relação ao baseline histórico de 82.410 bytes', () => {
            const jcbPath = path.join(ASSETS_DIR, 'card-jcb.svg');
            const content = fs.readFileSync(jcbPath);
            const size = content.length;

            // Baseline original: 82.410 bytes. O novo JCB otimizado deve ter menos de 1.500 bytes (> 98% de redução)
            expect(size).toBeLessThan(1500);
            expect(size).toBe(1246);
        });

        it('orçamento cumulativo de todos os 11 assets respeita o teto estrito (< 65 KB bruto, baseline: 189.769 bytes)', () => {
            const files = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.svg'));
            let totalRaw = 0;
            let totalGzip = 0;
            let totalBrotli = 0;

            for (const file of files) {
                const content = fs.readFileSync(path.join(ASSETS_DIR, file));
                totalRaw += content.length;
                totalGzip += zlib.gzipSync(content).length;
                totalBrotli += zlib.brotliCompressSync(content).length;
            }

            // Total histórico original: 189.769 bytes
            expect(totalRaw, 'Total bruto deve ser menor que 65 KB').toBeLessThan(65 * 1024);
            expect(totalGzip, 'Total gzip deve ser menor que 28 KB').toBeLessThan(28 * 1024);
            expect(totalBrotli, 'Total brotli deve ser menor que 24 KB').toBeLessThan(24 * 1024);
        });
    });

    describe('Isolamento Modular do Bundle e Grafo de Dependências', () => {
        it('entry principal index.es.js não contém payloads de SVGs de bandeiras de forma eager', () => {
            const indexPath = path.join(DIST_DIR, 'index.es.js');
            if (fs.existsSync(indexPath)) {
                const indexContent = fs.readFileSync(indexPath, 'utf-8');

                // Nenhuma das strings características de bandeiras SVG deve estar embutida no entry
                expect(indexContent).not.toContain('image-rendering:optimizeQuality;fill-rule:evenodd');
                expect(indexContent).not.toContain('stop-color:#006bb6'); // JCB
                expect(indexContent).not.toContain('stop-color:#1c1d6a'); // Visa
            }
        });

        it('cada bandeira de cartão possui seu próprio chunk isolado no dist', () => {
            if (fs.existsSync(DIST_DIR)) {
                const distFiles = fs.readdirSync(DIST_DIR);

                const expectedBrandChunks = [
                    'card-amex',
                    'card-diners',
                    'card-discovery',
                    'card-elo',
                    'card-hipercard',
                    'card-jcb',
                    'card-maestro',
                    'card-mastercard',
                    'card-visa'
                ];

                for (const brand of expectedBrandChunks) {
                    const chunkExists = distFiles.some((f) => f.startsWith(`${brand}-`) && f.endsWith('.js'));
                    expect(chunkExists, `Chunk para bandeira ${brand} deve existir no dist`).toBe(true);
                }
            }
        });

        it('o chunk de Visa é estritamente isolado e não inclui nem referencia outras bandeiras', () => {
            if (fs.existsSync(DIST_DIR)) {
                const distFiles = fs.readdirSync(DIST_DIR);
                const visaChunk = distFiles.find((f) => f.startsWith('card-visa-') && f.endsWith('.js'));
                expect(visaChunk).toBeDefined();

                const chunkContent = fs.readFileSync(path.join(DIST_DIR, visaChunk!), 'utf-8');

                // Contém a definição do SVG do Visa
                expect(chunkContent).toContain('<svg');
                expect(chunkContent).toContain('viewBox="0 0 354 236"');

                // NÃO contém referências de nenhuma outra bandeira
                const otherBrands = ['mastercard', 'amex', 'elo', 'hipercard', 'jcb', 'diners', 'discover', 'maestro'];
                for (const other of otherBrands) expect(chunkContent).not.toContain(`card-${other}`);

            }
        });
    });

    describe('Isolamento Modular em Runtime e Caching', () => {
        it('carregar uma bandeira específica sob demanda NÃO carrega nem instancia as demais no cache', async () => {
            expect(isCardBrandCached('visa')).toBe(false);
            expect(isCardBrandCached('mastercard')).toBe(false);
            expect(isCardBrandCached('amex')).toBe(false);

            const visaUri = await loadCardBrandUri('visa');
            expect(visaUri).toBeTruthy();
            expect(isCardBrandCached('visa')).toBe(true);

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
});
