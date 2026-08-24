import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive } from 'vue';

const route = reactive<Record<string, any>>({ name: 'board', query: {}, params: {} });
const push = vi.fn();
const hasRoute = vi.fn(() => false);

// Mock parcial: o módulo real precisa sobreviver por causa do RouterLink.
vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push, hasRoute, currentRoute: { value: route } })
}));

import MaxTopMenu from '../../src/components/MaxTopMenu.vue';
import MaxUserSection from '../../src/components/MaxUserSection.vue';
import MaxTopToolbar from '../../src/components/MaxTopToolbar.vue';
import MaxTopMenuSearchBar from '../../src/components/MaxTopMenuSearchBar.vue';
import { useTopToolbarStore } from '../../src/stores/useTopToolbar.Store';
import { useSearchBarStore } from '../../src/stores/useSearchBar.Store';
import { useUserStore } from '../../src/stores/useUser.Store';
import { configureMaxApp, resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

let pinia: Pinia;

const mountWithPinia = (component: any, options: Record<string, any> = {}) => mount(component, {
    ...options,
    global: { ...(options.global ?? {}), plugins: [pinia] }
});

describe('MaxTopMenu', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        route.name = 'board';
        push.mockReset();
    });

    it('exibe a barra de busca quando a toolbar está oculta', () => {
        const wrapper = mountWithPinia(MaxTopMenu);

        expect(wrapper.findComponent(MaxTopMenuSearchBar).exists()).toBe(true);
        expect(wrapper.findComponent(MaxTopToolbar).exists()).toBe(false);
    });

    it('troca a busca pela toolbar quando ela é exibida', async () => {
        const toolbar = useTopToolbarStore();
        toolbar.show = true;

        const wrapper = mountWithPinia(MaxTopMenu);
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent(MaxTopToolbar).exists()).toBe(true);
        expect(wrapper.findComponent(MaxTopMenuSearchBar).exists()).toBe(false);
    });

    it('renderiza a seção de usuário por padrão', () => {
        expect(mountWithPinia(MaxTopMenu).findComponent(MaxUserSection).exists()).toBe(true);
    });

    it('exibe o botão de menu lateral apenas em mobile', () => {
        expect(mountWithPinia(MaxTopMenu).find('.btn_side_menu').exists()).toBe(false);

        const mobile = mountWithPinia(MaxTopMenu, { attrs: { screen: 'mobile' } });

        expect(mobile.find('.btn_side_menu').exists()).toBe(true);
    });

    it('não exibe o menu adicionar sem itens', () => {
        expect(mountWithPinia(MaxTopMenu).findComponent({ name: 'MaxPopoverMenu' }).exists()).toBe(false);
    });

    it('exibe o menu adicionar com os itens informados', () => {
        const wrapper = mountWithPinia(MaxTopMenu, {
            props: { addItems: [{ label: 'Novo Projeto', icon: 'mdi:plus', route: 'new_project' }] }
        });

        expect(wrapper.findComponent({ name: 'MaxPopoverMenu' }).exists()).toBe(true);
    });

    it.each(['status', 'chat', 'bugs', 'notifications', 'voip', 'live'])('renderiza o conteúdo do slot %s', (slot) => {
        const wrapper = mountWithPinia(MaxTopMenu, {
            slots: { [slot]: `<div class="conteudo-${slot}">x</div>` }
        });

        expect(wrapper.find(`.conteudo-${slot}`).exists()).toBe(true);
    });

    it('permite substituir a busca pelo slot', () => {
        const wrapper = mountWithPinia(MaxTopMenu, {
            slots: { search: '<div class="busca-custom">x</div>' }
        });

        expect(wrapper.find('.busca-custom').exists()).toBe(true);
        expect(wrapper.findComponent(MaxTopMenuSearchBar).exists()).toBe(false);
    });

    it('permite substituir a seção de usuário pelo slot', () => {
        const wrapper = mountWithPinia(MaxTopMenu, {
            slots: { user: '<div class="usuario-custom">x</div>' }
        });

        expect(wrapper.find('.usuario-custom').exists()).toBe(true);
        expect(wrapper.findComponent(MaxUserSection).exists()).toBe(false);
    });
});

