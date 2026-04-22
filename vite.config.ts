import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [vue(), UnoCSS(), dts({ rollupTypes: true })], // rollupTypes: false é mais estável no Vite 8
    build: {
        lib: {
            entry: './src/index.ts',
            name: 'MaxComponentsUi',
            fileName: (format: string) => `index.${format}.js`,
            formats: ['es', 'umd'],
            cssFileName: 'style',
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue',
                },
                // Mantenha ou simplifique isto:
                assetFileNames: 'style.[ext]',
            },
        },
        cssTarget: 'esnext',
        sourcemap: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@helpers': path.resolve(__dirname, './src/helpers'),
        },
    },
});
