/**
 * Arquivo de setup global para o Vitest.
 * Configura mocks necessários para o ambiente de testes (localStorage, fetch, PrimeVue, etc.).
 */
import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';

// Mock do localStorage para testes que utilizam cache
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
    };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock do getComputedStyle para testes de getColorFromVar
Object.defineProperty(globalThis, 'getComputedStyle', {
    value: vi.fn(() => ({
        getPropertyValue: vi.fn((prop: string) => {
            const cssVars: Record<string, string> = {
                '--blue-500': '#3b82f6',
                '--red-500': '#ef4444',
                '--green-500': '#22c55e',
                '--orange-600': '#ea580c',
                '--background-0': '#ffffff',
                '--gray-300': '#d1d5db'
            };
            return cssVars[prop] ?? '';
        })
    }))
});

// Mock global do fetch para testes de useIconStore
globalThis.fetch = vi.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({}),
        ok: true,
        status: 200
    } as Response)
);

// Mock mínimo do indexedDB para componentes que usam cache via IDB (getCachedApiIDB)
if (typeof globalThis.indexedDB === 'undefined') {
    const request: any = {
        result: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
    };
    Object.defineProperty(globalThis, 'indexedDB', {
        configurable: true,
        value: {
            open: vi.fn(() => request),
            deleteDatabase: vi.fn(() => request)
        }
    });
}

// Mock do módulo virtual:uno.css (importado no index.ts)
vi.mock('virtual:uno.css', () => ({}));

// Configuração global do Vue Test Utils com PrimeVue + Pinia
config.global.plugins = [
    createPinia(),
    [PrimeVue, { ripple: false }]
];

// Stubs globais para componentes que dependem de diretivas externas
config.global.directives = {
    tooltip: {},
    maska: {}
};
