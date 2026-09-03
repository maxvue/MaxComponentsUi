import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxUserSection from '../../src/components/MaxUserSection.vue';

function mountSection(props: Record<string, any> = {}, openMenu = true) {
    const wrapper = mount(MaxUserSection, {
        props,
        global: {
            stubs: {
                MaxUserAvatar: { template: '<div class="max-user-avatar" />' },
                MaxIcon: { template: '<i class="max-icon" />' }
            }
        }
    });
    if (openMenu) (wrapper.vm as any).show();

    return wrapper;
}

describe('MaxUserSection', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
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

    it('usa labels padrão em pt-BR no menu', async () => {
        const _wrapper = mountSection({ name: 'João', userId: 1 });
        await _wrapper.vm.$nextTick();
        const labels = Array.from(document.body.querySelectorAll('.main-item-menu-div')).map((d) => d.textContent?.trim());
        expect(labels).toContain('Meu perfil');
        expect(labels).toContain('Configurações');
        expect(labels).toContain('Suporte');
        expect(labels).toContain('Sair');
    });

    it('permite sobrescrever as labels', async () => {
        const _wrapper = mountSection({ name: 'João', userId: 1, labelProfile: 'My profile' });
        await _wrapper.vm.$nextTick();
        const labels = Array.from(document.body.querySelectorAll('.main-item-menu-div')).map((d) => d.textContent?.trim());
        expect(labels).toContain('My profile');
    });

    it('alterna o label de dark mode conforme a prop darkMode', async () => {
        const off = mountSection({ name: 'João', userId: 1, darkMode: false });
        await off.vm.$nextTick();
        let labels = Array.from(document.body.querySelectorAll('.main-item-menu-div')).map((d) => d.textContent?.trim());
        expect(labels).toContain('Ativar Modo escuro');

        document.body.innerHTML = '';
        const on = mountSection({ name: 'João', userId: 1, darkMode: true });
        await on.vm.$nextTick();
        labels = Array.from(document.body.querySelectorAll('.main-item-menu-div')).map((d) => d.textContent?.trim());
        expect(labels).toContain('Desativar Modo escuro');
    });

    it('exibe a versão como última linha do menu quando fornecida', async () => {
        const _wrapper = mountSection({ name: 'João', userId: 1, version: '1.2.3' });
        await _wrapper.vm.$nextTick();
        expect(document.body.textContent).toContain('Versão: 1.2.3');
    });

    it('emite os eventos correspondentes ao clicar nos itens do menu', async () => {
        const wrapper = mountSection({ name: 'João', userId: 1, darkMode: false });
        await wrapper.vm.$nextTick();
        const itemBy = (label: string) =>
            Array.from(document.body.querySelectorAll('.main-item-menu-div')).find((d) => d.textContent?.trim() === label) as HTMLElement;

        itemBy('Meu perfil').click();
        (wrapper.vm as any).show();
        await wrapper.vm.$nextTick();
        itemBy('Configurações').click();
        (wrapper.vm as any).show();
        await wrapper.vm.$nextTick();
        itemBy('Ativar Modo escuro').click();
        (wrapper.vm as any).show();
        await wrapper.vm.$nextTick();
        itemBy('Suporte').click();
        (wrapper.vm as any).show();
        await wrapper.vm.$nextTick();
        itemBy('Sair').click();

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

    it('respeita o override do menu via prop items', async () => {
        const items = [{ label: 'Custom', icon: 'mdi:star', exec: () => {} }];
        const _wrapper = mountSection({ name: 'João', userId: 1, items });
        await _wrapper.vm.$nextTick();
        const labels = Array.from(document.body.querySelectorAll('.main-item-menu-div')).map((d) => d.textContent?.trim());
        expect(labels).toEqual(['Custom']);
    });

    it('oculta o bloco de texto e botão de impersonate em modo onlyAvatar ou screen mobile', () => {
        const wrapper = mountSection({ name: 'João', userId: 1, onlyAvatar: true, isImpersonated: true }, false);
        expect(wrapper.find('.user-text-div').exists()).toBe(false);
        expect(wrapper.find('.impersonated-btn').exists()).toBe(false);
        expect(wrapper.find('.button-avatar.mobile-user-avatar').exists()).toBe(true);
    });

    it('abre o menu ao clicar no avatar em modo onlyAvatar', async () => {
        const wrapper = mountSection({ name: 'João', userId: 1, onlyAvatar: true }, false);
        expect(document.body.querySelector('.max-user-section-overlay')).toBeNull();

        await wrapper.find('.button-avatar').trigger('click');
        expect(document.body.querySelector('.max-user-section-overlay')).not.toBeNull();
    });
});
