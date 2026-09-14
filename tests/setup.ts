/**
 * Arquivo de setup global para o Vitest.
 * Configura mocks necessários para o ambiente de testes (localStorage, fetch, Pinia, router, etc.).
 * Implementa política rigorosa contra warnings e erros não tratados no console.
 */
import { vi, beforeEach, afterEach } from 'vitest';
import { config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MaxLoaderIcon from '../src/components/MaxLoaderIcon.vue';

// Mock do módulo virtual:uno.css (importado no index.ts)
vi.mock('virtual:uno.css', () => ({}));

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

if (typeof globalThis.HTMLInputElement === 'undefined') globalThis.HTMLInputElement = (globalThis.window?.HTMLInputElement ?? class HTMLInputElement {}) as any;

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock global do Ziggy para suporte a rotas nomeadas via @maxvue/max-use
if (typeof (globalThis as any).Ziggy === 'undefined') (globalThis as any).Ziggy = {
    url: 'http://localhost',
    port: null,
    defaults: {},
    routes: {
        menus: { uri: 'api/menus', methods: ['GET'] }
    }
};

// Mock do getComputedStyle para testes de getColorFromVar e wrappers do VTU.
Object.defineProperty(globalThis, 'getComputedStyle', {
    value: vi.fn((element?: HTMLElement) => ({
        display: element?.style?.display || '',
        visibility: element?.style?.visibility || '',
        opacity: element?.style?.opacity || '',
        getPropertyValue: vi.fn((prop: string) => {
            const cssVars: Record<string, string> = {
                '--blue-500': '#3b82f6',
                '--blue-600': '#2563eb',
                '--red-500': '#ef4444',
                '--green-500': '#22c55e',
                '--orange-600': '#ea580c',
                '--background-0': '#ffffff',
                '--background-50': '#f8fafc',
                '--background-100': '#f1f5f9',
                '--background-200': '#e2e8f0',
                '--background-300': '#cbd5e1',
                '--background-400': '#94a3b8',
                '--background-500': '#64748b',
                '--background-600': '#475569',
                '--background-700': '#334155',
                '--background-800': '#1e293b',
                '--background-900': '#0f172a',
                '--max-primary-500': '#00768e',
                '--max-primary-600': '#005f77',
                '--max-primary-400': '#178da5',
                '--gray-300': '#d1d5db'
            };

            return cssVars[prop] ?? '';
        })
    }))
});

// Mock global do fetch para testes de useIconStore e ícones do sistema.
const dummySvg = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
const createDefaultFetch = () => vi.fn((input: RequestInfo | URL) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as any)?.url ?? '';

    if (urlStr && urlStr.includes('icons')) {
        const result: Record<string, string> = {};
        try {
            const parsed = new URL(urlStr, 'http://localhost');
            const icons = parsed.searchParams.getAll('icons[]');
            for (const icon of icons) result[icon] = dummySvg;
        } catch {
            // fallback se url não for parseável
        }

        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(result),
            text: () => Promise.resolve(dummySvg)
        } as unknown as Response);
    }

    return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(dummySvg)
    } as unknown as Response);
});

globalThis.fetch = createDefaultFetch();

// Inicialização determinística do IndexedDB em memória para testes
import { createFreshIndexedDB } from './helpers/indexedDbTestUtils';
if (typeof (globalThis as any).indexedDB === 'undefined' || !(globalThis as any).indexedDB.open) (globalThis as any).indexedDB = createFreshIndexedDB();

// Componentes globais do design system
config.global.components = {
    MaxIcon: {
        name: 'MaxIcon',
        props: ['icon', 'i', 'size', 'dark', 'light', 'color', 'iconColor', 'hoverColor', 'plus', 'checked', 'rotate', 'flip', 'tooltip'],
        template: '<span class="max-icon-stub" :data-icon="icon || i" />'
    },
    LoaderIcon: MaxLoaderIcon,
    MaxLoaderIcon
};

// Router mock para injeção via useRouter() / useRoute()
const dummyRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    hasRoute: vi.fn(() => false),
    currentRoute: { value: { path: '/', name: undefined, params: {}, query: {}, hash: '', fullPath: '/', matched: [] } }
};
const dummyRoute = { path: '/', name: undefined, params: {}, query: {}, hash: '', fullPath: '/', matched: [] };

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal<Record<string, any>>();
    const { hasInjectionContext, inject } = await import('vue');
    return {
        ...actual,
        useRoute: () => {
            if (hasInjectionContext()) {
                const injected = inject(actual.routeLocationKey, dummyRoute);
                return injected ?? dummyRoute;
            }
            return dummyRoute;
        },
        useRouter: () => {
            if (hasInjectionContext()) {
                const injected = inject(actual.routerKey, dummyRouter);
                return injected ?? dummyRouter;
            }
            return dummyRouter;
        }
    };
});

// Plugins globais: mantido vazio para que testes que fornecem seu próprio Pinia
// via `global.plugins` não emitam avisos de plugin duplicado ou Symbol(pinia) sobrescrito.
// Cada teste recebe um setActivePinia(createPinia()) isolado no beforeEach.
config.global.plugins = [];

// Stubs globais de diretivas
config.global.directives = {
    tooltip: {},
    maska: {}
};

// Captura e verificação de warnings e erros não tratados
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

let unhandledWarnings: string[] = [];
let unhandledErrors: string[] = [];

console.warn = (...args: any[]) => {
    if (!vi.isMockFunction(console.warn)) {
        const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        unhandledWarnings.push(msg);
    }
    originalConsoleWarn(...args);
};

console.error = (...args: any[]) => {
    if (!vi.isMockFunction(console.error)) {
        const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        unhandledErrors.push(msg);
    }
    originalConsoleError(...args);
};

beforeEach(() => {
    unhandledWarnings = [];
    unhandledErrors = [];
    globalThis.fetch = createDefaultFetch();
    setActivePinia(createPinia());
});

afterEach(() => {
    const hasWarnSpy = vi.isMockFunction(console.warn);
    const hasErrorSpy = vi.isMockFunction(console.error);

    const warnings = hasWarnSpy ? [] : [...unhandledWarnings];
    const errors = hasErrorSpy ? [] : [...unhandledErrors];

    unhandledWarnings = [];
    unhandledErrors = [];

    if (warnings.length > 0) throw new Error(`[tests/setup] Teste emitiu console.warn inesperado:\n${warnings.join('\n')}`);

    if (errors.length > 0) throw new Error(`[tests/setup] Teste emitiu console.error inesperado:\n${errors.join('\n')}`);
});
