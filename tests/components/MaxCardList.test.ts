import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import MaxCardList from '../../src/components/MaxCardList.vue';
import { useSearchBarStore } from '../../src/stores/useSearchBar.Store';

function makeDataset(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        title: `Card ${i + 1}`,
        subtitle: `Descrição do Card ${i + 1}`,
        category: i % 2 === 0 ? 'tech' : 'design'
    }));
}

function mountCardList(options: { props?: Record<string, any>; slots?: Record<string, any> } = {}) {
    return mount(MaxCardList, {
        props: options.props ?? {},
        slots: options.slots ?? {},
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub" :data-icon="icon"></span>',
                    props: ['icon']
                },
                MaxLoader: {
                    template: '<div class="max-loader-stub" :data-label="label">{{ label }}</div>',
                    props: ['label']
                },
                MaxEmptyDiv: {
                    template: '<div class="max-empty-div-stub" :data-label="label">{{ label }}</div>',
                    props: ['label']
                },
                MaxStats: {
                    template: '<div class="max-stats-stub" :data-items-count="items?.length"></div>',
                    props: ['items']
                },
                MaxInputSearch: {
                    name: 'MaxInputSearch',
                    template: '<input class="max-input-search-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @change="$emit(\'search\', $event.target.value)" />',
                    props: ['modelValue', 'placeholder'],
                    emits: ['update:modelValue', 'search']
                }
            }
        }
    });
}

