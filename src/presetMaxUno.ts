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
            // Padding/margin: os eixos `w`/`h` são aliases de `x`/`y` (largura = esquerda+direita,
            // altura = topo+baixo) nesta regra específica — NÃO se referem a width/height do elemento.
            // Ex.: `pw-10` = padding horizontal, `mh-10` = margin vertical. Ver src/helpers/paddingMargin.ts.
            [/^[pm][tblrwhyx]?-?(\d+)$/, (params) => paddingMargin(params)],
            [/^w[-_]?[fF](?:ull|lex)$/, () => ({ width: '100% !important' })],
            [/^fs-(.+)$/, ([, s]) => ({ 'font-size': `${s}rem !important` })],
            // O captura precisa excluir parênteses: com `(.+)`, a função CSS
            // `color-mix(in srgb, ...)` — escrita dentro de blocos <style> — era
            // lida como utilitário e gerava `var(--mix(in)`, um bracket sem
            // fechamento que quebra o PostCSS na build da app consumidora.
            [/^color-([\w-]+)$/, ([, s]) => {
                if (!s) return undefined;
                return { color: `var(--${s}) !important` };
            }],
            // Cores dinâmicas
            [/^text-(center|left|right)$/, ([, s]) => ({ 'text-align': s + ' !important' })],
            [/^bg-(.+)$/, ([, s]) => {
                if (!s || s.startsWith('[') || s.includes('[') || s.includes('/')) return undefined;
                if (/^(cover|contain|center|top|bottom|left|right|repeat|no-repeat|repeat-[xy]|none|transparent|current|inherit|fixed|local|scroll|auto|clip-.+|origin-.+)$/.test(s)) return undefined;
                return { 'background-color': s.startsWith('var(') || s.startsWith('#') || s.startsWith('rgb') || s.startsWith('hsl') ? s : `var(--${s})` };
            }],
            [/^(?:(row|col|column))?-gap-(.+)$/i, (params) => (hasContent(params[1]) ? gap(params) : { gap: getCssSize(params[2]) + ' !important' })]
        ],
        // RULES: CSS customizado que não existe no UnoCSS padrão
        rules: [


            // Tipografia
            [/^w-?max-(.+)$/, ([, s]) => ({ 'max-width': `${getCssSize(s)} !important` })],
            [/^font-weight-(.+)$/, ([, s]) => ({ 'font-weight': s })],
            [/^max-w-(.+)$/, ([, s]) => ({ 'max-width': `${getCssSize(s)} !important` })],
            [/^h-?max-(.+)$/, ([, s]) => ({ 'max-height': `${getCssSize(s)} !important` })],
            [/^max-h-(.+)$/, ([, s]) => ({ 'max-height': `${getCssSize(s)} !important` })],
            [/^min-w-(.+)$/, ([, s]) => ({ 'min-width': `${getCssSize(s)} !important` })],
            [/^w-?min-(.+)$/, ([, s]) => ({ 'min-width': `${getCssSize(s)} !important` })],
            [/^h-?min-(.+)$/, ([, s]) => ({ 'min-height': `${getCssSize(s)} !important` })],
            [/^min-h-(.+)$/, ([, s]) => ({ 'min-height': `${getCssSize(s)} !important` })],

            [/^hover-(.+)$/, ([, s]) => [
                {
                    'color': `var(--${s}) !important`
                },
                {
                    selector: (sel: string) => `${sel}:hover, ${sel}:hover .max-icon-div, ${sel}:hover .max-icon, ${sel}:hover svg`
                }
            ]],
            [/^no-scrollbar/, () => [
                {
                    'scrollbar-width': 'none',
                    '-ms-overflow-style': 'none',
                    'overflow-y': 'auto'
                }
            ]],

            // Grid system
            [/^grid-?(cols|rows)-?(.+)$/i, ([, tp, vl]) => ({ ['grid-template-' + (tp.toLowerCase() === 'cols' ? 'columns' : 'rows')]: vl.replace(/-/g, ' ') })],
            [/^grid-?(center|end|start)-?(center|end|start)?$/i, ([, first, second]) => ({ display: 'grid', 'place-items': second ? `${first} ${second}` : first })],

            // Utilitários
            [/^elipsis$/, () => ({ 'white-space': 'nowrap', 'text-overflow': 'ellipsis', 'max-width': '100%', overflow: 'hidden' })],
            // Restrita ao prefixo `s-` (ex.: `s-50`, `s100`) para não colidir com `w-*`,
            // que deve ser resolvido pelo presetWind3 com a semântica padrão de `width`.
            [/^s-?(\d+)$/, ([, d]) => ({ flex: `1 0 calc(${d}% - 8px)` })],
            [/^opacity-?(\d+(?:\.\d+)?)$/, ([, d]) => {
                const raw = Number(d);
                if (!Number.isFinite(raw)) return undefined;
                const val = raw > 1 ? raw / 100 : raw;
                const clamped = Math.min(Math.max(val, 0), 1);
                return { opacity: `${clamped}` };
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