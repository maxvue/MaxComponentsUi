import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';

const require = createRequire(import.meta.url);

function virtualMaxGridPresetPlugin() {
    const virtualModuleId = 'virtual:maxgrid-preset.js';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    return {
        name: 'virtual-maxgrid-preset-css',
        resolveId(id: string) {
            if (id === virtualModuleId) return resolvedVirtualModuleId;

        },
        async load(id: string) {
            if (id === resolvedVirtualModuleId) {
                const { createGenerator } = await import('unocss');
                const presetAttributify = (await import('@unocss/preset-attributify')).default;
                const { presetMaxUno } = await import('./src/presetMaxUno.ts');
                const uno = await createGenerator({
                    presets: [presetMaxUno(), presetAttributify()]
                });
                const tokens = [
                    's7-end', 's7-10-end', 's3-start', 's3-10-start',
                    's-50-full-start', 's-50-max-end', 's-10', 's-15', 's-20',
                    's-30', 's-40', 's-50', 's3', 's7',
                    's11-11', 's20-full-mobile',
                    's4', 's-4', 's4-max-end-mobile', 's4-max-mobile-end'
                ];
                const content = tokens.map((t) => `<div class="${t}" ${t}></div>`).join('\n');
                const { css } = await uno.generate(content, { preflights: false });
                return `export default ${JSON.stringify(css)};`;
            }
        }
    };
}

export default defineConfig({
    plugins: [
        vue(),
        virtualMaxGridPresetPlugin()
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
