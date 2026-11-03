import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { createApp, h, reactive, ref, type App } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import MaxApp from '../../src/components/MaxApp.vue';
import { useUserStore } from '../../src/stores/useUser.Store';
import { useListMenusStore } from '../../src/stores/useListMenus.Store';
import { useTopToolbarStore } from '../../src/stores/useTopToolbar.Store';
import { resetMaxAppConfig } from '../../src/helpers/maxAppConfig';
import '../../src/themes/all.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitTicks(count = 5): Promise<void> {
    for (let i = 0; i < count; i++) await nextFrame();
}

function getRootFontSize(): number {
    return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

const DummyPageComponent = {
    name: 'DummyPageComponent',
    render() {
        return h('div', { class: 'dummy-page' }, 'Conteúdo da página');
    }
};

interface MountAppOptions {
    viewport?: { width: number; height: number };
    screen?: 'desktop' | 'mobile';
    sideMenuItems?: any[];
    bottomTabs?: any[];
    addItems?: any[];
    topToolbarItems?: any[];
    showTopToolbar?: boolean;
}

async function mountAppForBrowser(options: MountAppOptions = {}) {
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
    hostElement.id = 'menu-icon-sizes-browser-host';
    document.body.appendChild(hostElement);

    const pinia = createPinia();
    setActivePinia(pinia);

    const user = useUserStore();
    user.data = {
        id: 1,
        name: 'Operador Teste',
        isImpersonated: false
    };
    (user as any).status = { server: { get: { is_success: true } } };

    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', name: 'home', component: DummyPageComponent },
            { path: '/page-1', name: 'page_1', component: DummyPageComponent },
            { path: '/page-2', name: 'page_2', component: DummyPageComponent }
        ]
    });
    await router.push('/');
    await router.isReady();

    if (options.showTopToolbar !== undefined || options.topToolbarItems) {
        const toolbar = useTopToolbarStore();
        toolbar.show = options.showTopToolbar ?? true;
        if (options.topToolbarItems) toolbar.items = options.topToolbarItems;
    }

    const menusStore = useListMenusStore();
    (menusStore.list as any) = ref({
        side: options.sideMenuItems ?? []
    });

    const app = createApp({
        render() {
            return h(MaxApp, {
                screen: options.screen ?? (width < 768 ? 'mobile' : 'desktop'),
                sideMenuItems: options.sideMenuItems,
                bottomTabs: options.bottomTabs,
                addItems: options.addItems
            });
        }
    });

    app.directive('tooltip', {});
    app.use(pinia);
    app.use(router);

    activeApp = app;
    app.mount(hostElement);

    await waitTicks(6);

    return { app, router, host: hostElement };
}

