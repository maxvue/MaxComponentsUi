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
});
