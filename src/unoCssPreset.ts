import { definePreset } from 'unocss';
import { hasContent } from '@maxvue/max-use';
import { gap } from './helpers/gap';
import { paddingMargin } from './helpers/paddingMargin';
import { getCssSize } from './helpers/getCssSize';
import * as sass from 'sass';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const presetMaxUno = () => {
    return definePreset(() => {
        return {
            name: 'max-css-preset',
            rules: [
                [/^font-size-(.+)$/, ([, s]) => ({ 'font-size': `${s}rem` })],
                [/^font-weight-(.+)$/, ([, s]) => ({ 'font-weight': s })],
                // Colors
                [/^color-(.+)$/, ([, s]) => ({ color: s.startsWith('var(') || s.startsWith('#') || s.startsWith('rgb') || s.startsWith('hsl') ? s : `var(--${s})` })],
                [/^bg-(.+)$/, ([, s]) => ({ 'background-color': s.startsWith('var(') || s.startsWith('#') || s.startsWith('rgb') || s.startsWith('hsl') ? s : `var(--${s})` })],
                // Grid
                [/^grid-?(cols|rows)-?(.+)$/i, ([, tp, vl]) => ({ ['grid-template-' + (tp.toLowerCase() === 'cols' ? 'columns' : 'rows')]: vl.replace(/-/g, ' ') })],
                [/^(?:(row|col|column))?-?gap-?(.+)$/i, (params) => (hasContent(params[1]) ? gap(params) : { gap: getCssSize(params[2]) })],
                [/^elipsis$/, () => ({ 'white-space': 'nowrap', 'text-overflow': 'ellipsis', 'max-width': '100%', overflow: 'hidden' })],
                [/^grid-?(center|end|start)-?(center|end|start)?$/i, ([, first, second]) => ({ display: 'grid', 'place-items': second ? `${first} ${second}` : first })],
                [/^(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/, ([, color, shade]) => ({ color: `var(--${color}-${shade})` })],
                [/^bg-(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/, ([, color, shade]) => ({ 'background-color': `var(--${color}-${shade})` })],
                [/^[pm][tblrwhyx]?-?(\d+)$/, (params) => paddingMargin(params)],
                [/^[sw]-?(\d+)$/, ([, d]) => ({ flex: `1 0 calc(${d}% - 8px)` })],
                [/^opacity-?([\d.]+)$/, ([, d]) => {
                    const val = Number(d);
                    return { opacity: val > 1 ? `${val / 100}` : `${val}` };
                }],
                [/^no[-_]?[Cc]lick$/, () => ({ 'pointer-events': 'none' })],
                [/^h[-_]?[fF](?:ull|lex)$/, () => ({ height: '100% !important' })],
                [/^w[-_]?[fF](?:ull|lex)$/, () => ({ width: '100% !important' })]

            ],
            preflights: [
                {
                    getCSS: () => {
                        try {
                            const scssPath = resolve(__dirname, './themes/all.scss');
                            const result = sass.compile(scssPath);
                            return result.css;
                        } catch (error) {
                            console.error('Erro ao compilar o SCSS no UnoCSS preset:', error);
                            return '';
                        }
                    }
                }
            ]
        };
    });
};