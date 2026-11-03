import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { createApp, h, type App } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import MaxApp from '../../src/components/MaxApp.vue';
import MaxTitle1 from '../../src/components/MaxTitle1.vue';
import MaxUserSection from '../../src/components/MaxUserSection.vue';
import MaxPageLayout from '../../src/components/MaxPageLayout.vue';
import { useUserStore } from '../../src/stores/useUser.Store';
import {
    FONT_SIZE_STORAGE_KEY,
    applyHtmlFontSize,
    _resetHtmlFontSizeForTesting
} from '../../src/helpers/useHtmlFontSize';
import '../../src/themes/all.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitTicks(count = 2): Promise<void> {
    for (let i = 0; i < count; i++) await nextFrame();
}

async function mountUserSection(props: Record<string, any> = {}, viewport = { width: 1280, height: 800 }) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    await page.viewport(viewport.width, viewport.height);

    hostElement = document.createElement('div');
    hostElement.id = 'font-size-test-host';
    document.body.appendChild(hostElement);

    const pinia = createPinia();
    setActivePinia(pinia);

    const app = createApp({
        render() {
            return h(MaxUserSection, {
                name: 'Usuário Teste',
                userId: 42,
                ...props
            });
        }
    });

    app.directive('tooltip', {});
    app.use(pinia);
    activeApp = app;
    app.mount(hostElement);

    await waitTicks(3);

    const trigger = hostElement.querySelector('.user-profile-trigger') as HTMLButtonElement;
    return { trigger, app, host: hostElement };
}

async function mountMaxApp(
    props: Record<string, any> = {},
    userSettings: Record<string, any> = { fontSize: 16 },
    viewport = { width: 1280, height: 800 }
) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    await page.viewport(viewport.width, viewport.height);

    hostElement = document.createElement('div');
    hostElement.id = 'font-size-max-app-test-host';
    document.body.appendChild(hostElement);

    const pinia = createPinia();
    setActivePinia(pinia);

    const user = useUserStore();
    user.data = {
        id: 42,
        name: 'Maria Teste',
        solar_company_name: 'Max Soluções',
        settings: { ...userSettings }
    };
    (user as any).status = { server: { get: { is_success: true } } };
    const saveSpy = vi.fn();
    (user as any).save = saveSpy;

    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            {
                path: '/',
                name: 'dashboard',
                component: {
                    components: { MaxTitle1 },
                    template: '<div class="test-page-content" style="padding: 16px;"><MaxTitle1 title="Painel de Controle" subtitle="Visão Geral" /></div>'
                }
            }
        ]
    });
    await router.push('/');
    await router.isReady();

    const app = createApp({
        render() {
            return h(MaxApp, {
                ...props
            });
        }
    });

    app.directive('tooltip', {});
    app.use(pinia);
    app.use(router);
    activeApp = app;
    app.mount(hostElement);

    await waitTicks(4);

    const trigger = hostElement.querySelector('.user-profile-trigger') as HTMLButtonElement;
    return { trigger, app, host: hostElement, user, saveSpy, router };
}