// O MaxUserSection é prop-driven e tem sua própria suíte em
// tests/components/MaxUserSection.test.ts. Aqui só interessa a ligação
// feita pelo MaxTopMenu: alimentar as props a partir da store.
describe('MaxTopMenu → MaxUserSection', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        resetMaxAppConfig();
    });

    afterEach(() => resetMaxAppConfig());

    it('alimenta nome e empresa a partir da store', () => {
        useUserStore().data = { id: 1, name: 'Maria', solar_company_name: 'Solar LTDA' };

        const section = mountWithPinia(MaxTopMenu).findComponent(MaxUserSection);

        expect(section.props('name')).toBe('Maria');
        expect(section.props('companyName')).toBe('Solar LTDA');
        expect(section.props('userId')).toBe(1);
    });

    it('monta a URL do avatar a partir do id', () => {
        useUserStore().data = { id: 7, name: 'Maria' };

        const section = mountWithPinia(MaxTopMenu).findComponent(MaxUserSection);

        expect(section.props('avatarUrl')).toBe('/avatar/7');
    });

    it('respeita o avatarPath informado', () => {
        useUserStore().data = { id: 7, name: 'Maria' };

        const section = mountWithPinia(MaxTopMenu, { props: { avatarPath: '/fotos/' } }).findComponent(MaxUserSection);

        expect(section.props('avatarUrl')).toBe('/fotos/7');
    });

    it('não monta URL de avatar sem usuário', () => {
        const section = mountWithPinia(MaxTopMenu).findComponent(MaxUserSection);

        expect(section.props('avatarUrl')).toBeUndefined();
    });

    it('repassa o modo escuro da store', () => {
        useUserStore().data = { id: 1, name: 'Maria', settings: { darkMode: true } };

        expect(mountWithPinia(MaxTopMenu).findComponent(MaxUserSection).props('darkMode')).toBe(true);
    });

    it('repassa a versão do sistema', () => {
        configureMaxApp({ version: '2.5.0' });
        useUserStore().data = { id: 1, name: 'Maria' };

        expect(mountWithPinia(MaxTopMenu).findComponent(MaxUserSection).props('version')).toBe('2.5.0');
    });

    it.each(['logout', 'profile', 'settings', 'support'])('repassa o evento %s', async (evento) => {
        useUserStore().data = { id: 1, name: 'Maria' };

        const wrapper = mountWithPinia(MaxTopMenu);
        wrapper.findComponent(MaxUserSection).vm.$emit(evento);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted(evento)).toBeTruthy();
    });
});

describe('MaxTopToolbar', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        push.mockReset();
        hasRoute.mockReset();
        hasRoute.mockReturnValue(false);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('não renderiza sem itens', () => {
        const toolbar = useTopToolbarStore();
        toolbar.show = true;

        expect(mountWithPinia(MaxTopToolbar).find('.tool-bar-top-main-div').exists()).toBe(false);
    });

    it('não renderiza quando show é falso', () => {
        const toolbar = useTopToolbarStore();
        toolbar.items = [{ label: 'Item' }];

        expect(mountWithPinia(MaxTopToolbar).find('.tool-bar-top-main-div').exists()).toBe(false);
    });

    it('renderiza com itens e show verdadeiro', () => {
        const toolbar = useTopToolbarStore();
        toolbar.show = true;
        toolbar.items = [{ label: 'Item' }];

        expect(mountWithPinia(MaxTopToolbar).find('.tool-bar-top-main-div').exists()).toBe(true);
    });

    it('renderiza o slot plus', () => {
        const wrapper = mountWithPinia(MaxTopToolbar, {
            slots: { plus: '<div class="plus-custom">x</div>' }
        });

        expect(wrapper.find('.plus-custom').exists()).toBe(true);
    });

    it('mantém o submenu aberto por 1s após o mouse sair do item', async () => {
        vi.useFakeTimers();
        const toolbar = useTopToolbarStore();
        toolbar.show = true;
        toolbar.items = [{ label: 'Arquivo', items: [{ label: 'Novo' }] }];

        const wrapper = mountWithPinia(MaxTopToolbar);
        const item = wrapper.find('.p-menubar-root-list > .p-menubar-item');

        await item.trigger('mouseenter');
        expect(wrapper.find('.p-menubar-submenu').exists()).toBe(true);

        await item.trigger('mouseleave');
        expect(wrapper.find('.p-menubar-submenu').exists()).toBe(true);

        await vi.advanceTimersByTimeAsync(999);
        expect(wrapper.find('.p-menubar-submenu').exists()).toBe(true);

        await vi.advanceTimersByTimeAsync(1);
        expect(wrapper.find('.p-menubar-submenu').exists()).toBe(false);

        wrapper.unmount();
        vi.useRealTimers();
    });

    it('cancela o fechamento se o mouse voltar ao item antes de 1s', async () => {
        vi.useFakeTimers();
        const toolbar = useTopToolbarStore();
        toolbar.show = true;
        toolbar.items = [{ label: 'Arquivo', items: [{ label: 'Novo' }] }];

        const wrapper = mountWithPinia(MaxTopToolbar);
        const item = wrapper.find('.p-menubar-root-list > .p-menubar-item');

        await item.trigger('mouseenter');
        await item.trigger('mouseleave');
        await vi.advanceTimersByTimeAsync(500);
        await item.trigger('mouseenter');
        await vi.advanceTimersByTimeAsync(1000);

        expect(wrapper.find('.p-menubar-submenu').exists()).toBe(true);

        wrapper.unmount();
        vi.useRealTimers();
    });

    it('renderiza submenu aninhado (flyout) ao passar o mouse sobre subitem com filhos', async () => {
        const toolbar = useTopToolbarStore();
        toolbar.show = true;
        toolbar.items = [
            {
                label: 'Atendimento',
                items: [
                    {
                        label: 'Atendimento ao cliente',
                        items: [
                            { label: 'Central 24h', subLabel: '0800 062 0196' },
                            { label: 'WhatsApp Clara', subLabel: '556232432020' }
                        ]
                    },
                    {
                        label: 'Lista de protocolos'
                    }
                ]
            }
        ];

        const wrapper = mountWithPinia(MaxTopToolbar);
        const rootItem = wrapper.find('.p-menubar-root-list > .p-menubar-item');

        await rootItem.trigger('mouseenter');
        expect(wrapper.find('.p-menubar-submenu').exists()).toBe(true);

        const subItems = wrapper.findAll('.p-menubar-submenu > .p-menubar-item');
        expect(subItems.length).toBe(2);

        // O primeiro subitem possui filhos e renderiza chevron
        expect(subItems[0].classes()).toContain('has-nested');
        expect(subItems[0].findComponent({ name: 'MaxIcon' }).exists()).toBe(true);

        // O segundo subitem não possui filhos
        expect(subItems[1].classes()).not.toContain('has-nested');

        // Submenu aninhado ainda não está aberto
        expect(wrapper.find('.p-menubar-submenu-nested').exists()).toBe(false);

        // Passa o mouse no primeiro subitem
        await subItems[0].trigger('mouseenter');
        expect(wrapper.find('.p-menubar-submenu-nested').exists()).toBe(true);

        // Canais filhos renderizados com seus labels e subLabels
        const nestedItems = wrapper.findAll('.p-menubar-submenu-nested > .p-menubar-item');
        expect(nestedItems.length).toBe(2);
        expect(nestedItems[0].text()).toContain('Central 24h');
        expect(nestedItems[0].text()).toContain('0800 062 0196');
        expect(nestedItems[1].text()).toContain('WhatsApp Clara');
        expect(nestedItems[1].text()).toContain('556232432020');

        wrapper.unmount();
    });

    it('executa a ação do canal filho ao clicar no item aninhado', async () => {
        const actionSpy = vi.fn();
        const toolbar = useTopToolbarStore();
        toolbar.show = true;
        toolbar.items = [
            {
                label: 'Atendimento',
                items: [
                    {
                        label: 'Ouvidoria',
                        items: [
                            { label: 'Telefone Ouvidoria', action: actionSpy }
                        ]
                    }
                ]
            }
        ];

        const wrapper = mountWithPinia(MaxTopToolbar);
        await wrapper.find('.p-menubar-root-list > .p-menubar-item').trigger('mouseenter');
        await wrapper.find('.p-menubar-submenu > .p-menubar-item').trigger('mouseenter');

        const nestedItem = wrapper.find('.p-menubar-submenu-nested .menu-item-content');
        expect(nestedItem.exists()).toBe(true);

        await nestedItem.trigger('click');
        expect(actionSpy).toHaveBeenCalledTimes(1);

        wrapper.unmount();
    });
});

