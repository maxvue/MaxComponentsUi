import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxButton from '../../src/components/MaxButton.vue';
import * as maxUse from '@maxvue/max-use';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        goToRoute: vi.fn()
    };
});

function mountButton(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
    return mount(MaxButton, {
        props,
        slots,
        global: {
            stubs: {
                MaxIconButton: {
                    template: '<button class="icon-button"><slot /></button>',
                    props: ['icon', 'i']
                },
                MaxIcon: {
                    template: '<div class="max-icon-stub"></div>',
                    props: ['icon']
                }
            }
        }
    });
}

describe('MaxButton', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('renderiza com label', () => {
        const wrapper = mountButton({ label: 'Salvar' });
        expect(wrapper.text()).toContain('Salvar');
        expect(wrapper.element.tagName).toBe('BUTTON');
        expect(wrapper.classes()).toContain('p-button');
        expect(wrapper.classes()).toContain('p-component');
    });

    it('gera classes de severity e gera ambas para warning', () => {
        const wrapper = mountButton({ label: 'Aviso', severity: 'warning' });
        expect(wrapper.classes()).toContain('p-button-warn');
        expect(wrapper.classes()).toContain('p-button-warning');
        expect(wrapper.attributes('data-p')).toContain('warning');
    });

    it('variantes outlined/text/link geram classes e atributo data-p', () => {
        const wrapper = mountButton({ label: 'Teste', outlined: true });
        expect(wrapper.classes()).toContain('p-button-outlined');
        expect(wrapper.attributes('data-p')).toContain('outlined');

        const wrapperVariant = mountButton({ label: 'Teste', variant: 'text' });
        expect(wrapperVariant.classes()).toContain('p-button-text');
        expect(wrapperVariant.attributes('data-p')).toContain('text');
    });

    it('aplica estado loading com aria-busy e disabled', () => {
        const wrapper = mountButton({ label: 'Salvando', loading: true });
        expect(wrapper.classes()).toContain('p-button-loading');
        expect(wrapper.attributes('aria-busy')).toBe('true');
        expect(wrapper.attributes('disabled')).toBeDefined();
    });

    it('fica desabilitado e ignora cliques quando disabled=true', async () => {
        const wrapper = mountButton({ label: 'Salvar', disabled: true });
        expect(wrapper.classes()).toContain('p-disabled');
        expect(wrapper.attributes('disabled')).toBeDefined();

        await wrapper.trigger('click');
        expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('posiciona ícone à direita quando iconPos=right ou iconRight fornecido', () => {
        const wrapperRight = mountButton({ label: 'Avançar', icon: 'mdi:arrow-right', iconPos: 'right' });
        expect(wrapperRight.find('.p-button-icon-right').exists()).toBe(true);

        const wrapperIconRight = mountButton({ label: 'Avançar', iconRight: 'mdi:arrow-right' });
        expect(wrapperIconRight.find('.p-button-icon-right').exists()).toBe(true);
    });

    it('renderiza como MaxIconButton quando não tem label', () => {
        const wrapper = mountButton({ icon: 'mdi:pencil' });
        expect(wrapper.find('.icon-button-b').exists()).toBe(true);
    });

    it('emite click quando não há route nem action', async () => {
        const wrapper = mountButton({ label: 'Click Me' });
        await wrapper.trigger('click');
        expect(wrapper.emitted('click')).toBeTruthy();
        expect(wrapper.emitted('click')?.[0]).toEqual([true]);
    });

    it('chama action ao invés de click se existir', async () => {
        const actionMock = vi.fn();
        const wrapper = mountButton({ label: 'Action', action: actionMock, data: { id: 2 } });

        await wrapper.trigger('click');
        expect(actionMock).toHaveBeenCalled();
        expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('chama goToRoute quando route for passado', async () => {
        const wrapper = mountButton({ label: 'Go', route: 'home', params: { id: 1 } });
        await wrapper.trigger('click');
        expect(maxUse.goToRoute).toHaveBeenCalledWith('home', { id: 1 });
        expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('aplica classe max-button-dashed quando dashed=true', () => {
        const wrapper = mountButton({ label: 'Tracejado', dashed: true });
        expect(wrapper.classes()).toContain('max-button-dashed');
    });

    it('slot default sobrescreve o conteúdo do botão', () => {
        const wrapper = mountButton({ label: 'Salvar' }, { default: '<span>Conteúdo Custom</span>' });
        expect(wrapper.html()).toContain('Conteúdo Custom');
    });

    it('não emite marcações do PrimeVue', () => {
        const wrapper = mountButton({ label: 'Teste' });
        expect(wrapper.html()).not.toContain('data-pc-name');
        expect(wrapper.html()).not.toContain('data-pc-section');
    });
});
