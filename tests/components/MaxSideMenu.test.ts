import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive, ref } from 'vue';

const route = reactive<Record<string, any>>({ name: 'projects', query: {}, params: {} });

// Preserva o módulo real: o MaxLogo renderiza um RouterLink, que sumiria
// se o mock substituísse o vue-router inteiro.
vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push: vi.fn() })
}));

// O useRefCachedApi dispara requisição real; aqui só interessa a ref devolvida.
const menusRef = ref<any>(null);
const getRoute = vi.fn<(name: string) => string | null>(() => null);

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef,
    getRoute: (...args: [string]) => getRoute(...args)
}));

import MaxSideMenu from '../../src/components/MaxSideMenu.vue';
import MaxMenuVerticalItem from '../../src/components/MaxMenuVerticalItem.vue';
import { useSearchBarStore } from '../../src/stores/useSearchBar.Store';
import { useSystemStore } from '../../src/stores/useSystem.Store';

let pinia: Pinia;

// O setup.ts instala um Pinia global; passar o local garante que o
// componente enxergue as stores manipuladas pelo teste.
// O MaxLogo renderiza um RouterLink, que exigiria um router completo; ele não
// é o alvo destes testes, então entra como stub.
const mountWithPinia = (component: any, options: Record<string, any> = {}) => mount(component, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        // O stub declara `src` para que os testes da prop `logo` possam
        // inspecionar o valor que chega ao MaxLogo.
        stubs: {
            MaxLogo: { name: 'MaxLogo', props: ['src'], template: '<div class="max-logo-stub" />' },
            ...(options.global?.stubs ?? {})
        }
    }
});

/** Monta um item de menu no formato devolvido pelo backend. */
const item = (details: Record<string, any>, id = String(Math.random())) => ({ id, details });

