// @vitest-environment node
import path from 'node:path';
import { existsSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import vue from '@vitejs/plugin-vue';

let server: ViteDevServer;
let browser: Browser;
let page: Page;

// O Chromium do Playwright deste projeto não expõe o domínio Autofill. O
// Chrome 151 disponibilizado pelo Selenium o expõe e é selecionável de modo
// explícito para que a ausência do runtime não seja confundida com cobertura.
const seleniumChrome151 = '/home/johnattas/.cache/selenium/chrome/linux64/151.0.7922.76/chrome';
const autofillExecutable = process.env.MAX_UI_AUTOFILL_EXECUTABLE ?? seleniumChrome151;

function assertAutofillRuntime(): void {
    if (!existsSync(autofillExecutable)) throw new Error(
        `R04 exige Chrome com CDP Autofill. Configure MAX_UI_AUTOFILL_EXECUTABLE; não encontrado: ${autofillExecutable}`
    );
}

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
    assertAutofillRuntime();
    browser = await chromium.launch({
        headless: true,
        executablePath: autofillExecutable
    });
    page = await browser.newPage();
}, 30_000);

afterAll(async () => {
    await browser?.close();
    await server?.close();
}, 30_000);

describe('R04/E03-02 — autofill real pelo DevTools Protocol', () => {
    it('preenche o owner nativo por Autofill CDP real e emite addressFormFilled', async () => {
        const session = await page.context().newCDPSession(page);
        await page.goto(`${server.resolvedUrls!.local[0]}tests/browser/r04Autofill.fixture.html`);
        const input = page.locator('input.max-input-native');
        await input.waitFor();

        const version = await session.send('Browser.getVersion');
        expect(version.product).toMatch(/^Chrome\/151\./);

        const document = await session.send('DOM.getDocument');
        const node = await session.send('DOM.querySelector', {
            nodeId: document.root.nodeId,
            selector: 'input.max-input-native'
        });
        const described = await session.send('DOM.describeNode', { nodeId: node.nodeId });
        const frameTree = await session.send('Page.getFrameTree');
        const address = {
            fields: [
                { name: 'EMAIL_ADDRESS', value: 'ada@example.test' }
            ]
        };

        await session.send('Autofill.enable');
        await session.send('Autofill.setAddresses', { addresses: [address] });
        const formFilled = new Promise<any>((resolve) => {
            session.once('Autofill.addressFormFilled', resolve);
        });
        await session.send('Autofill.trigger', {
            fieldId: described.node.backendNodeId!,
            frameId: frameTree.frameTree.frame.id,
            // O Chrome 151 requer o endereço também em trigger; setAddresses
            // sozinho registra o perfil, mas não o seleciona neste protocolo.
            address
        });

        const event = await formFilled;
        expect(event.filledFields).toEqual(expect.arrayContaining([
            expect.objectContaining({
                name: 'email',
                value: 'ada@example.test',
                autofillType: 'Email address'
            })
        ]));
        expect(await input.inputValue()).toBe('ada@example.test');
        const submittedValue = await page.locator('#r04-autofill-form').evaluate((form) => {
            return new FormData(form as HTMLFormElement).get('email');
        });
        expect(submittedValue).toBe('ada@example.test');
    }, 30_000);
});
