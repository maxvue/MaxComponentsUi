import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxFilterBar from '../../src/components/MaxFilterBar.vue';

describe('MaxFilterBar.vue', () => {
    it('deve renderizar container sem tag de form e com papel de region acessível', () => {
        const wrapper = mount(MaxFilterBar, {
            props: {
                ariaLabel: 'Filtros da listagem de clientes'
            }
        });

        expect(wrapper.element.tagName.toLowerCase()).not.toBe('form');
        expect(wrapper.attributes('role')).toBe('region');
        expect(wrapper.attributes('aria-label')).toBe('Filtros da listagem de clientes');
    });

    it('não deve exibir botão Limpar quando activeCount for 0', () => {
        const wrapper = mount(MaxFilterBar, {
            props: {
                activeCount: 0
            }
        });

        const clearBtn = wrapper.find('.max-filter-bar__btn--clear');
        expect(clearBtn.exists()).toBe(false);
    });

    it('deve exibir botão Limpar e badge quando activeCount for maior que 0 e emitir clear ao clicar', async () => {
        const wrapper = mount(MaxFilterBar, {
            props: {
                activeCount: 3
            }
        });

        expect(wrapper.text()).toContain('3 filtros ativos');

        const clearBtn = wrapper.find('.max-filter-bar__btn--clear');
        expect(clearBtn.exists()).toBe(true);

        await clearBtn.trigger('click');
        expect(wrapper.emitted('clear')).toHaveLength(1);
    });

    it('deve exibir botão Aplicar somente quando showApply for true e emitir apply ao clicar', async () => {
        const wrapperNoApply = mount(MaxFilterBar, {
            props: {
                showApply: false
            }
        });
        expect(wrapperNoApply.find('.max-filter-bar__btn--apply').exists()).toBe(false);

        const wrapperApply = mount(MaxFilterBar, {
            props: {
                showApply: true
            }
        });
        const applyBtn = wrapperApply.find('.max-filter-bar__btn--apply');
        expect(applyBtn.exists()).toBe(true);

        await applyBtn.trigger('click');
        expect(wrapperApply.emitted('apply')).toHaveLength(1);
    });

    it('deve desabilitar botões de ação quando loading ou disabled for true', () => {
        const wrapper = mount(MaxFilterBar, {
            props: {
                activeCount: 1,
                showApply: true,
                loading: true
            }
        });

        const clearBtn = wrapper.find('.max-filter-bar__btn--clear');
        const applyBtn = wrapper.find('.max-filter-bar__btn--apply');
        expect(clearBtn.attributes('disabled')).toBeDefined();
        expect(applyBtn.attributes('disabled')).toBeDefined();
    });
});
