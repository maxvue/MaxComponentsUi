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

describe('R04/E03-02 — autofill real pelo DevTools Protocol', () => {
    it('registra, sem mascarar, a indisponibilidade de Autofill no Chromium headless fornecido', async () => {
        const session = await page.context().newCDPSession(page);
        await page.goto(`${server.resolvedUrls!.local[0]}tests/browser/r04Autofill.fixture.html`);
        await page.locator('input.max-input-native').waitFor();

        const version = await session.send('Browser.getVersion');
        await expect(session.send('Autofill.enable')).rejects.toThrow('\'Autofill.enable\' wasn\'t found');
        // O protocolo tipado do Playwright declara Autofill.trigger/setAddresses,
        // mas o Chromium 153 headless distribuído neste ambiente não expõe o
        // domínio. Esta é uma sonda de capacidade, não cobertura de autofill.
        expect(version.product).toMatch(/^HeadlessChrome\/153\./);
    }, 30_000);
});
