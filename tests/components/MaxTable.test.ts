import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTable from '../../src/components/MaxTable.vue';
import MaxTableColumn from '../../src/components/MaxTableColumn.vue';
import { ref, h, nextTick } from 'vue';

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

        it('cabeçalho sortable insere botão nativo .max-table-header-button, aria-sort no th, ícone aria-hidden e responde a Enter e Espaço', async () => {
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
            const button = header.find('button.max-table-header-button');
            expect(button.exists()).toBe(true);
            expect(button.attributes('type')).toBe('button');
            expect(button.attributes('aria-label')).toBe('Ordenar por Nome');
            expect(header.attributes('scope')).toBe('col');
            expect(header.attributes('tabindex')).toBeUndefined();
            expect(header.attributes('aria-sort')).toBe('none');
            expect(header.find('.sort-icon-box').attributes('aria-hidden')).toBe('true');

            // Enter: Ascending
            await button.trigger('keydown', { key: 'Enter' });
            expect(header.attributes('aria-sort')).toBe('ascending');
            let rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows[0].text()).toContain('Ana');

            // Space: Descending
            await button.trigger('keydown', { key: ' ' });
            expect(header.attributes('aria-sort')).toBe('descending');
            rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows[0].text()).toContain('Carlos');
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

        it('renderiza resumo "Exibindo X–Y de Z" e desabilita controles durante loading', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData,
                    paginator: true,
                    rows: 2,
                    totalRecords: 3,
                    loading: false
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const summary = wrapper.find('.paginator-summary');
            expect(summary.exists()).toBe(true);
            expect(summary.text()).toContain('Exibindo 1–2 de 3');

            const info = wrapper.find('.paginator-info');
            expect(info.exists()).toBe(true);
            expect(info.text()).toContain('Página 1 de 2');

            // Quando loading é ativado, botões de paginação ficam desabilitados
            await wrapper.setProps({ loading: true });
            const buttons = wrapper.findAll('.paginator-btn');
            for (const btn of buttons) {
                expect(btn.attributes('disabled')).toBeDefined();
            }
        });

        it('em modo lazy não fatia registros localmente e respeita totalRecords', () => {
            const remotePageItems = [
                { id: '10', name: 'Item Remoto 1' },
                { id: '11', name: 'Item Remoto 2' }
            ];
            const wrapper = mount(MaxTable, {
                props: {
                    value: remotePageItems,
                    paginator: true,
                    lazy: true,
                    first: 20,
                    rows: 10,
                    totalRecords: 50
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            // No modo lazy, exibe todos os itens passados na página sem fatia local
            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(2);
            expect(rows[0].text()).toContain('Item Remoto 1');

            const summary = wrapper.find('.paginator-summary');
            expect(summary.text()).toContain('Exibindo 21–22 de 50');

            const info = wrapper.find('.paginator-info');
            expect(info.text()).toContain('Página 3 de 5');
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

    describe('Acessibilidade e Operações por Teclado nas Linhas (E08-05)', () => {
        const sampleData = [
            { id: 1, name: 'Carlos', role: 'Admin' },
            { id: 2, name: 'Ana', role: 'User' },
            { id: 3, name: 'Bruno', role: 'Editor' }
        ];

        it('linhas estáticas permanecem fora do Tab e sem aria-selected', () => {
            const wrapper = mount(MaxTable, {
                props: { value: sampleData },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(3);
            for (const row of rows) {
                expect(row.attributes('tabindex')).toBeUndefined();
                expect(row.attributes('aria-selected')).toBeUndefined();
                expect(row.classes()).not.toContain('max-table-row-interactive');
            }
        });

        it('linhas interativas com selectionMode aplicam tabindex="0", classe interativa e aria-selected', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData,
                    selectionMode: 'single',
                    selection: sampleData[0]
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows[0].attributes('tabindex')).toBe('0');
            expect(rows[0].attributes('aria-selected')).toBe('true');
            expect(rows[0].classes()).toContain('max-table-row-interactive');

            expect(rows[1].attributes('tabindex')).toBe('0');
            expect(rows[1].attributes('aria-selected')).toBe('false');
            expect(rows[1].classes()).toContain('max-table-row-interactive');
        });

        it('tecla Espaço alterna seleção em selectionMode single', async () => {
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

            const rows = wrapper.findAll('tbody tr.max-table-row');

            // Espaço na linha não selecionada: seleciona
            await rows[0].trigger('keydown', { key: ' ' });
            expect(wrapper.emitted('update:selection')).toBeTruthy();
            expect(wrapper.emitted('update:selection')![0]).toEqual([sampleData[0]]);

            // Atualiza prop selection para simular estado selecionado e pressiona Espaço novamente: desseleciona
            await wrapper.setProps({ selection: sampleData[0] });
            await rows[0].trigger('keydown', { key: ' ' });
            expect(wrapper.emitted('update:selection')![1]).toEqual([null]);
        });

        it('tecla Espaço alterna seleção em selectionMode multiple', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData,
                    selectionMode: 'multiple',
                    selection: [sampleData[0]]
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const rows = wrapper.findAll('tbody tr.max-table-row');

            // Espaço na linha 2 (não selecionada): adiciona à seleção
            await rows[1].trigger('keydown', { key: ' ' });
            expect(wrapper.emitted('update:selection')).toBeTruthy();
            expect(wrapper.emitted('update:selection')![0]).toEqual([[sampleData[0], sampleData[1]]]);

            // Espaço na linha 1 (já selecionada): remove da seleção
            await rows[0].trigger('keydown', { key: ' ' });
            expect(wrapper.emitted('update:selection')![1]).toEqual([[]]);
        });

        it('tecla Enter ativa row-click quando ouvinte fornecido e não cria seleção implícita', async () => {
            const onRowClick = vi.fn();
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData,
                    onRowClick
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows[0].attributes('tabindex')).toBe('0');
            // Como selectionMode não está configurado, aria-selected não deve existir
            expect(rows[0].attributes('aria-selected')).toBeUndefined();

            // Enter ativa row-click
            await rows[0].trigger('keydown', { key: 'Enter' });
            expect(wrapper.emitted('row-click')).toBeTruthy();
            expect(wrapper.emitted('row-click')![0][0]).toMatchObject({
                data: sampleData[0],
                index: 0
            });

            // Espaço NÃO deve selecionar nem emitir nada
            await rows[0].trigger('keydown', { key: ' ' });
            expect(wrapper.emitted('update:selection')).toBeFalsy();
            expect(wrapper.emitted('row-click')).toHaveLength(1);
        });

        it('quando apenas selectionMode existe sem row-click, tecla Enter não cria ação implícita', async () => {
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

            const rows = wrapper.findAll('tbody tr.max-table-row');
            await rows[0].trigger('keydown', { key: 'Enter' });
            expect(wrapper.emitted('row-click')).toBeFalsy();
            expect(wrapper.emitted('update:selection')).toBeFalsy();
        });

        it('ignora eventos de teclado e clique disparados em controles interativos filhos da linha', async () => {
            const onRowClick = vi.fn();
            const wrapper = mount(MaxTable, {
                props: {
                    value: sampleData,
                    selectionMode: 'single',
                    onRowClick
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' }),
                        h(MaxTableColumn, { field: 'action', header: 'Ação' }, {
                            body: () => h('button', { class: 'inner-action-btn' }, 'Excluir')
                        })
                    ]
                }
            });

            const innerButton = wrapper.find('.inner-action-btn');
            expect(innerButton.exists()).toBe(true);

            // Clique no botão interno
            await innerButton.trigger('click');
            expect(wrapper.emitted('row-click')).toBeFalsy();
            expect(wrapper.emitted('update:selection')).toBeFalsy();

            // Teclado no botão interno
            await innerButton.trigger('keydown', { key: 'Enter' });
            expect(wrapper.emitted('row-click')).toBeFalsy();

            await innerButton.trigger('keydown', { key: ' ' });
            expect(wrapper.emitted('update:selection')).toBeFalsy();
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

    describe('Virtual Scroll (@tanstack/vue-virtual)', () => {
        function makeDataset(count: number) {
            return Array.from({ length: count }, (_, i) => ({
                id: i + 1,
                name: `Item ${i + 1}`,
                value: `Val ${i + 1}`
            }));
        }

        function stubViewport(el: HTMLElement, height: number) {
            Object.defineProperty(el, 'clientHeight', { value: height, configurable: true });
            Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
            el.getBoundingClientRect = () => ({
                top: 0,
                left: 0,
                right: 600,
                bottom: height,
                width: 600,
                height,
                x: 0,
                y: 0,
                toJSON: () => ({})
            } as DOMRect);
        }

        async function settle() {
            await new Promise((r) => setTimeout(r, 0));
            await nextTick();
            await nextTick();
        }

        it('com 1000 itens e virtualScroll: true, renderiza apenas subconjunto visível no DOM', async () => {
            const data = makeDataset(1000);
            const wrapper = mount(MaxTable, {
                props: {
                    value: data,
                    virtualScroll: true,
                    itemHeight: 40
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const tbody = wrapper.find('tbody').element as HTMLElement;
            stubViewport(tbody, 400);
            await settle();

            const renderedRows = wrapper.findAll('tbody tr.max-table-row');
            expect(renderedRows.length).toBeGreaterThan(0);
            expect(renderedRows.length).toBeLessThan(50);
        });

        it('adota altura fixa e atribui itemHeight quando fornecido', async () => {
            const data = makeDataset(50);
            const wrapper = mount(MaxTable, {
                props: {
                    value: data,
                    virtualScroll: true,
                    itemHeight: 50
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const tbody = wrapper.find('tbody').element as HTMLElement;
            stubViewport(tbody, 500);
            await settle();

            const firstRow = wrapper.find('tbody tr.max-table-row');
            expect(firstRow.attributes('style')).toContain('height: 50px');
        });

        it('adota sistema de medição dinâmica com data-index quando itemHeight não é fornecido', async () => {
            const data = makeDataset(20);
            const wrapper = mount(MaxTable, {
                props: {
                    value: data,
                    virtualScroll: true
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const tbody = wrapper.find('tbody').element as HTMLElement;
            stubViewport(tbody, 400);
            await settle();

            const firstRow = wrapper.find('tbody tr.max-table-row');
            expect(firstRow.attributes('data-index')).toBe('0');
        });

        it('expõe métodos scrollToIndex e scrollToOffset via defineExpose', async () => {
            const data = makeDataset(100);
            const wrapper = mount(MaxTable, {
                props: {
                    value: data,
                    virtualScroll: true,
                    itemHeight: 40
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const vm = wrapper.vm as any;
            expect(typeof vm.scrollToIndex).toBe('function');
            expect(typeof vm.scrollToOffset).toBe('function');
            expect(vm.totalVirtualHeight).toBeGreaterThan(0);

            expect(() => vm.scrollToIndex(20)).not.toThrow();
            expect(() => vm.scrollToOffset(400)).not.toThrow();
        });

        it('mantém seleção de linha e evento @row-click em modo virtualScroll', async () => {
            const data = makeDataset(20);
            const wrapper = mount(MaxTable, {
                props: {
                    value: data,
                    virtualScroll: true,
                    itemHeight: 40,
                    selectionMode: 'single'
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const tbody = wrapper.find('tbody').element as HTMLElement;
            stubViewport(tbody, 400);
            await settle();

            const firstRow = wrapper.find('tbody tr.max-table-row');
            await firstRow.trigger('click');

            expect(wrapper.emitted('row-click')).toBeTruthy();
            expect(wrapper.emitted('update:selection')?.[0]?.[0]).toEqual(data[0]);
        });

        it('recalcula dimensões quando ResizeObserver ou getBoundingClientRect reporta alturas dinâmicas diferentes', async () => {
            const data = makeDataset(10);
            const wrapper = mount(MaxTable, {
                props: {
                    value: data,
                    virtualScroll: true
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' })
                    ]
                }
            });

            const tbody = wrapper.find('tbody').element as HTMLElement;
            stubViewport(tbody, 400);
            await settle();

            // Simula uma linha com altura maior (65px)
            const firstTr = wrapper.find('tbody tr.max-table-row').element as HTMLElement;
            firstTr.getBoundingClientRect = () => ({
                top: 0,
                left: 0,
                right: 600,
                bottom: 65,
                width: 600,
                height: 65,
                x: 0,
                y: 0,
                toJSON: () => ({})
            } as DOMRect);

            (wrapper.vm as any).rowVirtualizer.measureElement(firstTr);
            await settle();

            expect((wrapper.vm as any).rowVirtualizer.getTotalSize()).toBeGreaterThanOrEqual(400);
        });
    });

    describe('Anatomia visual compartilhada e feedback de célula (E10-08)', () => {
        it('não contém regra display: none para .input-message no SFC', async () => {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxTable.vue'), 'utf-8');

            expect(sfc).not.toMatch(/\.input-message\s*\{[^}]*display:\s*none/);
        });

        it('importa e consome os mixins compartilhados de table-anatomy', async () => {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxTable.vue'), 'utf-8');

            expect(sfc).toContain('@use \'../themes/table-anatomy\' as table;');
            expect(sfc).toContain('@include table.table-container');
            expect(sfc).toContain('@include table.table-header-row');
            expect(sfc).toContain('@include table.table-header-cell');
            expect(sfc).toContain('@include table.table-body-row');
            expect(sfc).toContain('@include table.table-row-zebra');
            expect(sfc).toContain('@include table.table-cell-input-feedback');
        });
    });
});
