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
        include: ['vue', 'vue-router', 'pinia', '@maxvue/max-use', 'axe-core']
    },
    test: {
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [
                {
                    browser: 'chromium',
                    launch: {
                        args: ['--enable-precise-memory-info', '--js-flags=--expose-gc']
                    }
                }
            ],
            headless: true,
            commands: {
                async setPageScaleFactor(context: any, scale: number) {
                    const page = context.provider.getPage(context.sessionId);
                    const cdp = await page.context().newCDPSession(page);
                    await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: scale });
                    await cdp.detach();
                }
            }
        },
        setupFiles: [path.resolve(import.meta.dirname, './tests/browser.setup.ts')],
        include: ['tests/browser/**/*.browser.ts']
    }
});
