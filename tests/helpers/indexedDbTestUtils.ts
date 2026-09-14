import { resetIconsIDBConnection } from '../../src/helpers/iconIdb';

export class MemoryIDBObjectStore {
    name: string;
    keyPath: string;
    data = new Map<string, any>();

    constructor(name: string, keyPath = 'name') {
        this.name = name;
        this.keyPath = keyPath;
    }

    getAll(): any {
        const req: any = {
            result: Array.from(this.data.values()),
            onsuccess: null,
            onerror: null
        };
        queueMicrotask(() => {
            if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
        });
        return req;
    }

    put(value: any): any {
        const key = value[this.keyPath];
        this.data.set(key, value);
        const req: any = {
            result: key,
            onsuccess: null,
            onerror: null
        };
        queueMicrotask(() => {
            if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
        });
        return req;
    }

    clear(): any {
        this.data.clear();
        const req: any = {
            result: undefined,
            onsuccess: null,
            onerror: null
        };
        queueMicrotask(() => {
            if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
        });
        return req;
    }

    count(): any {
        const req: any = {
            result: this.data.size,
            onsuccess: null,
            onerror: null
        };
        queueMicrotask(() => {
            if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
        });
        return req;
    }
}

export class MemoryIDBTransaction {
    db: MemoryIDBDatabase;
    mode: IDBTransactionMode;
    storeNames: string[];
    oncomplete: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onabort: ((event: any) => void) | null = null;

    constructor(db: MemoryIDBDatabase, storeNames: string | string[], mode: IDBTransactionMode) {
        this.db = db;
        this.storeNames = Array.isArray(storeNames) ? storeNames : [storeNames];
        this.mode = mode;

        queueMicrotask(() => {
            if (typeof this.oncomplete === 'function') this.oncomplete({ target: this });
        });
    }

    objectStore(name: string): MemoryIDBObjectStore {
        const store = this.db.stores.get(name);
        if (!store) throw new Error(`NotFoundError: The specified object store was not found: ${name}`);
        return store;
    }
}

export class MemoryIDBDatabase {
    name: string;
    version: number;
    stores: Map<string, MemoryIDBObjectStore>;
    onclose: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;

    constructor(name: string, version = 1, stores = new Map<string, MemoryIDBObjectStore>()) {
        this.name = name;
        this.version = version;
        this.stores = stores;
    }

    get objectStoreNames() {
        const names = Array.from(this.stores.keys());
        return {
            contains: (name: string) => names.includes(name),
            item: (index: number) => names[index] ?? null,
            get length() { return names.length; },
            [Symbol.iterator]: function* () { yield* names; }
        };
    }

    createObjectStore(name: string, options?: { keyPath?: string }): MemoryIDBObjectStore {
        const store = new MemoryIDBObjectStore(name, options?.keyPath ?? 'name');
        this.stores.set(name, store);
        return store;
    }

    transaction(storeNames: string | string[], mode: IDBTransactionMode = 'readonly'): MemoryIDBTransaction {
        return new MemoryIDBTransaction(this, storeNames, mode);
    }

    close(): void {
        if (typeof this.onclose === 'function') this.onclose({ target: this });
    }
}

export class MemoryIDBFactory {
    databases = new Map<string, { version: number; stores: Map<string, MemoryIDBObjectStore> }>();

    open(name: string, version = 1): any {
        let entry = this.databases.get(name);
        const isUpgrade = !entry || entry.version < version;
        if (!entry) {
            entry = { version, stores: new Map() };
            this.databases.set(name, entry);
        } else if (isUpgrade) entry.version = version;


        const conn = new MemoryIDBDatabase(name, entry.version, entry.stores);

        const req: any = {
            result: conn,
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null,
            onblocked: null
        };

        queueMicrotask(() => {
            if (isUpgrade && typeof req.onupgradeneeded === 'function') req.onupgradeneeded({ target: req });
            if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
        });

        return req;
    }

    deleteDatabase(name: string): any {
        this.databases.delete(name);
        const req: any = {
            result: undefined,
            onsuccess: null,
            onerror: null,
            onblocked: null
        };
        queueMicrotask(() => {
            if (typeof req.onsuccess === 'function') req.onsuccess({ target: req });
        });
        return req;
    }
}

/**
 * Cria uma nova instância de MemoryIDBFactory isolada.
 */
export function createFreshIndexedDB(): MemoryIDBFactory {
    return new MemoryIDBFactory();
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

    if (typeof indexedDB !== 'undefined' && typeof indexedDB.deleteDatabase === 'function') await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(dbName);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
    });


    resetIconsIDBConnection();
}
