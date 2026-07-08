import { definePreset } from 'unocss';
import { hasContent } from '@maxvue/max-use';
import { gap } from './helpers/gap';
import { paddingMargin } from './helpers/paddingMargin';
import { getCssSize } from './helpers/getCssSize';
import * as sass from 'sass';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const presetMaxUno = () => {
    return definePreset(() => ({
        name: 'max-css-preset',
        // SHORTCUTS: Classes que precisam de !important ou são atalhos complexos
        shortcuts: [
            [/^h[-_]?[fF](?:ull|lex)$/, () => ({ height: '100% !important' })],
            [/^font-size-(.+)$/, ([, s]) => ({ 'font-size': `${s}rem !important` })],
            [/^[pm][tblrwhyx]?-?(\d+)$/, (params) => paddingMargin(params)],
            [/^w[-_]?[fF](?:ull|lex)$/, () => ({ width: '100% !important' })],
            [/^fs-(.+)$/, ([, s]) => ({ 'font-size': `${s}rem !important` })],
            [/^ color-(.+)$/, ([, s]) => ({ color: `var(--${String(s).length > 3 ? s : 'gray-300'}) !important` })],
            // Cores dinâmicas
            [/^text-(center|left|right)$/, ([, s]) => ({ 'text-align': s + ' !important' })],
            [/^bg-(.+)$/, ([, s]) => ({ 'background-color': s.startsWith('var(') || s.startsWith('#') || s.startsWith('rgb') || s.startsWith('hsl') ? s : `var(--${s})` })],
            [/^(?:(row|col|column))?-gap-(.+)$/i, (params) => (hasContent(params[1]) ? gap(params) : { gap: getCssSize(params[2]) + ' !important' })]
        ],
        // RULES: CSS customizado que não existe no UnoCSS padrão
        rules: [


            // Tipografia
            [/^w-?max-(.+)$/, ([, s]) => ({ 'max-width': s + 'px !important' })],
            [/^font-weight-(.+)$/, ([, s]) => ({ 'font-weight': s })],
            [/^max-w-(.+)$/, ([, s]) => ({ 'max-width': s + 'px !important' })],
            [/^h-?max-(.+)$/, ([, s]) => ({ 'max-height': s + 'px !important' })],
            [/^max-h-(.+)$/, ([, s]) => ({ 'max-height': s + 'px !important' })],
            [/^min-w-(.+)$/, ([, s]) => ({ 'min-width': s + 'px !important' })],
            [/^w-?min-(.+)$/, ([, s]) => ({ 'min-width': s + 'px !important' })],
            [/^h-?min-(.+)$/, ([, s]) => ({ 'min-height': s + 'px !important' })],
            [/^min-h-(.+)$/, ([, s]) => ({ 'min-height': s + 'px !important' })],

            [/^hover-(.+)$/, ([, s]) => ({
                '&:hover': {
                    'color': `var(--${s}) !important`,
                    '.max-icon-div': {
                        'color': `var(--${s}) !important`,
                        '.max-icon': {
                            'color': `var(--${s}) !important`,
                            'svg': {
                                'color': `var(--${s}) !important`
                            }
                        },
                        'svg': {
                            'color': `var(--${s}) !important`
                        }
                    },
                    '.max-icon': {
                        'color': `var(--${s}) !important`,
                        'svg': {
                            'color': `var(--${s}) !important`
                        }
                    },
                    'svg': {
                        'color': `var(--${s}) !important`
                    }
                }
            })],

            // Grid system
            [/^grid-?(cols|rows)-?(.+)$/i, ([, tp, vl]) => ({ ['grid-template-' + (tp.toLowerCase() === 'cols' ? 'columns' : 'rows')]: vl.replace(/-/g, ' ') })],
            [/^grid-?(center|end|start)-?(center|end|start)?$/i, ([, first, second]) => ({ display: 'grid', 'place-items': second ? `${first} ${second}` : first })],

            // Utilitários
            [/^elipsis$/, () => ({ 'white-space': 'nowrap', 'text-overflow': 'ellipsis', 'max-width': '100%', overflow: 'hidden' })],
            [/^[sw]-?(\d+)$/, ([, d]) => ({ flex: `1 0 calc(${d}% - 8px)` })],
            [/^opacity-?([\d.]+)$/, ([, d]) => {
                const val = Number(d);
                return { opacity: val > 1 ? `${val / 100}` : `${val}` };
            }],
            [/^no[-_]?[Cc]lick$/, () => ({ 'pointer-events': 'none' })],

            // Cores predefinidas
            [/^(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/, ([, color, shade]) => ({ color: `var(--${color}-${shade})` })],
            [/^bg-(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/, ([, color, shade]) => ({ 'background-color': `var(--${color}-${shade})` })]

        ],
        preflights: [
            {
                getCSS: () => {
                    try {
                        let scssPath = resolve(__dirname, './themes/all.scss');

                        // Fallback para o diretório src se não encontrado no dist (útil para desenvolvimento local)
                        if (!existsSync(scssPath)) {
                            const fallbackPath = resolve(__dirname, '../src/themes/all.scss');
                            if (existsSync(fallbackPath)) scssPath = fallbackPath;
                            else return '';

                        }

                        const result = sass.compile(scssPath);
                        return result.css;
                    } catch (error) {
                        console.error('Erro ao compilar o SCSS no UnoCSS preset:', error);
                        return '';
                    }
                }
            }
        ]
    }));
};

export const maxUnoPreset = presetMaxUno;