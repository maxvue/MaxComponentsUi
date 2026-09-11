import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxLink from '../../src/components/MaxLink.vue';

describe('MaxLink', () => {
    const defaultGlobal = {
        stubs: {
            RouterLink: {
                name: 'RouterLink',
                template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>',
                props: ['to']
            }
        }
    };

    it('renderiza corretamente o slot default', () => {
        const wrapper = mount(MaxLink, {
            props: {
                route: 'home'
            },
            slots: {
                default: '<span>Acessar Painel</span>'
            },
            global: defaultGlobal
        });

        expect(wrapper.classes()).toContain('max-link');
        expect(wrapper.text()).toContain('Acessar Painel');
    });

    it('prioriza route_name sobre route na propriedade to', () => {
        const wrapper = mount(MaxLink, {
            props: {
                route_name: 'user-profile',
                route: 'ignored-route'
            },
            slots: {
                default: 'Perfil'
            },
            global: defaultGlobal
        });

        const routerLink = wrapper.findComponent({ name: 'RouterLink' });
        expect(routerLink.exists()).toBe(true);
        expect(routerLink.props('to')).toEqual({ name: 'user-profile' });
    });

    it('utiliza prop route quando route_name não for fornecido', () => {
        const wrapper = mount(MaxLink, {
            props: {
                route: 'settings'
            },
            slots: {
                default: 'Configurações'
            },
            global: defaultGlobal
        });

        const routerLink = wrapper.findComponent({ name: 'RouterLink' });
        expect(routerLink.exists()).toBe(true);
        expect(routerLink.props('to')).toEqual({ name: 'settings' });
    });

    it('repassa atributos adicionais para o componente', () => {
        const wrapper = mount(MaxLink, {
            props: {
                route: 'dashboard'
            },
            attrs: {
                id: 'main-nav-link',
                'data-testid': 'nav-dashboard'
            },
            global: defaultGlobal
        });

        expect(wrapper.attributes('id')).toBe('main-nav-link');
        expect(wrapper.attributes('data-testid')).toBe('nav-dashboard');
    });
});
