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
import { useUserStore } from '../../src/stores/useUser.Store';

let pinia: Pinia;

describe('MaxApp controlledTheme prop', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        document.documentElement.classList.remove('dark');
    });

    afterEach(() => {
        document.documentElement.classList.remove('dark');
    });

    it('quando controlledTheme for true, não muta o DOM nem user.data.settings.darkMode', async () => {
        const user = useUserStore();
        user.data = { id: 1, name: 'João', settings: { darkMode: true } };
        (user as any).status = { server: { get: { is_success: true } } };

        const wrapper = mount(MaxApp, {
            props: {
                controlledTheme: true
            },
            global: {
                plugins: [pinia],
                stubs: { teleport: true, MaxPageLayout: { name: 'MaxPageLayout', template: '<div><slot /></div>' } }

            }
        });

        // O DOM não deve ter recebido a classe dark do user.data.settings.darkMode
        expect(document.documentElement.classList.contains('dark')).toBe(false);

        // Dispara toggleDarkMode
        await wrapper.findComponent({ name: 'MaxPageLayout' }).vm.$emit?.('toggle-dark-mode');

        // Evento emitido, mas classe continua não mutada pelo MaxApp
        expect(wrapper.emitted('toggleDarkMode')).toBeTruthy();
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('quando controlledTheme for false (padrão), sincroniza classe .dark com user.data.settings.darkMode', async () => {
        const user = useUserStore();
        user.data = { id: 1, name: 'João', settings: { darkMode: true } };
        (user as any).status = { server: { get: { is_success: true } } };

        mount(MaxApp, {
            props: {
                controlledTheme: false
            },
            global: {
                plugins: [pinia],
                stubs: { teleport: true, MaxPageLayout: { template: '<div><slot /></div>' } }
            }
        });

        // O DOM deve ter recebido a classe dark
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
});
