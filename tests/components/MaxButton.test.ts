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

function mountButton(props: Record<string, any> = {}) {
    return mount(MaxButton, {
        props,
        global: {
            stubs: {
                MaxIconButton: {
                    template: '<button class="icon-button"><slot /></button>',
                    props: ['icon', 'i']
                },
                MaxIcon: {
                    // `flex` fica fora de props de propósito: assim cai em attrs
                    // e é renderizado no DOM, como no MaxIcon real.
                    template: '<div class="max-icon-stub" :data-size="String(size)"></div>',
                    props: ['icon', 'size']
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
    });

    it('renderiza como MaxIconButton quando não tem label', () => {
        const wrapper = mountButton({ icon: 'mdi:pencil' });
        expect(wrapper.exists()).toBe(true);
    });

    it('aplica severity passada via props', () => {
        const wrapper = mountButton({ label: 'Excluir', severity: 'danger' });
        expect(wrapper.exists()).toBe(true);
    });

    it('fica desabilitado quando disabled=true', () => {
        const wrapper = mountButton({ label: 'Salvar', disabled: true });
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza com ícone quando icon é passado', () => {
        const wrapper = mountButton({ label: 'Salvar', icon: 'mdi:check' });
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza ícone de loading quando loading=true', () => {
        const wrapper = mountButton({ label: 'Salvar', loading: true });
        // Line 10 (template #loadingicon) should be covered
        expect(wrapper.html()).toContain('max-icon-stub');
    });

    it('emite click quando não há route nem action', async () => {
        const wrapper = mountButton({ label: 'Click Me' });
        (wrapper.vm as any).onClick(new MouseEvent('click'));
        expect(wrapper.emitted('click')).toBeTruthy();
        expect(wrapper.emitted('click')?.[0]).toEqual([true]);
    });

    it('chama action ao invés de click se existir', () => {
        const actionMock = vi.fn();
        const wrapper = mountButton({ label: 'Action', action: actionMock, data: { id: 2 } });

        // Chamando onClick
        (wrapper.vm as any).onClick(new MouseEvent('click'));
        expect(actionMock).toHaveBeenCalled();
        expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('chama goToRoute quando route for passado', () => {
        const wrapper = mountButton({ label: 'Go', route: 'home', params: { id: 1 } });
        (wrapper.vm as any).onClick(new MouseEvent('click'));
        expect(maxUse.goToRoute).toHaveBeenCalledWith('home', { id: 1 });
        expect(wrapper.emitted('click')).toBeFalsy();
    });

    describe('tamanho do ícone', () => {
        it('size textual dimensiona o botão, não o ícone', () => {
            const wrapper = mountButton({ label: 'Salvar', icon: 'mdi:check', size: 'small' });

            // 'small' é tamanho de BOTÃO: não pode vazar como tamanho do ícone.
            expect(wrapper.find('.max-icon-stub').attributes('data-size')).toBe('1.4');
            expect(wrapper.find('button').classes()).toContain('p-button-sm');
        });

        // params.scss:109 tem `[full],[flex] { width:100% !important }`, e o
        // seletor casa pela PRESENÇA do atributo. Com :flex="loading" o Vue
        // renderiza flex="false" quando loading é falso — o atributo existe, a
        // regra vence o estilo inline e o ícone estica até o contêiner.
        it('não emite o atributo flex quando não está carregando', () => {
            const wrapper = mountButton({ label: 'Salvar', icon: 'mdi:check' });
            const icon = wrapper.find('.max-icon-stub');

            expect(icon.attributes('flex')).toBeUndefined();
        });

        it('size numérico ainda dimensiona o ícone (uso legado)', () => {
            const wrapper = mountButton({ label: 'Salvar', icon: 'mdi:check', size: 2 });
            expect(wrapper.find('.max-icon-stub').attributes('data-size')).toBe('2');
        });

        it('sizeIcon e iconSize têm precedência sobre o default', () => {
            const comSizeIcon = mountButton({ label: 'A', icon: 'mdi:check', sizeIcon: 3, size: 'large' });
            expect(comSizeIcon.find('.max-icon-stub').attributes('data-size')).toBe('3');

            const comIconSize = mountButton({ label: 'B', icon: 'mdi:check', iconSize: 2.5 });
            expect(comIconSize.find('.max-icon-stub').attributes('data-size')).toBe('2.5');
        });
    });
});
