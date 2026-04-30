import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';


export default defineConfig({
    plugins: [
        cssInjectedByJsPlugin(),
        vue(),
        UnoCSS({ inspector: false }),
        dts({ rollupTypes: false }),
        AutoImport({
            imports: [
                'vue',
                { 'max-use': ['maxUse'] },
                {
                    from: 'vue',
                    imports: ['Ref', 'ComputedRef', 'ShallowRef', 'ShallowComputedRef', 'PropType', 'WatchStopHandle', 'Watch'],
                    type: true
                },
                { 'maska/vue': ['vMaska'] },
                '@vueuse/core'
            ],
            ignore: ['useTimeAgo'],
            dts: './auto-import.d.ts',
            dtsMode: 'overwrite',
            dtsPreserveExts: true,
            vueTemplate: true,
            vueDirectives: true,
            viteOptimizeDeps: true,
            defaultExportByFilename: false,
            injectAtEnd: true,
            dirsScanOptions: {
                types: true
            },
            dirs: ['./src/helpers/**']
        }),
        Components({
            dirs: ['./src/components'],
            extensions: ['vue'],
            directoryAsNamespace: false,
            deep: true,
            allowOverrides: true,
            dts: './auto-import-components.d.ts',
            directives: true,
            syncMode: 'overwrite',
            resolvers: [PrimeVueResolver()]
        })
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, './src/index.ts'),
            name: 'MaxComponentsUi',
            fileName: (format: string) => `index.${format}.js`,
            formats: ['es', 'umd'],
            cssFileName: 'style'
        },
        rollupOptions: {
            external: [
                'vue',
                '@iconify/vue',
                '@oxc-parser/binding-wasm32-wasi'
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
        minify: false
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@helpers': path.resolve(__dirname, './src/helpers')
        }
    }
});
