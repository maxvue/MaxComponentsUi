import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import dts from 'vite-plugin-dts';
import fs from 'node:fs';

export default defineConfig({
    plugins: [
        vue(),
        UnoCSS({ inspector: false }),
        dts({ rollupTypes: false }),
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
                stores: path.resolve(import.meta.dirname, './src/stores/index.ts'),
                styles: path.resolve(import.meta.dirname, './src/styles.ts'),
                ...Object.fromEntries(
                    fs.readdirSync(path.resolve(import.meta.dirname, './src/components'))
                        .filter((file) => file.endsWith('.vue'))
                        .map((file) => [
                            `components/${file.replace('.vue', '')}`,
                            path.resolve(import.meta.dirname, `./src/components/${file}`)
                        ])
                )
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
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
            '@helpers': path.resolve(import.meta.dirname, './src/helpers')
        }
    }
});
