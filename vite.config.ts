import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from './uno.config';

export default defineConfig({
    plugins: [vue(), UnoCSS()],
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
            '@': './src',
        },
    },
});
