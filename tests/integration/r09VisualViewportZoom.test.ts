// @vitest-environment node
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import vue from '@vitejs/plugin-vue';

let server: ViteDevServer;
let browser: Browser;
let page: Page;

beforeAll(async () => {
    server = await createServer({
        configFile: false,
        root: process.cwd(),
        plugins: [vue()],
        resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
        optimizeDeps: { noDiscovery: true, include: ['vue', 'pinia', '@maxvue/max-use'] },
        server: { host: '127.0.0.1', port: 0, watch: null },
        appType: 'spa'
    });
    await server.listen();
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
}, 30_000);

afterAll(async () => {
    await browser?.close();
    await server?.close();
}, 30_000);

describe('R09/E04-06/E04-07 — pinch-zoom real do Chromium', () => {
    it('registra VisualViewport.scale=2 e mantém BaseOverlay/Popover reais utilizáveis', async () => {
        const session = await page.context().newCDPSession(page);
        await session.send('Emulation.setDeviceMetricsOverride', {
            width: 280,
            height: 320,
            deviceScaleFactor: 1,
            mobile: true
        });
        await page.goto(`${server.resolvedUrls!.local[0]}tests/browser/r09Zoom.fixture.html`);
        await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
        await expect.poll(() => page.evaluate(() => window.visualViewport?.scale)).toBeCloseTo(2, 2);
        // CDP altera a viewport visual de verdade; o evento garante que a
        // atualização de layout seja observada antes das medições.
        await page.evaluate(() => window.visualViewport?.dispatchEvent(new Event('resize')));

        const metrics = await page.evaluate(() => {
            const viewport = window.visualViewport!;
            const overlay = document.querySelector<HTMLElement>('.max-base-overlay')!;
            const trigger = document.querySelector<HTMLButtonElement>('.max-popover-icon')!;
            const overlayRect = overlay.getBoundingClientRect();
            overlay.scrollTop = 40;
            const overlayHit = document.elementFromPoint(overlayRect.left + 4, overlayRect.top + 4);
            trigger.click();
            return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
                const popover = document.querySelector<HTMLElement>('.max-popover-dialog')!;
                const popoverRect = popover.getBoundingClientRect();
                popover.scrollTop = 40;
                resolve({
                    scale: viewport.scale,
                    viewport: { left: viewport.offsetLeft, top: viewport.offsetTop, width: viewport.width, height: viewport.height },
                    overlay: { left: overlayRect.left, top: overlayRect.top, right: overlayRect.right, bottom: overlayRect.bottom, scrollTop: overlay.scrollTop, hit: overlay.contains(overlayHit) },
                    popover: { left: popoverRect.left, top: popoverRect.top, right: popoverRect.right, bottom: popoverRect.bottom, scrollTop: popover.scrollTop, hit: popover.contains(document.elementFromPoint(popoverRect.left + 4, popoverRect.top + 4)), arrow: getComputedStyle(popover, '::before').content, arrowWidth: getComputedStyle(popover, '::before').width, arrowHeight: getComputedStyle(popover, '::before').height, arrowTransform: getComputedStyle(popover, '::before').transform }
                });
            })));
        }) as any;
        const withinViewport = (rect: any) => {
            expect(rect.left).toBeGreaterThanOrEqual(metrics.viewport.left + 7);
            expect(rect.top).toBeGreaterThanOrEqual(metrics.viewport.top + 7);
            expect(rect.right).toBeLessThanOrEqual(metrics.viewport.left + metrics.viewport.width - 7);
            expect(rect.bottom).toBeLessThanOrEqual(metrics.viewport.top + metrics.viewport.height - 7);
            expect(rect.scrollTop).toBe(40);
            expect(rect.hit).toBe(true);
        };
        expect(metrics.scale).toBeCloseTo(2, 2);
        withinViewport(metrics.overlay);
        withinViewport(metrics.popover);
        expect(metrics.popover.arrow).not.toBe('none');
        expect(metrics.popover.arrowWidth).toBe('14px');
        expect(metrics.popover.arrowHeight).toBe('14px');
        expect(metrics.popover.arrowTransform).toMatch(/^matrix\(/);
    }, 30_000);
});
