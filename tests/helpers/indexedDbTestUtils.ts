import { IDBFactory } from 'fake-indexeddb';
import { resetIconsIDBConnection } from '../../src/helpers/iconIdb';

/**
 * Cria uma nova instância de IDBFactory completamente isolada em memória.
 */
export function createFreshIndexedDB(): IDBFactory {
    return new IDBFactory();
}

/**
 * Executa uma promise com timeout estrito para prevenir testes pendurados.
 */
export function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs = 1000,
    errorMsg = 'Operação IndexedDB expirou'
): Promise<T> {
    let timer: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`${errorMsg} (${timeoutMs}ms)`));
        }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timer);
    });
}

/**
 * Exclui um banco de dados IndexedDB e reseta a conexão do helper iconIdb.
 */
export async function cleanupIconsDatabase(dbName = 'max_icons_db'): Promise<void> {
    resetIconsIDBConnection();

    if (typeof indexedDB !== 'undefined' && typeof indexedDB.deleteDatabase === 'function') {
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(dbName);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
    }

    resetIconsIDBConnection();
}
