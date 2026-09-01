import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive, ref } from 'vue';

const route = reactive<Record<string, any>>({ name: 'board', meta: {}, query: {}, params: {} });

vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push: vi.fn(), hasRoute: () => false, currentRoute: { value: route } }),
    RouterView: { template: '<div class="router-view-stub" />' }
}));

const menusRef = ref<any>(null);

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef
}));

import MaxApp from '../../src/components/MaxApp.vue';
import MaxPageLayout from '../../src/components/MaxPageLayout.vue';
import { useUserStore } from '../../src/stores/useUser.Store';
import { useLoginStore } from '../../src/stores/useLogin.Store';
import { getMaxAppConfig, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

let pinia: Pinia;

const mountApp = (options: Record<string, any> = {}) => mount(MaxApp, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        stubs: { MaxLogo: { template: '<div class="max-logo-stub" />' }, ...(options.global?.stubs ?? {}) }
    }
});

/** Simula o usuário já carregado pelo @maxvue/max-pinia. */
const loadUser = (data: Record<string, any> | null = { id: 1, name: 'Maria' }) => {
    const user = useUserStore();
    user.data = data;
    (user as any).status = { server: { get: { is_success: true } } };

    return user;
};

describe('MaxApp', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        resetMaxAppConfig();
        Object.assign(route, { name: 'board', meta: {}, query: {}, params: {} });
        localStorage.clear();
    });

    afterEach(() => resetMaxAppConfig());

    describe('branching de layout', () => {
        it('não renderiza nada sem rota resolvida', () => {
            route.name = undefined;

            expect(mountApp().find('.max-app').exists()).toBe(false);
        });

        it('não renderiza o layout enquanto o usuário não carregou', () => {
            const wrapper = mountApp();

            expect(wrapper.find('.max-app').exists()).toBe(true);
            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(false);
        });

        it('renderiza só o conteúdo em rotas de site', () => {
            route.meta = { layout: 'site' };
            loadUser();

            const wrapper = mountApp();

            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(false);
        });

        it('renderiza só o conteúdo em rotas blank', () => {
            route.meta = { layout: 'blank' };
            loadUser();

            expect(mountApp().findComponent(MaxPageLayout).exists()).toBe(false);
        });

        it('trata como blank as rotas listadas em blankPages', () => {
            route.name = 'Contract';
            loadUser();

            const wrapper = mountApp({ props: { blankPages: ['Contract', 'Wire'] } });

            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(false);
        });

        it('renderiza o layout completo com usuário autenticado', () => {
            loadUser();

            expect(mountApp().findComponent(MaxPageLayout).exists()).toBe(true);
        });

        it('renderiza a tela de login com usuário carregado e sem sessão', () => {
            loadUser(null);

            const wrapper = mountApp();

            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(false);
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
        });

        it('permite substituir a tela de login pelo slot', () => {
            loadUser(null);

            const wrapper = mountApp({ slots: { login: '<div class="login-custom">x</div>' } });

            expect(wrapper.find('.login-custom').exists()).toBe(true);
        });

        it('permite substituir a área autenticada pelo slot', () => {
            loadUser();

            const wrapper = mountApp({ slots: { authenticated: '<div class="auth-custom">x</div>' } });

            expect(wrapper.find('.auth-custom').exists()).toBe(true);
            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(false);
        });
    });

    describe('singletons de UI', () => {
        it('sempre renderiza toast e confirmação', () => {
            const wrapper = mountApp();

            expect(wrapper.findComponent({ name: 'MaxToast' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'MaxPopoverConfirm' }).exists()).toBe(true);
        });

        it('renderiza a tela de carregamento', () => {
            expect(mountApp().findComponent({ name: 'MaxLoadScreen' }).exists()).toBe(true);
        });
    });

    describe('slot extras', () => {
        it('não renderiza extras sem autenticação', () => {
            const wrapper = mountApp({ slots: { extras: '<div class="extras">x</div>' } });

            expect(wrapper.find('.extras').exists()).toBe(false);
        });

        it('renderiza extras com usuário autenticado', () => {
            loadUser();

            const wrapper = mountApp({ slots: { extras: '<div class="extras">x</div>' } });

            expect(wrapper.find('.extras').exists()).toBe(true);
        });
    });

    describe('repasse de slots ao layout', () => {
        it.each(['status', 'chat', 'bugs', 'notifications', 'voip', 'live'])('repassa o slot %s', (slot) => {
            loadUser();

            const wrapper = mountApp({ slots: { [slot]: `<div class="slot-${slot}">x</div>` } });

            expect(wrapper.find(`.slot-${slot}`).exists()).toBe(true);
        });

        it('repassa o slot user', () => {
            loadUser();

            const wrapper = mountApp({ slots: { user: '<div class="usuario-custom">x</div>' } });

            expect(wrapper.find('.usuario-custom').exists()).toBe(true);
        });
    });

    describe('configuração por props', () => {
        it('aplica as rotas informadas', () => {
            mountApp({ props: { routeLogin: 'entrar', routeProviders: 'oauth.lista', routeUser: 'me' } });

            const config = getMaxAppConfig();

            expect(config.routeLogin).toBe('entrar');
            expect(config.routeProviders).toBe('oauth.lista');
            expect(config.routeUser).toBe('me');
        });

        it('mantém os padrões quando as rotas não são informadas', () => {
            mountApp();

            expect(getMaxAppConfig().routeLogin).toBe('login');
            expect(getMaxAppConfig().routeUser).toBe('user.data');
        });

        it('propaga allowUserName para a store de login', () => {
            mountApp({ props: { allowUserName: false } });

            expect(useLoginStore().allow_user_name).toBe(false);
        });

        it('mantém os métodos de login habilitados por padrão', () => {
            mountApp();

            const login = useLoginStore();

            expect(login.allow_email).toBe(true);
            expect(login.allow_phone).toBe(true);
            expect(login.allow_user_name).toBe(true);
        });

        it('propaga allowEmail e allowPhone', () => {
            mountApp({ props: { allowEmail: false, allowPhone: false } });

            const login = useLoginStore();

            expect(login.allow_email).toBe(false);
            expect(login.allow_phone).toBe(false);
        });

        // Regressão: os eventos morriam no MaxPageLayout, que não os
        // reemitia — o @logout da aplicação nunca disparava e o usuário
        // clicava em "Sair" sem efeito nenhum.
        it.each(['logout', 'profile', 'settings', 'support', 'endImpersonate'])(
            'propaga o evento %s do menu do usuário até quem usa o MaxApp',
            async (evento) => {
                loadUser();

                const wrapper = mountApp();
                const section = wrapper.findComponent({ name: 'MaxUserSection' });

                expect(section.exists()).toBe(true);

                section.vm.$emit(evento);
                await wrapper.vm.$nextTick();

                expect(wrapper.emitted(evento)).toBeTruthy();
            }
        );

        it('propaga toggleDarkMode até quem usa o MaxApp', async () => {
            loadUser();

            const wrapper = mountApp();
            wrapper.findComponent({ name: 'MaxUserSection' }).vm.$emit('toggleDarkMode');
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('toggleDarkMode')).toBeTruthy();
        });

        it('repassa a logo até o menu lateral', () => {
            loadUser();

            const wrapper = mountApp({ props: { logo: '/get_file?file=logo.svg' } });

            expect(wrapper.findComponent(MaxPageLayout).props('logo')).toBe('/get_file?file=logo.svg');
        });

        it('repassa addItems ao layout', () => {
            loadUser();
            const addItems = [{ label: 'Novo Projeto', icon: 'mdi:plus', route: 'new_project' }];

            const wrapper = mountApp({ props: { addItems } });

            expect(wrapper.findComponent(MaxPageLayout).props('addItems')).toEqual(addItems);
        });

        it('repassa bottomTabs e sideMenuGroups ao layout', () => {
            loadUser();
            const bottomTabs = [{ name: 'inicio', label: 'Início', icon: 'mdi:home' }];
            const sideMenuGroups = [{ title: 'Geral', items: [] }];

            const wrapper = mountApp({ props: { bottomTabs, sideMenuGroups } });

            const layout = wrapper.findComponent(MaxPageLayout);
            expect(layout.props('bottomTabs')).toEqual(bottomTabs);
            expect(layout.props('sideMenuGroups')).toEqual(sideMenuGroups);
        });

        it('propaga o evento fabClick do layout', async () => {
            loadUser();

            const wrapper = mountApp();
            wrapper.findComponent(MaxPageLayout).vm.$emit('fabClick');
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('fabClick')).toHaveLength(1);
        });
    });

    describe('uso pretendido no engeapp', () => {
        it('funciona com a assinatura de uma linha', () => {
            loadUser();

            const wrapper = mountApp({
                props: { routeLogin: 'login', routeProviders: 'social.providers', allowUserName: false }
            });

            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(true);
            expect(useLoginStore().allow_user_name).toBe(false);
            expect(getMaxAppConfig().routeProviders).toBe('social.providers');
        });
    });
});
