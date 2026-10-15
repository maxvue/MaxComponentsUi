import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { createApp, h, onMounted, ref, type App } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import MaxApp from '../../src/components/MaxApp.vue';
import { useUserStore } from '../../src/stores/useUser.Store';
import { useListMenusStore } from '../../src/stores/useListMenus.Store';
import { resetMaxAppConfig } from '../../src/helpers/maxAppConfig';
import '../../src/themes/all.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;
let unavailablePageMounts = 0;
let availablePageMounts = 0;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitTicks(count = 4): Promise<void> {
    for (let i = 0; i < count; i++) await nextFrame();
}

const UnavailableRouteComponent = {
    name: 'UnavailableRouteComponent',
    setup() {
        onMounted(() => { unavailablePageMounts++; });
        return () => h('div', { class: 'unavailable-page-content' }, 'Conteúdo Privado Não Liberado');
    }
};

const AvailableRouteComponent = {
    name: 'AvailableRouteComponent',
    setup() {
        onMounted(() => { availablePageMounts++; });
        return () => h('div', { class: 'available-page-content' }, 'Conteúdo da Página Disponível');
    }
};

interface MountAppOptions {
    viewport?: { width: number; height: number };
    initialPath?: string;
    screen?: 'desktop' | 'mobile';
    menus?: any[];
    sideMenuItems?: any[];
    bottomTabs?: any[];
}

async function mountMaxApp(options: MountAppOptions = {}) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    const width = options.viewport?.width ?? 1280;
    const height = options.viewport?.height ?? 800;
    await page.viewport(width, height);

    hostElement = document.createElement('div');
    hostElement.id = 'max-app-availability-test-host';
    document.body.appendChild(hostElement);

    const pinia = createPinia();
    setActivePinia(pinia);

    const user = useUserStore();
    user.data = {
        id: 1,
        name: 'Operador Solar',
        isImpersonated: false
    };
    (user as any).status = { server: { get: { is_success: true } } };

    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            {
                path: '/',
                name: 'home',
                component: AvailableRouteComponent
            },
            {
                path: '/recurso-indisponivel',
                name: 'recurso_indisponivel',
                component: UnavailableRouteComponent
            },
            {
                path: '/recurso-disponivel',
                name: 'recurso_disponivel',
                component: AvailableRouteComponent
            }
        ]
    });

    const initialRoute = options.initialPath ?? '/recurso-indisponivel';
    await router.push(initialRoute);
    await router.isReady();

    const menusStore = useListMenusStore();
    const defaultMenus = [
        {
            id: 'm1',
            route: 'recurso_indisponivel',
            is_disponible: false,
            details: { title: 'Recurso Bloqueado', icon: 'mdi:lock-outline' }
        },
        {
            id: 'm2',
            route: 'recurso_disponivel',
            is_disponible: true,
            details: { title: 'Recurso Ativo', icon: 'mdi:check-circle-outline' }
        }
    ];

    const menusPayload = options.sideMenuItems ?? options.menus ?? defaultMenus;
    (menusStore.list as any) = ref({
        side: menusPayload
    });

    const app = createApp({
        render() {
            return h(MaxApp, {
                screen: options.screen ?? (width < 768 ? 'mobile' : 'desktop'),
                sideMenuItems: options.sideMenuItems ?? options.menus ?? (options.bottomTabs ? undefined : defaultMenus),
                bottomTabs: options.bottomTabs
            });
        }
    });

    app.directive('tooltip', {});
    app.use(pinia);
    app.use(router);

    activeApp = app;
    app.mount(hostElement);

    await waitTicks(5);

    return { app, router, host: hostElement };
}

