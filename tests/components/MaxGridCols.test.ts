import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxGridCols from '../../src/components/MaxGridCols.vue';

describe('MaxGridCols', () => {
    it('renderiza o container com a classe semântica max-grid-cols', () => {
        const wrapper = mount(MaxGridCols, {
            slots: {
                default: '<div class="col-item">Item da Coluna</div>'
            }
        });

        expect(wrapper.classes()).toContain('max-grid-cols');
        expect(wrapper.find('.col-item').exists()).toBe(true);
        expect(wrapper.text()).toContain('Item da Coluna');
    });

    it('projeta múltiplos elementos filhos no slot default', () => {
        const wrapper = mount(MaxGridCols, {
            slots: {
                default: `
                    <div class="col-1">Coluna 1</div>
                    <div class="col-2">Coluna 2</div>
                    <div class="col-3">Coluna 3</div>
                `
            }
        });

        expect(wrapper.findAll('.col-1, .col-2, .col-3')).toHaveLength(3);
    });

    it('repassa atributos e classes adicionais via fallthrough nativo', () => {
        const wrapper = mount(MaxGridCols, {
            attrs: {
                'data-testid': 'grid-cols-24',
                class: 'custom-grid-cols-class'
            }
        });

        expect(wrapper.attributes('data-testid')).toBe('grid-cols-24');
        expect(wrapper.classes()).toContain('custom-grid-cols-class');
        expect(wrapper.classes()).toContain('max-grid-cols');
    });
});
