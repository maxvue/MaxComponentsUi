import { describe, it, expect } from 'vitest';
import { createGenerator } from 'unocss';
import postcss from 'postcss';

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
});
