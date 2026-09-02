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
    RouterView: { template: '<div class="router-view-stub">Content</div>' }
}));

const menusRef = ref<any>(null);

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef
}));

import MaxApp from '../../src/components/MaxApp.vue';
import { useUserStore } from '../../src/stores/useUser.Store';
import { resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

let pinia: Pinia;

const mountApp = (options: Record<string, any> = {}) => mount(MaxApp, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        stubs: { MaxLogo: { template: '<div class="max-logo-stub" />' }, ...(options.global?.stubs ?? {}) }
    }
});

const loadUser = (data: Record<string, any> | null = { id: 1, name: 'Maria' }) => {
    const user = useUserStore();
    user.data = data;
    (user as any).status = { server: { get: { is_success: true } } };

    return user;
};

describe('MaxApp - Estrutura de Scroll e Classes de View', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        resetMaxAppConfig();
        Object.assign(route, { name: 'board', meta: {}, query: {}, params: {} });
        localStorage.clear();
    });

    afterEach(() => resetMaxAppConfig());

    it('renderiza classes estruturadas de view nas ramificações do template', () => {
        // 1. Rota de site/blank
        route.meta = { layout: 'site' };
        loadUser();
        let wrapper = mountApp();
        expect(wrapper.find('.max-app-view.max-app-blank').exists()).toBe(true);

        // 2. Tela de login (carregado e sem sessão)
        route.meta = {};
        loadUser(null);
        wrapper = mountApp();
        expect(wrapper.find('.max-app-view.max-app-login').exists()).toBe(true);

        // 3. Usuário autenticado
        loadUser({ id: 1, name: 'Maria' });
        wrapper = mountApp();
        expect(wrapper.find('.max-app-view.max-app-authenticated').exists()).toBe(true);
    });
});
