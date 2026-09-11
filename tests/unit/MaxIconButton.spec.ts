import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxIconButton from '../../src/components/MaxIconButton.vue';
import * as maxUse from '@maxvue/max-use';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        goToRoute: vi.fn()
    };
});

function mountIconButton(props: Record<string, any> = {}) {
    return mount(MaxIconButton, {
        props,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub" :data-icon="icon || i"></span>',
                    props: ['icon', 'i', 'size', 'dark', 'light', 'pointer', 'color', 'iconColor']
                }
            }
        }
    });
}

describe('MaxIconButton (Acessibilidade e Semântica WAI-ARIA)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('renderiza uma tag semântica <button type="button"> como raiz', () => {
        const wrapper = mountIconButton({ icon: 'mdi:pencil' });
        expect(wrapper.element.tagName.toLowerCase()).toBe('button');
        expect(wrapper.attributes('type')).toBe('button');
    });

    it('permite navegação por teclado e possui atributo disabled falso por padrão', () => {
        const wrapper = mountIconButton({ icon: 'mdi:pencil' });
        expect(wrapper.attributes('disabled')).toBeUndefined();
        expect(wrapper.attributes('aria-disabled')).toBeUndefined();
        expect(wrapper.classes()).not.toContain('is-disabled');
    });

    it('aplica estado desabilitado corretamente quando disabled=true', async () => {
        const actionMock = vi.fn();
        const wrapper = mountIconButton({
            icon: 'mdi:pencil',
            disabled: true,
            action: actionMock
        });

        expect(wrapper.attributes('disabled')).toBeDefined();
        expect(wrapper.attributes('aria-disabled')).toBe('true');
        expect(wrapper.classes()).toContain('is-disabled');

        await wrapper.trigger('click');
        expect(actionMock).not.toHaveBeenCalled();
        expect(wrapper.emitted('action')).toBeFalsy();
    });

    it('bloqueia hover scale quando disabled=true', async () => {
        const wrapper = mountIconButton({
            icon: 'mdi:pencil',
            disabled: true,
            hoverScale: 1.5
        });

        await wrapper.trigger('mouseenter');
        expect(wrapper.element.style.transform).toBe('scale(1)');
    });

    describe('cálculo inteligente de aria-label (ariaLabelComputed)', () => {
        it('utiliza prop aria-label explícita quando fornecida', () => {
            const wrapper = mountIconButton({
                icon: 'mdi:pencil',
                'aria-label': 'Editar cadastro de cliente'
            });
            expect(wrapper.attributes('aria-label')).toBe('Editar cadastro de cliente');
        });

        it('utiliza prop label como fallback de aria-label', () => {
            const wrapper = mountIconButton({
                icon: 'mdi:cog',
                label: 'Configurações avançadas'
            });
            expect(wrapper.attributes('aria-label')).toBe('Configurações avançadas');
        });

        it('utiliza prop title como fallback de aria-label', () => {
            const wrapper = mountIconButton({
                icon: 'mdi:bell',
                title: 'Notificações do sistema'
            });
            expect(wrapper.attributes('aria-label')).toBe('Notificações do sistema');
        });

        it.each([
            ['mdi:close', 'Fechar'],
            ['heroicons:xmark', 'Fechar'],
            ['mdi:chevron-down', 'Expandir opções'],
            ['fa:angle-down', 'Expandir opções'],
            ['mdi:chevron-up', 'Recolher opções'],
            ['fa:angle-up', 'Recolher opções'],
            ['mdi:magnify-search', 'Buscar'],
            ['mdi:trash-can', 'Excluir'],
            ['lucide:delete', 'Excluir'],
            ['mdi:pencil-edit', 'Editar'],
            ['mdi:plus-circle', 'Adicionar'],
            ['tabler:add', 'Adicionar'],
            ['mdi:unknown-icon', 'Botão de ação']
        ])('calcula o nome acessível contextual para o ícone %s como "%s"', (icon, expectedLabel) => {
            const wrapper = mountIconButton({ icon });
            expect(wrapper.attributes('aria-label')).toBe(expectedLabel);
        });
    });

    it('aciona onClick ao clicar e emite evento action', async () => {
        const wrapper = mountIconButton({ icon: 'mdi:check' });
        await wrapper.trigger('click');
        expect(wrapper.emitted('action')).toBeTruthy();
        expect(wrapper.emitted('action')![0]).toEqual([true]);
    });

    it('aciona callback action fornecido', async () => {
        const actionMock = vi.fn();
        const wrapper = mountIconButton({ icon: 'mdi:check', action: actionMock });
        await wrapper.trigger('click');
        expect(actionMock).toHaveBeenCalled();
    });

    it('navega via goToRoute quando route é fornecido', async () => {
        const wrapper = mountIconButton({
            icon: 'mdi:home',
            route: 'dashboard',
            params: { id: 10 }
        });
        await wrapper.trigger('click');
        expect(maxUse.goToRoute).toHaveBeenCalledWith('dashboard', { id: 10 });
    });
});
