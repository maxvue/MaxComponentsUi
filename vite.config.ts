import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [vue(), UnoCSS(), dts({ rollupTypes: false })],
    build: {
        lib: {
            entry: './src/index.ts',
            name: 'MaxComponentsUi',
            fileName: (format: string) => `index.${format}.js`,
            formats: ['es', 'umd'],
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue',
                },
                assetFileNames: (assetInfo: any) => {
                    if (assetInfo.name === 'style.css') return 'style.css';
                    return assetInfo.name;
                },
            },
        },
        cssCodeSplit: false,
        sourcemap: true,
        minify: 'esbuild',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@helpers': path.resolve(__dirname, './src/helpers'),
        },
    },
});
