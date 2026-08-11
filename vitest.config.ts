import path from 'node:path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        vue()
    ],
    resolve: {
        alias: {
            'virtual:uno.css': path.resolve(import.meta.dirname, './tests/setup.ts'),
            '@': path.resolve(import.meta.dirname, './src'),
            '@helpers': path.resolve(import.meta.dirname, './src/helpers'),
            '@maxvue/max-use': path.resolve(import.meta.dirname, '../MaxUse/src/index.ts'),
            // O alias acima aponta para o *fonte* do MaxUse, cujo `import '@vueuse/core'`
            // resolveria a cópia aninhada em ../MaxUse/node_modules. Isso carregaria uma
            // segunda instância do Vue, e os watchers do VueUse (watchDebounced, etc.)
            // nunca disparariam sobre refs criados pelos testes. Fixar ambos aqui mantém
            // uma única instância de reatividade.
            '@vueuse/core': path.resolve(import.meta.dirname, './node_modules/@vueuse/core'),
            vue: path.resolve(import.meta.dirname, './node_modules/vue')
        },
        // Garante instância única mesmo para dependências resolvidas transitivamente.
        dedupe: ['vue', '@vueuse/core', 'pinia']
    },
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        pool: 'forks',
        singleFork: true,
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
            ]
        }
    }
});