describe('MaxSideMenu', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        route.name = 'projects';
        menusRef.value = null;
    });

    it('não renderiza grupos sem menus carregados', () => {
        const wrapper = mountWithPinia(MaxSideMenu);

        expect(wrapper.find('.grupo').exists()).toBe(false);
    });

    it('renderiza os itens principais', () => {
        menusRef.value = { side: [item({ icon: 'mdi:home', page_component: 'Projects' })] };

        const wrapper = mountWithPinia(MaxSideMenu);

        expect(wrapper.find('.grupo.items').exists()).toBe(true);
        expect(wrapper.findAll('.item_menu')).toHaveLength(1);
    });

    it('separa itens de configuração em outro grupo', () => {
        menusRef.value = {
            side: [
                item({ icon: 'mdi:home', page_component: 'Projects' }),
                item({ icon: 'mdi:cog', page_component: 'Settings', settings: true })
            ]
        };

        const wrapper = mountWithPinia(MaxSideMenu);

        expect(wrapper.find('.grupo.items').exists()).toBe(true);
        expect(wrapper.find('.grupo.settings').exists()).toBe(true);
        expect(wrapper.findAllComponents(MaxMenuVerticalItem)).toHaveLength(2);
    });

    it('oculta itens marcados com hide', () => {
        menusRef.value = {
            side: [
                item({ icon: 'mdi:home', page_component: 'Projects' }),
                item({ icon: 'mdi:eye-off', page_component: 'Oculto', hide: true })
            ]
        };

        expect(mountWithPinia(MaxSideMenu).findAll('.item_menu')).toHaveLength(1);
    });

    it('mantém visível o item com hide false', () => {
        // Regressão: com `=== null`, salvar hide=false escondia o menu.
        menusRef.value = { side: [item({ icon: 'mdi:home', page_component: 'Projects', hide: false })] };

        expect(mountWithPinia(MaxSideMenu).findAll('.item_menu')).toHaveLength(1);
    });

    it('exibe a logo em desktop', () => {
        menusRef.value = { side: [] };

        const wrapper = mountWithPinia(MaxSideMenu);

        expect(wrapper.find('.space-logo').exists()).toBe(true);
    });

    describe('prop logo', () => {
        beforeEach(() => {
            menusRef.value = { side: [] };
            getRoute.mockReset();
            getRoute.mockReturnValue(null);
        });

        it('não renderiza logo quando a prop é omitida', () => {
            const wrapper = mountWithPinia(MaxSideMenu);

            expect(wrapper.find('.space-logo').exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'MaxLogo' }).exists()).toBe(false);
        });

        it.each([
            ['/get_file?file=logo.svg'],
            ['https://cdn.exemplo.com/logo.png'],
            ['data:image/svg+xml;base64,abc']
        ])('usa %s diretamente como src', (url) => {
            const wrapper = mountWithPinia(MaxSideMenu, { props: { logo: url } });

            expect(wrapper.findComponent({ name: 'MaxLogo' }).props('src')).toBe(url);
            expect(getRoute).not.toHaveBeenCalled();
        });

        it('resolve um nome de rota pelo getRoute', () => {
            getRoute.mockReturnValue('https://app.exemplo.com/logo');

            const wrapper = mountWithPinia(MaxSideMenu, { props: { logo: 'assets.logo' } });

            expect(getRoute).toHaveBeenCalledWith('assets.logo');
            expect(wrapper.findComponent({ name: 'MaxLogo' }).props('src')).toBe('https://app.exemplo.com/logo');
        });

        it('não renderiza logo quando a rota não resolve', () => {
            getRoute.mockReturnValue(null);

            const wrapper = mountWithPinia(MaxSideMenu, { props: { logo: 'rota.inexistente' } });

            expect(wrapper.findComponent({ name: 'MaxLogo' }).exists()).toBe(false);
        });

        it('ignora valor em branco', () => {
            const wrapper = mountWithPinia(MaxSideMenu, { props: { logo: '   ' } });

            expect(wrapper.findComponent({ name: 'MaxLogo' }).exists()).toBe(false);
            expect(getRoute).not.toHaveBeenCalled();
        });
    });

    it('limpa a busca ao clicar na logo', async () => {
        menusRef.value = { side: [] };
        const search = useSearchBarStore();
        search.input_value = 'algo';

        const wrapper = mountWithPinia(MaxSideMenu);
        await wrapper.find('.space-logo').trigger('click');

        expect(search.input_value).toBe('');
    });
});

describe('MaxMenuVerticalItem', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        route.name = 'projects';
    });

    it('renderiza um bloco por item', () => {
        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:home' }), item({ icon: 'mdi:cog' })] }
        });

        expect(wrapper.findAll('.item_menu')).toHaveLength(2);
    });

    it('marca como ativo o item da página atual', () => {
        // snakeCase('Projects') === 'projects', que é a rota atual.
        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:home', page_component: 'Projects' })] }
        });

        expect(wrapper.find('.item_menu').classes()).toContain('active');
    });

    it('não marca itens de outras páginas', () => {
        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:cog', page_component: 'Settings' })] }
        });

        expect(wrapper.find('.item_menu').classes()).not.toContain('active');
    });

    it('expõe o page_component como atributo', () => {
        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:home', page_component: 'Projects' })] }
        });

        expect(wrapper.find('.item_menu').attributes('page_component')).toBe('Projects');
    });

    it('limpa a busca ao clicar no item', async () => {
        const search = useSearchBarStore();
        search.input_value = 'algo';

        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:home', page_component: 'Projects' })] }
        });

        await wrapper.find('.item_menu').trigger('click');

        expect(search.input_value).toBe('');
    });

    it('acompanha a mudança de rota', async () => {
        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:cog', page_component: 'Settings' })] }
        });

        expect(wrapper.find('.item_menu').classes()).not.toContain('active');

        route.name = 'settings';
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.item_menu').classes()).toContain('active');
    });

    it('usa a store de sistema para resolver a página atual', () => {
        const system = useSystemStore();

        expect(system.page).toBe('projects');
    });
});
