import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import fs from 'node:fs';

export default defineConfig({
    plugins: [
        vue(),
        UnoCSS({ inspector: false }),
        dts({ rollupTypes: false }),
        cssInjectedByJsPlugin({
            jsAssetsFilterFunction: (outputChunk) => {
                return outputChunk.fileName === 'index.es.js';
            }
        }),
        {
            name: 'copy-themes',
            closeBundle() {
                const srcThemes = path.resolve(import.meta.dirname, 'src/themes');
                const distThemes = path.resolve(import.meta.dirname, 'dist/themes');
                fs.cpSync(srcThemes, distThemes, { recursive: true });
                if (!fs.existsSync(path.resolve(distThemes, 'all.scss'))) throw new Error('Falha ao copiar dist/themes/all.scss durante o build');

            }
        }
    ],
    build: {
        lib: {
            entry: {
                index: path.resolve(import.meta.dirname, './src/index.ts'),
                preset: path.resolve(import.meta.dirname, './src/presetMaxUno.ts'),
                resolver: path.resolve(import.meta.dirname, './src/helpers/MaxComponentsUiResolver.ts'),
                prime: path.resolve(import.meta.dirname, './src/prime/index.ts')
            },
            name: 'MaxComponentsUi',
            fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'es.js' : 'js'}`,
            formats: ['es'],
            cssFileName: 'style'
        },
        rollupOptions: {
            external: (id: string) => (
                !id.startsWith('.') &&
                !path.isAbsolute(id) &&
                !id.startsWith('virtual:') &&
                !id.startsWith('\0')
            ),
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
        alias: { '@': path.resolve(import.meta.dirname, './src'),'@helpers': path.resolve(import.meta.dirname, './src/helpers'),'@maxvue/max-use': path.resolve(import.meta.dirname, '../MaxUse/src/index.ts') }
    }
});
