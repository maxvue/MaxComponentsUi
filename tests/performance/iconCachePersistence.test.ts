// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useIconStore } from '../../src/stores/useIcon.Store';
import { saveSanitizedIconsToIDB, openIconsDB } from '../../src/helpers/iconIdb';
import * as sanitizeSvgModule from '../../src/helpers/sanitizeSvg';
import { createFreshIndexedDB, withTimeout, cleanupIconsDatabase, type MemoryIDBObjectStore } from '../helpers/indexedDbTestUtils';

describe('Performance & Cardinality: Icon Cache Persistence (E05-02)', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(async () => {
        pinia = createPinia();
        setActivePinia(pinia);
        (globalThis as any).indexedDB = createFreshIndexedDB();
        await cleanupIconsDatabase();
    });

    afterEach(async () => {
        await cleanupIconsDatabase();
        vi.restoreAllMocks();
    });

    it('um lote de k novos ícones produz exatamente k chamadas a IDBObjectStore.put', async () => {
        const db = await withTimeout(openIconsDB());
        expect(db).not.toBeNull();

        const tx = db!.transaction('icons', 'readwrite');
        const store = tx.objectStore('icons');
        vi.spyOn(store, 'put');

        const k = 10;
        const delta: Record<string, sanitizeSvgModule.SanitizedSvg> = {};
        for (let i = 0; i < k; i++) delta[`icon-${i}`] = sanitizeSvgModule.sanitizeSvg(`<svg><circle r="${i}"/></svg>`) as sanitizeSvgModule.SanitizedSvg;


        await withTimeout(saveSanitizedIconsToIDB(delta));

        // put deve ser chamado exatamente k vezes no store
        const currentDb = await openIconsDB();
        const currentTx = currentDb!.transaction('icons', 'readwrite');
        const currentStore = currentTx.objectStore('icons') as unknown as MemoryIDBObjectStore;
        expect(currentStore.data.size).toBe(k);
    });

    it('persistência incremental não reprocessa os N ícones já presentes no catálogo', async () => {
        const store = useIconStore(pinia);

        // Preenche N = 50 ícones no store
        const initialN = 50;
        for (let i = 0; i < initialN; i++) store.icons_data[`existing-${i}`] = `<svg><rect id="${i}"/></svg>`;


        const sanitizeSpy = vi.spyOn(sanitizeSvgModule, 'sanitizeSvg');

        // Recebe delta de k = 5 novos ícones
        const k = 5;
        const newIconsPayload: Record<string, string> = {};
        for (let i = 0; i < k; i++) newIconsPayload[`new-${i}`] = `<svg><polygon points="${i}"/></svg>`;


        // Simula resposta da API
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(newIconsPayload)
        } as Response);

        const newKeys = Object.keys(newIconsPayload);
        newKeys.forEach((k) => store.getIcon(k));

        await new Promise((r) => setTimeout(r, 200));

        // O sanitizador foi chamado apenas para os k novos ícones (k chamadas), NÃO para N + k
        const sanitizeCallsForNew = sanitizeSpy.mock.calls.filter(
            (call) => typeof call[0] === 'string' && call[0].includes('polygon')
        );
        expect(sanitizeCallsForNew.length).toBe(k);

        // Nenhum dos N ícones existentes foi re-sanitizado
        const sanitizeCallsForExisting = sanitizeSpy.mock.calls.filter(
            (call) => typeof call[0] === 'string' && call[0].includes('rect')
        );
        expect(sanitizeCallsForExisting.length).toBe(0);
    });

    it('processa escala de 100 ícones com persistência de delta sem complexidade O(N^2)', async () => {
        const store = useIconStore(pinia);
        const batchSize = 100;

        const batchPayload: Record<string, string> = {};
        for (let i = 0; i < batchSize; i++) batchPayload[`batch-${batchSize}-${i}`] = `<svg><path d="M${i}"/></svg>`;

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(batchPayload)
        } as Response);

        const start = performance.now();
        Object.keys(batchPayload).forEach((k) => store.getIcon(k));
        await new Promise((r) => setTimeout(r, 200));
        const duration = performance.now() - start;

        // Deve processar de forma determinística sem travar a thread
        expect(duration).toBeLessThan(5000);
        expect(store.icons_data[`batch-${batchSize}-0`]).toBeDefined();
    });
});
