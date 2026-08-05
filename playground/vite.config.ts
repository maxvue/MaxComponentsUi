import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import { maxUseAutoImport } from '@maxvue/max-use';


export default defineConfig({
    optimizeDeps: {
        include: ['max-use']
    },
    plugins: [
        vue(),
        UnoCSS({
            configFile: resolve(__dirname, '../uno.config.ts')
        }),
        AutoImport({
            imports: [
                'vue',
                ...maxUseAutoImport,
                {
                    from: 'vue',
                    imports: ['Ref', 'ComputedRef', 'ShallowRef', 'ShallowComputedRef', 'PropType', 'WatchStopHandle', 'Watch'],
                    type: true
                }
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
                '../src/*.ts'
            ]
        }),
        Components({
            dirs: ['../src/components/**'],
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
    root: resolve(__dirname),
    server: {
        host: 'maxcomponents.test',
        open: false,
        cors: true,
        origin: 'https://maxcomponents.test'
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, '../src')
        }
    },
    define: {
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false
    }
});