describe('Preferência e Efeito Visual do Tamanho da Fonte (Chromium Browser)', () => {
    beforeEach(() => {
        _resetHtmlFontSizeForTesting();
        if (typeof localStorage !== 'undefined') localStorage.removeItem(FONT_SIZE_STORAGE_KEY);
        if (typeof document !== 'undefined') {
            document.documentElement.style.fontSize = '';
            document.documentElement.style.removeProperty('--max-font-size-base');
        }
    });

    afterEach(async () => {
        if (activeApp) {
            activeApp.unmount();
            activeApp = null;
        }
        if (hostElement) {
            hostElement.remove();
            hostElement = null;
        }
        document.querySelectorAll('.max-user-section-overlay').forEach((el) => el.remove());
        _resetHtmlFontSizeForTesting();
        if (typeof localStorage !== 'undefined') localStorage.removeItem(FONT_SIZE_STORAGE_KEY);
        if (typeof document !== 'undefined') {
            document.documentElement.style.fontSize = '';
            document.documentElement.style.removeProperty('--max-font-size-base');
        }
        await page.viewport(1280, 800);
    });

    it('altera imediatamente o tamanho da raiz HTML e do texto rem (.main-item-menu-div) via cliques no stepper', async () => {
        const { trigger } = await mountUserSection();
        expect(trigger).not.toBeNull();

        // Abre o menu do perfil
        trigger.click();
        await waitTicks(3);

        const overlay = document.body.querySelector('.max-user-section-overlay');
        expect(overlay).not.toBeNull();

        const plusBtn = document.body.querySelector('button[aria-label="Aumentar tamanho da fonte"]') as HTMLButtonElement;
        const minusBtn = document.body.querySelector('button[aria-label="Diminuir tamanho da fonte"]') as HTMLButtonElement;
        const valueBtn = document.body.querySelector('.font-size-value-btn') as HTMLButtonElement;
        const menuItem = document.body.querySelector('.main-item-menu-div:not(.font-size-item-div)') as HTMLElement;

        expect(plusBtn).not.toBeNull();
        expect(minusBtn).not.toBeNull();
        expect(valueBtn).not.toBeNull();
        expect(menuItem).not.toBeNull();

        // Estado inicial (16px base -> 0.9rem = 14.4px)
        expect(valueBtn.textContent?.trim()).toBe('16');
        const initialMenuSize = parseFloat(getComputedStyle(menuItem).fontSize);
        expect(Math.abs(initialMenuSize - 14.4)).toBeLessThanOrEqual(0.2);

        // Incrementa até 20px (4 cliques)
        for (let i = 0; i < 4; i++) {
            plusBtn.click();
            await waitTicks(2);
        }

        // Verifica estado após incremento: raiz 20px, variável CSS 20px e texto rem 18px (0.9 * 20)
        expect(valueBtn.textContent?.trim()).toBe('20');
        expect(document.documentElement.style.fontSize).toBe('20px');
        expect(document.documentElement.style.getPropertyValue('--max-font-size-base')).toBe('20px');

        const incrementedMenuSize = parseFloat(getComputedStyle(menuItem).fontSize);
        expect(Math.abs(incrementedMenuSize - 18.0)).toBeLessThanOrEqual(0.2);
        expect(document.body.querySelector('.max-user-section-overlay')).not.toBeNull();

        // Decrementa 1 passo (20 -> 19px: 0.9 * 19 = 17.1px)
        minusBtn.click();
        await waitTicks(2);

        expect(valueBtn.textContent?.trim()).toBe('19');
        expect(document.documentElement.style.fontSize).toBe('19px');
        const decrementedMenuSize = parseFloat(getComputedStyle(menuItem).fontSize);
        expect(Math.abs(decrementedMenuSize - 17.1)).toBeLessThanOrEqual(0.2);

        // Restaura para o padrão (16px) clicando no visor de valor
        valueBtn.click();
        await waitTicks(2);

        expect(valueBtn.textContent?.trim()).toBe('16');
        expect(document.documentElement.style.fontSize).toBe('16px');
        const restoredMenuSize = parseFloat(getComputedStyle(menuItem).fontSize);
        expect(Math.abs(restoredMenuSize - 14.4)).toBeLessThanOrEqual(0.2);

        // Garante que o valor não reverte após estabilizar
        await waitTicks(5);
        expect(document.documentElement.style.fontSize).toBe('16px');
    });

    it('fluxo visual completo no MaxApp: clique no avatar altera raiz HTML, menu (.main-item-menu-div) e texto computado do conteúdo (MaxTitle1)', async () => {
        const { trigger, user, saveSpy, host } = await mountMaxApp();
        expect(trigger).not.toBeNull();

        const menuId = trigger.getAttribute('aria-controls');
        expect(menuId).toBeTruthy();

        // Clica no avatar para abrir o menu
        await userEvent.click(trigger);
        await waitTicks(3);

        const overlay = (document.getElementById(menuId!) || document.body.querySelector('.max-user-section-overlay')) as HTMLElement;
        expect(overlay).not.toBeNull();

        const plusBtn = overlay.querySelector('button[aria-label="Aumentar tamanho da fonte"]') as HTMLButtonElement;
        const minusBtn = overlay.querySelector('button[aria-label="Diminuir tamanho da fonte"]') as HTMLButtonElement;
        const valueBtn = overlay.querySelector('.font-size-value-btn') as HTMLButtonElement;
        const menuItem = overlay.querySelector('.main-item-menu-div:not(.font-size-item-div)') as HTMLElement;
        const titleText = host.querySelector('.t1-main-text') as HTMLElement;

        expect(plusBtn).not.toBeNull();
        expect(minusBtn).not.toBeNull();
        expect(valueBtn).not.toBeNull();
        expect(menuItem).not.toBeNull();
        expect(titleText).not.toBeNull();

        // Estado inicial (raiz 16px): menu 0.9rem = 14.4px, título 1.125rem = 18.0px
        expect(valueBtn.textContent?.trim()).toBe('16');
        expect(document.documentElement.style.fontSize).toBe('16px');
        expect(document.documentElement.style.getPropertyValue('--max-font-size-base')).toBe('16px');
        expect(Math.abs(parseFloat(getComputedStyle(menuItem).fontSize) - 14.4)).toBeLessThanOrEqual(0.2);
        expect(Math.abs(parseFloat(getComputedStyle(titleText).fontSize) - 18.0)).toBeLessThanOrEqual(0.2);

        // 4 cliques no botão de aumentar (16 -> 20px)
        for (let i = 0; i < 4; i++) {
            await userEvent.click(plusBtn);
            await waitTicks(2);
        }

        // Estado aumentado (raiz 20px): menu 0.9rem = 18.0px, título 1.125rem = 22.5px
        expect(valueBtn.textContent?.trim()).toBe('20');
        expect(document.documentElement.style.fontSize).toBe('20px');
        expect(document.documentElement.style.getPropertyValue('--max-font-size-base')).toBe('20px');
        expect(Math.abs(parseFloat(getComputedStyle(menuItem).fontSize) - 18.0)).toBeLessThanOrEqual(0.2);
        expect(Math.abs(parseFloat(getComputedStyle(titleText).fontSize) - 22.5)).toBeLessThanOrEqual(0.2);
        expect(user.data?.settings?.fontSize).toBe(20);
        expect(saveSpy).toHaveBeenCalled();

        // 1 clique no botão de diminuir (20 -> 19px)
        await userEvent.click(minusBtn);
        await waitTicks(2);

        // Estado reduzido (raiz 19px): menu 0.9rem = 17.1px, título 1.125rem = 21.375px
        expect(valueBtn.textContent?.trim()).toBe('19');
        expect(document.documentElement.style.fontSize).toBe('19px');
        expect(Math.abs(parseFloat(getComputedStyle(menuItem).fontSize) - 17.1)).toBeLessThanOrEqual(0.2);
        expect(Math.abs(parseFloat(getComputedStyle(titleText).fontSize) - 21.375)).toBeLessThanOrEqual(0.2);
        expect(user.data?.settings?.fontSize).toBe(19);

        // 1 clique no visor de valor para restaurar o padrão de 16px
        await userEvent.click(valueBtn);
        await waitTicks(2);

        // Estado restaurado (raiz 16px): menu 0.9rem = 14.4px, título 1.125rem = 18.0px
        expect(valueBtn.textContent?.trim()).toBe('16');
        expect(document.documentElement.style.fontSize).toBe('16px');
        expect(Math.abs(parseFloat(getComputedStyle(menuItem).fontSize) - 14.4)).toBeLessThanOrEqual(0.2);
        expect(Math.abs(parseFloat(getComputedStyle(titleText).fontSize) - 18.0)).toBeLessThanOrEqual(0.2);
        expect(user.data?.settings?.fontSize).toBe(16);

        // Sem reversão indevida após estabilização
        await waitTicks(5);
        expect(document.documentElement.style.fontSize).toBe('16px');
        expect(Math.abs(parseFloat(getComputedStyle(titleText).fontSize) - 18.0)).toBeLessThanOrEqual(0.2);
    });

    it('sincroniza imediatamente o DOM (documentElement) com valor pré-existente no localStorage ao inicializar', async () => {
        localStorage.setItem(FONT_SIZE_STORAGE_KEY, '19');
        _resetHtmlFontSizeForTesting();

        const { trigger } = await mountUserSection();
        expect(trigger).not.toBeNull();

        // DOM e variável CSS devem ser aplicados imediatamente no boot
        expect(document.documentElement.style.fontSize).toBe('19px');
        expect(document.documentElement.style.getPropertyValue('--max-font-size-base')).toBe('19px');

        trigger.click();
        await waitTicks(3);

        const valueBtn = document.body.querySelector('.font-size-value-btn') as HTMLButtonElement;
        expect(valueBtn.textContent?.trim()).toBe('19');

        const menuItem = document.body.querySelector('.main-item-menu-div:not(.font-size-item-div)') as HTMLElement;
        const computedSize = parseFloat(getComputedStyle(menuItem).fontSize);
        expect(Math.abs(computedSize - 17.1)).toBeLessThanOrEqual(0.2);
    });

    it('aplica preferência carregada prévia na inicialização do MaxApp e reflete no título real', async () => {
        const { host } = await mountMaxApp({}, { fontSize: 18 });

        expect(document.documentElement.style.fontSize).toBe('18px');
        expect(document.documentElement.style.getPropertyValue('--max-font-size-base')).toBe('18px');

        const titleText = host.querySelector('.t1-main-text') as HTMLElement;
        expect(titleText).not.toBeNull();
        expect(Math.abs(parseFloat(getComputedStyle(titleText).fontSize) - 20.25)).toBeLessThanOrEqual(0.2);
    });

    it('lida com ausência de preferência inicial e persiste ao primeiro ajuste no MaxApp', async () => {
        const { trigger, user, saveSpy } = await mountMaxApp({}, {});
        expect(trigger).not.toBeNull();

        // Padrão 16px aplicado
        expect(document.documentElement.style.fontSize).toBe('16px');

        await userEvent.click(trigger);
        await waitTicks(3);

        const plusBtn = document.body.querySelector('button[aria-label="Aumentar tamanho da fonte"]') as HTMLButtonElement;
        expect(plusBtn).not.toBeNull();

        await userEvent.click(plusBtn);
        await waitTicks(2);

        expect(document.documentElement.style.fontSize).toBe('17px');
        expect(user.data?.settings?.fontSize).toBe(17);
        expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('respeita a precedência de prop fontSize explícita sobre a preferência carregada no MaxApp', async () => {
        const { host } = await mountMaxApp({ fontSize: 20 }, { fontSize: 14 });

        expect(document.documentElement.style.fontSize).toBe('20px');
        const titleText = host.querySelector('.t1-main-text') as HTMLElement;
        expect(Math.abs(parseFloat(getComputedStyle(titleText).fontSize) - 22.5)).toBeLessThanOrEqual(0.2);
    });

    it('suporta alteração rápida repetida sem reversão indevida no MaxApp', async () => {
        const { trigger } = await mountMaxApp();
        await userEvent.click(trigger);
        await waitTicks(3);

        const plusBtn = document.body.querySelector('button[aria-label="Aumentar tamanho da fonte"]') as HTMLButtonElement;
        expect(plusBtn).not.toBeNull();

        plusBtn.click();
        plusBtn.click();
        plusBtn.click();
        await waitTicks(4);

        expect(document.documentElement.style.fontSize).toBe('19px');
        await waitTicks(5);
        expect(document.documentElement.style.fontSize).toBe('19px');
    });

    it('preserva e restaura a fonte computada após remontagem da aplicação', async () => {
        const { trigger } = await mountMaxApp();
        await userEvent.click(trigger);
        await waitTicks(3);

        const plusBtn = document.body.querySelector('button[aria-label="Aumentar tamanho da fonte"]') as HTMLButtonElement;
        plusBtn.click();
        plusBtn.click();
        await waitTicks(3);

        expect(document.documentElement.style.fontSize).toBe('18px');

        // Remonta o aplicativo
        const { host: newHost } = await mountMaxApp({}, { fontSize: 18 });
        expect(document.documentElement.style.fontSize).toBe('18px');

        const titleText = newHost.querySelector('.t1-main-text') as HTMLElement;
        expect(Math.abs(parseFloat(getComputedStyle(titleText).fontSize) - 20.25)).toBeLessThanOrEqual(0.2);
    });

    it('respeita os limites mínimo (10px) e máximo (24px) desabilitando os botões correspondentes', async () => {
        // Testa limite mínimo
        const { trigger: triggerMin } = await mountUserSection({ fontSize: 10, minFontSize: 10, maxFontSize: 24 });
        triggerMin.click();
        await waitTicks(3);

        const minusBtnMin = document.body.querySelector('button[aria-label="Diminuir tamanho da fonte"]') as HTMLButtonElement;
        const plusBtnMin = document.body.querySelector('button[aria-label="Aumentar tamanho da fonte"]') as HTMLButtonElement;

        expect(minusBtnMin.disabled).toBe(true);
        expect(plusBtnMin.disabled).toBe(false);

        // Testa limite máximo
        const { trigger: triggerMax } = await mountUserSection({ fontSize: 24, minFontSize: 10, maxFontSize: 24 });
        triggerMax.click();
        await waitTicks(3);

        const minusBtnMax = document.body.querySelector('button[aria-label="Diminuir tamanho da fonte"]') as HTMLButtonElement;
        const plusBtnMax = document.body.querySelector('button[aria-label="Aumentar tamanho da fonte"]') as HTMLButtonElement;

        expect(plusBtnMax.disabled).toBe(true);
        expect(minusBtnMax.disabled).toBe(false);
    });

    it('permite navegação por teclado: enter para abrir menu, escape fecha e devolve foco', async () => {
        const { trigger } = await mountUserSection();
        trigger.focus();
        expect(document.activeElement).toBe(trigger);

        await userEvent.keyboard('{Enter}');
        await waitTicks(3);

        const overlay = document.body.querySelector('.max-user-section-overlay');
        expect(overlay).not.toBeNull();

        await userEvent.keyboard('{Escape}');
        await waitTicks(3);

        expect(document.body.querySelector('.max-user-section-overlay')).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });

    it('aplica realmente a raiz 10px, 16px e 24px em viewports 320px e 1280px e verifica ausência de overflow horizontal', async () => {
        // Viewport mobile estreita (320px) com fonte ampliada para 24px
        applyHtmlFontSize(24);
        expect(parseFloat(getComputedStyle(document.documentElement).fontSize)).toBe(24);

        const { trigger: trigger320 } = await mountUserSection({ fontSize: 24 }, { width: 320, height: 568 });
        trigger320.click();
        await waitTicks(3);

        const overlay320 = document.body.querySelector('.max-user-section-overlay') as HTMLElement;
        expect(overlay320).not.toBeNull();
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);

        // Viewport desktop (1280px) com fonte reduzida para 10px
        applyHtmlFontSize(10);
        expect(parseFloat(getComputedStyle(document.documentElement).fontSize)).toBe(10);

        const { trigger: trigger1280 } = await mountUserSection({ fontSize: 10 }, { width: 1280, height: 800 });
        trigger1280.click();
        await waitTicks(3);

        const overlay1280 = document.body.querySelector('.max-user-section-overlay') as HTMLElement;
        expect(overlay1280).not.toBeNull();
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);

        // Viewport desktop (1280px) com fonte padrão de 16px
        applyHtmlFontSize(16);
        expect(parseFloat(getComputedStyle(document.documentElement).fontSize)).toBe(16);
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
    });

    it('repassa a prop fontSize controlada para o layout mobile', async () => {
        await page.viewport(375, 667);

        hostElement = document.createElement('div');
        hostElement.id = 'layout-test-host';
        document.body.appendChild(hostElement);

        const pinia = createPinia();
        setActivePinia(pinia);

        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/', component: { template: '<div>página mobile</div>' } }
            ]
        });
        await router.push('/');
        await router.isReady();

        const app = createApp({
            render() {
                return h(MaxPageLayout, {
                    screen: 'mobile',
                    fontSize: 22
                });
            }
        });

        app.directive('tooltip', {});
        app.use(pinia);
        app.use(router);
        activeApp = app;
        app.mount(hostElement);

        await waitTicks(3);

        const mobileLayoutEl = hostElement.querySelector('.max-page-mobile-layout');
        expect(mobileLayoutEl).not.toBeNull();
    });
});
