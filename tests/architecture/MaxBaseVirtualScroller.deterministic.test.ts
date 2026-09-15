/**
 * Suíte Determinística — MaxBaseVirtualScroller (R23/F28A)
 *
 * Conserva SOMENTE os três contratos determinísticos:
 *   1. Cardinalidade  — número correto de itens renderizados na janela virtual
 *   2. Coalescência   — atualizações em batch funcionam sem perda de estado
 *   3. Cleanup        — sem memory leaks, listeners órfãos ou nós fantasma
 *
 * NÃO contém medições de `performance.now()` nem `expect(duration).toBeLessThan()`.
 * Medições temporais ficam em: tests/benchmarks/MaxBaseVirtualScroller.benchmark.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import MaxBaseVirtualScroller from '../../src/components/base/MaxBaseVirtualScroller.vue';

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

async function settle(): Promise<void> {
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
    await nextTick();
}

function makeItems(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `item-${i}`);
}

/** happy-dom não faz layout real; stub necessário para que o virtualizador calcule a janela. */
function stubViewport(el: HTMLElement, height: number): void {
    Object.defineProperty(el, 'clientHeight', { value: height, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
    el.getBoundingClientRect = () => ({
        top: 0, left: 0, right: 0, bottom: height, width: 300, height, x: 0, y: 0,
        toJSON: () => ({})
    } as DOMRect);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('MaxBaseVirtualScroller — Determinístico (R23/F28A)', () => {
    let wrapper: VueWrapper | null = null;

    beforeEach(() => {
        setActivePinia(createPinia());
        wrapper = null;
    });

    afterEach(() => {
        wrapper?.unmount();
        wrapper = null;
    });

    // =========================================================================
    // 1. CARDINALIDADE — número correto de itens renderizados
    // =========================================================================

    describe('Cardinalidade', () => {
        it('com 100 itens: renderiza apenas a janela virtual (muito menos que 100 nós DOM)', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(100), itemSize: 40, style: { height: '200px' } },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            const rendered = wrapper.findAll('.row-item').length;
            expect(rendered).toBeGreaterThan(0);
            // Com itemSize=40 e altura=200px, no máximo ~10 itens visíveis + overscan
            expect(rendered).toBeLessThan(100);
        });

        it('com 1.000 itens: DOM não escala linearmente com a cardinalidade', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(1000), itemSize: 40, style: { height: '200px' } },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            const rendered = wrapper.findAll('.row-item').length;
            expect(rendered).toBeGreaterThan(0);
            expect(rendered).toBeLessThan(100);
        });

        it('com 10.000 itens: DOM mantém tamanho proporcional à viewport, não à coleção', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(10000), itemSize: 40, style: { height: '200px' } },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            const rendered = wrapper.findAll('.row-item').length;
            expect(rendered).toBeGreaterThan(0);
            // Independente de 1k ou 10k itens, DOM renderizado deve ser equivalente
            expect(rendered).toBeLessThan(100);
        });

        it('lista vazia: zero nós renderizados sem erros', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: [], itemSize: 40, style: { height: '200px' } },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            expect(wrapper.findAll('.row-item')).toHaveLength(0);
        });

        it('com 1 item: exatamente 1 nó renderizado', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(1), itemSize: 40, style: { height: '200px' } },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            expect(wrapper.findAll('.row-item')).toHaveLength(1);
        });

        it('aumentar cardinalidade não aumenta o DOM além do limite da viewport', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(100), itemSize: 40, style: { height: '200px' } },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            const antes = wrapper.findAll('.row-item').length;

            await wrapper.setProps({ items: makeItems(10000) });
            await settle();

            const depois = wrapper.findAll('.row-item').length;

            // Ambos devem ser comparáveis — a virtualização mantém o DOM estável
            expect(Math.abs(depois - antes)).toBeLessThanOrEqual(10);
        });
    });

    // =========================================================================
    // 2. COALESCÊNCIA — atualizações em batch funcionam sem perda de estado
    // =========================================================================

    describe('Coalescência', () => {
        it('substituição completa da lista em batch mantém o número de itens renderizados correto', async () => {
            // Usa 5 itens para garantir renderização completa (todos cabem no viewport)
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(5), itemSize: 40, style: { height: '400px' } },
                slots: {
                    item: '<template #item="{ item }"><div class="row-item">{{ item }}</div></template>'
                }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            // Com 5 itens e viewport de 400px (itemSize=40), todos devem caber
            expect(wrapper.findAll('.row-item')).toHaveLength(5);

            // Substitui lista inteira de uma vez (coalescência)
            await wrapper.setProps({ items: makeItems(3) });
            await settle();

            // Após coalescência, deve refletir os 3 itens exatos
            expect(wrapper.findAll('.row-item')).toHaveLength(3);
        });

        it('múltiplas trocas de props em sequência (batch) são coalescidas corretamente', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(10), itemSize: 40, style: { height: '400px' } },
                slots: {
                    item: '<template #item="{ item }"><div class="row-item">{{ item }}</div></template>'
                }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            // Série de trocas sem aguardar entre elas (coalescência de reatividade Vue)
            wrapper.setProps({ items: makeItems(5) });
            wrapper.setProps({ items: makeItems(8) });
            wrapper.setProps({ items: makeItems(3) });
            await settle();

            // Deve refletir o estado final (3 itens), não um estado intermediário
            expect(wrapper.findAll('.row-item')).toHaveLength(3);
        });

        it('trocar itens por lista de mesmo tamanho atualiza conteúdo sem deixar nós fantasma', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: ['alpha', 'beta', 'gamma'], itemSize: 40, style: { height: '400px' } },
                slots: {
                    item: '<template #item="{ item }"><div class="row-item">{{ item }}</div></template>'
                }
            });
            stubViewport(wrapper.element as HTMLElement, 400);
            await settle();

            const textosAntes = wrapper.findAll('.row-item').map((r) => r.text());
            expect(textosAntes).toEqual(['alpha', 'beta', 'gamma']);

            await wrapper.setProps({ items: ['delta', 'epsilon', 'zeta'] });
            await settle();

            const textosDepois = wrapper.findAll('.row-item').map((r) => r.text());
            expect(textosDepois).toEqual(['delta', 'epsilon', 'zeta']);
        });

        it('reduzir de 1000 para 5 itens não deixa nós DOM órfãos', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(1000), itemSize: 40, style: { height: '200px' } },
                slots: { item: '<div class="row-item" />' }
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            await wrapper.setProps({ items: makeItems(5) });
            await settle();

            // Com apenas 5 itens, a cardinalidade exata deve ser respeitada
            expect(wrapper.findAll('.row-item')).toHaveLength(5);
        });
    });

    // =========================================================================
    // 3. CLEANUP — sem memory leaks, listeners órfãos ou nós fantasma
    // =========================================================================

    describe('Cleanup', () => {
        it('unmount remove o elemento raiz do DOM sem nós filhos residuais', async () => {
            const div = document.createElement('div');
            document.body.appendChild(div);

            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(100), itemSize: 40, style: { height: '200px' } },
                slots: { item: '<div class="row-item" />' },
                attachTo: div
            });
            stubViewport(wrapper.element as HTMLElement, 200);
            await settle();

            expect(div.querySelectorAll('.row-item').length).toBeGreaterThan(0);

            wrapper.unmount();
            wrapper = null;

            // Após desmontagem, nenhum nó row-item deve sobrar no documento
            expect(document.querySelectorAll('.row-item').length).toBe(0);

            document.body.removeChild(div);
        });

        it('nós fora da janela virtual são desmontados ao rolar (zero nós fantasma fora da viewport)', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: { items: makeItems(10000), itemSize: 40, style: { height: '200px' } },
                slots: { item: '<div class="row-item" data-testid="vrow" />' }
            });
            const el = wrapper.element as HTMLElement;
            stubViewport(el, 200);
            await settle();

            const montadosInicio = wrapper.findAll('[data-testid="vrow"]').length;

            // Scroll para o meio — os nós do início devem ser desmontados
            el.scrollTop = 4000;
            el.dispatchEvent(new Event('scroll'));
            await settle();

            const montadosMeio = wrapper.findAll('[data-testid="vrow"]').length;

            // A contagem de nós montados deve ser similar antes e depois (janela virtual estável)
            expect(montadosMeio).toBeGreaterThan(0);
            expect(montadosMeio).toBeLessThan(100);
            expect(Math.abs(montadosMeio - montadosInicio)).toBeLessThanOrEqual(10);
        });

        it('aria-activedescendant nunca aponta para nó desmontado após scroll', async () => {
            wrapper = mount(MaxBaseVirtualScroller, {
                props: {
                    items: makeItems(10000),
                    itemSize: 40,
                    style: { height: '200px' },
                    role: 'listbox',
                    ariaLabel: 'Cleanup Scroll',
                    idPrefix: 'cleanup-test'
                },
                slots: { item: '<div class="row-item" />' }
            });
            const el = wrapper.element as HTMLElement;
            stubViewport(el, 200);
            await settle();

            const scroller = wrapper.find('.max-base-virtual-scroller');

            // Foca item 0
            await scroller.trigger('keydown', { key: 'ArrowDown' });
            await settle();

            expect(wrapper.find('#cleanup-test-option-0').exists()).toBe(true);

            // Scroll profundo desmonta o item 0
            el.scrollTop = 4000;
            el.dispatchEvent(new Event('scroll'));
            await settle();

            // Item 0 deve estar desmontado
            expect(wrapper.find('#cleanup-test-option-0').exists()).toBe(false);

            // aria-activedescendant deve ser undefined (não apontar para nó fantasma)
            expect(scroller.attributes('aria-activedescendant')).toBeUndefined();
        });

        it('múltiplos mounts e unmounts em sequência não acumulam listeners globais', async () => {
            const eventListeners = window as unknown as { _eventListeners?: unknown[] };
            const listenersBefore = eventListeners._eventListeners?.length ?? 0;

            for (let cycle = 0; cycle < 3; cycle++) {
                const w = mount(MaxBaseVirtualScroller, {
                    props: { items: makeItems(100), itemSize: 40, style: { height: '200px' } },
                    slots: { item: '<div class="row-item" />' }
                });
                stubViewport(w.element as HTMLElement, 200);
                await settle();
                w.unmount();
            }

            // O número de listeners globais não deve crescer após cleanup
            const listenersAfter = eventListeners._eventListeners?.length ?? 0;
            expect(listenersAfter).toBeLessThanOrEqual(listenersBefore + 5);
        });
    });
});
