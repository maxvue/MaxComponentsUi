import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'node:fs';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { maxUseAutoImport } from '@maxvue/max-use';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const maxUseImportsWithoutVueDuplicates = maxUseAutoImport.map((preset) => {
    if (!('imports' in preset) || !Array.isArray(preset.imports)) return preset;
    return {
        ...preset,
        imports: preset.imports.filter((name) => !['toRef', 'toRefs', 'useAsyncState', 'useScrollLock'].includes(name))
    };
});

export default defineConfig({
    optimizeDeps: {
        include: ['max-use']
    },
    plugins: [
        // O código-fonte da biblioteca fica acima de `root`. No dev server do
        // Vite 8, imports dinâmicos `@fs/*.svg?raw` seriam servidos como SVG,
        // em vez de módulo JS. Preservamos o contrato `?raw` também para esses
        // assets externos ao playground.
        {
            name: 'playground-external-svg-raw',
            enforce: 'pre',
            load(id) {
                const [file, query = ''] = id.split('?', 2);
                if (!file.endsWith('.svg') || !query.split('&').includes('raw')) return null;
                return `export default ${JSON.stringify(readFileSync(file, 'utf8'))};`;
            },
            configureServer(server) {
                const sourceRoot = resolve(rootDir, '../src');
                server.middlewares.use((request, response, next) => {
                    const [pathname = '', query = ''] = (request.url ?? '').split('?', 2);
                    if (!pathname.startsWith('/@fs/') || !pathname.endsWith('.svg') || !query.split('&').includes('raw')) return next();

                    const file = decodeURIComponent(pathname.slice('/@fs'.length));
                    if (!file.startsWith(sourceRoot)) return next();

                    response.statusCode = 200;
                    response.setHeader('Content-Type', 'application/javascript');
                    response.end(`export default ${JSON.stringify(readFileSync(file, 'utf8'))};`);
                });
            }
        },
        vue(),
        UnoCSS({
            configFile: resolve(rootDir, '../uno.config.ts')
        }),
        AutoImport({
            imports: [
                'vue',
                ...maxUseImportsWithoutVueDuplicates,
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
            // Os cenários importam a API pública da biblioteca explicitamente.
            // Não varrer `src` evita registrar a mesma exportação pela fachada,
            // pelos tipos e por módulos internos, que o plugin reporta como
            // imports duplicados durante o build.
            ignore: ['toRef', 'toRefs', 'useAsyncState', 'useScrollLock']
        })
    ],
    root: resolve(rootDir),
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
            '@': resolve(rootDir, '../src'),
            '@maxvue/max-components-ui': resolve(rootDir, '../src/index.ts')
        }
    },
    define: {
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false
    },
    build: {
        // O limite do Vite apenas evita warning redundante; o gate executável está
        // em scripts/check-playground-bundle.mjs e também mede gzip.
        chunkSizeWarningLimit: 2600
    }
});
