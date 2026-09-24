import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTableColumn from '../../src/components/MaxTableColumn.vue';

vi.mock('@maxvue/max-use', () => ({
    useElementSize: () => ({ width: { value: 100 } })
}));

describe('MaxTableColumn.vue', () => {
    it('deve montar corretamente', () => {
        const wrapper = mount(MaxTableColumn, {
            global: {
                stubs: {
                    Column: true
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('não renderiza nenhum conteúdo (template vazio, componente sem lógica própria)', () => {
        const wrapper = mount(MaxTableColumn, {
            global: {
                stubs: {
                    Column: true
                }
            }
        });
        expect(wrapper.html()).toBe('');
        expect(wrapper.findAll('*').length).toBe(0);
    });

    it('aceita props declarativas e renderiza slot default quando fornecido', () => {
        const wrapper = mount(MaxTableColumn, {
            props: {
                field: 'name',
                header: 'Nome do Usuário',
                sortable: true
            },
            slots: {
                default: '<span class="inner-slot">Conteúdo</span>'
            }
        });
        expect(wrapper.props('field')).toBe('name');
        expect(wrapper.props('header')).toBe('Nome do Usuário');
        expect(wrapper.props('sortable')).toBe(true);
        expect(wrapper.find('.inner-slot').text()).toBe('Conteúdo');
    });

    it('aceita props declarativas de filtro e slot #filter', () => {
        const wrapper = mount(MaxTableColumn, {
            props: {
                field: 'email',
                header: 'E-mail',
                filter: true,
                filterField: 'user.email',
                filterPlaceholder: 'Digite o e-mail...',
                filterMatchMode: 'startsWith',
                showClearButton: true,
                showFilterMenu: true
            },
            slots: {
                filter: '<input class="custom-filter-input" />'
            }
        });

        expect(wrapper.props('filter')).toBe(true);
        expect(wrapper.props('filterField')).toBe('user.email');
        expect(wrapper.props('filterPlaceholder')).toBe('Digite o e-mail...');
        expect(wrapper.props('filterMatchMode')).toBe('startsWith');
        expect(wrapper.props('showClearButton')).toBe(true);
        expect(wrapper.props('showFilterMenu')).toBe(true);
    });
});
