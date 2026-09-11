import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTable from '../../src/components/MaxTable.vue';
import MaxTableColumn from '../../src/components/MaxTableColumn.vue';
import { ref, h } from 'vue';

const mockWidth = ref(0);
vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        useElementSize: vi.fn(() => ({ width: mockWidth, height: ref(0) }))
    };
});

function mountTable(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxTable, {
        props,
        attrs: { value: [], ...attrs }
    });
}

describe('MaxTable', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockWidth.value = 0;
    });

    it('renderiza corretamente', () => {
        const wrapper = mountTable();
        expect(wrapper.find('.max-table-main-div').exists()).toBe(true);
    });

    it('renderiza container de tabela internamente', () => {
        const wrapper = mountTable();
        expect(wrapper.find('.p-datatable').exists()).toBe(true);
    });

    it('expõe width via defineExpose', () => {
        const wrapper = mountTable();
        expect((wrapper.vm as any).width).toBeDefined();
    });

    it('aceita slots personalizados', () => {
        const wrapper = mount(MaxTable, {
            attrs: { value: [] },
            slots: {
                default: '<div class="custom-slot">Custom</div>'
            }
        });
        expect(wrapper.find('.custom-slot').exists()).toBe(true);
    });

    it('renderiza o slot "buttons" e calcula o width', async () => {
        const wrapper = mount(MaxTable, {
            attrs: { value: [] },
            slots: {
                buttons: '<button class="action-btn">Action</button>'
            }
        });

        expect(wrapper.find('.p-column').exists()).toBe(true);
        expect(wrapper.find('.max-table-buttons').exists()).toBe(true);
        expect(wrapper.find('.action-btn').exists()).toBe(true);

        const vm = wrapper.vm as any;

        mockWidth.value = 50;
        await wrapper.vm.$nextTick();

        expect(vm.width).toBe(60); // calculated_width.value + 10

        // Atualizar novamente não deve mudar se width.value > 1
        mockWidth.value = 100;
        await wrapper.vm.$nextTick();
        expect(vm.width).toBe(60);
    });

    it('renderiza a coluna de botões apenas uma única vez mesmo com múltiplos slots declarados (header, footer, buttons)', () => {
        const wrapper = mount(MaxTable, {
            attrs: { value: [] },
            slots: {
                header: '<div class="header-slot">Header</div>',
                footer: '<div class="footer-slot">Footer</div>',
                buttons: '<button class="action-btn">Action</button>'
            }
        });

        const columns = wrapper.findAll('.p-column');
        expect(columns.length).toBe(1);
    });

    describe('Modo Template-Driven (sem duplicação de slots)', () => {
        it('renderiza o slot default exatamente UMA única vez, sem nós duplicados no tbody', () => {
            const wrapper = mount(MaxTable, {
                slots: {
                    header: '<th>Item</th>',
                    default: '<tr class="test-row"><td>Dado</td></tr>'
                }
            });

            const rows = wrapper.findAll('tbody tr.test-row');
            expect(rows.length).toBe(1);
        });
    });

    describe('Modo Data-Driven com MaxTableColumn', () => {
        const sampleData = [
            { id: 1, name: 'Carlos', info: { role: 'Admin' }, age: 30 },
            { id: 2, name: 'Ana', info: { role: 'User' }, age: 25 },
            { id: 3, name: 'Bruno', info: { role: 'Editor' }, age: 35 }
        ];

        it('renderiza cabeçalhos e células a partir de colunas declarativas e lê campos aninhados', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' }),
                        h(MaxTableColumn, { field: 'info.role', header: 'Cargo' })
                    ]
                }
            });

            const headers = wrapper.findAll('thead th');
            expect(headers.length).toBe(2);
            expect(headers[0].text()).toContain('Nome');
            expect(headers[1].text()).toContain('Cargo');

            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(3);

            const firstRowCells = rows[0].findAll('td.max-table-td');
            expect(firstRowCells[0].text()).toContain('Carlos');
            expect(firstRowCells[1].text()).toContain('Admin');

            // Verifica alternância de zebrado
            expect(rows[0].classes()).toContain('p-row-even');
            expect(rows[1].classes()).toContain('p-row-odd');
            expect(rows[2].classes()).toContain('p-row-even');
        });

        it('suporta scoped slot #body customizado por coluna', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' }),
                        h(MaxTableColumn, { field: 'age', header: 'Idade' }, {
                            body: ({ data }: any) => h('span', { class: 'custom-age' }, `${data.age} anos`)
                        })
                    ]
                }
            });

            const customAgeSpans = wrapper.findAll('.custom-age');
            expect(customAgeSpans.length).toBe(3);
            expect(customAgeSpans[0].text()).toBe('30 anos');
        });

        it('renderiza o slot #empty quando a lista estiver vazia', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: []
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ],
                    empty: '<div class="custom-empty">Nenhum dado cadastrado</div>'
                }
            });

            expect(wrapper.find('.custom-empty').exists()).toBe(true);
            expect(wrapper.text()).toContain('Nenhum dado cadastrado');
        });

        it('ordena registros client-side ao clicar no cabeçalho sortable', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: [...sampleData]
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', sortable: true })
                    ]
                }
            });

            const header = wrapper.find('thead th.max-table-th-sortable');
            expect(header.exists()).toBe(true);

            // Clique 1: Ordenação ascendente (Ana, Bruno, Carlos)
            await header.trigger('click');
            let rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows[0].text()).toContain('Ana');
            expect(rows[1].text()).toContain('Bruno');
            expect(rows[2].text()).toContain('Carlos');

            // Clique 2: Ordenação descendente (Carlos, Bruno, Ana)
            await header.trigger('click');
            rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows[0].text()).toContain('Carlos');
            expect(rows[1].text()).toContain('Bruno');
            expect(rows[2].text()).toContain('Ana');
        });

        it('emite evento @sort em modo lazy sem ordenar localmente', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: [...sampleData],
                    lazy: true
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', sortable: true })
                    ]
                }
            });

            const header = wrapper.find('thead th.max-table-th-sortable');
            await header.trigger('click');

            expect(wrapper.emitted('sort')).toBeTruthy();
            expect(wrapper.emitted('sort')![0]).toEqual([{
                sortField: 'name',
                sortOrder: 1
            }]);

            // Em modo lazy, a ordem original local não deve mudar
            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows[0].text()).toContain('Carlos');
        });

        it('pagina registros e emite @page em formato compatível com DataTablePageEvent', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData,
                    paginator: true,
                    rows: 2
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            // Página 1 (rows: 2 de 3 -> Carlos, Ana)
            let rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(2);
            expect(rows[0].text()).toContain('Carlos');
            expect(rows[1].text()).toContain('Ana');

            const nextBtn = wrapper.findAll('.paginator-btn')[2];
            await nextBtn.trigger('click');

            // Página 2 -> Bruno
            rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(1);
            expect(rows[0].text()).toContain('Bruno');

            expect(wrapper.emitted('page')).toBeTruthy();
            expect(wrapper.emitted('page')![0]).toEqual([{
                page: 1,
                first: 2,
                rows: 2,
                pageCount: 2
            }]);
        });

        it('emite @row-click e atualiza seleção quando clicado', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData,
                    selectionMode: 'single'
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const firstRow = wrapper.findAll('tbody tr.max-table-row')[0];
            await firstRow.trigger('click');

            expect(wrapper.emitted('row-click')).toBeTruthy();
            expect((wrapper.emitted('row-click')![0][0] as any).data).toEqual(sampleData[0]);
            expect(wrapper.emitted('update:selection')).toBeTruthy();
            expect(wrapper.emitted('update:selection')![0][0]).toEqual(sampleData[0]);
        });

        it('aplica classes e estilos definidos na coluna', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, {
                            field: 'name',
                            header: 'Nome',
                            class: 'col-custom-name',
                            headerClass: 'col-header-custom',
                            width: 150
                        })
                    ]
                }
            });

            const th = wrapper.find('thead th');
            expect(th.classes()).toContain('col-custom-name');
            expect(th.classes()).toContain('col-header-custom');
            expect(th.attributes('style')).toContain('width: 150px');

            const td = wrapper.find('tbody td');
            expect(td.classes()).toContain('col-custom-name');
            expect(td.attributes('style')).toContain('width: 150px');
        });

        it('renderiza botões por linha no modo Data-Driven com slot #buttons', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ],
                    buttons: ({ data }: any) => h('button', { class: 'row-btn' }, `Ação ${data.id}`)
                }
            });

            const buttons = wrapper.findAll('.row-btn');
            expect(buttons.length).toBe(3);
            expect(buttons[0].text()).toBe('Ação 1');
            expect(buttons[1].text()).toBe('Ação 2');
            expect(buttons[2].text()).toBe('Ação 3');
        });
    });

    describe('Loading e Empty State (Etapa 11)', () => {
        it('renderiza o estado de loading no Modo Template-Driven', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    loading: true,
                    loadingMessage: 'Aguarde, carregando...'
                },
                slots: {
                    default: '<tr><td>Linha</td></tr>'
                }
            });

            expect(wrapper.find('.max-table-loading-row').exists()).toBe(true);
            expect(wrapper.find('.max-table-spinner').exists()).toBe(true);
            expect(wrapper.text()).toContain('Aguarde, carregando...');
            expect(wrapper.text()).not.toContain('Linha');
        });

        it('renderiza o estado de loading no Modo Data-Driven e oculta registros', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: [{ id: 1, name: 'Carlos' }],
                    loading: true
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            expect(wrapper.find('.max-table-loading-row').exists()).toBe(true);
            expect(wrapper.find('.max-table-spinner').exists()).toBe(true);
            expect(wrapper.text()).not.toContain('Carlos');
        });

        it('NÃO renderiza o empty state quando loading: true no Modo Data-Driven', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: [],
                    loading: true
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            expect(wrapper.find('.max-table-loading-row').exists()).toBe(true);
            expect(wrapper.find('.max-table-empty-row').exists()).toBe(false);
            expect(wrapper.text()).not.toContain('Nenhum registro encontrado');
        });

        it('renderiza o empty state quando empty: true mesmo havendo registros no Modo Data-Driven', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: [{ id: 1, name: 'Carlos' }],
                    empty: true,
                    emptyMessage: 'Forçado vazio'
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            expect(wrapper.find('.max-table-empty-row').exists()).toBe(true);
            expect(wrapper.text()).toContain('Forçado vazio');
            expect(wrapper.text()).not.toContain('Carlos');
        });

        it('permite customizar o estado de loading via slot #loading', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    loading: true
                },
                slots: {
                    loading: '<div class="custom-loader">Carregando dados custom...</div>'
                }
            });

            expect(wrapper.find('.custom-loader').exists()).toBe(true);
            expect(wrapper.text()).toContain('Carregando dados custom...');
        });

        it('renderiza empty state no Modo Template-Driven quando empty: true', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    empty: true,
                    emptyMessage: 'Sem linhas'
                },
                slots: {
                    default: '<tr><td>Linha</td></tr>'
                }
            });

            expect(wrapper.find('.max-table-empty-row').exists()).toBe(true);
            expect(wrapper.text()).toContain('Sem linhas');
            expect(wrapper.text()).not.toContain('Linha');
        });
    });
});
