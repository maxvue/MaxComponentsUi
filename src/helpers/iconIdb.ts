import { sanitizeSvg } from './sanitizeSvg';

/** Nome do banco IndexedDB exclusivo para o cache de ícones */
const DB_NAME = 'max_icons_db';
/** Nome do object store */
const STORE_NAME = 'icons';
/** Versão do banco */
const DB_VERSION = 1;

export interface IconRecord {
    name: string;
    svg: string;
}

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;

/**
 * Abre (ou reutiliza) a conexão com o banco IndexedDB de ícones.
 * Degrada graciosamente em ambiente SSR ou sem suporte a IndexedDB.
 */
export function openIconsDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return Promise.resolve(null);
    if (dbInstance) return Promise.resolve(dbInstance);
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'name' });
            };

            request.onsuccess = (event) => {
                dbInstance = (event.target as IDBOpenDBRequest).result;
                dbInstance.onclose = () => {
                    dbInstance = null;
                    dbPromise = null;
                };
                dbInstance.onerror = () => {
                    dbInstance = null;
                    dbPromise = null;
                };
                resolve(dbInstance);
            };

            request.onerror = () => {
                dbPromise = null;
                resolve(null);
            };

            request.onblocked = () => {
                dbPromise = null;
                resolve(null);
            };
        } catch {
            dbPromise = null;
            resolve(null);
        }
    });

    return dbPromise;
}

/**
 * Carrega todos os ícones persistidos no IndexedDB.
 */
export async function loadAllIconsFromIDB(): Promise<Record<string, string>> {
    try {
        const db = await openIconsDB();
        if (!db) return {};

        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => {
                    const records: IconRecord[] = request.result ?? [];
                    const result: Record<string, string> = {};
                    for (const record of records) if (record?.name && record?.svg) {
                        const clean = sanitizeSvg(record.svg);
                        if (clean) result[record.name] = clean;
                    }
                    resolve(result);
                };

                request.onerror = () => resolve({});
                tx.onerror = () => resolve({});
                tx.onabort = () => resolve({});
            } catch {
                resolve({});
            }
        });
    } catch {
        return {};
    }
}

/**
 * Salva múltiplos ícones no IndexedDB de forma não-bloqueante.
 */
export async function saveIconsToIDB(icons: Record<string, string>): Promise<void> {
    try {
        const entries = Object.entries(icons).filter(([k, v]) => k && v && v !== 'waiting');
        if (entries.length === 0) return;

        const db = await openIconsDB();
        if (!db) return;

        return new Promise<void>((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);

                for (const [name, svg] of entries) {
                    const clean = sanitizeSvg(svg);
                    if (clean) store.put({ name, svg: clean });
                }

                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
                tx.onabort = () => resolve();
            } catch {
                resolve();
            }
        });
    } catch {
        // Ignora silenciosamente falhas de storage
    }
}

/**
 * Salva um único ícone no IndexedDB.
 */
export async function saveIconToIDB(name: string, svg: string): Promise<void> {
    if (!name || !svg || svg === 'waiting') return;
    await saveIconsToIDB({ [name]: svg });
}

/**
 * Limpa todos os ícones do IndexedDB.
 */
export async function clearIconsIDB(): Promise<void> {
    try {
        const db = await openIconsDB();
        if (!db) return;

        return new Promise<void>((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.clear();
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
                tx.onabort = () => resolve();
            } catch {
                resolve();
            }
        });
    } catch {
        // Ignora silenciosamente
    }
}

/**
 * Reseta a conexão memoizada com o IndexedDB (usado principalmente em testes).
 */
export function resetIconsIDBConnection(): void {
    if (dbInstance) {
        try {
            dbInstance.close();
        } catch {}
        dbInstance = null;
    }
    dbPromise = null;
}
