// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    openIconsDB,
    loadAllIconsFromIDB,
    saveIconsToIDB,
    saveSanitizedIconsToIDB,
    saveIconToIDB,
    clearIconsIDB,
    resetIconsIDBConnection
} from '../../src/helpers/iconIdb';
import { sanitizeSvg, type SanitizedSvg } from '../../src/helpers/sanitizeSvg';
import { withTimeout, cleanupIconsDatabase } from './indexedDbTestUtils';

describe('iconIdb helper com IndexedDB real', () => {
    beforeEach(async () => {
        await cleanupIconsDatabase();
    });

    afterEach(async () => {
        await cleanupIconsDatabase();
        vi.restoreAllMocks();
    });

    it('abre a conexão e inicializa o schema com objectStore icons e keyPath name', async () => {
        const db = await withTimeout(openIconsDB());
        expect(db).not.toBeNull();
        expect(db?.objectStoreNames.contains('icons')).toBe(true);

        // Reutilização da mesma instância memoizada
        const sameDb = await withTimeout(openIconsDB());
        expect(sameDb).toBe(db);
    });

    it('grava e recupera múltiplos ícones via saveIconsToIDB', async () => {
        const payload = {
            'lucide:check': '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>',
            'lucide:x': '<svg viewBox="0 0 24 24"><path d="M18 6L6 18"/></svg>'
        };

        await withTimeout(saveIconsToIDB(payload));

        const loaded = await withTimeout(loadAllIconsFromIDB());
        expect(Object.keys(loaded)).toHaveLength(2);
        expect(loaded['lucide:check']).toContain('<svg');
        expect(loaded['lucide:x']).toContain('<svg');
    });

    it('grava diretamente ícones já sanitizados via saveSanitizedIconsToIDB (O(k))', async () => {
        const cleanSvg = sanitizeSvg('<svg><circle cx="12" cy="12" r="10"/></svg>') as SanitizedSvg;
        const delta: Record<string, SanitizedSvg> = {
            'custom:circle': cleanSvg
        };

        await withTimeout(saveSanitizedIconsToIDB(delta));

        const loaded = await withTimeout(loadAllIconsFromIDB());
        expect(loaded['custom:circle']).toBe(cleanSvg);
    });

    it('grava um único ícone via saveIconToIDB', async () => {
        const svg = '<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';
        await withTimeout(saveIconToIDB('icon-single', svg));

        const loaded = await withTimeout(loadAllIconsFromIDB());
        expect(loaded['icon-single']).toContain('<rect');
    });

    it('sobrescreve registros existentes pela mesma chave name', async () => {
        await withTimeout(saveIconToIDB('icon-test', '<svg><circle r="5"/></svg>'));
        await withTimeout(saveIconToIDB('icon-test', '<svg><rect width="20"/></svg>'));

        const loaded = await withTimeout(loadAllIconsFromIDB());
        expect(loaded['icon-test']).toContain('<rect');
    });

    it('sanitiza e descarta SVGs maliciosos ao carregar do IndexedDB', async () => {
        const db = await withTimeout(openIconsDB());
        expect(db).not.toBeNull();

        // Injeta diretamente registro malicioso contendo script e registro não-SVG no store
        await new Promise<void>((resolve) => {
            const tx = db!.transaction('icons', 'readwrite');
            const store = tx.objectStore('icons');
            store.put({
                name: 'xss-icon',
                svg: '<script>alert(1)</script>'
            });
            store.put({
                name: 'sanitized-icon',
                svg: '<svg><script>alert(1)</script><circle cx="1" cy="1" r="1"/></svg>'
            });
            tx.oncomplete = () => resolve();
        });

        const loaded = await withTimeout(loadAllIconsFromIDB());
        expect(loaded['xss-icon']).toBeUndefined();
        expect(loaded['sanitized-icon']).toBeDefined();
        expect(loaded['sanitized-icon']).not.toContain('<script');
        expect(loaded['sanitized-icon']).toContain('<circle');
    });

    it('limpa todos os ícones via clearIconsIDB', async () => {
        await withTimeout(saveIconToIDB('i-1', '<svg><circle/></svg>'));
        await withTimeout(saveIconToIDB('i-2', '<svg><circle/></svg>'));

        let loaded = await withTimeout(loadAllIconsFromIDB());
        expect(Object.keys(loaded)).toHaveLength(2);

        await withTimeout(clearIconsIDB());

        loaded = await withTimeout(loadAllIconsFromIDB());
        expect(Object.keys(loaded)).toHaveLength(0);
    });

    it('ignora gravações vazias ou sentinelas waiting', async () => {
        await expect(withTimeout(saveIconsToIDB({}))).resolves.toBeUndefined();
        await expect(withTimeout(saveIconsToIDB({ 'icon-w': 'waiting' }))).resolves.toBeUndefined();
        await expect(withTimeout(saveIconToIDB('', '<svg/>'))).resolves.toBeUndefined();
        await expect(withTimeout(saveIconToIDB('icon-w', 'waiting'))).resolves.toBeUndefined();

        const loaded = await withTimeout(loadAllIconsFromIDB());
        expect(Object.keys(loaded)).toHaveLength(0);
    });

    it('fecha conexão e permite reabertura através de resetIconsIDBConnection', async () => {
        const db1 = await withTimeout(openIconsDB());
        expect(db1).not.toBeNull();

        resetIconsIDBConnection();

        const db2 = await withTimeout(openIconsDB());
        expect(db2).not.toBeNull();
        expect(db2).not.toBe(db1);
    });

    it('degrada graciosamente em ambiente SSR (sem indexedDB)', async () => {
        const originalIDB = globalThis.indexedDB;
        delete (globalThis as any).indexedDB;

        try {
            const db = await openIconsDB();
            expect(db).toBeNull();

            const icons = await loadAllIconsFromIDB();
            expect(icons).toEqual({});

            await expect(saveIconsToIDB({ 'icon-a': '<svg/>' })).resolves.toBeUndefined();
            await expect(saveSanitizedIconsToIDB({})).resolves.toBeUndefined();
            await expect(saveIconToIDB('icon-a', '<svg/>')).resolves.toBeUndefined();
            await expect(clearIconsIDB()).resolves.toBeUndefined();
        } finally {
            globalThis.indexedDB = originalIDB;
        }
    });

    it('trata erro de abertura sem propagar exceção não tratada', async () => {
        const originalIDB = globalThis.indexedDB;
        globalThis.indexedDB = {
            open: () => {
                throw new Error('IndexedDB blocked');
            }
        } as any;

        try {
            resetIconsIDBConnection();
            const db = await withTimeout(openIconsDB());
            expect(db).toBeNull();

            const icons = await withTimeout(loadAllIconsFromIDB());
            expect(icons).toEqual({});

            await expect(withTimeout(saveIconsToIDB({ 'icon-err': '<svg/>' }))).resolves.toBeUndefined();
            await expect(withTimeout(clearIconsIDB())).resolves.toBeUndefined();
        } finally {
            globalThis.indexedDB = originalIDB;
            resetIconsIDBConnection();
        }
    });

    it('trata request.onerror e request.onblocked na abertura', async () => {
        const originalIDB = globalThis.indexedDB;
        try {
            // Simula onerror
            globalThis.indexedDB = {
                open: () => {
                    const req: any = {};
                    setTimeout(() => {
                        if (req.onerror) req.onerror(new Event('error'));
                    }, 0);
                    return req;
                }
            } as any;

            resetIconsIDBConnection();
            let db = await withTimeout(openIconsDB());
            expect(db).toBeNull();

            // Simula onblocked
            globalThis.indexedDB = {
                open: () => {
                    const req: any = {};
                    setTimeout(() => {
                        if (req.onblocked) req.onblocked(new Event('blocked'));
                    }, 0);
                    return req;
                }
            } as any;

            resetIconsIDBConnection();
            db = await withTimeout(openIconsDB());
            expect(db).toBeNull();
        } finally {
            globalThis.indexedDB = originalIDB;
            resetIconsIDBConnection();
        }
    });

    it('trata falha de transação em saveSanitizedIconsToIDB e clearIconsIDB', async () => {
        const cleanSvg = sanitizeSvg('<svg><circle/></svg>') as SanitizedSvg;
        const db = await withTimeout(openIconsDB());
        expect(db).not.toBeNull();

        const origTx = db!.transaction.bind(db);
        // Simula transação que aborta
        vi.spyOn(db!, 'transaction').mockImplementation((...args: any[]) => {
            const tx = origTx(...args);
            setTimeout(() => {
                if (tx.onerror) tx.onerror(new Event('error'));
                if (tx.onabort) tx.onabort(new Event('abort'));
            }, 0);
            return tx;
        });

        await expect(withTimeout(saveSanitizedIconsToIDB({ 'icon-fail': cleanSvg }))).resolves.toBeUndefined();
        await expect(withTimeout(clearIconsIDB())).resolves.toBeUndefined();
    });

    it('trata dbInstance.onerror e reseta dbInstance', async () => {
        const db = await withTimeout(openIconsDB());
        expect(db).not.toBeNull();
        if (db && (db as any).onerror) (db as any).onerror(new Event('error'));

        // Próxima chamada abre novamente
        const db2 = await withTimeout(openIconsDB());
        expect(db2).not.toBeNull();
    });
});
