import { describe, expect, it } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import { SCENARIO_LOADERS } from '../../playground/src/scenarios';
import { configureMaxApp } from '../../src';

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

describe('R19/E10-10 — smoke do playground no Chromium', () => {
    it('carrega e monta cada cenário e seus estados reais sem avisos ou erros', async () => {
        const scenarioIds = Object.keys(SCENARIO_LOADERS);
        expect(scenarioIds).toHaveLength(36);
        Object.assign(globalThis as typeof globalThis & { Ziggy: unknown }, {
            Ziggy: {
                url: window.location.origin,
                port: null,
                defaults: {},
                routes: {
                    'playground.menus': { uri: 'playground/menus', methods: ['GET', 'HEAD'] },
                    menus: { uri: 'playground/menus', methods: ['GET', 'HEAD'] }
                }
            }
        });
        const originalFetch = globalThis.fetch;
        globalThis.fetch = ((input, init) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            if (url.endsWith('/playground/menus')) return Promise.resolve(new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
            return originalFetch(input, init);
        }) as typeof fetch;
        // Os cenários de navegação fornecem itens locais. Sem uma API de
        // demonstração, não disparamos uma chamada de menu inexistente.
        configureMaxApp({ routeMenus: undefined });

        for (const scenarioId of scenarioIds) {
            const module = await SCENARIO_LOADERS[scenarioId]();
            expect(module.default, scenarioId).toBeDefined();

            const warnings: string[] = [];
            const errors: string[] = [];
            const consoleWarnings: string[] = [];
            const consoleErrors: string[] = [];
            const originalConsoleWarn = console.warn;
            const originalConsoleError = console.error;
            console.warn = (...args) => consoleWarnings.push(args.map(String).join(' '));
            console.error = (...args) => consoleErrors.push(args.map(String).join(' '));
            const host = document.createElement('div');
            host.dataset.smokeScenario = scenarioId;
            document.body.append(host);
            const app = createApp({ render: () => h(module.default) });
            app.use(createPinia());
            app.use(createRouter({
                history: createMemoryHistory(),
                routes: [{ path: '/', name: 'playground.menus', component: { render: () => null } }]
            }));
            // O playground registra Icon via @iconify/vue. O runner da
            // biblioteca não instala essa dependência do app de demonstração,
            // então preservamos a resolução global com um render mínimo.
            app.component('Icon', { render: () => h('span') });
            app.directive('tooltip', {});
            app.config.warnHandler = (message) => warnings.push(message);
            app.config.errorHandler = (error) => errors.push(error instanceof Error ? error.message : String(error));

            try {
                app.mount(host);
                await nextTick();
                await nextFrame();
                await nextTick();

                expect(host.querySelector(`[data-scenario="${scenarioId}"]`), scenarioId).not.toBeNull();
                expect(host.querySelector(`[data-scenario="${scenarioId}"]`)?.children.length, `${scenarioId}: conteúdo real`).toBeGreaterThan(1);
                expect(warnings, `${scenarioId}: avisos do Vue`).toEqual([]);
                expect(errors, `${scenarioId}: erros de renderização`).toEqual([]);
                expect(consoleWarnings, `${scenarioId}: console.warn`).toEqual([]);
                expect(consoleErrors, `${scenarioId}: console.error`).toEqual([]);
            } finally {
                console.warn = originalConsoleWarn;
                console.error = originalConsoleError;
                app.unmount();
                host.remove();
            }
        }
        globalThis.fetch = originalFetch;
    });
});
