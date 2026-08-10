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

// Mock do getComputedStyle para testes de getColorFromVar.
// Repassa display/visibility/opacity do style inline real do elemento, para que
// utilitários como wrapper.isVisible() do @vue/test-utils (usado com v-show) funcionem.
Object.defineProperty(globalThis, 'getComputedStyle', {
    value: vi.fn((element?: HTMLElement) => ({
        display: element?.style?.display || '',
        visibility: element?.style?.visibility || '',
        opacity: element?.style?.opacity || '',
        getPropertyValue: vi.fn((prop: string) => {
            const cssVars: Record<string, string> = {
                '--blue-500': '#3b82f6',
                '--red-500': '#ef4444',
                '--green-500': '#22c55e',
                '--orange-600': '#ea580c',
                '--background-0': '#ffffff',
                '--gray-300': '#d1d5db'
            };
            if (!(prop in cssVars)) console.warn(`[tests/setup] getComputedStyle: variável CSS desconhecida "${prop}" retornando string vazia — considere adicioná-la ao mock`);

            return cssVars[prop] ?? '';
        })
    }))
});

// Mock global do fetch para testes de useIconStore.
// Sempre resolve com sucesso por padrão — testes que precisam exercitar caminhos de
// erro (ex.: tests/stores/useIcon.Store.test.ts) devem sobrescrever localmente com
// vi.spyOn(globalThis, 'fetch').mockRejectedValue(...) ou .mockResolvedValue({ ok: false, ... }).
globalThis.fetch = vi.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({}),
        ok: true,
        status: 200
    } as Response)
);

// Mock mínimo do indexedDB para componentes que usam cache via IDB (getCachedApiIDB).
// LIMITAÇÃO CONHECIDA: este mock nunca dispara onsuccess/onerror/onupgradeneeded — qualquer
// código que aguarde um desses callbacks para resolver fica pendurado indefinidamente, e
// nenhum teste vai perceber isso automaticamente (a promise/callback nunca é chamada, então
// o teste que depende dela para completar simplesmente não avança). Testes que precisam
// validar de verdade o caminho de sucesso/erro do IndexedDB devem criar um mock local mais
// completo naquele arquivo de teste (ex.: disparando request.onsuccess manualmente via
// setTimeout/queueMicrotask, ou usando fake timers) — não depender deste mock global para isso.
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

// Stubs globais para componentes que dependem de diretivas externas.
// Intencionalmente stubadas como objetos vazios (no-op) para simplicidade da maioria dos
// testes — nenhuma formatação de máscara real nem tooltip real acontece com esses stubs.
// Testes que precisam validar o comportamento REAL da máscara (Maska) devem importar
// `vMaska` de 'maska/vue' e registrá-la localmente no mount(), sem alterar este stub global:
//   import { vMaska } from 'maska/vue';
//   mount(Componente, { global: { directives: { maska: vMaska } } });
config.global.directives = {
    tooltip: {},
    maska: {}
};
