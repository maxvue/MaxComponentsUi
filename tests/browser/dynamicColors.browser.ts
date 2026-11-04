import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import MaxApp from '../../src/components/MaxApp.vue';
import { useColorsStore } from '../../src/stores/useColors.Store';
import { DEFAULT_BASE_COLORS } from '../../src/types/colors';
import '../../src/themes/all.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitTicks(count = 2): Promise<void> {
    for (let i = 0; i < count; i++) await nextFrame();
}

describe('Dynamic Colors Browser Suite', () => {
    beforeEach(() => {
        document.documentElement.classList.remove('dark');
        const styleEl = document.getElementById('max-dynamic-colors');
        if (styleEl) styleEl.remove();
        localStorage.clear();
    });

    afterEach(() => {
        if (activeApp) {
            activeApp.unmount();
            activeApp = null;
        }
        if (hostElement) {
            hostElement.remove();
            hostElement = null;
        }
        document.documentElement.classList.remove('dark');
        const styleEl = document.getElementById('max-dynamic-colors');
        if (styleEl) styleEl.remove();
        localStorage.clear();
    });

    it('computa variáveis de cores no DOM real do navegador e suporta alternância claro/escuro', async () => {
        const pinia = createPinia();
        setActivePinia(pinia);

        const colorsStore = useColorsStore();
        colorsStore.setColors();
        await waitTicks(2);

        const rootStyle = window.getComputedStyle(document.documentElement);
        const pinkVal = rootStyle.getPropertyValue('--pink').trim().toUpperCase();
        expect(pinkVal).toBe(DEFAULT_BASE_COLORS.pink.toUpperCase());

        const textVal = rootStyle.getPropertyValue('--text').trim().toUpperCase();
        expect(textVal).toBe(DEFAULT_BASE_COLORS.text.toUpperCase());

        const borderVal = rootStyle.getPropertyValue('--border').trim().toUpperCase();
        expect(borderVal).toBe(DEFAULT_BASE_COLORS.border.toUpperCase());

        const pink0 = rootStyle.getPropertyValue('--pink-0').trim().toUpperCase();
        expect(pink0).toBe('#FFFFFF');

        // Alterna para dark mode
        document.documentElement.classList.add('dark');
        await waitTicks(2);

        const darkStyle = window.getComputedStyle(document.documentElement);
        // No dark mode, --pink-850 deve corresponder ao valor de --pink-0 do light (#FFFFFF)
        const darkPink850 = darkStyle.getPropertyValue('--pink-850').trim().toUpperCase();
        expect(darkPink850).toBe('#FFFFFF');
    });

    it('atualiza as variáveis computadas no navegador ao passar a prop colors no MaxApp', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const pinia = createPinia();
        setActivePinia(pinia);

        const router = createRouter({
            history: createMemoryHistory(),
            routes: [{ path: '/', name: 'home', component: { template: '<div>Home</div>' } }]
        });
        await router.push('/');

        const app = createApp({
            render() {
                return h(MaxApp, {
                    freeMode: true,
                    colors: {
                        pink: '#334455',
                        blue: '#667788'
                    }
                });
            }
        });

        app.use(pinia);
        app.use(router);
        app.mount(hostElement);
        activeApp = app;

        await waitTicks(3);

        const rootStyle = window.getComputedStyle(document.documentElement);
        expect(rootStyle.getPropertyValue('--pink').trim().toUpperCase()).toBe('#334455');
        expect(rootStyle.getPropertyValue('--blue').trim().toUpperCase()).toBe('#667788');
    });
});
