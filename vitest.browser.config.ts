import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';

const require = createRequire(import.meta.url);

export default defineConfig({
    plugins: [
        vue()
    ],
    resolve: {
        alias: {
            'virtual:uno.css': path.resolve(import.meta.dirname, './tests/browser.setup.ts'),
            '@': path.resolve(import.meta.dirname, './src'),
            '@helpers': path.resolve(import.meta.dirname, './src/helpers'),
            '@vueuse/core': path.dirname(require.resolve('@vueuse/core/package.json')),
            vue: path.dirname(require.resolve('vue/package.json'))
        },
        dedupe: ['vue', '@vueuse/core', 'pinia']
    },
    optimizeDeps: {
        include: ['vue', 'vue-router', 'pinia', '@maxvue/max-use']
    },
    test: {
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [
                { browser: 'chromium' }
            ],
            headless: true
        },
        setupFiles: [path.resolve(import.meta.dirname, './tests/browser.setup.ts')],
        include: ['tests/browser/**/*.browser.ts']
    }
});
