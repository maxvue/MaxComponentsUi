import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import MaxBaseVirtualScroller from '../../../src/components/base/MaxBaseVirtualScroller.vue';

async function settle() {
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
    await nextTick();
}

function makeItems(count: number) {
    return Array.from({ length: count }, (_, i) => `item-${i}`);
}

// happy-dom nao faz layout: sem isto, clientHeight e getBoundingClientRect
// retornam 0 e o virtualizador nao consegue calcular quantos itens cabem na
// viewport, entao renderiza tudo (ou nada) — o oposto do que estamos testando.
function stubViewport(el: HTMLElement, height: number) {
    Object.defineProperty(el, 'clientHeight', { value: height, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
    el.getBoundingClientRect = () => ({
        top: 0, left: 0, right: 0, bottom: height, width: 300, height, x: 0, y: 0,
        toJSON: () => ({})
    } as DOMRect);
}

describe('MaxBaseVirtualScroller', () => {
    let wrapper: VueWrapper | null;

    beforeEach(() => {
        wrapper = null;
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('renderiza o container com o style informado', () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(5), itemSize: 40, style: { height: '200px' } }
        });
        const root = wrapper.find('.max-base-virtual-scroller');
        expect(root.attributes('style')).toContain('height: 200px');
    });

    it('com 1000 itens, renderiza muito menos que 1000 nos (virtualizacao real)', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(1000), itemSize: 40, style: { height: '200px' } },
            slots: { item: '<div class="row-item">{{ params.item }}</div>' }
        });
        stubViewport(wrapper.element as HTMLElement, 200);
        await settle();

        const rendered = wrapper.findAll('.row-item').length;
        expect(rendered).toBeGreaterThan(0);
        expect(rendered).toBeLessThan(100);
    });

    it('o slot item recebe o item e os options corretos', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(10), itemSize: 40, style: { height: '400px' } },
            slots: {
                item: `<template #item="{ item, options }">
                    <div class="row-item" :data-index="options.index" :data-count="options.count">{{ item }}</div>
                </template>`
            }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        const first = wrapper.find('.row-item');
        expect(first.exists()).toBe(true);
        expect(first.text()).toBe('item-0');
        expect(first.attributes('data-count')).toBe('10');
    });

    it('options.first e true apenas no indice 0', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(10), itemSize: 40, style: { height: '400px' } },
            slots: {
                item: `<template #item="{ options }">
                    <div class="row-item" :data-first="options.first">{{ options.index }}</div>
                </template>`
            }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        const rows = wrapper.findAll('.row-item');
        const firstFlags = rows.map((r) => ({ index: Number(r.text()), first: r.attributes('data-first') }));
        const trueOnes = firstFlags.filter((f) => f.first === 'true');
        expect(trueOnes).toHaveLength(1);
        expect(trueOnes[0].index).toBe(0);
    });

    it('lista vazia nao quebra', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: [], itemSize: 40, style: { height: '200px' } },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 200);
        await settle();

        expect(wrapper.findAll('.row-item')).toHaveLength(0);
    });

    it('mudar items reativamente atualiza a renderizacao', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(3), itemSize: 40, style: { height: '400px' } },
            slots: {
                item: '<template #item="{ item }"><div class="row-item">{{ item }}</div></template>'
            }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        expect(wrapper.findAll('.row-item')).toHaveLength(3);

        await wrapper.setProps({ items: makeItems(2) });
        await settle();

        expect(wrapper.findAll('.row-item')).toHaveLength(2);
    });

    it('expoe scrollToIndex chamavel', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(100), itemSize: 40, style: { height: '400px' } },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        expect(typeof wrapper!.vm.scrollToIndex).toBe('function');
        expect(() => wrapper!.vm.scrollToIndex(50)).not.toThrow();
    });

    it('permanece semanticamente neutro por padrão sem roles ou atributos posicionais (E06-01)', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(5), itemSize: 40, style: { height: '400px' } },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        expect(wrapper.find('.max-base-virtual-scroller').attributes('role')).toBeUndefined();
        expect(wrapper.findAll('[role="option"]')).toHaveLength(0);

        const rows = wrapper.findAll('.row-item');
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].element.parentElement?.getAttribute('aria-setsize')).toBeNull();
        expect(rows[0].element.parentElement?.getAttribute('aria-posinset')).toBeNull();
    });

    it('aplica role="listbox" e role="option" com aria-setsize/aria-posinset quando explicitamente configurado (E06-01)', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: {
                items: makeItems(5),
                itemSize: 40,
                style: { height: '400px' },
                role: 'listbox',
                itemRole: 'option',
                ariaLabel: 'Opções disponíveis'
            },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        expect(wrapper.find('.max-base-virtual-scroller').attributes('role')).toBe('listbox');
        expect(wrapper.find('.max-base-virtual-scroller').attributes('aria-label')).toBe('Opções disponíveis');

        const options = wrapper.findAll('[role="option"]');
        expect(options.length).toBeGreaterThan(0);
        expect(options[0].attributes('aria-setsize')).toBe('5');
        expect(options[0].attributes('aria-posinset')).toBe('1');
    });

    it('aplica role="list" e role="listitem" para listas informativas (E06-01)', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: {
                items: makeItems(5),
                itemSize: 40,
                style: { height: '400px' },
                role: 'list',
                itemRole: 'listitem'
            },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        expect(wrapper.find('.max-base-virtual-scroller').attributes('role')).toBe('list');
        const items = wrapper.findAll('[role="listitem"]');
        expect(items.length).toBeGreaterThan(0);
        expect(items[0].attributes('aria-setsize')).toBe('5');
        expect(items[0].attributes('aria-posinset')).toBe('1');
    });

    it('emite scroll ao rolar o container', async () => {
        wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(100), itemSize: 40, style: { height: '400px' } },
            slots: { item: '<div class="row-item" />' }
        });
        stubViewport(wrapper.element as HTMLElement, 400);
        await settle();

        await wrapper.find('.max-base-virtual-scroller').trigger('scroll');
        expect(wrapper.emitted('scroll')).toBeTruthy();
    });

    it('nao emite classes ou dependencias do PrimeVue', () => {
        const html = require('fs').readFileSync(
            require('path').resolve(__dirname, '../../../src/components/base/MaxBaseVirtualScroller.vue'),
            'utf-8'
        );
        expect(html).not.toContain('primevue');
        expect(html).not.toContain('@primeuix');
        expect(/\.p-[a-z-]/.test(html)).toBe(false);
    });

    describe('Contrato Listbox e Blindagem Semântica (F14 / WCAG 1.3.1 e 4.1.2)', () => {
        it('emite warning quando role="listbox" nao possui aria-label nem aria-labelledby', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(5), role: 'listbox' },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('O papel "listbox" exige um nome acessível via aria-label ou aria-labelledby.')
            );
            warnSpy.mockRestore();
        });

        it('nao emite warning quando aria-label e fornecido para o listbox', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(5), role: 'listbox', ariaLabel: 'Lista de seleção' },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            expect(warnSpy).not.toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('atribui tabindex="0" por padrao no container quando role="listbox"', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(5), role: 'listbox', ariaLabel: 'Lista' },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            expect(wrapper.find('.max-base-virtual-scroller').attributes('tabindex')).toBe('0');
        });

        it('container neutro (sem role) nao possui tabindex por padrao', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(5) },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            expect(wrapper.find('.max-base-virtual-scroller').attributes('tabindex')).toBeUndefined();
        });

        it('quando disabled=true no listbox, aplica tabindex="-1" e aria-disabled="true"', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(5), role: 'listbox', ariaLabel: 'Lista', disabled: true },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            expect(scroller.attributes('tabindex')).toBe('-1');
            expect(scroller.attributes('aria-disabled')).toBe('true');
            expect(scroller.classes()).toContain('is-disabled');
        });

        it('normaliza effectiveItemRole para "option" em role="listbox", impedindo combinacoes invalidas', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(5),
                    role: 'listbox',
                    itemRole: 'listitem', // papel invalido para filhos diretos de listbox
                    ariaLabel: 'Lista normalizada'
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            expect(wrapper.findAll('[role="option"]').length).toBeGreaterThan(0);
            expect(wrapper.findAll('[role="listitem"]')).toHaveLength(0);
        });

        it('impede role="option" orfao quando o container e neutro sem role', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(5),
                    itemRole: 'option' // nao deve ser renderizado como option sem listbox
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            expect(wrapper.findAll('[role="option"]')).toHaveLength(0);
        });
    });

    describe('Navegação e Controle por Teclado (F14)', () => {
        it('ArrowDown navega sequencialmente e emite update:focusedIndex', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(10), role: 'listbox', ariaLabel: 'Navegação Teclado' },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            await scroller.trigger('keydown', { key: 'ArrowDown' });
            await settle();

            expect(wrapper.emitted('update:focusedIndex')?.[0]).toEqual([0]);

            await scroller.trigger('keydown', { key: 'ArrowDown' });
            await settle();

            expect(wrapper.emitted('update:focusedIndex')?.[1]).toEqual([1]);
        });

        it('ArrowUp recua o foco e nao ultrapassa o indice 0', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(10), role: 'listbox', ariaLabel: 'Navegação Teclado' },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            await scroller.trigger('keydown', { key: 'ArrowDown' }); // 0
            await scroller.trigger('keydown', { key: 'ArrowDown' }); // 1
            await settle();

            await scroller.trigger('keydown', { key: 'ArrowUp' }); // 0
            await settle();
            const focusEvents = wrapper.emitted('update:focusedIndex') ?? [];
            expect(focusEvents[focusEvents.length - 1]).toEqual([0]);

            await scroller.trigger('keydown', { key: 'ArrowUp' }); // permanece 0
            await settle();
            expect(wrapper.vm.focusedIndex).toBe(0);
        });

        it('pula itens desabilitados na navegacao por teclado', async () => {
            const items = [
                { id: 0, label: 'Zero', disabled: false },
                { id: 1, label: 'Um (desabilitado)', disabled: true },
                { id: 2, label: 'Dois', disabled: false }
            ];
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items,
                    role: 'listbox',
                    ariaLabel: 'Lista com desabilitado',
                    isItemDisabled: (item) => Boolean(item.disabled)
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            await scroller.trigger('keydown', { key: 'ArrowDown' }); // deve focar indice 0
            await settle();
            expect(wrapper.vm.focusedIndex).toBe(0);

            await scroller.trigger('keydown', { key: 'ArrowDown' }); // deve pular o 1 e ir direto para o 2
            await settle();
            expect(wrapper.vm.focusedIndex).toBe(2);
        });

        it('Home e End movem para o primeiro e ultimo item habilitados', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(10), role: 'listbox', ariaLabel: 'Lista Home End' },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            await scroller.trigger('keydown', { key: 'End' });
            await settle();
            expect(wrapper.vm.focusedIndex).toBe(9);

            await scroller.trigger('keydown', { key: 'Home' });
            await settle();
            expect(wrapper.vm.focusedIndex).toBe(0);
        });

        it('PageDown e PageUp avancam e recuam em blocos', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(50), role: 'listbox', ariaLabel: 'Lista Page' },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            await scroller.trigger('keydown', { key: 'ArrowDown' }); // 0
            await settle();

            await scroller.trigger('keydown', { key: 'PageDown' });
            await settle();
            const afterPageDown = wrapper.vm.focusedIndex;
            expect(afterPageDown).toBeGreaterThan(0);

            await scroller.trigger('keydown', { key: 'PageUp' });
            await settle();
            expect(wrapper.vm.focusedIndex).toBeLessThan(afterPageDown);
        });

        it('nao reage ao teclado se o componente estiver desabilitado ou neutro', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(5), role: 'listbox', ariaLabel: 'Lista Desabilitada', disabled: true },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            await scroller.trigger('keydown', { key: 'ArrowDown' });
            await settle();

            expect(wrapper.emitted('update:focusedIndex')).toBeUndefined();
        });
    });

    describe('Seleção e aria-selected (F14)', () => {
        it('todas as opcoes montadas possuem atributo aria-selected com valor booleano explicito', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(5),
                    role: 'listbox',
                    ariaLabel: 'Lista Seleção',
                    modelValue: 'item-1'
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const options = wrapper.findAll('[role="option"]');
            expect(options.length).toBeGreaterThan(0);

            for (const opt of options) {
                const selectedAttr = opt.attributes('aria-selected');
                expect(selectedAttr).toBeDefined();
                expect(selectedAttr === 'true' || selectedAttr === 'false').toBe(true);
            }

            // item-1 está selecionado
            expect(options[0].attributes('aria-selected')).toBe('false');
            expect(options[1].attributes('aria-selected')).toBe('true');
        });

        it('Enter e Espaco selecionam o item focado e emitem update:modelValue e select', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(5), role: 'listbox', ariaLabel: 'Seleção Teclado' },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            await scroller.trigger('keydown', { key: 'ArrowDown' }); // foca item 0
            await settle();

            await scroller.trigger('keydown', { key: 'Enter' });
            await settle();

            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['item-0']);
            expect(wrapper.emitted('select')?.[0][0]).toEqual({ index: 0, item: 'item-0', value: 'item-0' });

            await scroller.trigger('keydown', { key: 'ArrowDown' }); // foca item 1
            await settle();

            await scroller.trigger('keydown', { key: ' ' }); // seleciona com Space
            await settle();

            expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['item-1']);
            expect(wrapper.emitted('select')?.[1][0]).toEqual({ index: 1, item: 'item-1', value: 'item-1' });
        });

        it('clicar em uma opcao seleciona e emite update:modelValue', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(5), role: 'listbox', ariaLabel: 'Clique' },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const options = wrapper.findAll('[role="option"]');
            await options[2].trigger('click');
            await settle();

            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['item-2']);
            expect(wrapper.vm.focusedIndex).toBe(2);
        });

        it('suporta selecao multipla com array v-model', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(5),
                    role: 'listbox',
                    ariaLabel: 'Multipla',
                    multiple: true,
                    modelValue: ['item-0']
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            expect(scroller.attributes('aria-multiselectable')).toBe('true');

            // Clicar no item 1 deve adicionar ao array
            const options = wrapper.findAll('[role="option"]');
            await options[1].trigger('click');
            await settle();

            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['item-0', 'item-1']]);
        });

        it('selectOnFocus=true seleciona automaticamente ao navegar', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(5),
                    role: 'listbox',
                    ariaLabel: 'Select On Focus',
                    selectOnFocus: true
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            await scroller.trigger('keydown', { key: 'ArrowDown' });
            await settle();

            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['item-0']);
        });

        it('reconhece selecao quando modelValue e o proprio objeto ou valor primitivo com getItemValue', async () => {
            const objItems = [
                { id: 101, name: 'Opção 1' },
                { id: 102, name: 'Opção 2' }
            ];
            // Teste 1: modelValue é o objeto completo
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: objItems,
                    role: 'listbox',
                    ariaLabel: 'Seleção por Objeto',
                    modelValue: objItems[1],
                    getItemValue: (item) => item.id
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const options = wrapper.findAll('[role="option"]');
            expect(options[0].attributes('aria-selected')).toBe('false');
            expect(options[1].attributes('aria-selected')).toBe('true');

            // Teste 2: modelValue é o ID primitivo
            await wrapper.setProps({ modelValue: 101 });
            await settle();

            expect(options[0].attributes('aria-selected')).toBe('true');
            expect(options[1].attributes('aria-selected')).toBe('false');
        });
    });

    describe('IDs Determinísticos e aria-activedescendant Seguro contra Nós Desmontados (F14)', () => {
        it('gera IDs determinísticos nos itens montados', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(5),
                    role: 'listbox',
                    ariaLabel: 'Lista IDs',
                    idPrefix: 'custom-list'
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const options = wrapper.findAll('[role="option"]');
            expect(options[0].attributes('id')).toBe('custom-list-option-0');
            expect(options[1].attributes('id')).toBe('custom-list-option-1');
        });

        it('aria-activedescendant aponta para o elemento montado quando ha foco ativo', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(10),
                    role: 'listbox',
                    ariaLabel: 'Active Descendant',
                    idPrefix: 'test-ad'
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            await scroller.trigger('keydown', { key: 'ArrowDown' }); // foca indice 0
            await settle();

            expect(scroller.attributes('aria-activedescendant')).toBe('test-ad-option-0');
        });

        it('aria-activedescendant NUNCA aponta para um nó desmontado fora da janela virtual', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(1000),
                    itemSize: 40,
                    style: { height: '200px' },
                    role: 'listbox',
                    ariaLabel: 'Virtual Scroller Seguro',
                    idPrefix: 'sec-list',
                    // Índice 500 está muito longe da viewport inicial (itens 0 a 8)
                    focusedIndex: 500
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            // Como o item 500 NÃO está montado na DOM, aria-activedescendant DEVE ser omitido!
            expect(scroller.attributes('aria-activedescendant')).toBeUndefined();
            expect(wrapper.find('#sec-list-option-500').exists()).toBe(false);
        });

        it('prop ariaActivedescendant externa so e aplicada se o elemento existir no DOM montado', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(10),
                    role: 'listbox',
                    ariaLabel: 'External AD',
                    ariaActivedescendant: 'elemento-inexistente-no-dom'
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            // Elemento não existe no DOM montado -> atributo deve ser omitido
            expect(scroller.attributes('aria-activedescendant')).toBeUndefined();
        });

        it('durante scroll forçado que desmonta o item focado (10.000 itens), aria-activedescendant torna-se undefined', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(10000),
                    itemSize: 40,
                    style: { height: '200px' },
                    role: 'listbox',
                    ariaLabel: 'Scroll com Desmonte',
                    idPrefix: 'scroll-test'
                },
                slots: { item: '<div class="row-item" />' }
            });
            const el = wrapper.element as HTMLElement;
            stubViewport(el, 200);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');
            // 1. Foca o item 0 por teclado
            await scroller.trigger('keydown', { key: 'ArrowDown' });
            await settle();

            expect(scroller.attributes('aria-activedescendant')).toBe('scroll-test-option-0');
            expect(wrapper.find('#scroll-test-option-0').exists()).toBe(true);

            // 2. Simula scroll forçado profundo para o meio da lista (scrollTop = 4000)
            el.scrollTop = 4000;
            await el.dispatchEvent(new Event('scroll'));
            await settle();

            // 3. O item 0 deve ter sido desmontado do DOM pelo virtualizador
            expect(wrapper.find('#scroll-test-option-0').exists()).toBe(false);

            // 4. aria-activedescendant DEVE ser undefined (removido do DOM), nunca apontando para nó desmontado/fantasma!
            expect(scroller.attributes('aria-activedescendant')).toBeUndefined();
        });
    });

    describe('Validação de Conformidade Acessível W3C / Axe Rules (F14)', () => {
        it('estrutura de listbox atende aos requisitos WAI-ARIA para leitores de tela', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(5),
                    role: 'listbox',
                    ariaLabel: 'Lista de Opções Acessível',
                    idPrefix: 'a11y-check',
                    modelValue: 'item-2'
                },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');

            // 1. Nome acessível obrigatório
            expect(scroller.attributes('aria-label')).toBeTruthy();

            // 2. Foco acessível
            expect(scroller.attributes('tabindex')).toBe('0');

            // 3. Papéis consistentes entre container e filhos
            expect(scroller.attributes('role')).toBe('listbox');
            const options = wrapper.findAll('[role="option"]');
            expect(options.length).toBe(5);

            // 4. Todo option tem aria-selected booleano e IDs determinísticos
            for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                expect(opt.attributes('id')).toBe(`a11y-check-option-${i}`);
                expect(['true', 'false']).toContain(opt.attributes('aria-selected'));
                expect(opt.attributes('aria-setsize')).toBe('5');
                expect(opt.attributes('aria-posinset')).toBe(String(i + 1));
            }

            // 5. Interação e activedescendant válido
            await scroller.trigger('keydown', { key: 'ArrowDown' });
            await settle();

            const activedescendantId = scroller.attributes('aria-activedescendant');
            expect(activedescendantId).toBeTruthy();
            const activeEl = wrapper.find(`#${activedescendantId}`);
            expect(activeEl.exists()).toBe(true);
            expect(activeEl.attributes('role')).toBe('option');
        });
    });
});
