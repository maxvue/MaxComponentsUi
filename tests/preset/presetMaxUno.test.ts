import { describe, it, expect, vi } from 'vitest';

/**
 * Testes para os padrões regex e CSS do preset UnoCSS.
 * Como o preset depende de `definePreset` do UnoCSS (que envelopa o retorno),
 * testamos as regras diretamente usando os helpers subjacentes.
 */
import { paddingMargin } from '../../src/helpers/paddingMargin';
import { gap } from '../../src/helpers/gap';
import { getCssSize } from '../../src/helpers/getCssSize';
import { presetMaxUno, maxUnoPreset } from '../../src/presetMaxUno';

const { mockExistsSync, mockSassCompile } = vi.hoisted(() => ({
    mockExistsSync: vi.fn(() => true),
    mockSassCompile: vi.fn(() => ({ css: '/* compiled css */' }))
}));

// Mock do UnoCSS para evitar problemas de importação
vi.mock('unocss', () => ({
    definePreset: vi.fn((factory: any) => factory)
}));

vi.mock('sass', () => ({
    compile: mockSassCompile
}));

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        existsSync: mockExistsSync,
        default: {
            ...(actual.default || {}),
            existsSync: mockExistsSync
        }
    };
});

describe('presetMaxUno', () => {
    it('exporta presetMaxUno e maxUnoPreset', () => {
        expect(typeof presetMaxUno).toBe('function');
        expect(maxUnoPreset).toBe(presetMaxUno);
    });

    describe('regras de shortcut (regex)', () => {
        it('hFull/hFlex match', () => {
            expect(/^h[-_]?[fF](?:ull|lex)$/.test('hFull')).toBe(true);
            expect(/^h[-_]?[fF](?:ull|lex)$/.test('hFlex')).toBe(true);
            expect(/^h[-_]?[fF](?:ull|lex)$/.test('h_Full')).toBe(true);
        });

        it('wFull/wFlex match', () => {
            expect(/^w[-_]?[fF](?:ull|lex)$/.test('wFull')).toBe(true);
            expect(/^w[-_]?[fF](?:ull|lex)$/.test('w-full')).toBe(true);
        });

        it('font-size-X match e captura valor', () => {
            const match = 'font-size-1.5'.match(/^font-size-(.+)$/);
            expect(match).toBeTruthy();
            expect(match![1]).toBe('1.5');
        });

        it('fs-X (alias) match', () => {
            const match = 'fs-0.9'.match(/^fs-(.+)$/);
            expect(match).toBeTruthy();
            expect(match![1]).toBe('0.9');
        });

        it('color-X captura variável CSS', () => {
            const match = 'color-blue-500'.match(/^color-(.+)$/);
            expect(match).toBeTruthy();
            expect(match![1]).toBe('blue-500');
        });

        it('color-X (regex corrigida, sem espaço) casa e gera saída CSS esperada', () => {
            const regex = /^color-(.+)$/;
            expect(regex.test('color-blue-500')).toBe(true);

            const match = 'color-blue-500'.match(regex);
            const s = match![1];
            const result = { color: `var(--${String(s).length > 3 ? s : 'gray-300'}) !important` };
            expect(result).toEqual({ color: 'var(--blue-500) !important' });
        });

        it('color-X não captura a função CSS color-mix()', () => {
            // Regressão: com `(.+)`, a regra casava `color-mix(in` — escrito em
            // blocos <style> das apps consumidoras — e gerava `var(--mix(in)`,
            // um bracket sem fechamento que quebrava o PostCSS na build delas.
            const regex = /^color-([\w-]+)$/;

            expect(regex.test('color-blue-500')).toBe(true);
            expect(regex.test('color-mix(in')).toBe(false);
            expect(regex.test('color-mix(in srgb, var(--x) 50%, transparent)')).toBe(false);
        });

        it('text-center/left/right match', () => {
            expect(/^text-(center|left|right)$/.test('text-center')).toBe(true);
            expect(/^text-(center|left|right)$/.test('text-left')).toBe(true);
            expect(/^text-(center|left|right)$/.test('text-right')).toBe(true);
        });

        it('bg-X match', () => {
            const match = 'bg-red-500'.match(/^bg-(.+)$/);
            expect(match).toBeTruthy();
            expect(match![1]).toBe('red-500');
        });
    });

    describe('regras de rules (regex)', () => {
        it('w-max-X captura valor para max-width', () => {
            const match = 'w-max-500'.match(/^w-?max-(.+)$/);
            expect(match).toBeTruthy();
            expect(getCssSize(match![1])).toBe('500px');
        });

        it('font-weight-X captura peso', () => {
            const match = 'font-weight-700'.match(/^font-weight-(.+)$/);
            expect(match).toBeTruthy();
            expect(match![1]).toBe('700');
        });

        it('max-w-X captura valor', () => {
            const match = 'max-w-300'.match(/^max-w-(.+)$/);
            expect(match).toBeTruthy();
            expect(getCssSize(match![1])).toBe('300px');
        });

        it('min-w-50% gera min-width: 50% !important (sem px concatenado)', () => {
            const match = 'min-w-50%'.match(/^min-w-(.+)$/);
            expect(match).toBeTruthy();
            const result = { 'min-width': `${getCssSize(match![1])} !important` };
            expect(result).toEqual({ 'min-width': '50% !important' });
        });

        it('max-w-full não concatena px indevidamente (mantém a keyword)', () => {
            const match = 'max-w-full'.match(/^max-w-(.+)$/);
            expect(match).toBeTruthy();
            const result = { 'max-width': `${getCssSize(match![1])} !important` };
            // getCssSize só converte valores puramente numéricos; "full" não é numérico,
            // então é mantido como veio. Nota: "full" sozinho não é uma unidade CSS válida
            // por si só — corrigir isso é um escopo futuro, fora desta etapa (que corrige
            // apenas a concatenação cega de "px").
            expect(result).toEqual({ 'max-width': 'full !important' });
        });

        it('min-h-10rem preserva unidade já presente no valor', () => {
            const match = 'min-h-10rem'.match(/^min-h-(.+)$/);
            expect(match).toBeTruthy();
            const result = { 'min-height': `${getCssSize(match![1])} !important` };
            expect(result).toEqual({ 'min-height': '10rem !important' });
        });

        it('elipsis match', () => {
            expect(/^elipsis$/.test('elipsis')).toBe(true);
        });

        it('s-X captura porcentagem para flex', () => {
            const match = 's50'.match(/^s-?(\d+)$/);
            expect(match).toBeTruthy();
            expect(match![1]).toBe('50');
        });

        it('w-100 não casa mais com a regra de flex (restrita a s-)', () => {
            expect(/^s-?(\d+)$/.test('w-100')).toBe(false);
            expect(/^s-?(\d+)$/.test('s-100')).toBe(true);
            expect(/^s-?(\d+)$/.test('s100')).toBe(true);
        });

        it('opacity-X normaliza valores', () => {
            const regex = /^opacity-([\d.]+)$/;
            // Valor > 1 → dividido por 100
            const match50 = 'opacity-50'.match(regex);
            const val50 = Number(match50![1]);
            expect(val50 > 1 ? `${val50 / 100}` : `${val50}`).toBe('0.5');

            // Valor <= 1 → mantido
            const match08 = 'opacity-0.8'.match(regex);
            const val08 = Number(match08![1]);
            expect(val08 > 1 ? `${val08 / 100}` : `${val08}`).toBe('0.8');
        });

        it('noClick match', () => {
            expect(/^no[-_]?[Cc]lick$/.test('noClick')).toBe(true);
            expect(/^no[-_]?[Cc]lick$/.test('no-click')).toBe(true);
            expect(/^no[-_]?[Cc]lick$/.test('no_Click')).toBe(true);
        });

        it('grid-cols-X / grid-rows-X match', () => {
            const match = 'grid-cols-1fr-2fr'.match(/^grid-?(cols|rows)-?(.+)$/i);
            expect(match).toBeTruthy();
            expect(match![1]).toBe('cols');
            expect(match![2].replace(/-/g, ' ')).toBe('1fr 2fr');
        });

        it('grid-center match com segundo valor opcional', () => {
            const match1 = 'grid-center'.match(/^grid-?(center|end|start)-?(center|end|start)?$/i);
            expect(match1).toBeTruthy();
            expect(match1![1]).toBe('center');
            expect(match1![2]).toBeUndefined();

            const match2 = 'grid-center-end'.match(/^grid-?(center|end|start)-?(center|end|start)?$/i);
            expect(match2).toBeTruthy();
            expect(match2![1]).toBe('center');
            expect(match2![2]).toBe('end');
        });

        it('cores predefinidas match', () => {
            const regex = /^(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/;
            const match = 'blue-500'.match(regex);
            expect(match).toBeTruthy();
            expect(`var(--${match![1]}-${match![2]})`).toBe('var(--blue-500)');
        });

        it('hover-X match', () => {
            const match = 'hover-red-500'.match(/^hover-(.+)$/);
            expect(match).toBeTruthy();
            expect(match![1]).toBe('red-500');
        });
    });

    describe('helpers usados nas shortcuts/rules', () => {
        it('paddingMargin resolve padding/margin corretamente', () => {
            const result = paddingMargin(['pt-10', 'p', 't', '10']);
            expect(result).toHaveProperty('padding-top');
        });

        it('gap resolve valores de gap', () => {
            const result = gap(['row-gap-10', 'row', '10']);
            expect(result).toHaveProperty('row-gap');
        });

        it('getCssSize formata tamanhos CSS', () => {
            // Valores numéricos são tratados como multiplicadores rem
            const result = getCssSize('2');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);

            // Valores com unidade são mantidos
            expect(getCssSize('100px')).toBe('100px');
        });
    });
    describe('handlers reais de shortcuts', () => {
        const preset = (presetMaxUno() as any)();
        const findShortcut = (regex: RegExp) => preset.shortcuts.find((s: any) => s[0] instanceof RegExp && s[0].source === regex.source);

        it('hFull / hFlex gera height: 100% !important', () => {
            const shortcut = findShortcut(/^h[-_]?[fF](?:ull|lex)$/);
            expect(shortcut).toBeTruthy();
            expect(shortcut[1]()).toEqual({ height: '100% !important' });
        });

        it('wFull / wFlex gera width: 100% !important', () => {
            const shortcut = findShortcut(/^w[-_]?[fF](?:ull|lex)$/);
            expect(shortcut).toBeTruthy();
            expect(shortcut[1]()).toEqual({ width: '100% !important' });
        });

        it('font-size-X formata valor em rem com !important', () => {
            const shortcut = findShortcut(/^font-size-(.+)$/);
            expect(shortcut).toBeTruthy();
            expect(shortcut[1]([, '1.5'])).toEqual({ 'font-size': '1.5rem !important' });
        });

        it('fs-X formata valor em rem com !important', () => {
            const shortcut = findShortcut(/^fs-(.+)$/);
            expect(shortcut).toBeTruthy();
            expect(shortcut[1]([, '0.875'])).toEqual({ 'font-size': '0.875rem !important' });
        });

        it('color-X formata variável CSS ou retorna undefined para valor vazio', () => {
            const shortcut = findShortcut(/^color-([\w-]+)$/);
            expect(shortcut).toBeTruthy();
            expect(shortcut[1]([, 'blue-500'])).toEqual({ color: 'var(--blue-500) !important' });
            expect(shortcut[1]([, ''])).toBeUndefined();
        });

        it('text-(center|left|right) formata alinhamento de texto com !important', () => {
            const shortcut = findShortcut(/^text-(center|left|right)$/);
            expect(shortcut).toBeTruthy();
            expect(shortcut[1]([, 'center'])).toEqual({ 'text-align': 'center !important' });
            expect(shortcut[1]([, 'left'])).toEqual({ 'text-align': 'left !important' });
            expect(shortcut[1]([, 'right'])).toEqual({ 'text-align': 'right !important' });
        });

        it('bg-X descarta palavras reservadas, colchetes e valores com barra de opacidade', () => {
            const shortcut = findShortcut(/^bg-(.+)$/);
            expect(shortcut).toBeTruthy();

            for (const keyword of ['cover', 'contain', 'center', 'transparent', 'none']) expect(shortcut[1]([, keyword])).toBeUndefined();
            expect(shortcut[1]([, '[#fff]'])).toBeUndefined();
            expect(shortcut[1]([, '[rgb(0,0,0)]'])).toBeUndefined();
            expect(shortcut[1]([, 'red-500/50'])).toBeUndefined();
            expect(shortcut[1]([, ''])).toBeUndefined();
        });

        it('bg-X suporta cores diretas (hex, rgb, hsl, var) e variáveis nomeadas', () => {
            const shortcut = findShortcut(/^bg-(.+)$/);
            expect(shortcut).toBeTruthy();

            expect(shortcut[1]([, '#ff0000'])).toEqual({ 'background-color': '#ff0000' });
            expect(shortcut[1]([, 'rgb(0,0,0)'])).toEqual({ 'background-color': 'rgb(0,0,0)' });
            expect(shortcut[1]([, 'hsl(0,0%,0%)'])).toEqual({ 'background-color': 'hsl(0,0%,0%)' });
            expect(shortcut[1]([, 'var(--custom)'])).toEqual({ 'background-color': 'var(--custom)' });
            expect(shortcut[1]([, 'blue-500'])).toEqual({ 'background-color': 'var(--blue-500)' });
        });

        it('gap resolve sem modificador, com coluna e com linha', () => {
            const shortcut = findShortcut(/^(?:(row|col|column))?-gap-(.+)$/i);
            expect(shortcut).toBeTruthy();

            expect(shortcut[1]([, undefined, '16'])).toEqual({ gap: '16px !important' });
            expect(shortcut[1]([, 'col', '8'])).toEqual({ 'column-gap': '8px !important' });
            expect(shortcut[1]([, 'row', '12'])).toEqual({ 'row-gap': '12px !important' });
        });

        it('paddingMargin delega corretamente para o helper de padding e margin', () => {
            const shortcut = findShortcut(/^[pm][tblrwhyx]?-?(\d+)$/);
            expect(shortcut).toBeTruthy();

            expect(shortcut[1](['p-10', '10'])).toEqual({ padding: '10px !important' });
            expect(shortcut[1](['pt-10', '10'])).toEqual({ 'padding-top': '10px !important' });
            expect(shortcut[1](['pw-8', '8'])).toEqual({
                'padding-left': '8px !important',
                'padding-right': '8px !important'
            });
            expect(shortcut[1](['m-16', '16'])).toEqual({ margin: '16px !important' });
            expect(shortcut[1](['mh-12', '12'])).toEqual({
                'margin-top': '12px !important',
                'margin-bottom': '12px !important'
            });
        });
    });

    describe('handlers reais de rules', () => {
        const preset = (presetMaxUno() as any)();
        const findRule = (regex: RegExp) => preset.rules.find((r: any) => r[0] instanceof RegExp && r[0].source === regex.source);

        it('dimensões máximas e mínimas (w-max, max-w, w-min, min-w, h-max, max-h, h-min, min-h)', () => {
            const wMax = findRule(/^w-?max-(.+)$/);
            expect(wMax).toBeTruthy();
            expect(wMax[1]([, '500'])).toEqual({ 'max-width': '500px !important' });

            const maxW = findRule(/^max-w-(.+)$/);
            expect(maxW).toBeTruthy();
            expect(maxW[1]([, 'full'])).toEqual({ 'max-width': 'full !important' });

            const wMin = findRule(/^w-?min-(.+)$/);
            expect(wMin).toBeTruthy();
            expect(wMin[1]([, '200'])).toEqual({ 'min-width': '200px !important' });

            const minW = findRule(/^min-w-(.+)$/);
            expect(minW).toBeTruthy();
            expect(minW[1]([, '50%'])).toEqual({ 'min-width': '50% !important' });

            const hMax = findRule(/^h-?max-(.+)$/);
            expect(hMax).toBeTruthy();
            expect(hMax[1]([, '300'])).toEqual({ 'max-height': '300px !important' });

            const maxH = findRule(/^max-h-(.+)$/);
            expect(maxH).toBeTruthy();
            expect(maxH[1]([, '100vh'])).toEqual({ 'max-height': '100vh !important' });

            const hMin = findRule(/^h-?min-(.+)$/);
            expect(hMin).toBeTruthy();
            expect(hMin[1]([, '150'])).toEqual({ 'min-height': '150px !important' });

            const minH = findRule(/^min-h-(.+)$/);
            expect(minH).toBeTruthy();
            expect(minH[1]([, '10rem'])).toEqual({ 'min-height': '10rem !important' });
        });

        it('font-weight-(.+) resolve peso da fonte', () => {
            const rule = findRule(/^font-weight-(.+)$/);
            expect(rule).toBeTruthy();
            expect(rule[1]([, '700'])).toEqual({ 'font-weight': '700' });
        });

        it('hover-(.+) gera declaração CSS e gerador de seletor composto', () => {
            const rule = findRule(/^hover-(.+)$/);
            expect(rule).toBeTruthy();

            const result = rule[1]([, 'primary-500']);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ color: 'var(--primary-500) !important' });
            expect(typeof result[1].selector).toBe('function');
            expect(result[1].selector('.btn')).toBe(
                '.btn:hover, .btn:hover .max-icon-div, .btn:hover .max-icon, .btn:hover svg'
            );
        });

        it('no-scrollbar retorna propriedades para ocultar barra de rolagem', () => {
            const rule = findRule(/^no-scrollbar/);
            expect(rule).toBeTruthy();

            const result = rule[1]();
            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toEqual({
                'scrollbar-width': 'none',
                '-ms-overflow-style': 'none',
                'overflow-y': 'auto'
            });
        });

        it('grid-(cols|rows)-(.+) substitui hífens por espaços nas trilhas', () => {
            const rule = findRule(/^grid-?(cols|rows)-?(.+)$/i);
            expect(rule).toBeTruthy();

            expect(rule[1]([, 'cols', '1fr-2fr'])).toEqual({ 'grid-template-columns': '1fr 2fr' });
            expect(rule[1]([, 'rows', 'auto-1fr'])).toEqual({ 'grid-template-rows': 'auto 1fr' });
        });

        it('grid-center/end/start resolve place-items com 1 ou 2 parâmetros', () => {
            const rule = findRule(/^grid-?(center|end|start)-?(center|end|start)?$/i);
            expect(rule).toBeTruthy();

            expect(rule[1]([, 'center', undefined])).toEqual({ display: 'grid', 'place-items': 'center' });
            expect(rule[1]([, 'center', 'end'])).toEqual({ display: 'grid', 'place-items': 'center end' });
            expect(rule[1]([, 'start', 'center'])).toEqual({ display: 'grid', 'place-items': 'start center' });
        });

        it('elipsis retorna regras de truncamento de texto', () => {
            const rule = findRule(/^elipsis$/);
            expect(rule).toBeTruthy();
            expect(rule[1]()).toEqual({
                'white-space': 'nowrap',
                'text-overflow': 'ellipsis',
                'max-width': '100%',
                overflow: 'hidden'
            });
        });

        it('s-(\\d+) calcula fórmula flexbox e restringe prefixo s-', () => {
            const rule = findRule(/^s-?(\d+)$/);
            expect(rule).toBeTruthy();

            expect(rule[1]([, '50'])).toEqual({ flex: '1 0 calc(50% - 8px)' });
            expect(rule[1]([, '100'])).toEqual({ flex: '1 0 calc(100% - 8px)' });

            expect(rule[0].test('w-100')).toBe(false);
            expect(rule[0].test('s-100')).toBe(true);
            expect(rule[0].test('s100')).toBe(true);
        });

        it('opacity-X normaliza porcentagens, decimais, limites de clamp e NaN', () => {
            const rule = findRule(/^opacity-?(\d+(?:\.\d+)?)$/);
            expect(rule).toBeTruthy();

            expect(rule[1]([, '50'])).toEqual({ opacity: '0.5' });
            expect(rule[1]([, '0.8'])).toEqual({ opacity: '0.8' });
            expect(rule[1]([, '150'])).toEqual({ opacity: '1' });
            expect(rule[1]([, '-10'])).toEqual({ opacity: '0' });
            expect(rule[1]([, 'invalid'])).toBeUndefined();
        });

        it('noClick desabilita eventos de ponteiro', () => {
            const rule = findRule(/^no[-_]?[Cc]lick$/);
            expect(rule).toBeTruthy();
            expect(rule[1]()).toEqual({ 'pointer-events': 'none' });
        });

        it('cores predefinidas geram var de cor e background-color', () => {
            const colorRule = findRule(/^(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/);
            expect(colorRule).toBeTruthy();
            expect(colorRule[1]([, 'blue', '500'])).toEqual({ color: 'var(--blue-500)' });

            const bgRule = findRule(/^bg-(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/);
            expect(bgRule).toBeTruthy();
            expect(bgRule[1]([, 'red', '600'])).toEqual({ 'background-color': 'var(--red-600)' });
        });
    });

    describe('preflights e compilação SCSS', () => {
        const preset = (presetMaxUno() as any)();

        it('preflights[0].getCSS() retorna CSS compilado pelo sass', () => {
            expect(preset.preflights).toBeDefined();
            expect(preset.preflights[0]).toBeDefined();

            const css = preset.preflights[0].getCSS();
            expect(css).toBe('/* compiled css */');
        });

        it('retorna string vazia quando o arquivo SCSS não existe', () => {
            mockExistsSync.mockReturnValue(false);

            const css = preset.preflights[0].getCSS();
            expect(css).toBe('');

            mockExistsSync.mockReturnValue(true);
        });

        it('trata erro de compilação do sass e retorna string vazia sem lançar exceção', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockSassCompile.mockImplementationOnce(() => {
                throw new Error('Sass compilation failed');
            });

            const css = preset.preflights[0].getCSS();
            expect(css).toBe('');
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });
});
