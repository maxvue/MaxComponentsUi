import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/board', name: 'board', component: { template: '<div>Board</div>' } },
        { path: '/inicio', name: 'inicio', component: { template: '<div>Inicio</div>' } }
    ]
});

const menusRef = ref<any>({ side: [] });

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef,
    getRoute: (r: string) => r
}));

import MaxApp from '../../src/components/MaxApp.vue';
import MaxLogo from '../../src/components/MaxLogo.vue';
import MaxSideMenu from '../../src/components/MaxSideMenu.vue';
import { useUserStore } from '../../src/stores/useUser.Store';
import { useSystemStore } from '../../src/stores/useSystem.Store';
import { configureMaxApp, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

let pinia: Pinia;

const mountApp = (options: Record<string, any> = {}) => mount(MaxApp, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia, router],
        stubs: {
            teleport: true,
            MaxIcon: { template: '<span class="max-icon-stub" />' },
            ...(options.global?.stubs ?? {})
        }
    }
});

const loadUser = (data: Record<string, any> | null = { id: 1, name: 'Maria' }) => {
    const user = useUserStore();
    user.data = data;
    (user as any).status = { server: { get: { is_success: true } } };

    return user;
};

describe('MaxApp — Renderização da Logo no Modo Desktop (Integração)', () => {
    beforeEach(async () => {
        pinia = createPinia();
        setActivePinia(pinia);
        resetMaxAppConfig();
        menusRef.value = { side: [] };
        router.push('/board');
        await router.isReady();
    });

    afterEach(() => {
        resetMaxAppConfig();
    });

    it('renderiza o espaço da logo e o MaxLogo real com tag <img> visível quando logo é informada via prop', async () => {
        loadUser();

        const wrapper = mountApp({
            props: {
                logo: '/get_file?file=logo.svg',
                screen: 'desktop'
            }
        });

        await wrapper.vm.$nextTick();

        const sideMenu = wrapper.findComponent(MaxSideMenu);
        expect(sideMenu.exists()).toBe(true);

        const spaceLogo = sideMenu.find('.space-logo');
        expect(spaceLogo.exists()).toBe(true);

        const logoComponent = sideMenu.findComponent(MaxLogo);
        expect(logoComponent.exists()).toBe(true);
        expect(logoComponent.props('src')).toBe('/get_file?file=logo.svg');

        const img = logoComponent.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('/get_file?file=logo.svg');
    });

    it('renderiza a logo usando a configuração global de configureMaxApp quando a prop logo for omitida', async () => {
        loadUser();
        configureMaxApp({ logo: '/get_file?file=logo.svg' });

        const wrapper = mountApp({
            props: {
                screen: 'desktop'
            }
        });

        await wrapper.vm.$nextTick();

        const sideMenu = wrapper.findComponent(MaxSideMenu);
        expect(sideMenu.exists()).toBe(true);

        const spaceLogo = sideMenu.find('.space-logo');
        expect(spaceLogo.exists()).toBe(true);

        const logoComponent = sideMenu.findComponent(MaxLogo);
        expect(logoComponent.exists()).toBe(true);
        expect(logoComponent.props('src')).toBe('/get_file?file=logo.svg');

        const img = logoComponent.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('/get_file?file=logo.svg');
    });

    it('renderiza a logo no desktop mesmo que o breakpoint da janela seja simulado como mobile se screen="desktop" foi informado', async () => {
        loadUser();
        const system = useSystemStore();
        vi.spyOn(system, 'type_device', 'get').mockReturnValue('mobile');

        const wrapper = mountApp({
            props: {
                logo: '/get_file?file=logo.svg',
                screen: 'desktop'
            }
        });

        await wrapper.vm.$nextTick();

        const spaceLogo = wrapper.find('.space-logo');
        expect(spaceLogo.exists()).toBe(true);

        const img = wrapper.find('.space-logo img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('/get_file?file=logo.svg');
    });

    it('dispara o evento logoClick ao clicar na logo no desktop', async () => {
        loadUser();

        const wrapper = mountApp({
            props: {
                logo: '/get_file?file=logo.svg',
                screen: 'desktop'
            }
        });

        await wrapper.vm.$nextTick();

        const spaceLogo = wrapper.find('.space-logo');
        expect(spaceLogo.exists()).toBe(true);

        await spaceLogo.trigger('click');

        expect(wrapper.emitted('logoClick')).toHaveLength(1);
    });
});