describe('useTopToolbarStore', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        push.mockReset();
        hasRoute.mockReset();
        hasRoute.mockReturnValue(false);
    });

    it('navega apenas com query quando não há rota', () => {
        const toolbar = useTopToolbarStore();
        toolbar.route({ id: 1 });

        expect(push).toHaveBeenCalledWith({ query: { id: 1 } });
    });

    it('usa a rota nomeada do Vue Router quando existe', () => {
        hasRoute.mockReturnValue(true);

        const toolbar = useTopToolbarStore();
        toolbar.route({ id: 1 }, 'projeto');

        expect(push).toHaveBeenCalledWith({ name: 'projeto', query: { id: 1 } });
    });

    it('mescla defaultData na navegação', () => {
        const toolbar = useTopToolbarStore();
        toolbar.defaultData = { origem: 'menu' };
        toolbar.route({ id: 1 });

        expect(push).toHaveBeenCalledWith({ query: { origem: 'menu', id: 1 } });
    });

    it('usa defaultRoute quando o item não informa rota', () => {
        hasRoute.mockReturnValue(true);

        const toolbar = useTopToolbarStore();
        toolbar.defaultRoute = 'padrao';
        toolbar.route({ id: 2 });

        expect(push).toHaveBeenCalledWith({ name: 'padrao', query: { id: 2 } });
    });
});

describe('MaxTopMenuSearchBar', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    it('usa o placeholder padrão', () => {
        const wrapper = mountWithPinia(MaxTopMenuSearchBar);

        expect(wrapper.find('input').attributes('placeholder')).toBe('Pesquisar');
    });

    it('aceita um placeholder customizado', () => {
        const wrapper = mountWithPinia(MaxTopMenuSearchBar, {
            props: { placeholder: 'Pesquisar em 12 Projetos' }
        });

        expect(wrapper.find('input').attributes('placeholder')).toBe('Pesquisar em 12 Projetos');
    });

    it('reflete a digitação na store de busca', async () => {
        const search = useSearchBarStore();
        const wrapper = mountWithPinia(MaxTopMenuSearchBar);

        await wrapper.find('input').setValue('projeto');

        expect(search.input_value).toBe('projeto');
    });

    it('renderiza o conteúdo do slot', () => {
        const wrapper = mountWithPinia(MaxTopMenuSearchBar, {
            slots: { default: '<div class="extra-busca">x</div>' }
        });

        expect(wrapper.find('.extra-busca').exists()).toBe(true);
    });
});
