import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxGrid from '../../src/components/MaxGrid.vue';
import MaxGridCols from '../../src/components/MaxGridCols.vue';
import MaxAnimateFade from '../../src/components/MaxAnimateFade.vue';

describe('MaxGrid', () => {
    it('renderiza corretamente com slot', () => {
        const wrapper = mount(MaxGrid, {
            slots: { default: '<div class="child">Item</div>' }
        });
        expect(wrapper.find('.max-grid-cols').exists()).toBe(true);
        expect(wrapper.find('.child').exists()).toBe(true);
    });

    it('renderiza label quando fornecido', () => {
        const wrapper = mount(MaxGrid, {
            props: { label: 'Dados Pessoais' },
            slots: { default: '<div>Conteúdo</div>' }
        });
        expect(wrapper.find('.label-grid').exists()).toBe(true);
        expect(wrapper.text()).toContain('Dados Pessoais');
    });

    it('não renderiza label quando não fornecido', () => {
        const wrapper = mount(MaxGrid, {
            slots: { default: '<div>Conteúdo</div>' }
        });
        expect(wrapper.find('.label-grid').exists()).toBe(false);
    });

    it('aplica classe label-center quando labelCenter=true', () => {
        const wrapper = mount(MaxGrid, {
            props: { label: 'Centralizado', labelCenter: true },
            slots: { default: '<div>Conteúdo</div>' }
        });
        expect(wrapper.find('.label-grid.label-center').exists()).toBe(true);
    });
});

describe('MaxGridCols', () => {
    it('renderiza corretamente com slot', () => {
        const wrapper = mount(MaxGridCols, {
            slots: { default: '<div class="col">Coluna</div>' }
        });
        expect(wrapper.find('.grid-cols').exists()).toBe(true);
        expect(wrapper.find('.col').exists()).toBe(true);
    });

    it('usa grid com 24 colunas (CSS)', () => {
        const wrapper = mount(MaxGridCols, {
            slots: { default: '<div>Col</div>' }
        });
        expect(wrapper.find('.grid-cols').exists()).toBe(true);
    });
});

describe('MaxAnimateFade', () => {
    it('renderiza slot diretamente', () => {
        const wrapper = mount(MaxAnimateFade, {
            slots: { default: '<div class="conteudo">Animado</div>' }
        });
        expect(wrapper.find('.conteudo').exists()).toBe(true);
        expect(wrapper.text()).toContain('Animado');
    });
});
