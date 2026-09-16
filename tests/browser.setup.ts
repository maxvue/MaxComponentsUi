// Setup para execução de testes em Browser real (Chromium)
import { initConsolePolicy } from './helpers/consolePolicy';

initConsolePolicy();

if (typeof (globalThis as any).Ziggy === 'undefined') (globalThis as any).Ziggy = {
    url: 'http://localhost',
    port: null,
    defaults: {},
    routes: {}
};

// Em Vitest Browser Mode, o runner executa testes dentro de um iframe.
// O CDP Emulation.setPageScaleFactor aplica o zoom no top-level document (window.top).
// Propagamos a escala do visualViewport do top-level para o iframe de teste.
if (typeof window !== 'undefined' && typeof VisualViewport !== 'undefined' && window.top && window !== window.top) {
    try {
        Object.defineProperty(VisualViewport.prototype, 'scale', {
            get() {
                return window.top?.visualViewport?.scale ?? 1;
            },
            configurable: true
        });
    } catch {
        // Fallback silencioso se não for redefinível
    }
}


// Mock do fetch para ícones para evitar requisições de rede involuntárias
const dummySvg = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
const originalFetch = globalThis.fetch;
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
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
    return originalFetch ? originalFetch(input, init) : Promise.reject(new Error('fetch not available'));
};
