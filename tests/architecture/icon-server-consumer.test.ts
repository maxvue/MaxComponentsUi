// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';
import { setActivePinia, createPinia } from 'pinia';

describe('Arquitetura - Integração de ICON_SERVER por consumidores isolados', () => {
    const fixturesRoot = path.resolve(__dirname, '../../.tmp-consumer-fixtures');
    const consumerADir = path.join(fixturesRoot, 'consumer-a');
    const consumerBDir = path.join(fixturesRoot, 'consumer-b');
    const consumerDefaultDir = path.join(fixturesRoot, 'consumer-default');

    const distIndex = path.resolve(__dirname, '../../dist/index.es.js');
    const distStores = path.resolve(__dirname, '../../dist/stores.es.js');

    beforeAll(() => {
        // Cria fixtures de ambiente simulando três aplicações consumidoras distintas
        fs.mkdirSync(consumerADir, { recursive: true });
        fs.mkdirSync(consumerBDir, { recursive: true });
        fs.mkdirSync(consumerDefaultDir, { recursive: true });

        fs.writeFileSync(
            path.join(consumerADir, '.env'),
            'ICON_SERVER=https://icones-a.consumidor.com.br\nSECRET_KEY_SENTINEL=segredo_a_123456\n',
            'utf-8'
        );

        fs.writeFileSync(
            path.join(consumerBDir, '.env'),
            'ICON_SERVER=https://cdn-b.consumidor.org/prefixo\nAPI_TOKEN_SENTINEL=token_b_789012\n',
            'utf-8'
        );

        fs.writeFileSync(
            path.join(consumerDefaultDir, '.env'),
            'APP_NAME=ConsumidorPadrao\nOUTRA_VARIAVEL_SENTINEL=outra_coisa\n',
            'utf-8'
        );
    });

    afterAll(() => {
        // Limpa apenas o diretório de fixtures temporárias criado pelo teste
        if (fs.existsSync(fixturesRoot)) fs.rmSync(fixturesRoot, { recursive: true, force: true });
    });

    let pinia: any;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        localStorage.clear();
    });

    afterEach(() => {
        if (pinia) pinia._e.stop();
        vi.restoreAllMocks();
    });

    it('lê seletivamente ICON_SERVER pelo loadEnv do Vite sem expor sentinelas secretas do .env', () => {
        // Consumidor A: expõe apenas o prefixo/chave ICON_SERVER
        const envA = loadEnv('', consumerADir, 'ICON_SERVER');
        expect(envA.ICON_SERVER).toBe('https://icones-a.consumidor.com.br');
        expect((envA as any).SECRET_KEY_SENTINEL).toBeUndefined();

        // Consumidor B
        const envB = loadEnv('', consumerBDir, 'ICON_SERVER');
        expect(envB.ICON_SERVER).toBe('https://cdn-b.consumidor.org/prefixo');
        expect((envB as any).API_TOKEN_SENTINEL).toBeUndefined();

        // Consumidor Default (sem ICON_SERVER)
        const envDefault = loadEnv('', consumerDefaultDir, 'ICON_SERVER');
        expect(envDefault.ICON_SERVER).toBeUndefined();
        expect((envDefault as any).OUTRA_VARIAVEL_SENTINEL).toBeUndefined();
    });

    it('o mesmo pacote compilado (dist) aceita configurações de múltiplos consumidores sem recompartilhar estado', async () => {
        expect(fs.existsSync(distIndex), 'dist/index.es.js deve existir (npm test executa o build antes)').toBe(true);
        expect(fs.existsSync(distStores), 'dist/stores.es.js deve existir').toBe(true);

        const { configureMaxApp, getMaxAppConfig, resetMaxAppConfig } = await import(distIndex);
        const { useIconStore } = await import(distStores);

        const envA = loadEnv('', consumerADir, 'ICON_SERVER');
        const envB = loadEnv('', consumerBDir, 'ICON_SERVER');
        const envDefault = loadEnv('', consumerDefaultDir, 'ICON_SERVER');

        const validSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

        // Cenário 1: Consumidor A
        resetMaxAppConfig();
        configureMaxApp({ iconServer: envA.ICON_SERVER });
        let config = getMaxAppConfig();
        expect(config.iconServer).toBe('https://icones-a.consumidor.com.br');
        expect(config.routeIcons).toBe('https://icones-a.consumidor.com.br/api/icons');
        expect(config.routeIconsSync).toBe('https://icones-a.consumidor.com.br/api/icons');
        expect((config as any).SECRET_KEY_SENTINEL).toBeUndefined();

        const capturedUrlsA: string[] = [];
        vi.stubGlobal('fetch', vi.fn((input: any) => {
            capturedUrlsA.push(String(input));
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ 'icon-a': validSvg }),
                text: () => Promise.resolve(validSvg)
            });
        }));

        let store = useIconStore();
        store.getIcon('icon-a');
        await new Promise((r) => setTimeout(r, 250)); // aguarda debounce

        expect(capturedUrlsA.some((u) => u.includes('https://icones-a.consumidor.com.br/api/icons'))).toBe(true);
        expect(capturedUrlsA.some((u) => u.includes('engeapp.com.br'))).toBe(false);

        // Cenário 2: Consumidor B
        resetMaxAppConfig();
        configureMaxApp({ iconServer: envB.ICON_SERVER });
        config = getMaxAppConfig();
        expect(config.iconServer).toBe('https://cdn-b.consumidor.org/prefixo');
        expect(config.routeIcons).toBe('https://cdn-b.consumidor.org/prefixo/api/icons');
        expect(config.routeIconsSync).toBe('https://cdn-b.consumidor.org/prefixo/api/icons');
        expect((config as any).API_TOKEN_SENTINEL).toBeUndefined();

        const capturedUrlsB: string[] = [];
        vi.stubGlobal('fetch', vi.fn((input: any) => {
            capturedUrlsB.push(String(input));
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ 'icon-b': validSvg }),
                text: () => Promise.resolve(validSvg)
            });
        }));

        pinia = createPinia();
        setActivePinia(pinia);
        store = useIconStore();
        store.getIcon('icon-b');
        await new Promise((r) => setTimeout(r, 250));

        expect(capturedUrlsB.some((u) => u.includes('https://cdn-b.consumidor.org/prefixo/api/icons'))).toBe(true);
        expect(capturedUrlsB.some((u) => u.includes('engeapp.com.br'))).toBe(false);

        // Cenário 3: Consumidor Padrão (sem ICON_SERVER no .env)
        resetMaxAppConfig();
        configureMaxApp({ iconServer: envDefault.ICON_SERVER });
        config = getMaxAppConfig();
        expect(config.iconServer).toBeUndefined();
        expect(config.routeIcons).toBe('https://engeapp.com.br/api/icons');
        expect(config.routeIconsSync).toBe('https://engeapp.com.br/api/icons');

        const capturedUrlsDefault: string[] = [];
        vi.stubGlobal('fetch', vi.fn((input: any) => {
            capturedUrlsDefault.push(String(input));
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ 'icon-default': validSvg }),
                text: () => Promise.resolve(validSvg)
            });
        }));

        pinia = createPinia();
        setActivePinia(pinia);
        store = useIconStore();
        store.getIcon('icon-default');
        await new Promise((r) => setTimeout(r, 250));

        expect(capturedUrlsDefault.some((u) => u.includes('https://engeapp.com.br/api/icons'))).toBe(true);

        // Limpeza final de configuração
        resetMaxAppConfig();
    });
});
