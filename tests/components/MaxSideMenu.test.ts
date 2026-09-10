import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive, ref } from 'vue';

const route = reactive<Record<string, any>>({ name: 'projects', query: {}, params: {} });
const push = vi.fn();

// Preserva o módulo real: o MaxLogo renderiza um RouterLink, que sumiria
// se o mock substituísse o vue-router inteiro.
vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push })
}));

// O useRefCachedApi dispara requisição real; aqui só interessa a ref devolvida.
const menusRef = ref<any>(null);
const getRoute = vi.fn<(name: string) => string | null>(() => null);
const mockGoToRoute = vi.fn();

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef,
    getRoute: (...args: [string]) => getRoute(...args),
    goToRoute: (...args: any[]) => mockGoToRoute(...args)
}));

import MaxSideMenu from '../../src/components/MaxSideMenu.vue';
import MaxMenuVerticalItem from '../../src/components/MaxMenuVerticalItem.vue';
import MaxIconButton from '../../src/components/MaxIconButton.vue';
import { useSearchBarStore } from '../../src/stores/useSearchBar.Store';
import { useSystemStore } from '../../src/stores/useSystem.Store';
import { configureMaxApp, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

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
        // O stub declara `src` e `to` para que os testes da prop `logo` e `routeLogo`
        // possam inspecionar os valores que chegam ao MaxLogo.
        stubs: {
            MaxLogo: { name: 'MaxLogo', props: ['src', 'to'], template: '<div class="max-logo-stub" />' },
            MaxIcon: { template: '<span class="max-icon-stub" />' },
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
        route.path = '/projects';
        menusRef.value = null;
        push.mockReset();
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

    it('limpa a busca, emite logoClick e navega para "/" ao clicar na logo por padrão', async () => {
        menusRef.value = { side: [] };
        const search = useSearchBarStore();
        search.input_value = 'algo';

        const wrapper = mountWithPinia(MaxSideMenu);
        await wrapper.find('.space-logo').trigger('click');

        expect(search.input_value).toBe('');
        expect(wrapper.emitted('logoClick')).toHaveLength(1);
        expect(push).toHaveBeenCalledWith('/');
    });

    it('navega para rota customizada e emite logoClick ao clicar na logo', async () => {
        menusRef.value = { side: [] };
        const wrapper = mountWithPinia(MaxSideMenu, { props: { routeLogo: 'dashboard' } });
        await wrapper.find('.space-logo').trigger('click');

        expect(wrapper.emitted('logoClick')).toHaveLength(1);
        expect(push).toHaveBeenCalledWith({ name: 'dashboard' });
    });

    it('repassa routeLogo para o MaxLogo', () => {
        menusRef.value = { side: [] };
        const wrapper = mountWithPinia(MaxSideMenu, { props: { logo: '/logo.svg', routeLogo: '/inicio' } });

        expect(wrapper.findComponent({ name: 'MaxLogo' }).props('to')).toBe('/inicio');
    });

    it('renderiza a logo quando props.screen="desktop" mesmo que system.type_device seja mobile', () => {
        menusRef.value = { side: [] };
        const system = useSystemStore();
        // Simula tela pequena no breakpoint
        vi.spyOn(system, 'type_device', 'get').mockReturnValue('mobile');

        const wrapper = mountWithPinia(MaxSideMenu, { props: { logo: '/logo.svg', screen: 'desktop' } });

        expect(wrapper.find('.space-logo').exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'MaxLogo' }).exists()).toBe(true);
    });

    it('utiliza a logo de getMaxAppConfig() quando a prop logo não for informada', () => {
        menusRef.value = { side: [] };
        configureMaxApp({ logo: '/config-logo.svg' });

        const wrapper = mountWithPinia(MaxSideMenu);

        expect(wrapper.find('.space-logo').exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'MaxLogo' }).props('src')).toBe('/config-logo.svg');

        resetMaxAppConfig();
    });

    it('utiliza routeLogo de getMaxAppConfig() quando a prop routeLogo não for informada', () => {
        menusRef.value = { side: [] };
        configureMaxApp({ logo: '/logo.svg', routeLogo: '/dashboard' });

        const wrapper = mountWithPinia(MaxSideMenu);

        expect(wrapper.findComponent({ name: 'MaxLogo' }).props('to')).toBe('/dashboard');

        resetMaxAppConfig();
    });

    it('renderiza o container .space-logo no topo do menu lateral para exibição alinhada da logo', () => {
        menusRef.value = { side: [] };
        const wrapper = mountWithPinia(MaxSideMenu, { props: { logo: '/logo.svg' } });

        const spaceLogo = wrapper.find('.space-logo');
        expect(spaceLogo.exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'MaxLogo' }).exists()).toBe(true);
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

    it('passa light=false e color="var(--blue-750)" para o MaxIconButton quando o item está ativo', () => {
        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:home', page_component: 'Projects' })] }
        });

        const iconButton = wrapper.findComponent(MaxIconButton);
        expect(iconButton.exists()).toBe(true);
        expect(iconButton.props('light')).toBe(false);
        expect(iconButton.props('color')).toBe('var(--blue-750)');
    });

    it('passa light=true e color=undefined para o MaxIconButton quando o item está inativo', () => {
        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:cog', page_component: 'Settings' })] }
        });

        const iconButton = wrapper.findComponent(MaxIconButton);
        expect(iconButton.exists()).toBe(true);
        expect(iconButton.props('light')).toBe(true);
        expect(iconButton.props('color')).toBeUndefined();
    });

    it('mantém item ativo quando a rota atual é uma subpágina mapeada (ex: commercial_proposal_detail para commercial_proposals)', () => {
        route.name = 'commercial_proposal_detail';

        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'heroicons:document-currency-dollar-solid', page_component: 'commercial_proposals' })] }
        });

        expect(wrapper.find('.item_menu').classes()).toContain('active');
    });

    it('mantém item ativo quando a rota atual corresponde a item.details.matches customizado', () => {
        route.name = 'custom_subpage';

        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:home', page_component: 'custom_parent', matches: ['custom_subpage'] })] }
        });

        expect(wrapper.find('.item_menu').classes()).toContain('active');
    });

    it('dispara goToRoute ao clicar na div do item', async () => {
        mockGoToRoute.mockReset();

        const wrapper = mountWithPinia(MaxMenuVerticalItem, {
            props: { items: [item({ icon: 'mdi:home', page_component: 'projects', route: 'solar_company_projects' })] }
        });

        await wrapper.find('.item_menu').trigger('click');

        expect(mockGoToRoute).toHaveBeenCalledWith('solar_company_projects');
    });
});
