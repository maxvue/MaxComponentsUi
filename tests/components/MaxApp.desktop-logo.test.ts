import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const menusRef = ref<any>({ side: [] });
const mockGetRoute = vi.fn((name: string) => {
    if (name === 'brand.logo') return '/media/engeapp-symbol-9fdaa226.svg';
    return null;
});

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef,
    getRoute: (name: string) => mockGetRoute(name),
    goToRoute: vi.fn()
}));

vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => ({ name: 'home', query: {}, params: {} }),
    useRouter: () => ({ push: vi.fn() })
}));

import MaxApp from '../../src/components/MaxApp.vue';
import { useUserStore } from '../../src/stores/useUser.Store';
import { configureMaxApp, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

describe('MaxApp Desktop Logo Integration', () => {
    let pinia: Pinia;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        resetMaxAppConfig();
    });

    it('renderiza o símbolo institucional aprovado a partir da configuração global e exibe fallback acessível ao ocorrer erro', async () => {
        const user = useUserStore();
        user.data = { id: 1, name: 'Dev' };
        (user as any).status = { server: { get: { is_success: true } } };

        configureMaxApp({
            logo: 'brand.logo',
            routeLogo: '/',
            logoAlt: 'Símbolo ENGEAPP',
            logoFallbackLabel: 'MaxCode'
        });

        const wrapper = mount(MaxApp, {
            props: {
                screen: 'desktop'
            },
            global: {
                plugins: [pinia],
                stubs: {
                    RouterView: { template: '<div class="router-view-stub" />' },
                    RouterLink: {
                        name: 'RouterLink',
                        template: '<a class="router-link"><slot /></a>',
                        props: ['to']
                    },
                    MaxIcon: { template: '<span class="max-icon-stub" />' }
                }
            }
        });

        // O MaxLogo real é renderizado dentro do menu lateral em desktop
        const img = wrapper.find('.space-logo img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('/media/engeapp-symbol-9fdaa226.svg');
        expect(img.attributes('alt')).toBe('Símbolo ENGEAPP');

        // Simula erro de carregamento da imagem
        await img.trigger('error');

        // Imagem removida e fallback visível renderizado
        expect(wrapper.find('.space-logo img').exists()).toBe(false);
        const fallback = wrapper.find('.space-logo .max-logo-fallback');
        expect(fallback.exists()).toBe(true);
        expect(fallback.text()).toBe('MaxCode');
        expect(fallback.attributes('role')).toBe('img');
        expect(fallback.attributes('aria-label')).toBe('Símbolo ENGEAPP');
    });
});
