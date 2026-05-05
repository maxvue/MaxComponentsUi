import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import { maxUseAutoImport } from '@maxvue/max-use';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
    plugins: [
        cssInjectedByJsPlugin(),
        vue(),
        UnoCSS({ inspector: false }),
        dts({ rollupTypes: false }),
        AutoImport({
            imports: [
                'vue',
                maxUseAutoImport,
                {
                    from: 'vue',
                    imports: ['Ref', 'ComputedRef', 'ShallowRef', 'ShallowComputedRef', 'PropType', 'WatchStopHandle', 'Watch'],
                    type: true
                },
                { 'maska/vue': ['vMaska'] }
            ],
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
            dirs: [
                './src/helpers/**',
                './src/components/**',
                './src/utils/**',
                './src/types/**'
            ]
        }),
        Components({
            dirs: ['./src/components/**'],
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
            entry: {
                index: path.resolve(__dirname, './src/index.ts'),
                preset: path.resolve(__dirname, './src/unoCssPreset.ts'),
                resolver: path.resolve(__dirname, './src/helpers/resolver.ts')
            },
            name: 'MaxComponentsUi',
            fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'es.js' : 'js'}`,
            formats: ['es'],
            cssFileName: 'style'
        },
        rollupOptions: {
            external: [
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
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@helpers': path.resolve(__dirname, './src/helpers')
        }
    }
});
