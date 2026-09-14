import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTableFields from '../../src/components/MaxTableFields.vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        ulid: () => 'mock-id',
        size: (arr: any[]) => arr?.length || 0,
        getCssSize: (val: any) => (typeof val === 'number' ? `${val}px` : val)
    };
});

describe('MaxTableFields.vue', () => {
    it('deve montar e renderizar os headers corretamente', () => {
        const columns = [{ field: 'name', header: 'Nome', slot: 'name' }];
        const wrapper = mount(MaxTableFields, {
            props: {
                list: [{ name: 'Teste' }],
                columns
            },
            global: {
                stubs: {
                    MaxIconButton: true,
                    MaxInputText: true
                }
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).toContain('Nome');
        expect(wrapper.html()).toContain('Teste');
    });

    it('deve emitir update:field ao alterar um input', async () => {
        const columns = [{ field: 'name', header: 'Nome', input: 'text' }];
        const wrapper = mount(MaxTableFields, {
            props: {
                list: [{ name: 'Teste' }],
                columns
            },
            global: {
                stubs: {
                    MaxInputText: true
                }
            }
        });

        (wrapper.vm as any).setFieldValue((wrapper.props('list') as any[])[0], 'name', 'Novo Teste', columns[0] as any);
        expect(wrapper.emitted('update:field')).toBeTruthy();
        expect(wrapper.emitted('update:field')?.[0][0]).toEqual({ row: { name: 'Novo Teste' }, field: 'name', value: 'Novo Teste' });
    });

    it('deve lidar com campos aninhados em getFieldValue e setFieldValue', () => {
        const columns = [{ field: 'user.name', header: 'Nome' }];
        const list = [{ user: { name: 'João' } }];
        const wrapper = mount(MaxTableFields, {
            props: { list, columns }
        });

        expect((wrapper.vm as any).getFieldValue(list[0], 'user.name')).toBe('João');
        expect((wrapper.vm as any).getFieldValue(list[0], null)).toBe('');

        (wrapper.vm as any).setFieldValue(list[0], 'user.name', 'Maria');
        expect(list[0].user.name).toBe('Maria');
    });

    it('deve testar incrementValue e decrementValue', () => {
        const columns = [{ field: 'qty', header: 'Quantidade', input: 'increment' }];
        const list = [{ qty: 10 }];
        const wrapper = mount(MaxTableFields, {
            props: { list, columns },
            global: { stubs: { MaxIconButton: true } }
        });

        (wrapper.vm as any).incrementValue(list[0], columns[0]);
        expect(list[0].qty).toBe(11);

        (wrapper.vm as any).decrementValue(list[0], columns[0]);
        expect(list[0].qty).toBe(10);

        (wrapper.vm as any).decrementValue(list[0], columns[0]);
        expect(list[0].qty).toBe(9);
    });

    it('resolveData com string, object e casos de fallback', () => {
        const wrapper = mount(MaxTableFields, {
            props: { list: [], columns: [] }
        });

        const row = { car: { color: 'blue' }, simple: 'text', id: 5 };

        expect((wrapper.vm as any).resolveData(row, null)).toBe(null);
        expect((wrapper.vm as any).resolveData(row, 'car.color')).toBe('blue');

        const objData = { color: 'car.color', size: 10, idx: 'id' };
        const resolved = (wrapper.vm as any).resolveData(row, objData);
        // Cada valor string é resolvido como caminho no row; valores não-string são mantidos.
        expect(resolved).toEqual({ color: 'blue', size: 10, idx: 5 });

        // Fallback for non-object, non-string, non-falsy values
        const numData = 42;
        expect((wrapper.vm as any).resolveData(row, numData)).toBe(42);

        // This hits the `if (keys.includes('id'))` branch for coverage even though keys is empty.
        expect((wrapper.vm as any).resolveData(row, true)).toBe(true);
    });

    it('resolveData com array data', () => {
        const wrapper = mount(MaxTableFields, {
            props: { list: [], columns: [] }
        });
        const row = { id: 5 };
        const arrData = [1, 2];
        expect((wrapper.vm as any).resolveData(row, arrData)).toEqual([1, 2]);
    });

    it('calcula o estilo das colunas corretamente', () => {
        const columns: any[] = [
            { field: 'col1', width: '100px' },
            { field: 'col2', size: '200px' },
            { field: 'col3', minWidth: '50px', maxWidth: '300px', align: 'center' }
        ];

        const wrapper = mount(MaxTableFields, {
            props: {
                list: [{ col1: 'a', col2: 'b', col3: 'c' }],
                columns
            }
        });

        const ths = wrapper.findAll('.max-table-fields-th');
        expect(ths[0].attributes('style')).toContain('width: 100px');
        expect(ths[0].attributes('style')).toContain('max-width: 100px');

        expect(ths[1].attributes('style')).toContain('width: 200px');
        expect(ths[1].attributes('style')).toContain('max-width: 200px');

        expect(ths[2].attributes('style')).toContain('min-width: 50px');
        expect(ths[2].attributes('style')).toContain('max-width: 300px');
        expect(ths[2].attributes('style')).toContain('text-align: center');
    });

    it('renderiza emptyMessage quando list for vazio', () => {
        const wrapper = mount(MaxTableFields, {
            props: { list: [], columns: [{ field: 'id', header: 'ID' }] }
        });
        expect(wrapper.text()).toContain('Nenhum registro encontrado');
    });

    it('converte object em list iterável', () => {
        const listAsObj = { 'key1': { id: 1 }, 'key2': { id: 2 } };
        const wrapper = mount(MaxTableFields, {
            props: { list: listAsObj, columns: [{ field: 'id', header: 'ID' }] }
        });
        expect((wrapper.vm as any).normalizedList.length).toBe(2);
    });

    it('renderiza os diferentes tipos de input', () => {
        const columns = [
            { field: 'c1', input: 'number' },
            { field: 'c2', input: 'select', options: ['A', 'B'] },
            { field: 'c3', input: 'date' },
            { field: 'c4', input: 'checkbox' },
            { field: 'c5', input: 'textarea' },
            { field: 'c6', input: 'auto-complete', options: ['A'] },
            { field: 'c7', input: 'auto-complete-api', route: '/api' },
            { field: 'c8', input: 'phone-number' },
            { field: 'c9', input: 'other-fallback' }
        ];
        const wrapper = mount(MaxTableFields, {
            props: { list: [{}], columns },
            global: {
                stubs: {
                    MaxInputNumber: true,
                    MaxInputSelect: true,
                    MaxInputDatePicker: true,
                    MaxInputCheckbox: true,
                    MaxInputTextArea: true,
                    MaxInputAutoComplete: true,
                    MaxInputAutoCompleteApi: true,
                    MaxInputPhone: true
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
        // Fire updates to test setFieldValue for each input
        ['MaxInputNumber', 'MaxInputSelect', 'MaxInputDatePicker', 'MaxInputCheckbox', 'MaxInputTextArea', 'MaxInputAutoComplete', 'MaxInputAutoCompleteApi', 'MaxInputPhone'].forEach((comp) => {
            const compWrapper = wrapper.findComponent({ name: comp });
            expect(compWrapper.exists()).toBe(true);
            compWrapper.vm.$emit('update:modelValue', comp === 'MaxInputCheckbox' ? true : 'new-val');
        });
    });

    it('renderiza botões na coluna de ações e props.buttons', () => {
        const wrapper = mount(MaxTableFields, {
            props: {
                list: [{ id: 1 }],
                columns: [],
                buttons: [{ id: 'btn1', icon: 'test' }]
            },
            global: { stubs: { MaxIconButton: true } }
        });
        expect(wrapper.find('.max-table-fields-buttons').exists()).toBe(true);
    });

    it('emite update:field e executa col.action para cada alteração em edições consecutivas (< 100ms)', async () => {
        const colActionSpy = vi.fn();
        const columns = [{ field: 'name', header: 'Nome', input: 'text', action: colActionSpy }];
        const list = [{ name: 'Valor1' }];
        const wrapper = mount(MaxTableFields, {
            props: { list, columns }
        });

        (wrapper.vm as any).setFieldValue(list[0], 'name', 'Valor2', columns[0]);
        (wrapper.vm as any).setFieldValue(list[0], 'name', 'Valor3', columns[0]);

        expect(wrapper.emitted('update:field')?.length).toBe(2);
        expect(colActionSpy).toHaveBeenCalledTimes(2);
    });

    it('deriva rowKey corretamente usando dataKey, id, uuid, ulid ou fallback', () => {
        const columns = [{ field: 'name', header: 'Nome' }];
        const wrapper = mount(MaxTableFields, {
            props: { list: [], columns, dataKey: 'code' }
        });

        expect((wrapper.vm as any).rowKey({ code: 'C10' }, 0)).toBe('C10');
        expect((wrapper.vm as any).rowKey({ id: 'ID1' }, 0)).toBe('ID1');
        expect((wrapper.vm as any).rowKey({ uuid: 'U1' }, 0)).toBe('U1');
        expect((wrapper.vm as any).rowKey({ ulid: 'UL1' }, 0)).toBe('UL1');
        expect((wrapper.vm as any).rowKey({ _recordKey: 'K1' }, 0)).toBe('K1');
        expect((wrapper.vm as any).rowKey({}, 3)).toBe(3);
    });

    it('calcula totalColspan corretamente quando list é vazio usando props.buttons ou slot buttons', () => {
        const columns = [{ field: 'name', header: 'Nome' }];

        // Com prop buttons
        const wrapperProps = mount(MaxTableFields, {
            props: { list: [], columns, buttons: [{ id: 'b1' }] }
        });
        expect(wrapperProps.find('.max-table-fields-empty-cell').attributes('colspan')).toBe('2');

        // Com slot buttons
        const wrapperSlot = mount(MaxTableFields, {
            props: { list: [], columns },
            slots: { buttons: '<div>Ações</div>' }
        });
        expect(wrapperSlot.find('.max-table-fields-empty-cell').attributes('colspan')).toBe('2');

        // Sem botões
        const wrapperNone = mount(MaxTableFields, {
            props: { list: [], columns }
        });
        expect(wrapperNone.find('.max-table-fields-empty-cell').attributes('colspan')).toBe('1');
    });

    it('renderiza fallback limpo de slot de coluna sem vazar nome de slot e campo', () => {
        const columns = [{ field: 'name', header: 'Nome', slot: 'inexistente' }];
        const list = [{ name: 'Maria' }];
        const wrapper = mount(MaxTableFields, {
            props: { list, columns }
        });

        const cellText = wrapper.find('.default-slot').text();
        expect(cellText).toBe('Maria');
        expect(cellText).not.toContain('inexistente');
        expect(cellText).not.toContain('name');
    });

    it('exibe o valor como texto em colunas sem slot e sem input', () => {
        const columns = [{ field: 'role', header: 'Cargo' }];
        const list = [{ role: 'Desenvolvedor' }];
        const wrapper = mount(MaxTableFields, {
            props: { list, columns }
        });

        expect(wrapper.find('.max-table-fields-td').text()).toBe('Desenvolvedor');
    });

    it('aplica buttonsWidth na coluna de ações quando fornecido', () => {
        const wrapper = mount(MaxTableFields, {
            props: {
                list: [{ id: 1 }],
                columns: [{ field: 'id', header: 'ID' }],
                buttonsWidth: '150px',
                buttons: [{ id: 'btn1', icon: 'test' }]
            },
            global: { stubs: { MaxIconButton: true } }
        });

        const thButtons = wrapper.find('.max-table-fields-th-buttons');
        const tdButtons = wrapper.find('.max-table-fields-buttons');

        expect(thButtons.attributes('style')).toContain('width: 150px');
        expect(thButtons.attributes('style')).toContain('max-width: 150px');
        expect(tdButtons.attributes('style')).toContain('width: 150px');
        expect(tdButtons.attributes('style')).toContain('max-width: 150px');
    });

    it('não colapsa para width: 0px quando renderizado apenas com slot buttons', () => {
        const wrapper = mount(MaxTableFields, {
            props: {
                list: [{ id: 1 }],
                columns: [{ field: 'id', header: 'ID' }]
            },
            slots: {
                buttons: '<button class="custom-btn">Ação</button>'
            }
        });

        const thButtons = wrapper.find('.max-table-fields-th-buttons');
        const tdButtons = wrapper.find('.max-table-fields-buttons');

        expect(thButtons.exists()).toBe(true);
        expect(tdButtons.exists()).toBe(true);
        expect(thButtons.attributes('style') || '').not.toContain('width: 0px');
        expect(tdButtons.attributes('style') || '').not.toContain('width: 0px');
    });

    it('aplica buttonsWidth na coluna de ações quando usado apenas com slot buttons', () => {
        const wrapper = mount(MaxTableFields, {
            props: {
                list: [{ id: 1 }],
                columns: [{ field: 'id', header: 'ID' }],
                buttonsWidth: '140px'
            },
            slots: {
                buttons: '<button class="custom-btn">Ação</button>'
            }
        });

        const thButtons = wrapper.find('.max-table-fields-th-buttons');
        const tdButtons = wrapper.find('.max-table-fields-buttons');

        expect(thButtons.attributes('style')).toContain('width: 140px');
        expect(tdButtons.attributes('style')).toContain('width: 140px');
    });

    it('calcula largura automática da coluna de ações com base na quantidade de botões quando buttonsWidth for omitido', () => {
        const wrapper = mount(MaxTableFields, {
            props: {
                list: [{ id: 1 }],
                columns: [{ field: 'id', header: 'ID' }],
                buttons: [
                    { id: 'b1', icon: 'i1' },
                    { id: 'b2', icon: 'i2' },
                    { id: 'b3', icon: 'i3' }
                ]
            },
            global: { stubs: { MaxIconButton: true } }
        });

        const thButtons = wrapper.find('.max-table-fields-th-buttons');
        const tdButtons = wrapper.find('.max-table-fields-buttons');

        // 3 botões * 32px = 96px
        expect(thButtons.attributes('style')).toContain('width: 96px');
        expect(tdButtons.attributes('style')).toContain('width: 96px');
    });

    it('aceita buttonsWidth numérico e converte para pixels via getCssSize', () => {
        const wrapper = mount(MaxTableFields, {
            props: {
                list: [{ id: 1 }],
                columns: [{ field: 'id', header: 'ID' }],
                buttonsWidth: 160,
                buttons: [{ id: 'b1' }]
            },
            global: { stubs: { MaxIconButton: true } }
        });

        const thButtons = wrapper.find('.max-table-fields-th-buttons');
        const tdButtons = wrapper.find('.max-table-fields-buttons');

        expect(thButtons.attributes('style')).toContain('width: 160px');
        expect(tdButtons.attributes('style')).toContain('width: 160px');
    });

    describe('Loading, Empty State e Resiliência (Etapa 11)', () => {
        it('deve renderizar a linha de loading com spinner e mensagem correta quando loading: true', () => {
            const wrapper = mount(MaxTableFields, {
                props: {
                    columns: [{ field: 'name', header: 'Nome' }],
                    list: [],
                    loading: true,
                    loadingMessage: 'Carregando registros de teste...'
                }
            });

            expect(wrapper.find('.max-table-fields-loading').exists()).toBe(true);
            expect(wrapper.find('.max-table-spinner').exists()).toBe(true);
            expect(wrapper.find('.max-table-loading-text').text()).toBe('Carregando registros de teste...');
        });

        it('NÃO deve renderizar o empty state quando loading: true mesmo se a lista for vazia', () => {
            const wrapper = mount(MaxTableFields, {
                props: {
                    columns: [{ field: 'name', header: 'Nome' }],
                    list: [],
                    loading: true
                }
            });

            expect(wrapper.find('.max-table-fields-loading').exists()).toBe(true);
            expect(wrapper.find('.max-table-fields-empty').exists()).toBe(false);
            expect(wrapper.text()).not.toContain('Nenhum registro encontrado');
        });

        it('deve renderizar o empty state quando loading: false e a lista for vazia', () => {
            const wrapper = mount(MaxTableFields, {
                props: {
                    columns: [{ field: 'name', header: 'Nome' }],
                    list: [],
                    loading: false,
                    emptyMessage: 'Nenhum dado disponível'
                }
            });

            expect(wrapper.find('.max-table-fields-loading').exists()).toBe(false);
            expect(wrapper.find('.max-table-fields-empty').exists()).toBe(true);
            expect(wrapper.find('.max-table-empty-text').text()).toBe('Nenhum dado disponível');
        });

        it('deve permitir customização via slot #loading', () => {
            const wrapper = mount(MaxTableFields, {
                props: {
                    columns: [{ field: 'name', header: 'Nome' }],
                    list: [],
                    loading: true
                },
                slots: {
                    loading: '<div class="custom-loading-slot">Aguarde, carregando...</div>'
                }
            });

            expect(wrapper.find('.custom-loading-slot').exists()).toBe(true);
            expect(wrapper.text()).toContain('Aguarde, carregando...');
        });

        it('deve permitir customização via slot #empty', () => {
            const wrapper = mount(MaxTableFields, {
                props: {
                    columns: [{ field: 'name', header: 'Nome' }],
                    list: [],
                    loading: false
                },
                slots: {
                    empty: '<div class="custom-empty-slot">Vazio por aqui</div>'
                }
            });

            expect(wrapper.find('.custom-empty-slot').exists()).toBe(true);
            expect(wrapper.text()).toContain('Vazio por aqui');
        });

        it('deve renderizar graciosamente sem quebrar quando columns for undefined', () => {
            expect(() => {
                const wrapper = mount(MaxTableFields, {
                    props: { columns: undefined, list: [] }
                });
                expect(wrapper.find('.max-table-fields').exists()).toBe(true);
            }).not.toThrow();
        });

        it('deve renderizar graciosamente sem quebrar quando list for undefined ou null', () => {
            expect(() => {
                const wrapper = mount(MaxTableFields, {
                    props: { columns: [{ field: 'id', header: 'ID' }], list: undefined }
                });
                expect(wrapper.find('.max-table-fields-body').exists()).toBe(true);
                expect(wrapper.text()).toContain('Nenhum registro encontrado');
            }).not.toThrow();

            expect(() => {
                const wrapper = mount(MaxTableFields, {
                    props: { columns: [{ field: 'id', header: 'ID' }], list: null as any }
                });
                expect(wrapper.find('.max-table-fields-body').exists()).toBe(true);
                expect(wrapper.text()).toContain('Nenhum registro encontrado');
            }).not.toThrow();
        });

        it('deve renderizar sem quebrar quando columns e list forem ambos undefined ou null', () => {
            expect(() => {
                const wrapper = mount(MaxTableFields, {
                    props: { columns: undefined, list: undefined }
                });
                expect(wrapper.find('.max-table-fields').exists()).toBe(true);
            }).not.toThrow();

            expect(() => {
                const wrapper = mount(MaxTableFields, {
                    props: { columns: null as any, list: null as any }
                });
                expect(wrapper.find('.max-table-fields').exists()).toBe(true);
            }).not.toThrow();
        });
    });

    describe('Anatomia visual compartilhada e feedback de célula (E10-08)', () => {
        it('não contém regra display: none para .input-message no SFC', async () => {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxTableFields.vue'), 'utf-8');

            expect(sfc).not.toMatch(/\.input-message\s*\{[^}]*display:\s*none/);
        });

        it('importa e consome os mixins compartilhados de table-anatomy', async () => {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxTableFields.vue'), 'utf-8');

            expect(sfc).toContain('@use \'../themes/table-anatomy\' as table;');
            expect(sfc).toContain('@include table.table-container');
            expect(sfc).toContain('@include table.table-header-row');
            expect(sfc).toContain('@include table.table-header-cell');
            expect(sfc).toContain('@include table.table-body-row');
            expect(sfc).toContain('@include table.table-row-zebra');
            expect(sfc).toContain('@include table.table-cell-input-feedback');
        });
    });

    describe('Contrato estrutural e acessibilidade de rolagem compartilhada (ui-design/tabela-max-recorta-colunas-sem-scroll-compartilhado)', () => {
        it('possui exatamente uma região de scroll compartilhada envolvendo thead e tbody com role e tabindex acessíveis', () => {
            const columns = [
                { field: 'col1', header: 'Col 1', minWidth: '200px' },
                { field: 'col2', header: 'Col 2', minWidth: '200px' },
                { field: 'col3', header: 'Col 3', minWidth: '200px' }
            ];
            const list = [
                { col1: 'A1', col2: 'B1', col3: 'C1' },
                { col1: 'A2', col2: 'B2', col3: 'C2' }
            ];

            const wrapper = mount(MaxTableFields, {
                props: { columns, list }
            });

            const scrollRegions = wrapper.findAll('.max-table-fields-scroll-region');
            expect(scrollRegions).toHaveLength(1);

            const scrollRegion = scrollRegions[0];
            expect(scrollRegion.attributes('role')).toBe('region');
            expect(scrollRegion.attributes('tabindex')).toBe('0');
            expect(scrollRegion.attributes('aria-label')).toBe('Tabela de dados rolável');

            const table = scrollRegion.find('table.max-table-fields');
            expect(table.exists()).toBe(true);

            const thead = table.find('thead.max-table-fields-head');
            const tbody = table.find('tbody.max-table-fields-body');
            expect(thead.exists()).toBe(true);
            expect(tbody.exists()).toBe(true);

            expect(thead.find('tr.max-table-fields-head-row').exists()).toBe(true);
            expect(thead.findAll('th.max-table-fields-th')).toHaveLength(3);
            expect(tbody.findAll('tr.max-table-fields-row')).toHaveLength(2);
            expect(tbody.findAll('.max-table-fields-td')).toHaveLength(6);
        });

        it('permite sobrescrever ariaLabel por prop', () => {
            const wrapper = mount(MaxTableFields, {
                props: {
                    columns: [{ field: 'id', header: 'ID' }],
                    list: [{ id: 1 }],
                    ariaLabel: 'Tabela de lançamentos contábeis'
                }
            });

            const scrollRegion = wrapper.find('.max-table-fields-scroll-region');
            expect(scrollRegion.attributes('aria-label')).toBe('Tabela de lançamentos contábeis');
        });

        it('mantém overflow e rolagem horizontal na região compartilhada e preserva último th e td no mesmo table', async () => {
            const columns = [
                { field: 'col1', header: 'Col 1', minWidth: '200px' },
                { field: 'col2', header: 'Col 2', minWidth: '200px' },
                { field: 'col3', header: 'Col 3', minWidth: '200px' }
            ];
            const list = [
                { col1: 'A1', col2: 'B1', col3: 'C1' },
                { col1: 'A2', col2: 'B2', col3: 'C2' }
            ];

            const wrapper = mount(MaxTableFields, {
                props: { columns, list }
            });

            const scrollRegion = wrapper.find<HTMLElement>('.max-table-fields-scroll-region');
            expect(scrollRegion.exists()).toBe(true);

            let scrollLeftValue = 0;
            Object.defineProperty(scrollRegion.element, 'clientWidth', { configurable: true, value: 320 });
            Object.defineProperty(scrollRegion.element, 'scrollWidth', { configurable: true, value: 600 });
            Object.defineProperty(scrollRegion.element, 'scrollLeft', {
                configurable: true,
                get: () => scrollLeftValue,
                set: (val: number) => { scrollLeftValue = val; }
            });

            scrollRegion.element.scrollLeft = 280;
            await scrollRegion.trigger('scroll');

            expect(scrollRegion.element.scrollLeft).toBe(280);

            // Último th e último td pertencem à mesma tabela dentro desse único scroll
            const lastTh = wrapper.findAll('th.max-table-fields-th').at(-1);
            const lastTd = wrapper.findAll('tr.max-table-fields-row').at(-1)?.findAll('td.max-table-fields-td').at(-1);

            expect(lastTh?.text()).toContain('Col 3');
            expect(lastTd?.text()).toContain('C2');
            expect(scrollRegion.element.contains(lastTh!.element)).toBe(true);
            expect(scrollRegion.element.contains(lastTd!.element)).toBe(true);

            // Não existe outro ancestral ou descendente com scroller horizontal no corpo
            const tbody = wrapper.find('.max-table-fields-body');
            expect(tbody.attributes('class')).not.toContain('scroll-region');
        });

        it('valida o contrato de estilos CSS no SFC (tabela nativa, thead sticky, sem overflow no tbody)', async () => {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxTableFields.vue'), 'utf-8');

            // Região de scroll única com overflow nos dois eixos
            expect(sfc).toMatch(/\.max-table-fields-scroll-region\s*\{[^}]*overflow:\s*auto/);
            expect(sfc).toMatch(/\.max-table-fields-scroll-region\s*\{[^}]*scrollbar-gutter:\s*stable/);
            expect(sfc).toMatch(/\.max-table-fields-scroll-region\s*\{[^}]*overscroll-behavior:\s*contain/);

            // Tabela com layout tabular nativo e largura intrínseca
            expect(sfc).toMatch(/\.max-table-fields\s*\{[^}]*width:\s*max-content/);
            expect(sfc).toMatch(/\.max-table-fields\s*\{[^}]*min-width:\s*100%/);
            expect(sfc).toMatch(/\.max-table-fields\s*\{[^}]*display:\s*table/);

            // thead sticky no topo
            expect(sfc).toMatch(/\.max-table-fields-head\s*\{[^}]*position:\s*sticky/);
            expect(sfc).toMatch(/\.max-table-fields-head\s*\{[^}]*top:\s*0/);

            // tbody não tem overflow próprio (o scroller é a região)
            expect(sfc).not.toMatch(/\.max-table-fields-body\s*\{[^}]*overflow-y:\s*auto/);
        });
    });
});
