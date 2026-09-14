import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

const require = createRequire(import.meta.url);

export default defineConfig({
    plugins: [
        vue()
    ],
    resolve: {
        alias: {
            'virtual:uno.css': path.resolve(import.meta.dirname, './tests/setup.ts'),
            '@': path.resolve(import.meta.dirname, './src'),
            '@helpers': path.resolve(import.meta.dirname, './src/helpers'),
            '@vueuse/core': path.dirname(require.resolve('@vueuse/core/package.json')),
            vue: path.dirname(require.resolve('vue/package.json'))
        },
        // Garante instância única mesmo para dependências resolvidas transitivamente.
        dedupe: ['vue', '@vueuse/core', 'pinia']
    },
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: [path.resolve(import.meta.dirname, './tests/setup.ts')],
        include: ['tests/**/*.{test,spec}.ts'],
        pool: 'forks',
        singleFork: true,
        testTimeout: 15000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.{ts,vue}'],
            exclude: [
                'src/**/*.d.ts',
                'src/styles/**',
                'src/themes/**',
                'src/locales/**',
                'src/prime/**',
                'src/scripts/**'
            ],
            thresholds: {
                statements: 85,
                branches: 75,
                functions: 80,
                lines: 85
            }
        }
    }
});
