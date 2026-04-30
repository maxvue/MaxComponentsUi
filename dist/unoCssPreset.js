import { definePreset } from 'unocss';
import { hasContent } from './helpers/hasContent';
import { gap } from './helpers/gap';
import { paddingMargin } from './helpers/paddingMargin';
import { getCssSize } from './helpers/getCssSize';
export const presetMaxUno = () => {
    return definePreset(() => {
        return {
            name: 'max-css-preset',
            rules: [
                [/^font-size-(.+)$/, ([, s]) => ({ 'font-size': `${s}rem` })],
                [/^font-weight-(.+)$/, ([, s]) => ({ 'font-weight': s })],
                // Colors
                [/^color-(.+)$/, ([, s]) => ({ color: `var(--${s})` })],
                [/^bg-(.+)$/, ([, s]) => ({ 'background-color': `var(--${s})` })],
                // Grid
                [/^grid-?(cols|rows)-?(.+)$/i, ([, tp, vl]) => ({ ['grid-template-' + (tp.toLowerCase() === 'cols' ? 'columns' : 'rows')]: vl.replace(/-/g, ' ') })],
                [/^(?:(row|col|column))?-?gap-?(.+)$/i, (params) => (hasContent(params[1]) ? gap(params) : { gap: getCssSize(params[2]) })],
                [/^elipsis$/, () => ({ 'white-space': 'nowrap', 'text-overflow': 'ellipsis', 'max-width': '100%', overflow: 'hidden' })],
                [/^grid-?(center|end|start)-?(center|end|start)?$/i, ([, first, second]) => ({ display: 'grid', 'place-items': second ? `${first} ${second}` : first })],
                [/^(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/, ([, color, shade]) => ({ color: `var(--${color}-${shade})` })],
                [/^bg-(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/, ([, color, shade]) => ({ color: `var(--${color}-${shade})` })],
                [/^[pm][tblrwhyx]?-?(\d+)$/, (params) => paddingMargin(params)],
                [/^[sw]-?(\d+)$/, ([, d]) => ({ flex: `1 0 calc(${d}% - 8px)` })]
            ]
        };
    });
};
