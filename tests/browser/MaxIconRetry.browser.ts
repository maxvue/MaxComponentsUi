import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createApp, h, ref, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxIcon from '../../src/components/MaxIcon.vue';
import MaxButton from '../../src/components/MaxButton.vue';
import '../../src/themes/all.scss';

let app: App | undefined;
let host: HTMLElement | undefined;
let originalFetch: typeof globalThis.fetch;

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

beforeEach(() => {
    originalFetch = globalThis.fetch;
});

afterEach(() => {
    app?.unmount();
    host?.remove();
    app = undefined;
    host = undefined;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
});

describe('MaxIcon retry e esgotamento no navegador real (Chromium)', () => {
    it('estabiliza ícone ausente em estado terminal após 4 ciclos com log único e mantém página interativa', async () => {
        let principalCalls = 0;
        let fallbackCalls = 0;
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
            const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as any)?.url ?? '';

            // Sincronização POST
            if (init?.method === 'POST') return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true })
            } as unknown as Response);

            // Fallback do Iconify para o ícone ausente -> 404
            if (urlStr.includes('api.iconify.design') && (urlStr.includes('iconmind%3Alog-level-duotone-thin') || urlStr.includes('iconmind:log-level-duotone-thin'))) {
                fallbackCalls++;
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    text: () => Promise.resolve('')
                } as unknown as Response);
            }

            // Fallback do Iconify para o ícone válido
            if (urlStr.includes('api.iconify.design') && (urlStr.includes('mdi%3Acheck') || urlStr.includes('mdi:check'))) return Promise.resolve({
                ok: true,
                status: 200,
                text: () => Promise.resolve('<svg id="valid-fallback-svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>')
            } as unknown as Response);

            // Rota principal para ícone ausente
            if (urlStr.includes('icons') && (urlStr.includes('iconmind%3Alog-level-duotone-thin') || urlStr.includes('iconmind:log-level-duotone-thin'))) {
                principalCalls++;
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ 'iconmind:log-level-duotone-thin': null })
                } as unknown as Response);
            }

            // Rota principal para ícone válido
            if (urlStr.includes('icons') && (urlStr.includes('mdi%3Acheck') || urlStr.includes('mdi:check'))) return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ 'mdi:check': '<svg id="valid-svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>' })
            } as unknown as Response);

            return originalFetch ? originalFetch(input, init) : Promise.reject(new Error('fetch not available'));
        };

        const clickCount = ref(0);
        const secondIcon = ref<string | null>(null);

        host = document.createElement('div');
        host.id = 'browser-test-host';
        host.style.cssText = 'padding: 16px; display: flex; flex-direction: column; gap: 12px;';
        document.body.append(host);

        app = createApp({
            setup() {
                return { clickCount, secondIcon };
            },
            render() {
                return h('div', { style: 'display: flex; flex-direction: column; gap: 8px;' }, [
                    // Múltiplas instâncias do ícone problemático simultâneas
                    h(MaxIcon, { icon: 'iconmind:log-level-duotone-thin', 'data-testid': 'icon-1' }),
                    h(MaxIcon, { icon: 'iconmind:log-level-duotone-thin', 'data-testid': 'icon-2' }),
                    h(MaxIcon, { icon: 'iconmind:log-level-duotone-thin', 'data-testid': 'icon-3' }),
                    // Botão para verificação de interatividade
                    h(MaxButton, {
                        label: `Cliques: ${clickCount.value}`,
                        'data-testid': 'test-button',
                        onClick: () => {
                            clickCount.value++;
                        }
                    }),
                    // Campo de texto nativo para checar digitação
                    h('input', {
                        id: 'test-input',
                        'data-testid': 'test-input',
                        placeholder: 'Digite aqui'
                    }),
                    // Segundo ícone que será montado posteriormente
                    secondIcon.value ? h(MaxIcon, { icon: secondIcon.value, 'data-testid': 'icon-valid' }) : null
                ]);
            }
        });

        app.use(createPinia());
        app.directive('tooltip', {});
        app.mount(host);

        await nextFrame();
        await nextFrame();

        // Aguarda os ciclos com debounce e retries limitados assentarem (4 ciclos de ~50ms + rede local)
        await delay(800);

        // 1. Confirma que o número de tentativas não explodiu e que o erro de console foi emitido uma única vez
        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith('Erro na obtenção do ícone', 'iconmind:log-level-duotone-thin');
        expect(principalCalls).toBe(4);
        expect(fallbackCalls).toBe(4);

        // 2. Comprova que a interface permaneceu 100% interativa: clique no botão funciona
        const btn = host.querySelector<HTMLButtonElement>('[data-testid="test-button"]')!;
        expect(btn).toBeDefined();
        await userEvent.click(btn);
        await nextFrame();
        expect(clickCount.value).toBe(1);

        // 3. Comprova que a digitação no input funciona normalmente
        const input = host.querySelector<HTMLInputElement>('[data-testid="test-input"]')!;
        expect(input).toBeDefined();
        await userEvent.type(input, 'MaxComponentsUi');
        expect(input.value).toBe('MaxComponentsUi');

        // 4. Remonta e solicita outro ícone válido independente
        secondIcon.value = 'mdi:check';
        await nextFrame();
        await delay(400);

        const validIconEl = host.querySelector('[data-testid="icon-valid"]');
        expect(validIconEl).toBeDefined();
        expect(validIconEl?.innerHTML).toContain('<svg');

        // 5. Garante que nenhuma chamada nova para o ícone esgotado ocorreu
        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(principalCalls).toBe(4);
        expect(fallbackCalls).toBe(4);
    });
});
