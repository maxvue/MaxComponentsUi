import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxGrid from '../../src/components/MaxGrid.vue';

describe('MaxGrid', () => {
    it('renderiza corretamente com slot default', () => {
        const wrapper = mount(MaxGrid, {
            slots: {
                default: '<div class="grid-item">Item 1</div>'
            }
        });

        expect(wrapper.classes()).toContain('max-grid');
        expect(wrapper.find('.grid-item').exists()).toBe(true);
        expect(wrapper.text()).toContain('Item 1');
    });

    it('renderiza label quando informado via prop', () => {
        const wrapper = mount(MaxGrid, {
            props: {
                label: 'Dados Cadastrais'
            },
            slots: {
                default: '<div>Conteúdo</div>'
            }
        });

        const labelEl = wrapper.find('.label-grid');
        expect(labelEl.exists()).toBe(true);
        expect(labelEl.text()).toBe('Dados Cadastrais');
        expect(labelEl.classes()).not.toContain('label-center');
    });

    it('não renderiza label quando a prop label for omitida ou nula', () => {
        const wrapper = mount(MaxGrid, {
            props: {
                label: null
            },
            slots: {
                default: '<div>Conteúdo</div>'
            }
        });

        expect(wrapper.find('.label-grid').exists()).toBe(false);
    });

    it('aplica a classe label-center quando labelCenter=true', () => {
        const wrapper = mount(MaxGrid, {
            props: {
                label: 'Título Central',
                labelCenter: true
            },
            slots: {
                default: '<div>Conteúdo</div>'
            }
        });

        const labelEl = wrapper.find('.label-grid');
        expect(labelEl.exists()).toBe(true);
        expect(labelEl.classes()).toContain('label-center');
    });

    it('repassa atributos customizados e classes ao elemento raiz', () => {
        const wrapper = mount(MaxGrid, {
            attrs: {
                id: 'my-custom-grid',
                'no-message': true
            }
        });

        expect(wrapper.attributes('id')).toBe('my-custom-grid');
        expect(wrapper.attributes('no-message')).toBeDefined();
    });
});
