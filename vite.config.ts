import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
    plugins: [
        vue(),
        UnoCSS({ inspector: false }),
        dts({ rollupTypes: false }),
        cssInjectedByJsPlugin({
            jsAssetsFilterFunction: (outputChunk) => {
                return outputChunk.fileName === 'index.es.js';
            }
        })

    ],
    build: {
        lib: {
            entry: {
                index: path.resolve(__dirname, './src/index.ts'),
                preset: path.resolve(__dirname, './src/presetMaxUno.ts'),
                resolver: path.resolve(__dirname, './src/helpers/MaxComponentsUiResolver.ts'),
                prime: path.resolve(__dirname, './src/prime/index.ts')
            },
            name: 'MaxComponentsUi',
            fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'es.js' : 'js'}`,
            formats: ['es'],
            cssFileName: 'style'
        },
        rollupOptions: {
            external: [
                'vue-router',
                'vue',
                '@iconify/vue',
                'sass',
                'node:path',
                'node:url',
                'node:fs',
                '@oxc-parser/binding-wasm32-wasi',
                ...Object.keys(pkg.dependencies || {}),
                ...Object.keys(pkg.peerDependencies || {})
            ],
            output: {
                exports: 'named',
                globals: {
                    vue: 'Vue'
                }
            },
            checks: {
                pluginTimings: false
            }
        },
        cssTarget: 'esnext',
        sourcemap: true,
        minify: 'terser'
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, './src'),'@helpers': path.resolve(__dirname, './src/helpers'),'@maxvue/max-use': path.resolve(__dirname, '../MaxUse/src/index.ts') }
    }
});
