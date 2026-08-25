import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    openIconsDB,
    loadAllIconsFromIDB,
    saveIconsToIDB,
    saveIconToIDB,
    clearIconsIDB,
    resetIconsIDBConnection
} from '../../src/helpers/iconIdb';

describe('iconIdb helper', () => {
    beforeEach(() => {
        resetIconsIDBConnection();
    });

    afterEach(() => {
        resetIconsIDBConnection();
        vi.restoreAllMocks();
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
            await expect(saveIconToIDB('icon-a', '<svg/>')).resolves.toBeUndefined();
            await expect(clearIconsIDB()).resolves.toBeUndefined();
        } finally {
            globalThis.indexedDB = originalIDB;
        }
    });

    it('ignora gravações com valores vazios ou \'waiting\'', async () => {
        await expect(saveIconsToIDB({})).resolves.toBeUndefined();
        await expect(saveIconsToIDB({ 'icon-w': 'waiting' })).resolves.toBeUndefined();
        await expect(saveIconToIDB('', '<svg/>')).resolves.toBeUndefined();
        await expect(saveIconToIDB('icon-w', 'waiting')).resolves.toBeUndefined();
    });

    it('trata erros de transação sem propagar exceção', async () => {
        const originalIDB = globalThis.indexedDB;
        globalThis.indexedDB = {
            open: () => {
                throw new Error('IndexedDB blocked');
            }
        } as any;

        try {
            const icons = await loadAllIconsFromIDB();
            expect(icons).toEqual({});

            await expect(saveIconsToIDB({ 'icon-err': '<svg/>' })).resolves.toBeUndefined();
            await expect(clearIconsIDB()).resolves.toBeUndefined();
        } finally {
            globalThis.indexedDB = originalIDB;
        }
    });
});
