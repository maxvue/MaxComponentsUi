import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useListMenusStore, type ListMenu } from '../../src/stores/useListMenus.Store';
import { configureMaxApp, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

const mockUseRefCachedApi = vi.fn((route: string) => {
    return ref<ListMenu | null | undefined>({
        side: [{ title: `Menu for ${route}` }]
    });
});

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: (route: string) => mockUseRefCachedApi(route)
}));

describe('useListMenusStore', () => {
    beforeEach(() => {
        resetMaxAppConfig();
        setActivePinia(createPinia());
        mockUseRefCachedApi.mockClear();
    });

    afterEach(() => {
        resetMaxAppConfig();
    });

    it('retorna a propriedade list contendo os dados gerenciados pelo useRefCachedApi', () => {
        const store = useListMenusStore();

        expect(store.list).toBeDefined();
        expect(store.list).toEqual({
            side: [{ title: 'Menu for menus' }]
        });
    });

    it('utiliza a rota padrão "menus" quando nenhuma configuração customizada é fornecida', () => {
        useListMenusStore();

        expect(mockUseRefCachedApi).toHaveBeenCalledWith('menus');
    });

    it('reflete a rota customizada quando configureMaxApp é chamado antes da instanciação', () => {
        configureMaxApp({ routeMenus: '/api/test-menus' });

        useListMenusStore();

        expect(mockUseRefCachedApi).toHaveBeenCalledWith('/api/test-menus');
    });

    it('garante isolamento entre diferentes instâncias de Pinia', () => {
        const pinia1 = createPinia();
        const pinia2 = createPinia();

        setActivePinia(pinia1);
        const store1 = useListMenusStore();

        setActivePinia(pinia2);
        const store2 = useListMenusStore();

        expect(store1).not.toBe(store2);

        store1.list = { side: [{ title: 'Instância 1' }] };
        expect(store2.list).toEqual({ side: [{ title: 'Menu for menus' }] });
    });
});
