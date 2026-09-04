import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTableFields from '../../src/components/MaxTableFields.vue';
import { _ulid } from '@maxvue/max-use';

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

        (wrapper.vm as any).setFieldValue(wrapper.props('list')[0], 'name', 'Novo Teste', columns[0] as any);
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
        ['MaxInputNumber', 'MaxInputSelect', 'MaxInputDatePicker', 'MaxInputCheckbox', 'MaxInputTextArea', 'MaxInputAutoComplete', 'MaxInputAutoCompleteApi', 'MaxInputPhone'].forEach((comp, _idx) => {
            const compWrapper = wrapper.findComponent({ name: comp });
            if(compWrapper.exists()) compWrapper.vm.$emit('update:modelValue', 'new-val');

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
});
