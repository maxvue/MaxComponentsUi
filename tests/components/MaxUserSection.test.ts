import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxUserSection from '../../src/components/MaxUserSection.vue';

// Stub do TieredMenu que renderiza o slot #item para cada entrada do model,
// permitindo inspecionar labels e disparar os execs.
const TieredMenuStub = {
    template: '<div class="tiered-menu"><template v-for="(item, i) in model" :key="i"><slot name="item" :item="item" /></template></div>',
    props: ['model'],
    methods: {
        toggle() {}
    }
};

function mountSection(props: Record<string, any> = {}) {
    return mount(MaxUserSection, {
        props,
        global: {
            stubs: {
                TieredMenu: TieredMenuStub,
                MaxUserAvatar: { template: '<div class="max-user-avatar" />' },
                MaxIcon: { template: '<i class="max-icon" />' }
            }
        }
    });
}

describe('MaxUserSection', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountSection({ name: 'João' });
        expect(wrapper.exists()).toBe(true);
    });

    it('exibe o nome do usuário', () => {
        const wrapper = mountSection({ name: 'João Silva' });
        expect(wrapper.find('.user-name-text').text()).toBe('João Silva');
    });

    it('exibe a empresa quando companyName é fornecido', () => {
        const wrapper = mountSection({ name: 'João', companyName: 'Acme Solar' });
        expect(wrapper.find('.solar-company-text').exists()).toBe(true);
        expect(wrapper.find('.solar-company-text').text()).toBe('Acme Solar');
    });

    it('oculta a empresa quando companyName não é fornecido', () => {
        const wrapper = mountSection({ name: 'João' });
        expect(wrapper.find('.solar-company-text').exists()).toBe(false);
    });

    it('exibe o avatar somente quando userId é fornecido', () => {
        expect(mountSection({ name: 'João' }).find('.max-user-avatar').exists()).toBe(false);
        expect(mountSection({ name: 'João', userId: 1 }).find('.max-user-avatar').exists()).toBe(true);
    });

    it('usa labels padrão em pt-BR no menu', () => {
        const wrapper = mountSection({ name: 'João', userId: 1 });
        const labels = wrapper.findAll('.main-item-menu-div').map((d) => d.text());
        expect(labels).toContain('Meu perfil');
        expect(labels).toContain('Configurações');
        expect(labels).toContain('Suporte');
        expect(labels).toContain('Sair');
    });

    it('permite sobrescrever as labels', () => {
        const wrapper = mountSection({ name: 'João', userId: 1, labelProfile: 'My profile' });
        const labels = wrapper.findAll('.main-item-menu-div').map((d) => d.text());
        expect(labels).toContain('My profile');
    });

    it('alterna o label de dark mode conforme a prop darkMode', () => {
        const off = mountSection({ name: 'João', userId: 1, darkMode: false })
            .findAll('.main-item-menu-div').map((d) => d.text());
        expect(off).toContain('Ativar Modo escuro');

        const on = mountSection({ name: 'João', userId: 1, darkMode: true })
            .findAll('.main-item-menu-div').map((d) => d.text());
        expect(on).toContain('Desativar Modo escuro');
    });

    it('exibe a versão como última linha do menu quando fornecida', () => {
        const wrapper = mountSection({ name: 'João', userId: 1, version: '1.2.3' });
        expect(wrapper.text()).toContain('Versão: 1.2.3');
    });

    it('emite os eventos correspondentes ao clicar nos itens do menu', async () => {
        const wrapper = mountSection({ name: 'João', userId: 1, darkMode: false });
        const itemBy = (label: string) =>
            wrapper.findAll('.main-item-menu-div').find((d) => d.text() === label)!;

        await itemBy('Meu perfil').trigger('click');
        await itemBy('Configurações').trigger('click');
        await itemBy('Ativar Modo escuro').trigger('click');
        await itemBy('Suporte').trigger('click');
        await itemBy('Sair').trigger('click');

        expect(wrapper.emitted('profile')).toHaveLength(1);
        expect(wrapper.emitted('settings')).toHaveLength(1);
        expect(wrapper.emitted('toggleDarkMode')).toHaveLength(1);
        expect(wrapper.emitted('support')).toHaveLength(1);
        expect(wrapper.emitted('logout')).toHaveLength(1);
    });

    it('renderiza o botão de impersonação e emite endImpersonate', async () => {
        const wrapper = mountSection({ name: 'João', userId: 1, isImpersonated: true });
        const btn = wrapper.find('.impersonated-btn');
        expect(btn.exists()).toBe(true);
        await btn.trigger('click');
        expect(wrapper.emitted('endImpersonate')).toHaveLength(1);
    });

    it('oculta o botão de impersonação quando isImpersonated é falso', () => {
        const wrapper = mountSection({ name: 'João', userId: 1 });
        expect(wrapper.find('.impersonated-btn').exists()).toBe(false);
    });

    it('respeita o override do menu via prop items', () => {
        const items = [{ label: 'Custom', icon: 'mdi:star', exec: () => {} }];
        const wrapper = mountSection({ name: 'João', userId: 1, items });
        const labels = wrapper.findAll('.main-item-menu-div').map((d) => d.text());
        expect(labels).toEqual(['Custom']);
    });
});
