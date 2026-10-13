import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { h, ref, nextTick } from 'vue';
import MaxGrid from '../../src/components/MaxGrid.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';

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

    describe('quebra explícita de linhas com start e end', () => {
        it('não renderiza elementos .max-grid-row quando não há marcadores ativos', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'item-1 s-10' }, 'Item 1'),
                        h('div', { class: 'item-2 s-20' }, 'Item 2')
                    ]
                }
            });

            expect(wrapper.findAll('.max-grid-row')).toHaveLength(0);
            const directChildren = wrapper.element.children;
            // Apenas os itens diretos (sem labels)
            expect(directChildren).toHaveLength(2);
            expect(directChildren[0].className).toContain('item-1');
            expect(directChildren[1].className).toContain('item-2');
        });

        it('organiza em segmentos de linha quando há marcador end', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'item-1 s7-end' }, 'Item 1'),
                        h('div', { class: 'item-2' }, 'Item 2')
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(2);
            expect(rows[0].text()).toBe('Item 1');
            expect(rows[1].text()).toBe('Item 2');
        });

        it('organiza em segmentos de linha quando há marcador start', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'item-1' }, 'Item 1'),
                        h('div', { class: 'item-2 s3-start' }, 'Item 2')
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(2);
            expect(rows[0].text()).toBe('Item 1');
            expect(rows[1].text()).toBe('Item 2');
        });

        it('trata end seguido de start como uma única fronteira, sem linha vazia intermediária', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'item-1 s7-end' }, 'Item 1'),
                        h('div', { class: 'item-2 s3-10-start' }, 'Item 2')
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(2);
            expect(rows[0].text()).toBe('Item 1');
            expect(rows[1].text()).toBe('Item 2');
        });

        it('não cria segmento vazio antes de item start no início da lista', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'item-1 s3-start' }, 'Item 1'),
                        h('div', { class: 'item-2' }, 'Item 2')
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(1);
            expect(rows[0].findAll('div')).toHaveLength(2);
        });

        it('não cria segmento vazio após item end no final da lista', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'item-1' }, 'Item 1'),
                        h('div', { class: 'item-2 s7-end' }, 'Item 2')
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(1);
            expect(rows[0].findAll('div')).toHaveLength(2);
        });

        it('isola item com ambas as fronteiras start e end em sua própria linha', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'item-1' }, 'Item 1'),
                        h('div', { class: 'item-2 s3-start s7-end' }, 'Item 2'),
                        h('div', { class: 'item-3' }, 'Item 3')
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(3);
            expect(rows[0].text()).toBe('Item 1');
            expect(rows[1].text()).toBe('Item 2');
            expect(rows[2].text()).toBe('Item 3');
        });

        it('reconhece marcadores definidos como atributos booleanos / valueless', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'item-1', 's7-10-end': '' }, 'Campo'),
                        h('div', { class: 'item-2', 's3-start': true }, 'Histórico')
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(2);
            expect(rows[0].text()).toBe('Campo');
            expect(rows[1].text()).toBe('Histórico');
        });

        it('ignora atributos condicionais com false, null ou undefined', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'item-1', 's7-end': false }, 'Item 1'),
                        h('div', { class: 'item-2', 's3-start': null }, 'Item 2'),
                        h('div', { class: 'item-3', 's5-end': undefined }, 'Item 3')
                    ]
                }
            });

            expect(wrapper.findAll('.max-grid-row')).toHaveLength(0);
        });

        it('normaliza classes com array e objeto condicional do Vue', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: ['item-1', { 's7-end': true, 'outra-classe': false }] }, 'Item 1'),
                        h('div', { class: { 's3-start': true, 'inativa-end': false } }, 'Item 2')
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(2);
            expect(rows[0].text()).toBe('Item 1');
            expect(rows[1].text()).toBe('Item 2');
        });

        it('expande Fragments de template/v-for e compõe keys', () => {
            const items = [
                { id: 'a', val: 'A', end: true },
                { id: 'b', val: 'B', end: false }
            ];

            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        items.map((item) => h('div', {
                            key: item.id,
                            class: item.end ? 's7-end' : ''
                        }, item.val))
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(2);
            expect(rows[0].text()).toBe('A');
            expect(rows[1].text()).toBe('B');
        });

        it('não quebra o slot interno de um MaxGrid aninhado', () => {
            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h('div', { class: 'externo-1 s7-end' }, 'Externo 1'),
                        h(MaxGrid, { class: 'grid-aninhado s3-start' }, {
                            default: () => [
                                h('span', { class: 'filho-aninhado-1' }, 'Sub 1'),
                                h('span', { class: 'filho-aninhado-2' }, 'Sub 2')
                            ]
                        })
                    ]
                }
            });

            // Grid externo tem 2 rows
            const rowsExternas = wrapper.findAll(':scope > .max-grid-row');
            expect(rowsExternas).toHaveLength(2);

            // Grid aninhado não tem marcadores em seus próprios filhos, então não tem rows internas
            const gridAninhadoEl = wrapper.find('.grid-aninhado');
            expect(gridAninhadoEl.exists()).toBe(true);
            expect(gridAninhadoEl.findAll('.max-grid-row')).toHaveLength(0);
            expect(gridAninhadoEl.findAll('span')).toHaveLength(2);
        });

        it('preserva reatividade de modelValue e atributos com MaxInputNumber real', async () => {
            const modelVal = ref(42);

            const wrapper = mount(MaxGrid, {
                slots: {
                    default: () => [
                        h(MaxInputNumber, {
                            modelValue: modelVal.value,
                            'onUpdate:modelValue': (v: number | null | undefined) => { modelVal.value = v ?? 0; },
                            's7-end': true
                        }),
                        h('div', { class: 'historico s3-10-start' }, 'Painel')
                    ]
                }
            });

            const rows = wrapper.findAll('.max-grid-row');
            expect(rows).toHaveLength(2);

            const inputComp = wrapper.findComponent(MaxInputNumber);
            expect(inputComp.exists()).toBe(true);
            expect(inputComp.attributes('s7-end')).toBeDefined();

            // Atualização reativa de valor
            modelVal.value = 100;
            await nextTick();

            expect(inputComp.props('modelValue')).toBe(100);
            expect(wrapper.findAll('.max-grid-row')).toHaveLength(2);
        });
    });
});