describe('Medição Geométrica dos Tamanhos de Ícones no Browser Real', () => {
    beforeEach(() => {
        resetMaxAppConfig();
        document.documentElement.classList.remove('dark');
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
    });

    it('mede dimensões reais de ícones laterais no desktop com fonte raiz controlada', async () => {
        const rootFs = getRootFontSize();
        const sideMenuItems = [
            {
                id: 'm1',
                size_side: '1.8rem',
                details: { title: 'Item Custom', icon: 'mdi:star', route: 'page_1' }
            },
            {
                id: 'm2',
                details: { title: 'Item Padrão', icon: 'mdi:home', route: 'page_2' }
            }
        ];

        await mountAppForBrowser({
            viewport: { width: 1280, height: 800 },
            sideMenuItems
        });

        const iconDivs = document.querySelectorAll('.max-menu-vertical-item .max-icon-div');
        expect(iconDivs.length).toBeGreaterThanOrEqual(2);

        const customRect = iconDivs[0].getBoundingClientRect();
        const expectedCustomPx = 1.8 * rootFs;
        expect(Math.abs(customRect.width - expectedCustomPx)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(customRect.height - expectedCustomPx)).toBeLessThanOrEqual(1.5);

        const defaultRect = iconDivs[1].getBoundingClientRect();
        const expectedDefaultPx = 1.5 * rootFs;
        expect(Math.abs(defaultRect.width - expectedDefaultPx)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(defaultRect.height - expectedDefaultPx)).toBeLessThanOrEqual(1.5);
    });

    it('mede dimensões de abas inferiores com e sem FAB no mobile 390x844', async () => {
        const rootFs = getRootFontSize();
        const bottomTabs = [
            { name: 'home', label: 'Início', icon: 'mdi:home', size_bottom: '1.6rem' },
            { name: 'page_1', label: 'Projetos', icon: 'mdi:solar-panel', size: '20px' },
            { name: 'page_2', label: 'Perfil', icon: 'mdi:account' } // fallback 1.3
        ];

        await mountAppForBrowser({
            viewport: { width: 390, height: 844 },
            screen: 'mobile',
            bottomTabs,
            addItems: [{ label: 'Adicionar', icon: 'mdi:plus' }]
        });

        const tabIcons = document.querySelectorAll('.bottom-menu-tab .max-icon-div');
        expect(tabIcons.length).toBeGreaterThanOrEqual(3);

        // Aba 1: 1.6rem
        const tab1Rect = tabIcons[0].getBoundingClientRect();
        expect(Math.abs(tab1Rect.width - (1.6 * rootFs))).toBeLessThanOrEqual(1.5);

        // Aba 2: 20px
        const tab2Rect = tabIcons[1].getBoundingClientRect();
        expect(Math.abs(tab2Rect.width - 20)).toBeLessThanOrEqual(1.5);

        // Aba 3: fallback 1.3rem
        const tab3Rect = tabIcons[2].getBoundingClientRect();
        expect(Math.abs(tab3Rect.width - (1.3 * rootFs))).toBeLessThanOrEqual(1.5);

        // FAB central: ícone fixo em 1.5rem e botão preservado
        const fabIcon = document.querySelector('.bottom-menu-fab-wrapper .fab .max-icon-div');
        expect(fabIcon).toBeTruthy();
        const fabRect = fabIcon!.getBoundingClientRect();
        expect(Math.abs(fabRect.width - (1.5 * rootFs))).toBeLessThanOrEqual(1.5);

        const fabButton = document.querySelector('.bottom-menu-fab-wrapper .fab') as HTMLElement;
        expect(fabButton).toBeTruthy();
        expect(Math.abs(fabButton.getBoundingClientRect().width - 47)).toBeLessThanOrEqual(1.5);
    });

    it('mede largura/altura do ícone e invariância do botão no topo para itens somente ícone', async () => {
        const rootFs = getRootFontSize();
        const topToolbarItems = [
            { icon: 'mdi:star', size_top: '20px', action: () => {} },
            { icon: 'mdi:bell', size_top: 1.8, action: () => {} },
            { icon: 'mdi:cog', action: () => {} }
        ];

        await mountAppForBrowser({
            viewport: { width: 1280, height: 800 },
            showTopToolbar: true,
            topToolbarItems
        });

        const toolbarButtons = document.querySelectorAll('.max-top-toolbar .p-menubar-item .max-icon-button');
        expect(toolbarButtons.length).toBe(3);

        // Botão 0: size_top="20px". O ícone interno deve medir 20px, mas o botão mantém 24px (1.5 * 16px)
        const btn0 = toolbarButtons[0] as HTMLElement;
        const icon0 = btn0.querySelector('.max-icon-div') as HTMLElement;
        expect(icon0).toBeTruthy();
        expect(Math.abs(icon0.getBoundingClientRect().width - 20)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(icon0.getBoundingClientRect().height - 20)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(btn0.getBoundingClientRect().width - 24)).toBeLessThanOrEqual(1.5);

        // Botão 1: size_top=1.8 (1.8rem). O ícone interno mede 1.8 * rootFs px
        const btn1 = toolbarButtons[1] as HTMLElement;
        const icon1 = btn1.querySelector('.max-icon-div') as HTMLElement;
        expect(icon1).toBeTruthy();
        expect(Math.abs(icon1.getBoundingClientRect().width - (1.8 * rootFs))).toBeLessThanOrEqual(1.5);
        expect(Math.abs(btn1.getBoundingClientRect().width - 24)).toBeLessThanOrEqual(1.5);

        // Botão 2: sem configuração customizada -> ícone e botão usam padrão
        const btn2 = toolbarButtons[2] as HTMLElement;
        const icon2 = btn2.querySelector('.max-icon-div') as HTMLElement;
        expect(icon2).toBeTruthy();
        expect(Math.abs(icon2.getBoundingClientRect().width - 24)).toBeLessThanOrEqual(1.5);
    });

    it('mantém geometria intacta no modo escuro (dark mode)', async () => {
        document.documentElement.classList.add('dark');
        const rootFs = getRootFontSize();
        const sideMenuItems = [
            {
                id: 'dark-item',
                size_side: '1.75rem',
                details: { title: 'Dark Test', icon: 'mdi:weather-night', route: 'page_1' }
            }
        ];

        await mountAppForBrowser({
            viewport: { width: 1280, height: 800 },
            sideMenuItems
        });

        const iconDiv = document.querySelector('.max-menu-vertical-item .max-icon-div') as HTMLElement;
        expect(iconDiv).toBeTruthy();
        const rect = iconDiv.getBoundingClientRect();
        expect(Math.abs(rect.width - (1.75 * rootFs))).toBeLessThanOrEqual(1.5);
    });

    it('reage dinamicamente a alterações reativas no tamanho do ícone', async () => {
        const rootFs = getRootFontSize();
        const dynamicItem = reactive({
            id: 'dyn-item',
            size_side: '1.5rem',
            details: { title: 'Dinâmico', icon: 'mdi:star', route: 'page_1' }
        });

        await mountAppForBrowser({
            viewport: { width: 1280, height: 800 },
            sideMenuItems: [dynamicItem]
        });

        const iconDiv = document.querySelector('.max-menu-vertical-item .max-icon-div') as HTMLElement;
        expect(iconDiv).toBeTruthy();
        expect(Math.abs(iconDiv.getBoundingClientRect().width - (1.5 * rootFs))).toBeLessThanOrEqual(1.5);

        // Atualiza reativamente para 2.0rem
        dynamicItem.size_side = '2.0rem';
        await waitTicks(5);

        const updatedRect = iconDiv.getBoundingClientRect();
        expect(Math.abs(updatedRect.width - (2.0 * rootFs))).toBeLessThanOrEqual(1.5);
    });
});
