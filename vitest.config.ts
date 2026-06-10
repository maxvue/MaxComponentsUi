import path from 'node:path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        vue()
    ],
    resolve: {
        alias: {
            'virtual:uno.css': path.resolve(__dirname, './tests/setup.ts'),
            '@': path.resolve(__dirname, './src'),
            '@helpers': path.resolve(__dirname, './src/helpers'),
            '@maxvue/max-use': path.resolve(__dirname, '../MaxUse/src/index.ts')
        }
    },
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        pool: 'forks',
        poolOptions: { forks: { singleFork: true } },
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
                'src/scripts/**',
                'src/check-*.cjs'
            ]
        }
    }
});
