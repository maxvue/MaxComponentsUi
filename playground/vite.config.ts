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
        // Porta fixa fora da faixa 5173-5176, disputada pelos outros projetos de
        // ~/GitHub (SocialMedia 5173, engeapp 5174, AgenteDeBolso 5175, MaxAdmin 5176,
        // e mbo/MinhaBibliaOnline/MaxUse/MaxPinia, que sobem sem porta fixa a partir da
        // 5173). strictPort faz falhar em vez de escorregar para a porta de outro
        // projeto, o que mascarava o conflito.
        port: 5180,
        strictPort: true,
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
