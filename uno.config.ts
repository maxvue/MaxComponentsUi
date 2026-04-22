import { resolve } from 'node:path';
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders';
import presetAttributify from '@unocss/preset-attributify';
import presetIcons from '@unocss/preset-icons';
import presetWind3 from '@unocss/preset-wind3';
import { defineConfig } from '@unocss/vite';
import { transformerVariantGroup } from 'unocss';
import { hasContent } from './src/helpers/hasContent';
import { gap } from './src/helpers/gap';
import { paddingMargin } from './src/helpers/paddingMargin';
import { getCssSize } from './src/helpers/getCssSize';

const iconDirectory = resolve(__dirname, 'icons');

export default defineConfig({
    shortcuts: [
        [/^font-size-(.+)$/, ([, s]) => ({ 'font-size': `${s}rem` })],
        [/^font-weight-(.+)$/, ([, s]) => ({ 'font-weight': s })],
        // Colors
        [/^color-(.+)$/, ([, s]) => ({ color: `var(--${s})` })],
        [/^bg-(.+)$/, ([, s]) => ({ 'background-color': `var(--${s})` })],
        // Grid
        [/^grid-?(cols|rows)-?(.+)$/i, ([, tp, vl]) => ({ ['grid-template-' + (tp.toLowerCase() === 'cols' ? 'columns' : 'rows')]: vl.replace(/-/g, ' ') })],
        [/^(?:(row|col|column))?-?gap-?(.+)$/i, (params) => (hasContent(params[1]) ? gap(params) : { gap: getCssSize(params[2]) })],
        [/^elipsis$/, ([, s]) => ({ 'white-space': 'nowrap', 'text-overflow': 'ellipsis', 'max-width': '100%', overflow: 'hidden' })],
        [/^grid-?(center|end|start)-?(center|end|start)?$/i, ([, first, second]) => ({ display: 'grid', 'place-items': second ? `${first} ${second}` : first })],
        [/^(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/, ([_, color, shade]) => ({ color: `var(--${color}-${shade})` })],
        [/^bg-(red|green|blue|emerald|orange|amber|cyan|pink|yellow|gray|background)-?(\d+)$/, ([_, color, shade]) => ({ color: `var(--${color}-${shade})` })],
        [/^[pm][tblrwhyx]?-?(\d+)$/, (params) => paddingMargin(params)],
    ],
    rules: [[/^[sw]-?(\d+)$/, ([, d]) => ({ flex: `1 0 calc(${d}% - 8px)` })]],
    transformers: [transformerVariantGroup()],
    presets: [
        presetWind3(),
        presetAttributify({
            extraProperties: {},
        }),
        presetIcons({
            extraProperties: {},
            prefix: '',
        }),
        // presetWebFonts({
        //   provider: 'google',
        //   fonts: {
        //     sans: 'Roboto',
        //     mono: ['Fira Code', 'Fira Mono:400,700'],
        //     lobster: 'Lobster',
        //     lato: [
        //       {
        //         name: 'Lato',
        //         weights: ['400', '700'],
        //         italic: true,
        //       },
        //       {
        //         name: 'sans-serif',
        //         provider: 'none',
        //       },
        //     ],
        //   },
        //   processors: createLocalFontProcessor(),
        // }),
    ],
});
