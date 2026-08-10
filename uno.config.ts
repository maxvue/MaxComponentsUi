import presetAttributify, { defaultIgnoreAttributes } from '@unocss/preset-attributify';
import presetWind3 from '@unocss/preset-wind3';
import { presetMaxUno } from './src/presetMaxUno';
import { defineConfig } from '@unocss/vite';
import { transformerVariantGroup } from 'unocss';


export default defineConfig({
    shortcuts: [],
    transformers: [ transformerVariantGroup() ],
    presets: [
        presetMaxUno(),
        presetWind3(),
        // `color` é uma prop real de componentes Vue (ex.: MaxIcon, MaxIconButton), não um
        // atributo utilitário estático. Quando vinculado dinamicamente (`:color="expressao()"`),
        // o extractor attributify captura o nome bruto do atributo incluindo o `:` do binding
        // Vue (ou seja, `:color`, não `color`) e tenta interpretar o texto da expressão JS como
        // valor de classe, gerando CSS malformado (parênteses desbalanceados) e quebrando o
        // build. `:color-string` (usado em MaxTagSelect.vue) sofre do mesmo problema por uma
        // segunda via: o atributo attributify vira um seletor `[color-string~="..."]`, cujo
        // texto bruto ainda casa com a shortcut `color-*` de presetMaxUno.ts (captura `s =
        // "string...`), gerando a mesma quebra de CSS. Por isso `ignoreAttributes` precisa
        // listar as formas estáticas (`color`, `color-string`) e as formas de binding dinâmico
        // (`:color`, `v-bind:color`, `:color-string`, `v-bind:color-string`) realmente usadas em
        // MaxTagSelect.vue/MaxTagsList.vue. Isso não afeta `color-blue-500` etc., que continuam
        // funcionando como classes utilitárias normais.
        presetAttributify({
            ignoreAttributes: [
                ...defaultIgnoreAttributes,
                'color',
                ':color',
                'v-bind:color',
                'color-string',
                ':color-string',
                'v-bind:color-string'
            ]
        })
    ]
});
