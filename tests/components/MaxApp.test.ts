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
import { useSystemStore } from '../../src/stores/useSystem.Store';
import { useColorsStore } from '../../src/stores/useColors.Store';
import { configureMaxApp, getMaxAppConfig, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

let pinia: Pinia;
const mountedWrappers: any[] = [];

const mountApp = (options: Record<string, any> = {}) => {
    const wrapper = mount(MaxApp, {
        ...options,
        global: {
            ...(options.global ?? {}),
            plugins: [pinia],
            stubs: { teleport: true, MaxLogo: { template: '<div class="max-logo-stub" />' }, ...(options.global?.stubs ?? {}) }
        }
    });
    mountedWrappers.push(wrapper);
    return wrapper;
};

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
        menusRef.value = null;
        Object.assign(route, { name: 'board', path: undefined, meta: {}, query: {}, params: {} });
        localStorage.clear();
    });

    afterEach(() => {
        resetMaxAppConfig();
        menusRef.value = null;
        Object.assign(route, { name: 'board', path: undefined, meta: {}, query: {}, params: {} });
        while (mountedWrappers.length > 0) {
            const w = mountedWrappers.pop();
            try { w.unmount(); } catch {}
        }
    });

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

        it('renderiza tela de login em rota guest mesmo quando o carregamento de usuário falhar (is_error)', () => {
            route.meta = { layout: 'guest' };
            const user = useUserStore();
            user.data = null;
            (user as any).status = { server: { get: { is_success: false, is_error: true } } };

            const wrapper = mountApp();

            expect(wrapper.find('.max-app-login').exists()).toBe(true);
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(false);
            expect(wrapper.find('.max-app-error').exists()).toBe(false);
        });

        it('renderiza o fallback de erro acessível quando o usuário falha em rota protegida', () => {
            route.meta = { layout: 'default', requiresAuth: true };
            const user = useUserStore();
            user.data = null;
            (user as any).status = { server: { get: { is_success: false, is_error: true, error: 'Network Error' } } };

            const wrapper = mountApp();

            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(false);
            expect(wrapper.find('.max-app-error').exists()).toBe(true);
            const alert = wrapper.find('[role="alert"]');
            expect(alert.exists()).toBe(true);
            expect(alert.text()).toContain('Falha ao carregar a aplicação');
            expect(alert.find('.max-app-error-retry-btn').exists()).toBe(true);
        });

        it('permite substituir o estado de erro pelo slot error com props error e retry', async () => {
            route.meta = { layout: 'default', requiresAuth: true };
            const user = useUserStore();
            user.data = null;
            (user as any).status = { server: { get: { is_success: false, is_error: true, error: '500 Server Error' } } };

            let retryChamado = false;
            (user as any).retry = async () => {
                retryChamado = true;
            };

            const wrapper = mountApp({
                slots: {
                    error: `
                        <template #error="{ error, retry }">
                            <div class="custom-error">
                                <span class="err-msg">{{ error }}</span>
                                <button class="custom-retry" @click="retry">Recarregar</button>
                            </div>
                        </template>
                    `
                }
            });

            expect(wrapper.find('.custom-error').exists()).toBe(true);
            expect(wrapper.find('.err-msg').text()).toBe('500 Server Error');

            await wrapper.find('.custom-retry').trigger('click');
            expect(retryChamado).toBe(true);
        });

        it('renderiza só o conteúdo da rota sem barras quando freeMode for true, mesmo com usuário autenticado', () => {
            loadUser();

            const wrapper = mountApp({ props: { freeMode: true } });

            expect(wrapper.find('.max-app-blank').exists()).toBe(true);
            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(false);
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
        });

        it('mantém os singletons de UI ativos mesmo com freeMode: true', () => {
            const wrapper = mountApp({ props: { freeMode: true } });

            expect(wrapper.findComponent({ name: 'MaxToast' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'MaxPopoverConfirm' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'MaxLoadScreen' }).exists()).toBe(true);
        });

        it('renderiza só o conteúdo da rota sem barras quando blankMode for true (alias de freeMode)', () => {
            loadUser();

            const wrapper = mountApp({ props: { blankMode: true } });

            expect(wrapper.find('.max-app-blank').exists()).toBe(true);
            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(false);
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
        });

        it('renderiza o layout completo com noLogin: true mesmo sem usuário autenticado', () => {
            const wrapper = mountApp({ props: { noLogin: true } });

            expect(wrapper.find('.max-app-login').exists()).toBe(false);
            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(true);
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
        });

        it('noLogin não renderiza a tela de erro quando bootstrap falhar', () => {
            route.meta = { layout: 'default' };
            const user = useUserStore();
            user.data = null;
            (user as any).status = { server: { get: { is_success: false, is_error: true, error: 'Erro de rede' } } };

            const wrapper = mountApp({ props: { noLogin: true } });

            expect(wrapper.find('.max-app-error').exists()).toBe(false);
            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(true);
        });

        it('não libera o slot extras quando noLogin for true sem usuário autenticado', () => {
            const wrapper = mountApp({
                props: { noLogin: true },
                slots: { extras: '<div class="extra-seguro">x</div>' }
            });

            expect(wrapper.find('.extra-seguro').exists()).toBe(false);
        });

        it('mantém precedência de freeMode e blankMode sobre noLogin', () => {
            const wrapperFree = mountApp({ props: { noLogin: true, freeMode: true } });
            expect(wrapperFree.find('.max-app-blank').exists()).toBe(true);
            expect(wrapperFree.findComponent(MaxPageLayout).exists()).toBe(false);

            const wrapperBlank = mountApp({ props: { noLogin: true, blankMode: true } });
            expect(wrapperBlank.find('.max-app-blank').exists()).toBe(true);
            expect(wrapperBlank.findComponent(MaxPageLayout).exists()).toBe(false);
        });

        it('mantém o fluxo normal quando noLogin é false ou omitido', () => {
            loadUser(null);

            const wrapper = mountApp({ props: { noLogin: false } });

            expect(wrapper.find('.max-app-login').exists()).toBe(true);
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

        it.each(['mobile-center', 'mobile-actions', 'switcher'])('repassa o slot mobile %s ao layout', (slot) => {
            loadUser();
            if (slot === 'switcher') useSystemStore().side_menu_open = true;

            const wrapper = mountApp({
                props: { screen: 'mobile' },
                slots: { [slot]: `<div class="slot-${slot}">x</div>` }
            });

            expect(wrapper.find(`.slot-${slot}`).exists()).toBe(true);
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

        it('repassa bottomShowLabels ao layout', () => {
            loadUser();

            const wrapper = mountApp({ props: { bottomShowLabels: true } });

            expect(wrapper.findComponent(MaxPageLayout).props('bottomShowLabels')).toBe(true);
        });

        it('repassa routeLogo ao layout com valor padrão "/"', () => {
            loadUser();

            const wrapper = mountApp();

            expect(wrapper.findComponent(MaxPageLayout).props('routeLogo')).toBe('/');
        });

        it('repassa routeLogo customizada ao layout', () => {
            loadUser();

            const wrapper = mountApp({ props: { routeLogo: 'dashboard' } });

            expect(wrapper.findComponent(MaxPageLayout).props('routeLogo')).toBe('dashboard');
        });

        it('repassa a logo de configureMaxApp ao layout quando a prop logo for omitida', () => {
            loadUser();
            configureMaxApp({ logo: '/global-logo.svg' });

            const wrapper = mountApp();

            expect(wrapper.findComponent(MaxPageLayout).props('logo')).toBe('/global-logo.svg');
        });

        it('repassa routeLogo de configureMaxApp ao layout quando a prop routeLogo for omitida', () => {
            loadUser();
            configureMaxApp({ routeLogo: 'dashboard' });

            const wrapper = mountApp();

            expect(wrapper.findComponent(MaxPageLayout).props('routeLogo')).toBe('dashboard');
        });

        it('repassa a prop screen ao layout', () => {
            loadUser();

            const wrapper = mountApp({ props: { screen: 'desktop' } });

            expect(wrapper.findComponent(MaxPageLayout).props('screen')).toBe('desktop');
        });

        it('propaga o evento fabClick do layout', async () => {
            loadUser();

            const wrapper = mountApp();
            wrapper.findComponent(MaxPageLayout).vm.$emit('fabClick');
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('fabClick')).toHaveLength(1);
        });

        it('propaga o evento logoClick do layout', async () => {
            loadUser();

            const wrapper = mountApp();
            wrapper.findComponent(MaxPageLayout).vm.$emit('logoClick');
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('logoClick')).toHaveLength(1);
        });

        it('preserva iconServer e rotas explícitas do boot após a montagem do MaxApp', () => {
            configureMaxApp({
                iconServer: 'https://icons.boot-app.com',
                routeLogin: 'boot.login'
            });

            mountApp({ props: { routeLogin: 'override.login' } });

            const config = getMaxAppConfig();
            expect(config.iconServer).toBe('https://icons.boot-app.com');
            expect(config.routeIcons).toBe('https://icons.boot-app.com/api/icons');
            expect(config.routeIconsSync).toBe('https://icons.boot-app.com/api/icons');
            expect(config.routeLogin).toBe('override.login');
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

    describe('gerenciamento de dark mode', () => {
        beforeEach(() => {
            document.documentElement.classList.remove('dark');
        });

        afterEach(() => {
            document.documentElement.classList.remove('dark');
        });

        it('aplica a classe .dark quando o usuário já tem darkMode: true nas configurações ao carregar', async () => {
            loadUser({ id: 1, name: 'Maria', settings: { darkMode: true } });

            mountApp();
            await new Promise((r) => setTimeout(r, 10));

            expect(document.documentElement.classList.contains('dark')).toBe(true);
        });

        it('remove a classe .dark quando o usuário tem darkMode: false nas configurações ao carregar', async () => {
            document.documentElement.classList.add('dark');
            loadUser({ id: 1, name: 'Maria', settings: { darkMode: false } });

            mountApp();
            await new Promise((r) => setTimeout(r, 10));

            expect(document.documentElement.classList.contains('dark')).toBe(false);
        });

        it('alterna o modo escuro ao receber toggleDarkMode e persiste na store', async () => {
            const user = loadUser({ id: 1, name: 'Maria', settings: { darkMode: false } });
            const saveSpy = vi.fn();
            (user as any).save = saveSpy;

            const wrapper = mountApp();
            const layout = wrapper.findComponent(MaxPageLayout);

            expect(document.documentElement.classList.contains('dark')).toBe(false);

            // Primeiro clique: ativa
            layout.vm.$emit('toggleDarkMode');
            await wrapper.vm.$nextTick();

            expect(document.documentElement.classList.contains('dark')).toBe(true);
            expect(user.data?.settings?.darkMode).toBe(true);
            expect(saveSpy).toHaveBeenCalledTimes(1);
            expect(wrapper.emitted('toggleDarkMode')).toBeTruthy();

            // Segundo clique: desativa
            layout.vm.$emit('toggleDarkMode');
            await wrapper.vm.$nextTick();

            expect(document.documentElement.classList.contains('dark')).toBe(false);
            expect(user.data?.settings?.darkMode).toBe(false);
            expect(saveSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('gerenciamento de tamanho da fonte', () => {
        beforeEach(() => {
            document.documentElement.style.fontSize = '';
            document.documentElement.style.removeProperty('--max-font-size-base');
            if (typeof localStorage !== 'undefined') localStorage.clear();
        });

        afterEach(() => {
            document.documentElement.style.fontSize = '';
            document.documentElement.style.removeProperty('--max-font-size-base');
            if (typeof localStorage !== 'undefined') localStorage.clear();
        });

        it('aplica fontSize quando o usuário já tem fontSize configurado ao carregar', async () => {
            loadUser({ id: 1, name: 'Maria', settings: { fontSize: 18 } });

            mountApp();
            await new Promise((r) => setTimeout(r, 10));

            expect(document.documentElement.style.fontSize).toBe('18px');
            expect(document.documentElement.style.getPropertyValue('--max-font-size-base')).toBe('18px');
        });

        it('atualiza fontSize ao receber changeFontSize do layout e persiste na store', async () => {
            const user = loadUser({ id: 1, name: 'Maria', settings: { fontSize: 16 } });
            const saveSpy = vi.fn();
            (user as any).save = saveSpy;

            const wrapper = mountApp();
            const layout = wrapper.findComponent(MaxPageLayout);

            layout.vm.$emit('changeFontSize', 19);
            await wrapper.vm.$nextTick();

            expect(document.documentElement.style.fontSize).toBe('19px');
            expect(user.data?.settings?.fontSize).toBe(19);
            expect(saveSpy).toHaveBeenCalledTimes(1);
            expect(wrapper.emitted('changeFontSize')).toEqual([[19]]);
        });

        it('atualiza fontSize ao clicar no controle real de ajuste de fonte dentro do menu do avatar no shell', async () => {
            const user = loadUser({ id: 1, name: 'Maria', settings: { fontSize: 16, customTheme: 'dark-blue' } });
            const saveSpy = vi.fn();
            (user as any).save = saveSpy;

            const wrapper = mountApp();
            await wrapper.vm.$nextTick();

            const trigger = wrapper.find('.user-profile-trigger');
            expect(trigger.exists()).toBe(true);

            await trigger.trigger('click');
            await wrapper.vm.$nextTick();

            const plusBtn = wrapper.find('button[aria-label="Aumentar tamanho da fonte"]');
            expect(plusBtn.exists()).toBe(true);

            await plusBtn.trigger('click');
            await wrapper.vm.$nextTick();

            expect(document.documentElement.style.fontSize).toBe('17px');
            expect(user.data?.settings?.fontSize).toBe(17);
            expect(user.data?.settings?.customTheme).toBe('dark-blue');
            expect(saveSpy).toHaveBeenCalledTimes(1);
            expect(wrapper.emitted('changeFontSize')).toEqual([[17]]);
        });
    });

    describe('disponibilidade de recursos (is_disponible)', () => {
        it('renderiza o aviso em desenvolvimento e não monta RouterView quando rota atual é is_disponible: false', () => {
            loadUser();
            menusRef.value = {
                side: [
                    { route: 'board', is_disponible: false, details: { title: 'Quadro' } }
                ]
            };

            const wrapper = mountApp();

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(true);
            expect(wrapper.text()).toContain('Recurso em desenvolvimento. Este recurso estará disponível em breve');
            expect(wrapper.find('.router-view-stub').exists()).toBe(false);
            expect(wrapper.findComponent(MaxPageLayout).exists()).toBe(true);
        });

        it('mantém quantidade de itens e botões de menu inalterados quando is_disponible é false', () => {
            loadUser();
            const menusTrue = {
                side: [
                    { id: '1', route: 'board', is_disponible: true, details: { title: 'Quadro' } },
                    { id: '2', route: 'clientes', is_disponible: true, details: { title: 'Clientes' } }
                ]
            };
            const menusFalse = {
                side: [
                    { id: '1', route: 'board', is_disponible: false, details: { title: 'Quadro' } },
                    { id: '2', route: 'clientes', is_disponible: false, details: { title: 'Clientes' } }
                ]
            };

            menusRef.value = menusTrue;
            const wrapperTrue = mountApp();
            const countTrue = wrapperTrue.findComponent(MaxPageLayout).props('sideMenuItems')?.length
                ?? wrapperTrue.findAll('.side-menu-item').length;

            wrapperTrue.unmount();

            menusRef.value = menusFalse;
            const wrapperFalse = mountApp();
            const countFalse = wrapperFalse.findComponent(MaxPageLayout).props('sideMenuItems')?.length
                ?? wrapperFalse.findAll('.side-menu-item').length;

            expect(countFalse).toBe(countTrue);
        });

        it('renderiza RouterView normalmente quando is_disponible é true ou ausente', () => {
            loadUser();
            menusRef.value = {
                side: [
                    { route: 'board', is_disponible: true, details: { title: 'Quadro' } },
                    { route: 'clientes', details: { title: 'Clientes' } }
                ]
            };

            const wrapper = mountApp();

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(false);
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
        });

        it('resolve disponibilidade a partir de props.sideMenuItems', () => {
            loadUser();
            const wrapper = mountApp({
                props: {
                    sideMenuItems: [
                        { route: 'board', is_disponible: false, details: { title: 'Quadro' } }
                    ]
                }
            });

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(true);
            expect(wrapper.find('.router-view-stub').exists()).toBe(false);
        });

        it('resolve disponibilidade a partir de props.sideMenuGroups', () => {
            loadUser();
            const wrapper = mountApp({
                props: {
                    sideMenuGroups: [
                        {
                            title: 'Módulo Principal',
                            items: [
                                { route: 'board', is_disponible: false, details: { title: 'Quadro' } }
                            ]
                        }
                    ]
                }
            });

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(true);
            expect(wrapper.find('.router-view-stub').exists()).toBe(false);
        });

        it('respeita precedência desktop: sideMenuItems sobrepõe sideMenuGroups e store', () => {
            loadUser();
            menusRef.value = { side: [{ route: 'board', is_disponible: false }] };
            const wrapper = mountApp({
                props: {
                    screen: 'desktop',
                    sideMenuGroups: [{ title: 'G', items: [{ route: 'board', is_disponible: false }] }],
                    sideMenuItems: [{ route: 'board', is_disponible: true }]
                }
            });

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(false);
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
        });

        it('respeita precedência mobile: sideMenuGroups sobrepõe sideMenuItems e store', () => {
            loadUser();
            menusRef.value = { side: [{ route: 'board', is_disponible: true }] };
            const wrapper = mountApp({
                props: {
                    screen: 'mobile',
                    sideMenuItems: [{ route: 'board', is_disponible: true }],
                    sideMenuGroups: [{ title: 'G', items: [{ route: 'board', is_disponible: false }] }]
                }
            });

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(true);
            expect(wrapper.find('.router-view-stub').exists()).toBe(false);
        });

        it('considera bottomTabs para indisponibilidade no mobile', () => {
            loadUser();
            const wrapper = mountApp({
                props: {
                    screen: 'mobile',
                    bottomTabs: [
                        { name: 'board', label: 'Quadro', icon: 'mdi:view-dashboard', is_disponible: false }
                    ]
                }
            });

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(true);
            expect(wrapper.find('.router-view-stub').exists()).toBe(false);
        });

        it('NÃO considera bottomTabs para indisponibilidade no desktop', () => {
            loadUser();
            const wrapper = mountApp({
                props: {
                    screen: 'desktop',
                    bottomTabs: [
                        { name: 'board', label: 'Quadro', icon: 'mdi:view-dashboard', is_disponible: false }
                    ]
                }
            });

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(false);
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
        });

        it('reage a navegação entre rota disponível e rota indisponível sem reload', async () => {
            loadUser();
            menusRef.value = {
                side: [
                    { route: 'board', is_disponible: true },
                    { route: 'relatorios', is_disponible: false }
                ]
            };

            const wrapper = mountApp();
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
            expect(wrapper.find('.max-app-unavailable').exists()).toBe(false);

            route.name = 'relatorios';
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(true);
            expect(wrapper.find('.router-view-stub').exists()).toBe(false);

            route.name = 'board';
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
            expect(wrapper.find('.max-app-unavailable').exists()).toBe(false);
        });

        it('reage a atualização tardia de menusRef da store', async () => {
            loadUser();
            menusRef.value = null;

            const wrapper = mountApp();
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);

            menusRef.value = {
                side: [{ route: 'board', is_disponible: false }]
            };
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(true);
            expect(wrapper.find('.router-view-stub').exists()).toBe(false);
        });

        it('reage a alteração no valor do campo is_disponible de false para true', async () => {
            loadUser();
            const item = reactive({ route: 'board', is_disponible: false });
            menusRef.value = { side: [item] };

            const wrapper = mountApp();
            expect(wrapper.find('.max-app-unavailable').exists()).toBe(true);

            item.is_disponible = true;
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.max-app-unavailable').exists()).toBe(false);
            expect(wrapper.find('.router-view-stub').exists()).toBe(true);
        });

        it('preserva integridade de slot authenticated customizado sem injetar aviso automático', () => {
            loadUser();
            menusRef.value = { side: [{ route: 'board', is_disponible: false }] };

            const wrapper = mountApp({
                slots: {
                    authenticated: '<div class="custom-authenticated-layout">Layout Customizado</div>'
                }
            });

            expect(wrapper.find('.custom-authenticated-layout').exists()).toBe(true);
            expect(wrapper.find('.max-app-unavailable').exists()).toBe(false);
        });

        it('não afeta rotas públicas ou login mesmo se houver menu correspondente indisponível', () => {
            route.name = 'login';
            route.meta = { layout: 'guest' };
            menusRef.value = { side: [{ route: 'login', is_disponible: false }] };

            const wrapper = mountApp();

            expect(wrapper.find('.max-app-login').exists()).toBe(true);
            expect(wrapper.find('.max-app-unavailable').exists()).toBe(false);
        });
    });

    describe('passagem de tamanhos de ícones por item nos menus (T5)', () => {
        it('repassa campos de tamanho em sideMenuItems para o layout sem perda de dados', () => {
            loadUser();
            const sideItems = [
                {
                    id: 'solar',
                    size_side: '1.8rem',
                    details: { route: 'board', icon: 'mdi:solar-panel', title: 'Solar' }
                },
                {
                    id: 'clients',
                    details: { route: 'clients', icon: 'mdi:account', title: 'Clientes', size: '20px' }
                }
            ];

            const wrapper = mountApp({
                props: { sideMenuItems: sideItems }
            });

            const pageLayout = wrapper.findComponent(MaxPageLayout);
            expect(pageLayout.exists()).toBe(true);
            expect(pageLayout.props('sideMenuItems')).toEqual(sideItems);
            expect(pageLayout.props('sideMenuItems')?.[0]?.size_side).toBe('1.8rem');
            expect(pageLayout.props('sideMenuItems')?.[1]?.details?.size).toBe('20px');
        });

        it('repassa campos de tamanho em bottomTabs e addItems para os menus inferiores e superiores', () => {
            loadUser();
            const bottomTabs = [
                { name: 'board', label: 'Projetos', icon: 'mdi:solar-panel', size_bottom: '1.5rem' },
                { name: 'clients', label: 'Clientes', icon: 'mdi:account', size: '18px' }
            ];
            const addItems = [
                { label: 'Novo Projeto', icon: 'mdi:plus', size_top: '1.6rem', size_bottom: '1.4rem' }
            ];

            const wrapper = mountApp({
                props: {
                    bottomTabs,
                    addItems
                }
            });

            const pageLayout = wrapper.findComponent(MaxPageLayout);
            expect(pageLayout.exists()).toBe(true);
            expect(pageLayout.props('bottomTabs')).toEqual(bottomTabs);
            expect(pageLayout.props('addItems')).toEqual(addItems);
            expect(pageLayout.props('bottomTabs')?.[0]?.size_bottom).toBe('1.5rem');
            expect(pageLayout.props('addItems')?.[0]?.size_top).toBe('1.6rem');
        });

        it('reage a alterações reativas nos tamanhos de ícones sem remontar o componente', async () => {
            loadUser();
            const item = reactive({
                id: 'reactive-item',
                size_side: '1.5rem',
                details: { route: 'board', icon: 'mdi:solar-panel', title: 'Solar' }
            });

            const wrapper = mountApp({
                props: { sideMenuItems: [item] }
            });

            const pageLayout = wrapper.findComponent(MaxPageLayout);
            expect(pageLayout.props('sideMenuItems')?.[0]?.size_side).toBe('1.5rem');

            // Alteração reativa direta no objeto
            item.size_side = '2.2rem';
            await wrapper.vm.$nextTick();

            expect(pageLayout.props('sideMenuItems')?.[0]?.size_side).toBe('2.2rem');
        });

        it('preserva campos de tamanho vindos de menus em cache do useListMenusStore', async () => {
            loadUser();
            menusRef.value = {
                side: [
                    {
                        id: 'store-item',
                        size_side: '1.7rem',
                        details: { route: 'board', icon: 'mdi:solar-panel', title: 'Solar Store' }
                    }
                ]
            };

            const wrapper = mountApp();
            await wrapper.vm.$nextTick();

            const pageLayout = wrapper.findComponent(MaxPageLayout);
            expect(pageLayout.exists()).toBe(true);
            const verticalItem = pageLayout.findComponent({ name: 'MaxMenuVerticalItem' });
            expect(verticalItem.exists()).toBe(true);
            expect(verticalItem.props('items')?.[0]?.size_side).toBe('1.7rem');
        });
    });

    describe('paleta dinâmica de cores (prop colors)', () => {
        beforeEach(() => {
            const styleEl = document.getElementById('max-dynamic-colors');
            if (styleEl) styleEl.remove();
        });

        afterEach(() => {
            const styleEl = document.getElementById('max-dynamic-colors');
            if (styleEl) styleEl.remove();
        });

        it('aplica as variáveis de cores padrão quando a prop colors for omitida', () => {
            mountApp();

            const styleEl = document.getElementById('max-dynamic-colors');
            expect(styleEl).toBeTruthy();
            expect(styleEl?.textContent).toContain('--pink: #ED58A2;');
        });

        it('aplica overrides de cores passados via prop colors no DOM e na store', () => {
            mountApp({
                props: {
                    colors: {
                        pink: '#AABBCC',
                        blue: '#112233'
                    }
                }
            });

            const colorsStore = useColorsStore();
            expect(colorsStore.colors.pink).toBe('#AABBCC');
            expect(colorsStore.colors.blue).toBe('#112233');

            const styleEl = document.getElementById('max-dynamic-colors');
            expect(styleEl?.textContent).toContain('--pink: #AABBCC;');
            expect(styleEl?.textContent).toContain('--blue: #112233;');
        });

        it('reage a alterações dinâmicas na prop colors', async () => {
            const wrapper = mountApp({
                props: {
                    colors: {
                        pink: '#111111'
                    }
                }
            });

            const styleEl = document.getElementById('max-dynamic-colors');
            expect(styleEl?.textContent).toContain('--pink: #111111;');

            await wrapper.setProps({
                colors: {
                    pink: '#222222'
                }
            });

            expect(styleEl?.textContent).toContain('--pink: #222222;');
        });
    });
});
