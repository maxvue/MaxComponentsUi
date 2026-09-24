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

        it('cabeçalho sortable insere botão nativo .max-table-header-button, aria-sort no th, ícone aria-hidden e responde a ativação nativa por clique/teclado (F20 / E08-05)', async () => {
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
            expect(header.attributes('tabindex')).toBeUndefined();
            expect(header.attributes('aria-sort')).toBe('none');
            expect(header.find('.sort-icon-box').attributes('aria-hidden')).toBe('true');

            // Ativação nativa (botão HTML despacha click ao ser acionado por Enter/Espaço): Ascending
            await button.trigger('click');
            expect(header.attributes('aria-sort')).toBe('ascending');
            let rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows[0].text()).toContain('Ana');

            // Segunda ativação nativa: Descending
            await button.trigger('click');
            expect(header.attributes('aria-sort')).toBe('descending');
            rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows[0].text()).toContain('Carlos');

            // Terceira ativação: limpa ordenação
            await button.trigger('click');
            expect(header.attributes('aria-sort')).toBe('none');
        });

        it('garante exatamente uma ordenação por interação no cabeçalho sortable sem duplicação de ativação (F20 / E08-05)', async () => {
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

            // Uma única ativação
            await button.trigger('click');
            expect(header.attributes('aria-sort')).toBe('ascending');
            expect(wrapper.findAll('tbody tr.max-table-row')[0].text()).toContain('Ana');

            // Exatamente mais uma ativação inverte a ordenação para descending
            await button.trigger('click');
            expect(header.attributes('aria-sort')).toBe('descending');
            expect(wrapper.findAll('tbody tr.max-table-row')[0].text()).toContain('Carlos');

            wrapper.unmount();
        });

        it('impõe rigorosamente scope="col" e aria-label estável em todos os elementos th (incluindo botões e slots)', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: [...sampleData],
                    headerButton: 'Ações da linha'
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome do Usuário', sortable: true }),
                        h(MaxTableColumn, { field: 'role', header: 'Perfil de Acesso', sortable: false }),
                        h(MaxTableColumn, { field: 'status' })
                    ],
                    buttons: () => h('button', 'Editar')
                }
            });

            const thList = wrapper.findAll('thead th');
            expect(thList.length).toBe(4);

            for (const th of thList) {
                expect(th.attributes('scope')).toBe('col');
                expect(th.attributes('aria-label')).toBeTruthy();
            }

            expect(thList[0].attributes('aria-label')).toBe('Nome do Usuário');
            expect(thList[1].attributes('aria-label')).toBe('Perfil de Acesso');
            expect(thList[2].attributes('aria-label')).toBe('status');
            expect(thList[3].attributes('aria-label')).toBe('Ações da linha');
        });

        it('garante nome acessível estável mesmo quando o header slot estiver vazio', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: [...sampleData]
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome Completo', sortable: true }, {
                            header: () => []
                        }),
                        h(MaxTableColumn, { field: 'role', sortable: false }, {
                            header: () => null
                        }),
                        h(MaxTableColumn, { sortable: false })
                    ],
                    buttons: () => h('button', 'Ação')
                }
            });

            const thList = wrapper.findAll('thead th');
            expect(thList.length).toBe(4);

            expect(thList[0].attributes('scope')).toBe('col');
            expect(thList[0].attributes('aria-label')).toBe('Nome Completo');
            const sortBtn = thList[0].find('button.max-table-header-button');
            expect(sortBtn.exists()).toBe(true);
            expect(sortBtn.attributes('aria-label')).toBe('Nome Completo');

            expect(thList[1].attributes('scope')).toBe('col');
            expect(thList[1].attributes('aria-label')).toBe('role');

            expect(thList[2].attributes('scope')).toBe('col');
            expect(thList[2].attributes('aria-label')).toBe('Coluna');

            expect(thList[3].attributes('scope')).toBe('col');
            expect(thList[3].attributes('aria-label')).toBe('Ações');
        });

        it('aciona ordenação por teclado via Enter e Espaço reais com exatamente uma emissão e ciclo aria-sort (F20 / R13)', async () => {
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

            expect(header.attributes('aria-sort')).toBe('none');
            expect(wrapper.emitted('sort')).toBeUndefined();

            // 1. Acionamento por tecla Enter: ordena ascending e emite exatamente 1 vez
            await button.trigger('keydown', { key: 'Enter' });
            expect(header.attributes('aria-sort')).toBe('ascending');
            expect(wrapper.emitted('sort')).toHaveLength(1);
            expect(wrapper.emitted('sort')![0]).toEqual([{ sortField: 'name', sortOrder: 1 }]);
            expect(wrapper.findAll('tbody tr.max-table-row')[0].text()).toContain('Ana');

            // 2. Acionamento por tecla Espaço: ordena descending e emite exatamente a 2ª vez
            await button.trigger('keydown', { key: ' ' });
            expect(header.attributes('aria-sort')).toBe('descending');
            expect(wrapper.emitted('sort')).toHaveLength(2);
            expect(wrapper.emitted('sort')![1]).toEqual([{ sortField: 'name', sortOrder: -1 }]);
            expect(wrapper.findAll('tbody tr.max-table-row')[0].text()).toContain('Carlos');

            // 3. Terceiro acionamento por Enter: limpa ordenação (none) e emite a 3ª vez
            await button.trigger('keydown', { key: 'Enter' });
            expect(header.attributes('aria-sort')).toBe('none');
            expect(wrapper.emitted('sort')).toHaveLength(3);
            expect(wrapper.emitted('sort')![2]).toEqual([{ sortField: '', sortOrder: 0 }]);

            // 4. Prevenção de disparo duplo: se keydown for seguido imediatamente por click sintético
            await button.trigger('keydown', { key: 'Enter' });
            await button.trigger('click');
            expect(wrapper.emitted('sort')).toHaveLength(4);
            expect(header.attributes('aria-sort')).toBe('ascending');
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

    describe('Filtragem de Colunas e Filtro Global', () => {
        const filterSample = [
            { id: 1, name: 'Carlos Eduardo', info: { role: 'Admin' }, age: 30, city: 'São Paulo' },
            { id: 2, name: 'Ana Carolina', info: { role: 'User' }, age: 25, city: 'Curitiba' },
            { id: 3, name: 'Bruno Dias', info: { role: 'Editor' }, age: 35, city: 'Belo Horizonte' },
            { id: 4, name: 'Mariana Lima', info: { role: 'User' }, age: 28, city: 'São Paulo' }
        ];

        it('renderiza a linha de filtros tr.max-table-filter-row quando ao menos uma coluna tiver filter: true', () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', filter: true }),
                        h(MaxTableColumn, { field: 'city', header: 'Cidade' })
                    ]
                }
            });

            const filterRow = wrapper.find('thead tr.max-table-filter-row');
            expect(filterRow.exists()).toBe(true);

            const filterInputs = filterRow.findAll('input.max-table-filter-input');
            expect(filterInputs.length).toBe(1);
        });

        it('filtra registros client-side em tempo real através do input de coluna', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample,
                    filterDebounce: 0
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', filter: true }),
                        h(MaxTableColumn, { field: 'city', header: 'Cidade' })
                    ]
                }
            });

            const input = wrapper.find('thead tr.max-table-filter-row input.max-table-filter-input');
            await input.setValue('ana');
            await wrapper.vm.$nextTick();

            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(2);
            expect(rows[0].text()).toContain('Ana Carolina');
            expect(rows[1].text()).toContain('Mariana Lima');
        });

        it('limpa o filtro e restaura as linhas ao clicar no botão Clear', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample,
                    filterDebounce: 0
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', filter: true, showClearButton: true })
                    ]
                }
            });

            const input = wrapper.find('thead tr.max-table-filter-row input.max-table-filter-input');
            await input.setValue('Carlos');
            await wrapper.vm.$nextTick();

            let rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(1);

            const clearBtn = wrapper.find('button.max-table-filter-clear-button');
            expect(clearBtn.exists()).toBe(true);

            await clearBtn.trigger('click');
            await wrapper.vm.$nextTick();

            rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(4);
        });

        it('suporta formato híbrido em v-model:filters (objeto estruturado ou valor primitivo direto)', async () => {
            const filters = ref<Record<string, any>>({
                name: 'Bruno'
            });

            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample,
                    filters: filters.value,
                    'onUpdate:filters': (val: any) => { filters.value = val; }
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', filter: true })
                    ]
                }
            });

            let rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(1);
            expect(rows[0].text()).toContain('Bruno Dias');

            // Alterar para formato estruturado com matchMode startsWith
            await wrapper.setProps({
                filters: {
                    name: { value: 'Car', matchMode: 'startsWith' }
                }
            });
            await wrapper.vm.$nextTick();

            rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(1);
            expect(rows[0].text()).toContain('Carlos Eduardo');
        });

        it('suporta matchModes numéricos (gt, lte, equals) e notação aninhada de campos', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample,
                    filters: {
                        age: { value: 28, matchMode: 'gt' },
                        'info.role': { value: 'Admin', matchMode: 'equals' }
                    }
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' }),
                        h(MaxTableColumn, { field: 'age', header: 'Idade', filter: true }),
                        h(MaxTableColumn, { field: 'info.role', header: 'Cargo', filter: true })
                    ]
                }
            });

            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(1);
            expect(rows[0].text()).toContain('Carlos Eduardo');
        });

        it('suporta scoped slot #filter customizado recebendo filterModel e filterCallback', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample,
                    filterDebounce: 0
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' }),
                        h(MaxTableColumn, { field: 'city', header: 'Cidade', filter: true }, {
                            filter: ({ filterCallback }: any) => h('button', {
                                class: 'custom-filter-curitiba',
                                onClick: () => filterCallback('Curitiba')
                            }, 'Filtrar Curitiba')
                        })
                    ]
                }
            });

            const btn = wrapper.find('.custom-filter-curitiba');
            expect(btn.exists()).toBe(true);

            await btn.trigger('click');
            await wrapper.vm.$nextTick();

            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(1);
            expect(rows[0].text()).toContain('Ana Carolina');
        });

        it('suporta Filtro Global cruzando múltiplos campos (globalFilterFields)', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample,
                    globalFilterFields: ['name', 'city', 'info.role'],
                    filters: {
                        global: { value: 'Paulo' }
                    }
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome' }),
                        h(MaxTableColumn, { field: 'city', header: 'Cidade' })
                    ]
                }
            });

            let rows = wrapper.findAll('tbody tr.max-table-row');
            // 'São Paulo' corresponde a Carlos Eduardo e Mariana Lima
            expect(rows.length).toBe(2);

            // Buscar por cargo através do filtro global
            await wrapper.setProps({
                filters: {
                    global: 'Editor'
                }
            });
            await wrapper.vm.$nextTick();

            rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(1);
            expect(rows[0].text()).toContain('Bruno Dias');
        });

        it('emite eventos @update:filters e @filter e ajusta paginação', async () => {
            const onFilter = vi.fn();
            const onUpdateFilters = vi.fn();

            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample,
                    paginator: true,
                    rows: 2,
                    first: 2, // Segunda página
                    filterDebounce: 0,
                    onFilter,
                    'onUpdate:filters': onUpdateFilters
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', filter: true })
                    ]
                }
            });

            const input = wrapper.find('thead tr.max-table-filter-row input.max-table-filter-input');
            await input.setValue('Carlos');
            await wrapper.vm.$nextTick();

            expect(onUpdateFilters).toHaveBeenCalled();
            expect(onFilter).toHaveBeenCalled();

            // Deve ter resetado a página para first = 0 pois restou apenas 1 item
            expect((wrapper.vm as any).first).toBe(0);
        });

        it('em modo lazy: true não filtra dados localmente e emite evento @filter', async () => {
            const onFilter = vi.fn();

            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample,
                    lazy: true,
                    filterDebounce: 0,
                    onFilter
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', filter: true })
                    ]
                }
            });

            const input = wrapper.find('thead tr.max-table-filter-row input.max-table-filter-input');
            await input.setValue('Inexistente');
            await wrapper.vm.$nextTick();

            // Em modo lazy, os 4 registros continuam renderizados na tabela
            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(4);
            expect(onFilter).toHaveBeenCalledWith(expect.objectContaining({
                filters: expect.objectContaining({
                    name: expect.objectContaining({ value: 'Inexistente' })
                })
            }));
        });

        it('suporta filterDisplay="menu" com botão no cabeçalho e popover de filtro', async () => {
            const wrapper = mount(MaxTable, {
                props: {
                    value: filterSample,
                    filterDisplay: 'menu',
                    filterDebounce: 0
                },
                slots: {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', filter: true })
                    ]
                }
            });

            // No modo menu, não renderiza tr.max-table-filter-row
            expect(wrapper.find('thead tr.max-table-filter-row').exists()).toBe(false);

            // Renderiza botão de filtro no cabeçalho da coluna
            const menuBtn = wrapper.find('thead th .max-table-filter-menu-button');
            expect(menuBtn.exists()).toBe(true);

            // Clicar abre o popover de menu de filtro
            await menuBtn.trigger('click');
            await wrapper.vm.$nextTick();

            const popover = wrapper.find('.max-table-filter-popover');
            expect(popover.exists()).toBe(true);

            // Selecionar startsWith, digitar no input dentro do popover e aplicar
            const modeSelect = popover.find('select.filter-popover-select');
            await modeSelect.setValue('startsWith');

            const menuInput = popover.find('input.max-table-filter-menu-input');
            await menuInput.setValue('Ana');

            const applyBtn = popover.find('button.max-table-filter-apply-btn');
            await applyBtn.trigger('click');
            await wrapper.vm.$nextTick();

            const rows = wrapper.findAll('tbody tr.max-table-row');
            expect(rows.length).toBe(1);
            expect(rows[0].text()).toContain('Ana Carolina');
        });
    });
});
