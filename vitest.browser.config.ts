import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';

import fs from 'node:fs';

if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
    const candidate = [
        '/home/johnattas/.cache/ms-playwright',
        path.join(process.env.HOME || '', '.cache/ms-playwright')
    ].find((p) => Boolean(p && fs.existsSync(p)));

    if (candidate) process.env.PLAYWRIGHT_BROWSERS_PATH = candidate;
}

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
                },
                async dragOverlaySelection(context: any, options: {
                    fromSelector: string;
                    toSelector: string;
                    steps?: number;
                    reverse?: boolean;
                    toSide?: 'left' | 'right';
                }) {
                    const page = context.provider.getPage(context.sessionId);
                    const frame = page.mainFrame().childFrames()[0] || page.frames().find((f: any) => f !== page.mainFrame());
                    if (!frame) throw new Error('Frame de teste não encontrado');

                    const fromElement = await frame.$(options.fromSelector);
                    const toElement = await frame.$(options.toSelector);
                    if (!fromElement) throw new Error(`Elemento de origem não encontrado: ${options.fromSelector}`);
                    if (!toElement) throw new Error(`Elemento de destino não encontrado: ${options.toSelector}`);

                    const fromBox = await fromElement.boundingBox();
                    const toBox = await toElement.boundingBox();
                    if (!fromBox || !toBox) throw new Error('BoundingBox não encontrado para elementos');

                    const startX = fromBox.x + fromBox.width / 2;
                    const startY = fromBox.y + fromBox.height / 2;
                    let endX = toBox.x + Math.min(25, toBox.width / 4);
                    let endY = toBox.y + Math.min(25, toBox.height / 4);

                    if (options.toSide === 'right') {
                        endX = toBox.x + toBox.width - 30;
                        endY = toBox.y + toBox.height / 2;
                    }

                    const p1 = options.reverse ? { x: endX, y: endY } : { x: startX, y: startY };
                    const p2 = options.reverse ? { x: startX, y: startY } : { x: endX, y: endY };

                    try {
                        await page.mouse.move(p1.x, p1.y);
                        await page.mouse.down({ button: 'left' });
                        await page.mouse.move(p2.x, p2.y, { steps: options.steps ?? 12 });
                        await page.mouse.up({ button: 'left' });
                    } finally {
                        await page.mouse.up({ button: 'left' }).catch(() => {});
                    }
                },
                async clickOverlayDirect(context: any, options: {
                    selector: string;
                    offsetX?: number;
                    offsetY?: number;
                    side?: 'left' | 'right';
                }) {
                    const page = context.provider.getPage(context.sessionId);
                    const frame = page.mainFrame().childFrames()[0] || page.frames().find((f: any) => f !== page.mainFrame());
                    if (!frame) throw new Error('Frame de teste não encontrado');

                    const element = await frame.$(options.selector);
                    if (!element) throw new Error(`Elemento não encontrado: ${options.selector}`);

                    const box = await element.boundingBox();
                    if (!box) throw new Error('BoundingBox não encontrado');

                    let x = box.x + (options.offsetX ?? Math.min(25, box.width / 4));
                    let y = box.y + (options.offsetY ?? Math.min(25, box.height / 4));

                    if (options.side === 'right') {
                        x = box.x + box.width - 30;
                        y = box.y + box.height / 2;
                    }

                    await page.mouse.click(x, y, { button: 'left' });
                }
            }
        },
        setupFiles: [path.resolve(import.meta.dirname, './tests/browser.setup.ts')],
        include: ['tests/browser/**/*.browser.ts']
    }
});