describe('MaxCardList', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    describe('Renderização e Estrutura Básica', () => {
        it('renderiza o container com a classe principal max-card-list', () => {
            const wrapper = mountCardList({
                props: { items: makeDataset(5) }
            });
            expect(wrapper.classes()).toContain('max-card-list');
        });

        it('renderiza título e subtítulo no cabeçalho quando informados', () => {
            const wrapper = mountCardList({
                props: {
                    title: 'Lista de Módulos',
                    subtitle: 'Gerenciamento de módulos e serviços'
                }
            });
            expect(wrapper.find('.max-card-list-title').text()).toBe('Lista de Módulos');
            expect(wrapper.find('.max-card-list-subtitle').text()).toBe('Gerenciamento de módulos e serviços');
        });

        it('integra semanticamente MaxStats no header via prop stats', () => {
            const stats = [
                { label: 'Total', value: 120 },
                { label: 'Ativos', value: 85 }
            ];
            const wrapper = mountCardList({
                props: {
                    title: 'Métricas',
                    stats
                }
            });
            const statsEl = wrapper.find('.max-stats-stub');
            expect(statsEl.exists()).toBe(true);
            expect(statsEl.attributes('data-items-count')).toBe('2');
        });

        it('permite sobrescrever o slot #header com escopo semântico', () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(10)
                },
                slots: {
                    header: `
                        <template #header="{ total, filteredCount }">
                            <div class="custom-header">Total: {{ total }} | Filtrados: {{ filteredCount }}</div>
                        </template>
                    `
                }
            });
            expect(wrapper.find('.custom-header').text()).toBe('Total: 10 | Filtrados: 10');
        });
    });

    describe('Auto-cálculo e Responsividade Dinâmica de Colunas', () => {
        it('adota columns fixo quando informado explicitamente', () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(6),
                    columns: 4
                }
            });
            const vm = wrapper.vm as any;
            expect(vm.computedColumns).toBe(4);
        });

        it('utiliza defaultColumns quando largura medida for zero no ambiente de teste', () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(6),
                    defaultColumns: 2
                }
            });
            const vm = wrapper.vm as any;
            expect(vm.computedColumns).toBe(2);
        });

        it('calcula colunas dinamicamente baseado na largura e minCardWidth', async () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(10),
                    minCardWidth: 300,
                    gap: 20
                }
            });

            // Simula medição de largura do container
            const container = wrapper.find('.max-card-list').element as HTMLElement;
            Object.defineProperty(container, 'clientWidth', {
                value: 940,
                configurable: true
            });

            await nextTick();
            const vm = wrapper.vm as any;
            // (940 + 20) / (300 + 20) = 960 / 320 = 3 colunas
            expect(vm.computedColumns).toBe(3);
        });

        it('aplica gridAutoRows: 1fr no estilo do grid para garantir altura uniforme dos cards', () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(4),
                    virtualScroll: false
                }
            });

            const grid = wrapper.find('.max-card-list-static-grid');
            expect(grid.attributes('style')).toContain('grid-auto-rows: 1fr');
        });

        it('força 1 coluna em layout mobile (largura <= 768px) mesmo com prop columns definida', async () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(6),
                    columns: 4
                }
            });

            const container = wrapper.find('.max-card-list').element as HTMLElement;
            Object.defineProperty(container, 'clientWidth', {
                value: 600,
                configurable: true
            });

            await nextTick();
            const vm = wrapper.vm as any;
            expect(vm.computedColumns).toBe(1);
        });

        it('mantém columns definida quando largura for superior a 768px', async () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(6),
                    columns: 3
                }
            });

            const container = wrapper.find('.max-card-list').element as HTMLElement;
            Object.defineProperty(container, 'clientWidth', {
                value: 1024,
                configurable: true
            });

            await nextTick();
            const vm = wrapper.vm as any;
            expect(vm.computedColumns).toBe(3);
        });
    });

    describe('Slot #add-card no Grid e Não-desalinhamento de Índices', () => {
        it('renderiza o slot #add-card na grade junto com os demais cards sem desalinhar os índices dos itens de dados', () => {
            const dataset = makeDataset(3);
            const receivedIndices: number[] = [];

            const wrapper = mount(MaxCardList, {
                props: {
                    items: dataset,
                    virtualScroll: false
                },
                slots: {
                    'add-card': '<button class="btn-add-card">Adicionar Card</button>',
                    'card': (slotProps: any) => {
                        receivedIndices.push(slotProps.index);
                        return `<div class="card-item" data-index="${slotProps.index}">Card ${slotProps.item.title}</div>`;
                    }
                }
            });

            expect(wrapper.find('.btn-add-card').exists()).toBe(true);
            expect(wrapper.find('.max-card-list-col--add').exists()).toBe(true);

            // Índices dos itens de dados devem ser rigorosamente 0, 1 e 2
            expect(receivedIndices).toEqual([0, 1, 2]);
        });

        it('renderiza o slot #add-card no header quando addCardPosition for "header"', () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(2),
                    addCardPosition: 'header'
                },
                slots: {
                    'add-card': '<button class="header-add-btn">+ Criar</button>'
                }
            });

            expect(wrapper.find('.max-card-list-header-add .header-add-btn').exists()).toBe(true);
            expect(wrapper.find('.max-card-list-col--add').exists()).toBe(false);
        });

        it('inclui o slot #add-card no cálculo de linhas da virtualização', async () => {
            const dataset = makeDataset(4);

            const wrapper = mount(MaxCardList, {
                props: {
                    items: dataset,
                    virtualScroll: true,
                    columns: 3
                },
                slots: {
                    'add-card': '<div class="virtual-add-card">+ Novo</div>'
                }
            });

            const vm = wrapper.vm as any;
            // Com 4 itens + 1 card de add em 3 colunas: linha 0 tem 3 itens (1 add + 2 dados), linha 1 tem 2 itens (2 dados)
            expect(vm.virtualizer.options.count).toBe(2);
        });
    });

    describe('Filtros Reativos e Emissões de Eventos com useSearchBarStore', () => {
        it('não renderiza barra de busca interna no template padrão', () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(5),
                    filterable: true
                }
            });

            expect(wrapper.findComponent({ name: 'MaxInputSearch' }).exists()).toBe(false);
            expect(wrapper.find('.max-card-list-search-wrapper').exists()).toBe(false);
        });

        it('ativa a busca na useSearchBarStore ao montar e sincroniza valores e eventos', async () => {
            const searchBar = useSearchBarStore();
            searchBar.is_visible = false;
            searchBar.search_value = '';

            const wrapper = mountCardList({
                props: {
                    items: makeDataset(5),
                    filterable: true
                }
            });

            // Deve tornar a barra global visível
            expect(searchBar.is_visible).toBe(true);

            // Simula digitação / atualização na store global
            searchBar.search_value = 'Card 2';
            await nextTick();

            expect(wrapper.emitted('update:searchQuery')?.[0]).toEqual(['Card 2']);
            expect(wrapper.emitted('update:search')?.[0]).toEqual(['Card 2']);
            expect(wrapper.emitted('search')?.[0]).toEqual(['Card 2']);
            expect(wrapper.emitted('update:filter')?.[0]).toEqual([{
                search: 'Card 2',
                category: ''
            }]);

            const vm = wrapper.vm as any;
            expect(vm.filteredItems.length).toBe(1);
            expect(vm.filteredItems[0].title).toBe('Card 2');
        });

        it('restaura o estado de visibilidade da useSearchBarStore ao desmontar', () => {
            const searchBar = useSearchBarStore();
            searchBar.is_visible = false;

            const wrapper = mountCardList({
                props: {
                    items: makeDataset(3),
                    useGlobalSearch: true
                }
            });

            expect(searchBar.is_visible).toBe(true);

            wrapper.unmount();
            expect(searchBar.is_visible).toBe(false);
        });

        it('filtra itens dinamicamente pelo texto de busca', async () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(4),
                    searchQuery: 'Card 3'
                }
            });

            const vm = wrapper.vm as any;
            expect(vm.filteredItems.length).toBe(1);
            expect(vm.filteredItems[0].title).toBe('Card 3');
        });

        it('filtra itens por categoria e emite update:category e update:filter', async () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(6),
                    categories: [
                        { label: 'Tecnologia', value: 'tech' },
                        { label: 'Design', value: 'design' }
                    ]
                }
            });

            const select = wrapper.find('.max-card-list-category-select');
            expect(select.exists()).toBe(true);

            await select.setValue('tech');

            expect(wrapper.emitted('update:category')?.[0]).toEqual(['tech']);
            expect(wrapper.emitted('update:filter')?.[0]).toEqual([{
                search: '',
                category: 'tech'
            }]);

            const vm = wrapper.vm as any;
            // No dataset de 6 itens: índices 0, 2, 4 têm category 'tech' (3 itens)
            expect(vm.filteredItems.length).toBe(3);
            expect(vm.filteredItems.every((item: any) => item.category === 'tech')).toBe(true);
        });

        it('utiliza filterFn personalizada quando fornecida', () => {
            const customFilter = vi.fn((item: any, _search: string) => item.id === 2);
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(5),
                    filterFn: customFilter
                }
            });

            const vm = wrapper.vm as any;
            expect(vm.filteredItems.length).toBe(1);
            expect(vm.filteredItems[0].id).toBe(2);
            expect(customFilter).toHaveBeenCalled();
        });
    });

    describe('Slots #loading e #empty Pré-estilizados', () => {
        it('renderiza o estado de loading padrão com MaxLoader quando loading: true', () => {
            const wrapper = mountCardList({
                props: {
                    loading: true,
                    loadingLabel: 'Aguarde carregando...'
                }
            });

            const loader = wrapper.find('.max-loader-stub');
            expect(loader.exists()).toBe(true);
            expect(loader.attributes('data-label')).toBe('Aguarde carregando...');
        });

        it('permite sobrescrever o slot #loading customizado', () => {
            const wrapper = mountCardList({
                props: { loading: true },
                slots: {
                    loading: '<div class="custom-loader">Carregamento customizado</div>'
                }
            });

            expect(wrapper.find('.custom-loader').exists()).toBe(true);
            expect(wrapper.find('.max-loader-stub').exists()).toBe(false);
        });

        it('renderiza o estado de empty padrão com MaxEmptyDiv quando itens vazios', () => {
            const wrapper = mountCardList({
                props: {
                    items: [],
                    emptyLabel: 'Nenhum resultado'
                }
            });

            const emptyDiv = wrapper.find('.max-empty-div-stub');
            expect(emptyDiv.exists()).toBe(true);
            expect(emptyDiv.attributes('data-label')).toBe('Nenhum resultado');
        });

        it('permite sobrescrever o slot #empty customizado', () => {
            const wrapper = mountCardList({
                props: { items: [] },
                slots: {
                    empty: '<div class="custom-empty">Lista vazia personalizada</div>'
                }
            });

            expect(wrapper.find('.custom-empty').exists()).toBe(true);
            expect(wrapper.find('.max-empty-div-stub').exists()).toBe(false);
        });
    });

    describe('Virtualização via @tanstack/vue-virtual e Métodos Expostos', () => {
        it('renderiza em modo virtual com classe is-virtual e container de scroll', () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(20),
                    virtualScroll: true
                }
            });

            expect(wrapper.classes()).toContain('is-virtual');
            expect(wrapper.find('.max-card-list-scroll').exists()).toBe(true);
        });

        it('renderiza em grid simples estático quando virtualScroll: false', () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(4),
                    virtualScroll: false
                }
            });

            expect(wrapper.classes()).not.toContain('is-virtual');
            expect(wrapper.find('.max-card-list-static-grid').exists()).toBe(true);
        });

        it('expõe métodos scrollToIndex, scrollToOffset, virtualizer e setSearch via defineExpose', () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(50),
                    virtualScroll: true
                }
            });

            const vm = wrapper.vm as any;
            expect(typeof vm.scrollToIndex).toBe('function');
            expect(typeof vm.scrollToOffset).toBe('function');
            expect(typeof vm.setSearch).toBe('function');
            expect(typeof vm.setCategory).toBe('function');
            expect(vm.virtualizer).toBeDefined();

            expect(() => vm.scrollToIndex(10)).not.toThrow();
            expect(() => vm.scrollToOffset(300)).not.toThrow();
        });
    });

    describe('Compatibilidade com keyField e showAddCard', () => {
        it('utiliza keyField como chave identificadora quando informado', () => {
            const customItems = [
                { custom_id: 'a1', title: 'Item 1' },
                { custom_id: 'b2', title: 'Item 2' }
            ];
            const wrapper = mountCardList({
                props: {
                    items: customItems,
                    keyField: 'custom_id',
                    virtualScroll: false
                }
            });
            expect(wrapper.findAll('.max-card-list-col').length).toBe(2);
        });

        it('renderiza card de adicionar automático com showAddCard e dispara evento add ao clicar', async () => {
            const wrapper = mountCardList({
                props: {
                    items: makeDataset(2),
                    showAddCard: true,
                    addCardLabel: 'Adicionar Homologação de Projeto',
                    virtualScroll: false
                }
            });

            const addCol = wrapper.find('.max-card-list-col--add');
            expect(addCol.exists()).toBe(true);
            expect(addCol.text()).toContain('Adicionar Homologação de Projeto');

            const addCard = addCol.findComponent({ name: 'MaxCard' });
            expect(addCard.exists()).toBe(true);
            await addCard.trigger('click');
            expect(wrapper.emitted('add')).toBeTruthy();
        });
    });

    describe('Integração com Cards e Subcards Aninhados', () => {
        it('renderiza cards pai com subcards dentro do MaxCardList', () => {
            const wrapper = mountCardList({
                props: {
                    items: [
                        { id: 1, name: 'Cliente A' },
                        { id: 2, name: 'Cliente B' }
                    ],
                    virtualScroll: false
                },
                slots: {
                    card: '<div class="max-card"><div class="max-card-header"><span class="max-card-title">Cliente</span></div><div class="max-card-content"><div class="max-subcard"><span class="max-subcard-title">PROP-01</span></div></div></div>'
                }
            });

            expect(wrapper.findAll('.max-card').length).toBe(2);
            expect(wrapper.findAll('.max-subcard').length).toBe(2);
            const cols = wrapper.findAll('.max-card-list-col');
            expect(cols.length).toBe(2);
        });
    });
});
