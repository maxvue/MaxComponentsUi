import { describe, it, expect } from 'vitest';
import { createGenerator } from 'unocss';
import postcss from 'postcss';
import presetWind3 from '@unocss/preset-wind3';
import presetAttributify from '@unocss/preset-attributify';
import { presetMaxUno } from '../../src/presetMaxUno';

/**
 * Testes que exercitam o preset de verdade, gerando CSS pelo UnoCSS.
 *
 * O outro arquivo de testes do preset mocka o UnoCSS e valida as regex
 * isoladamente — o que não pega CSS sintaticamente inválido. Aqui o CSS
 * gerado é passado pelo PostCSS, exatamente como na build das apps
 * consumidoras.
 */
describe('presetMaxUno — CSS gerado', () => {
    /** Gera o CSS de um trecho de código e devolve o resultado. */
    const generate = async (code: string) => {
        const uno = await createGenerator({ presets: [presetMaxUno()] });
        const { css } = await uno.generate(code, { preflights: false });

        return css;
    };

    /** Falha se o CSS gerado não for parseável. */
    const expectParsavel = (css: string) => expect(() => postcss.parse(css)).not.toThrow();

    it('gera CSS válido para color-blue-500', async () => {
        const css = await generate('<div class="color-blue-500"></div>');

        expectParsavel(css);
        expect(css).toContain('var(--blue-500)');
    });

    it('não quebra com a função CSS color-mix() em blocos de estilo', async () => {
        // Regressão: `color-mix(in srgb, ...)` dentro de <style> era lido como
        // utilitário e gerava `var(--mix(in)`, um bracket sem fechamento que
        // derrubava o PostCSS na build da app consumidora.
        const code = `
            <template><div class="color-blue-500"></div></template>
            <style>
                .cartao { background: color-mix(in srgb, var(--background-0) 88%, transparent); }
            </style>
        `;

        expectParsavel(await generate(code));
    });

    it('não gera regra para color-mix(', async () => {
        const css = await generate('<div>color-mix(in srgb, red 50%, blue)</div>');

        expectParsavel(css);
        expect(css).not.toContain('--mix(in');
    });

    it('gera CSS válido para outras funções CSS comuns', async () => {
        const code = `
            <style>
                .a { width: calc(100% - 1rem); }
                .b { color: rgb(0 0 0 / 10%); }
                .c { background: linear-gradient(to right, red, blue); }
            </style>
        `;

        expectParsavel(await generate(code));
    });

    it('hover-primary-600 e hover-red-500 geram CSS de hover correto', async () => {
        const css = await generate('<div class="hover-primary-600 hover-red-500"></div>');

        expectParsavel(css);
        expect(css).toContain('var(--primary-600)');
        expect(css).toContain('var(--red-500)');
    });

    it('color-red gera var(--red) e não var(--gray-300)', async () => {
        const css = await generate('<div class="color-red"></div>');

        expectParsavel(css);
        expect(css).toContain('var(--red)');
        expect(css).not.toContain('var(--gray-300)');
    });

    it('opacity-150 é clamped em 1 e não gera 1.5 nem NaN', async () => {
        const css = await generate('<div class="opacity-150 opacity-1.2.3"></div>');

        expectParsavel(css);
        expect(css).toContain('opacity:1');
        expect(css).not.toContain('opacity:1.5');
        expect(css).not.toContain('opacity:NaN');
    });

    it('gera CSS válido para col-gap, column-gap, row-gap, ph e pw', async () => {
        const css = await generate('<div class="col-gap-4 column-gap-8 row-gap-12 ph-16 pw-20"></div>');

        expectParsavel(css);
        expect(css).toContain('column-gap:4px !important');
        expect(css).toContain('column-gap:8px !important');
        expect(css).toContain('row-gap:12px !important');
        expect(css).toContain('padding-top:16px !important');
        expect(css).toContain('padding-bottom:16px !important');
        expect(css).toContain('padding-left:20px !important');
        expect(css).toContain('padding-right:20px !important');
    });

    describe('dimensionamento s- no CSS gerado', () => {
        const declarationsFor = async (token: string) => {
            const css = await generate(`<div class="${token}"></div>`);
            const declarations: Record<string, string> = {};

            postcss.parse(css).walkDecls((declaration) => {
                declarations[declaration.prop] = declaration.value;
            });
            return declarations;
        };

        it.each([
            ['s-50', '1000px', '1200px'],
            ['s100', '2000px', '2400px'],
            ['s-50-full', '1000px', '100%'],
            ['s-50-max', '1000px', '100%'],
            ['s-50-80', '1000px', '1600px']
        ])('%s gera CSS válido sem propriedades de quebra', async (token, minWidth, maxWidth) => {
            expect(await declarationsFor(token)).toEqual({
                flex: '1 1 0%',
                'min-width': minWidth,
                'max-width': maxWidth
            });
        });

        it.each([
            ['s3-start', '60px', '72px'],
            ['s3-10-start', '60px', '200px'],
            ['s50-start', '1000px', '1200px'],
            ['s-50-full-start', '1000px', '100%'],
            ['s-50-max-start', '1000px', '100%'],
            ['s-50-80-start', '1000px', '1600px']
        ])('%s gera somente break-before', async (token, minWidth, maxWidth) => {
            expect(await declarationsFor(token)).toEqual({
                flex: '1 1 0%',
                'min-width': minWidth,
                'max-width': maxWidth,
                'break-before': 'always'
            });
        });

        it.each([
            ['s7-end', '140px', '168px'],
            ['s7-10-end', '140px', '200px'],
            ['s-50-end', '1000px', '1200px'],
            ['s-50-full-end', '1000px', '100%'],
            ['s-50-max-end', '1000px', '100%'],
            ['s-50-80-end', '1000px', '1600px']
        ])('%s gera somente break-after', async (token, minWidth, maxWidth) => {
            expect(await declarationsFor(token)).toEqual({
                flex: '1 1 0%',
                'min-width': minWidth,
                'max-width': maxWidth,
                'break-after': 'always'
            });
        });

        it.each([
            ['s3-10-start-mobile', '(max-width: 767.98px)', 'break-before', '60px', '200px'],
            ['s-50-mobile-end', '(max-width: 767.98px)', 'break-after', '1000px', '1200px'],
            ['s50-start-tablet', '(max-width: 1000.98px)', 'break-before', '1000px', '1200px'],
            ['s-50-full-tablet-end', '(max-width: 1000.98px)', 'break-after', '1000px', '100%'],
            ['s50-max-start-desktop', '(min-width: 1001px)', 'break-before', '1000px', '100%'],
            ['s7-desktop-end', '(min-width: 1001px)', 'break-after', '140px', '168px']
        ])('%s gera a quebra e dimensões dentro da media query', async (token, media, property, minWidth, maxWidth) => {
            const css = await generate(`<div class="${token}"></div>`);

            expectParsavel(css);
            const baseDeclarations: Record<string, string> = {};
            const mediaDeclarations: Record<string, string> = {};
            const mediaQueries: string[] = [];
            const root = postcss.parse(css);

            root.walkDecls((declaration) => {
                const wrapper = declaration.parent?.parent;

                if (wrapper?.type === 'atrule') {
                    expect(wrapper.name).toBe('media');
                    expect(wrapper.params).toBe(media);
                    mediaDeclarations[declaration.prop] = declaration.value;
                } else baseDeclarations[declaration.prop] = declaration.value;
            });
            root.walkAtRules('media', (atRule) => {
                mediaQueries.push(atRule.params);
            });

            expect(baseDeclarations).toEqual({});
            expect(mediaDeclarations).toEqual({
                flex: '1 1 0%',
                'min-width': minWidth,
                'max-width': maxWidth,
                [property]: 'always'
            });
            expect(mediaQueries).toEqual([media]);
        });

        it.each([
            ['s-50-mobile', '(max-width: 767.98px)', '1000px', '1200px'],
            ['s50-tablet', '(max-width: 1000.98px)', '1000px', '1200px'],
            ['s-50-desktop', '(min-width: 1001px)', '1000px', '1200px'],
            ['s20-full-mobile', '(max-width: 767.98px)', '400px', '100%']
        ])('%s sem posição gera dimensões dentro da media query', async (token, media, minWidth, maxWidth) => {
            const css = await generate(`<div class="${token}"></div>`);

            expectParsavel(css);
            expect(css).toContain(`@media ${media}`);
            const baseDeclarations: Record<string, string> = {};
            const mediaDeclarations: Record<string, string> = {};
            const root = postcss.parse(css);

            root.walkDecls((declaration) => {
                const wrapper = declaration.parent?.parent;

                if (wrapper?.type === 'atrule') {
                    expect(wrapper.name).toBe('media');
                    expect(wrapper.params).toBe(media);
                    mediaDeclarations[declaration.prop] = declaration.value;
                } else baseDeclarations[declaration.prop] = declaration.value;
            });

            expect(baseDeclarations).toEqual({});
            expect(mediaDeclarations).toEqual({
                flex: '1 1 0%',
                'min-width': minWidth,
                'max-width': maxWidth
            });
        });

        it.each(['s-50-start-end', 's-50-mobile-desktop', 's-50-start-mobile-end'])('%s não gera CSS para modificadores conflitantes', async (token) => {
            expect(await generate(`<div class="${token}"></div>`)).toBe('');
        });
    });

    describe('attributify e gerador integrado', () => {
        const generateFull = async (code: string) => {
            const uno = await createGenerator({
                presets: [presetMaxUno(), presetWind3(), presetAttributify()]
            });
            const { css } = await uno.generate(code, { preflights: false });
            return css;
        };

        const ruleDeclarations = (css: string) => {
            const result: Record<string, Record<string, string>> = {};
            postcss.parse(css).walkRules((rule) => {
                const decls: Record<string, string> = {};
                rule.walkDecls((d) => {
                    decls[d.prop] = d.value;
                });
                result[rule.selector] = { ...result[rule.selector], ...decls };
            });
            return result;
        };

        it('gera CSS para atributos sem valor com attributify', async () => {
            const css = await generateFull('<div s7-end s3-10-start></div>');
            expectParsavel(css);

            const rules = ruleDeclarations(css);
            const s7EndSelector = Object.keys(rules).find((sel) => sel.includes('s7-end'));
            const s3StartSelector = Object.keys(rules).find((sel) => sel.includes('s3-10-start'));

            expect(s7EndSelector).toBeDefined();
            expect(s3StartSelector).toBeDefined();

            expect(rules[s7EndSelector!]).toEqual({
                flex: '1 1 0%',
                'min-width': '140px',
                'max-width': '168px',
                'break-after': 'always'
            });

            expect(rules[s3StartSelector!]).toEqual({
                flex: '1 1 0%',
                'min-width': '60px',
                'max-width': '200px',
                'break-before': 'always'
            });
        });

        it('preserva modificadores de dispositivo com attributify e presetWind3', async () => {
            const css = await generateFull('<div s3-10-start-desktop w-100></div>');

            expectParsavel(css);
            const rules = ruleDeclarations(css);
            const dimensionSelector = Object.keys(rules).find((selector) => selector.includes('s3-10-start-desktop'));
            const widthSelector = Object.keys(rules).find((selector) => selector.includes('w-100'));
            const mediaQueries: string[] = [];

            expect(dimensionSelector).toBeDefined();
            expect(widthSelector).toBeDefined();
            expect(rules[dimensionSelector!]).toEqual({
                flex: '1 1 0%',
                'min-width': '60px',
                'max-width': '200px',
                'break-before': 'always'
            });
            expect(rules[widthSelector!]).toHaveProperty('width');
            expect(rules[widthSelector!]).not.toHaveProperty('flex');
            postcss.parse(css).walkAtRules('media', (atRule) => {
                mediaQueries.push(atRule.params);
            });
            expect(mediaQueries).toEqual(['(min-width: 1001px)']);
        });

        it('combina token base com override por dispositivo em attributify respeitando a ordem da cascata', async () => {
            const css = await generateFull('<MaxInputCpfCnpj s11-11 s20-full-mobile label="CPF ou CNPJ" />');

            expectParsavel(css);
            const root = postcss.parse(css);

            let baseRule: any;
            let mediaRule: any;

            root.walkRules((rule) => {
                if (rule.selector.includes('s11-11')) {
                    expect(rule.parent?.type).toBe('root');
                    baseRule = rule;
                } else if (rule.selector.includes('s20-full-mobile')) {
                    expect(rule.parent?.type).toBe('atrule');
                    expect((rule.parent as any).name).toBe('media');
                    expect((rule.parent as any).params).toBe('(max-width: 767.98px)');
                    mediaRule = rule;
                }
            });

            expect(baseRule).toBeDefined();
            expect(mediaRule).toBeDefined();

            const baseDecls: Record<string, string> = {};
            baseRule.walkDecls((d: any) => {
                baseDecls[d.prop] = d.value;
            });
            expect(baseDecls).toEqual({
                flex: '1 1 0%',
                'min-width': '220px',
                'max-width': '220px'
            });

            const mediaDecls: Record<string, string> = {};
            mediaRule.walkDecls((d: any) => {
                mediaDecls[d.prop] = d.value;
            });
            expect(mediaDecls).toEqual({
                flex: '1 1 0%',
                'min-width': '400px',
                'max-width': '100%'
            });

            // Ordem na folha de estilos: regra base precede a @media query
            const basePos = root.nodes.indexOf(baseRule);
            const mediaAtRulePos = root.nodes.indexOf(mediaRule.parent);
            expect(basePos).toBeLessThan(mediaAtRulePos);
        });
    });
});