describe('Disponibilidade de Recursos e Geometria no MaxApp (Chromium Browser)', () => {
    beforeEach(() => {
        resetMaxAppConfig();
        unavailablePageMounts = 0;
        availablePageMounts = 0;
        if (typeof document !== 'undefined') document.documentElement.classList.remove('dark');
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
        if (typeof document !== 'undefined') document.documentElement.classList.remove('dark');
        resetMaxAppConfig();
        await page.viewport(1280, 800);
    });

    describe('Desktop (1280x800)', () => {
        it('substitui o conteúdo da rota pelo aviso centralizado sem montar o componente real da rota', async () => {
            const { host } = await mountMaxApp({
                viewport: { width: 1280, height: 800 },
                initialPath: '/recurso-indisponivel',
                screen: 'desktop'
            });

            // O componente da rota não deve ter sido montado
            expect(unavailablePageMounts).toBe(0);
            expect(host.querySelector('.unavailable-page-content')).toBeNull();

            // O aviso exato deve estar visível
            const unavailableBox = host.querySelector('.max-app-unavailable');
            expect(unavailableBox).not.toBeNull();
            expect(unavailableBox?.textContent?.trim()).toBe('Recurso em desenvolvimento. Este recurso estará disponível em breve');

            // Verifica acessibilidade
            expect(unavailableBox?.getAttribute('role')).toBe('status');
            expect(unavailableBox?.getAttribute('aria-live')).toBe('polite');
        });

        it('centraliza o bloco textual na área útil da página (.pane1) com desvio <= 8 CSS px', async () => {
            const { host } = await mountMaxApp({
                viewport: { width: 1280, height: 800 },
                initialPath: '/recurso-indisponivel',
                screen: 'desktop'
            });

            const pane1 = host.querySelector('.pane1') as HTMLElement;
            const unavailableInner = host.querySelector('.max-app-unavailable .inner') as HTMLElement;

            expect(pane1).not.toBeNull();
            expect(unavailableInner).not.toBeNull();

            const paneRect = pane1.getBoundingClientRect();
            const textRect = unavailableInner.getBoundingClientRect();

            const paneStyle = window.getComputedStyle(pane1);
            const padTop = parseFloat(paneStyle.paddingTop) || 0;
            const padBottom = parseFloat(paneStyle.paddingBottom) || 0;
            const padLeft = parseFloat(paneStyle.paddingLeft) || 0;
            const padRight = parseFloat(paneStyle.paddingRight) || 0;

            // Cálculo dos centros geométricos da área útil (descontando padding)
            const paneCenterX = paneRect.left + padLeft + (paneRect.width - padLeft - padRight) / 2;
            const paneCenterY = paneRect.top + padTop + (paneRect.height - padTop - padBottom) / 2;

            const textCenterX = textRect.left + textRect.width / 2;
            const textCenterY = textRect.top + textRect.height / 2;

            const deltaX = Math.abs(textCenterX - paneCenterX);
            const deltaY = Math.abs(textCenterY - paneCenterY);

            expect(deltaX).toBeLessThanOrEqual(8);
            expect(deltaY).toBeLessThanOrEqual(8);

            // Sem transbordamento horizontal
            expect(document.body.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
        });

        it('preserva legibilidade e centralização no modo escuro (dark mode)', async () => {
            document.documentElement.classList.add('dark');

            const { host } = await mountMaxApp({
                viewport: { width: 1280, height: 800 },
                initialPath: '/recurso-indisponivel',
                screen: 'desktop'
            });

            const unavailableBox = host.querySelector('.max-app-unavailable');
            expect(unavailableBox).not.toBeNull();
            expect(unavailableBox?.textContent?.trim()).toBe('Recurso em desenvolvimento. Este recurso estará disponível em breve');
            expect(unavailablePageMounts).toBe(0);
        });

        it('monta normalmente a página quando navega para uma rota disponível', async () => {
            const { host, router } = await mountMaxApp({
                viewport: { width: 1280, height: 800 },
                initialPath: '/recurso-indisponivel',
                screen: 'desktop'
            });

            expect(host.querySelector('.max-app-unavailable')).not.toBeNull();
            expect(availablePageMounts).toBe(0);

            // Navega para a rota disponível
            await router.push('/recurso-disponivel');
            await waitTicks(5);

            expect(host.querySelector('.max-app-unavailable')).toBeNull();
            expect(host.querySelector('.available-page-content')).not.toBeNull();
            expect(availablePageMounts).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Mobile (390x844)', () => {
        it('substitui o conteúdo pelo aviso no viewport mobile sem montar componente da rota', async () => {
            const { host } = await mountMaxApp({
                viewport: { width: 390, height: 844 },
                initialPath: '/recurso-indisponivel',
                screen: 'mobile'
            });

            expect(unavailablePageMounts).toBe(0);
            expect(host.querySelector('.unavailable-page-content')).toBeNull();

            const unavailableBox = host.querySelector('.max-app-unavailable');
            expect(unavailableBox).not.toBeNull();
            expect(unavailableBox?.textContent?.trim()).toBe('Recurso em desenvolvimento. Este recurso estará disponível em breve');
        });

        it('centraliza o bloco textual na área útil (.mobile-page-body) com desvio <= 8 CSS px', async () => {
            const { host } = await mountMaxApp({
                viewport: { width: 390, height: 844 },
                initialPath: '/recurso-indisponivel',
                screen: 'mobile'
            });

            const pageBody = host.querySelector('.mobile-page-body') as HTMLElement;
            const unavailableInner = host.querySelector('.max-app-unavailable .inner') as HTMLElement;

            expect(pageBody).not.toBeNull();
            expect(unavailableInner).not.toBeNull();

            const bodyRect = pageBody.getBoundingClientRect();
            const textRect = unavailableInner.getBoundingClientRect();

            const bodyStyle = window.getComputedStyle(pageBody);
            const padTop = parseFloat(bodyStyle.paddingTop) || 0;
            const padBottom = parseFloat(bodyStyle.paddingBottom) || 0;
            const padLeft = parseFloat(bodyStyle.paddingLeft) || 0;
            const padRight = parseFloat(bodyStyle.paddingRight) || 0;

            const bodyCenterX = bodyRect.left + padLeft + (bodyRect.width - padLeft - padRight) / 2;
            const bodyCenterY = bodyRect.top + padTop + (bodyRect.height - padTop - padBottom) / 2;

            const textCenterX = textRect.left + textRect.width / 2;
            const textCenterY = textRect.top + textRect.height / 2;

            const deltaX = Math.abs(textCenterX - bodyCenterX);
            const deltaY = Math.abs(textCenterY - bodyCenterY);

            expect(deltaX).toBeLessThanOrEqual(8);
            expect(deltaY).toBeLessThanOrEqual(8);

            // Sem transbordamento horizontal no mobile
            expect(document.body.scrollWidth).toBeLessThanOrEqual(390);
        });

        it('aplica indisponibilidade a partir de bottomTabs informadas no mobile', async () => {
            const { host } = await mountMaxApp({
                viewport: { width: 390, height: 844 },
                initialPath: '/recurso-indisponivel',
                screen: 'mobile',
                menus: [],
                bottomTabs: [
                    {
                        name: 'recurso_indisponivel',
                        label: 'Bloqueado',
                        icon: 'mdi:lock',
                        is_disponible: false
                    }
                ]
            });

            expect(unavailablePageMounts).toBe(0);
            const unavailableBox = host.querySelector('.max-app-unavailable');
            expect(unavailableBox).not.toBeNull();
            expect(unavailableBox?.textContent?.trim()).toBe('Recurso em desenvolvimento. Este recurso estará disponível em breve');
        });
    });
});
