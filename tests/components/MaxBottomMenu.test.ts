import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive } from 'vue';

/** Rota mutável e router espionável compartilhados com o mock do vue-router. */
const currentRoute = reactive<Record<string, any>>({ name: 'board' });
const push = vi.fn();

vi.mock('vue-router', () => ({
    useRoute: () => currentRoute,
    useRouter: () => ({ push })
}));

import MaxBottomMenu from '../../src/components/MaxBottomMenu.vue';
import MaxContainerApp from '../../src/components/MaxContainerApp.vue';

describe('MaxBottomMenu', () => {
    beforeEach(() => {
        currentRoute.name = 'board';
        push.mockReset();
    });

    it('renderiza as quatro abas padrão', () => {
        const wrapper = mount(MaxBottomMenu);

        expect(wrapper.findAll('.bottom-menu-tab')).toHaveLength(4);
    });

    it('exibe os rótulos das abas', () => {
        const wrapper = mount(MaxBottomMenu);

        expect(wrapper.text()).toContain('Início');
        expect(wrapper.text()).toContain('Clientes');
        expect(wrapper.text()).toContain('Projetos');
        expect(wrapper.text()).toContain('Perfil');
    });

    it('marca como ativa apenas a aba da rota atual', () => {
        const wrapper = mount(MaxBottomMenu);
        const ativas = wrapper.findAll('.bottom-menu-tab.active');

        expect(ativas).toHaveLength(1);
        expect(ativas[0].text()).toContain('Projetos');
    });

    it('considera as rotas de matches como parte da mesma aba', () => {
        currentRoute.name = 'integrador_client_show';

        const wrapper = mount(MaxBottomMenu);
        const ativas = wrapper.findAll('.bottom-menu-tab.active');

        expect(ativas).toHaveLength(1);
        expect(ativas[0].text()).toContain('Clientes');
    });

    it('não marca nenhuma aba em rota desconhecida', () => {
        currentRoute.name = 'outra_rota';

        expect(mount(MaxBottomMenu).findAll('.bottom-menu-tab.active')).toHaveLength(0);
    });

    it('navega ao clicar em outra aba', async () => {
        const wrapper = mount(MaxBottomMenu);

        await wrapper.findAll('.bottom-menu-tab')[0].trigger('click');

        expect(push).toHaveBeenCalledWith({ name: 'integrador_dashboard' });
    });

    it('não navega ao clicar na aba já ativa', async () => {
        const wrapper = mount(MaxBottomMenu);

        await wrapper.findAll('.bottom-menu-tab')[2].trigger('click');

        expect(push).not.toHaveBeenCalled();
    });

    it('aceita abas customizadas', () => {
        const wrapper = mount(MaxBottomMenu, {
            props: {
                tabs: [
                    { name: 'a', label: 'Alfa', icon: 'mdi:a' },
                    { name: 'b', label: 'Beta', icon: 'mdi:b' }
                ]
            }
        });

        expect(wrapper.findAll('.bottom-menu-tab')).toHaveLength(2);
        expect(wrapper.text()).toContain('Alfa');
        expect(wrapper.text()).not.toContain('Projetos');
    });

    it('ajusta as colunas ao número de abas', () => {
        const wrapper = mount(MaxBottomMenu, {
            props: { tabs: [{ name: 'a', label: 'Alfa', icon: 'mdi:a' }] }
        });

        expect(wrapper.find('.bottom-menu-bar').attributes('style')).toContain('repeat(1, 1fr)');
    });

    it('renderiza o botão FAB central e o SVG côncavo quando addItems é fornecido', () => {
        const wrapper = mount(MaxBottomMenu, {
            props: {
                addItems: [{ label: 'Novo Item', icon: 'mdi:plus', route: 'new_item' }]
            }
        });

        expect(wrapper.find('.fab').exists()).toBe(true);
        expect(wrapper.find('.img-background').exists()).toBe(true);
        expect(wrapper.classes()).toContain('is-curved');
        expect(wrapper.find('.bottom-menu-bar').attributes('style')).toContain('64px');
    });

    it('emite o evento fabClick quando o FAB simples é clicado', async () => {
        const wrapper = mount(MaxBottomMenu, {
            props: { showFab: true }
        });

        const fabBtn = wrapper.find('.fab');
        expect(fabBtn.exists()).toBe(true);

        await fabBtn.trigger('click');
        expect(wrapper.emitted('fabClick')).toHaveLength(1);
    });

    it('permite customizar o FAB via slot', () => {
        const wrapper = mount(MaxBottomMenu, {
            props: { showFab: true },
            slots: { fab: '<button class="custom-fab-btn">Adicionar</button>' }
        });

        expect(wrapper.find('.custom-fab-btn').exists()).toBe(true);
    });
});

describe('MaxContainerApp', () => {
    it('renderiza o conteúdo do slot', () => {
        const wrapper = mount(MaxContainerApp, {
            slots: { default: '<p class="filho">conteúdo</p>' }
        });

        expect(wrapper.find('.filho').exists()).toBe(true);
    });

    it('aplica a classe container-app', () => {
        expect(mount(MaxContainerApp).find('.container-app').exists()).toBe(true);
    });

    it('repassa atributos para o elemento raiz', () => {
        const wrapper = mount(MaxContainerApp, { attrs: { screen: 'mobile' } });

        expect(wrapper.find('.container-app').attributes('screen')).toBe('mobile');
    });
});
