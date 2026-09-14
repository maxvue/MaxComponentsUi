// Setup para execução de testes em Browser real (Chromium)
if (typeof (globalThis as any).Ziggy === 'undefined') (globalThis as any).Ziggy = {
    url: 'http://localhost',
    port: null,
    defaults: {},
    routes: {}
};


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
