import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import MaxBaseVirtualScroller from '../../../src/components/base/MaxBaseVirtualScroller.vue';

/**
 * happy-dom não faz layout: sem intervenção o container mede 0 e o virtualizador não
 * renderiza nada.
 *
 * O @tanstack/virtual-core mede o elemento de scroll por `offsetWidth`/`offsetHeight`
 * (`getRect` em virtual-core/dist/esm/index.js:14) — NÃO por getBoundingClientRect
 * nem clientHeight. Stubar o alvo errado faz o teste "passar" com zero itens
 * renderizados, que é justamente o resultado sem sentido a evitar.
 */
const VIEWPORT = 400;

const stubLayout = (height = VIEWPORT) => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get(this: HTMLElement) {
            return this.classList?.contains('max-virtual-scroller') ? height : 0;
        }
    });

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 300 });

    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get(this: HTMLElement) {
            return this.classList?.contains('max-virtual-scroller') ? height : 0;
        }
    });
};

const restoreLayout = () => {
    Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight');
    Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
};

const makeItems = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i, label: `item ${i}` }));

const mountScroller = (props: Record<string, unknown> = {}) =>
    mount(MaxBaseVirtualScroller, {
        props: { items: makeItems(1000), itemSize: 40, scrollHeight: `${VIEWPORT}px`, ...props },
        slots: { item: '<span class="linha">{{ params.item?.label }}#{{ params.options.index }}</span>' },
        attachTo: document.body
    });

describe('MaxBaseVirtualScroller', () => {
    beforeEach(() => stubLayout());

    afterEach(() => {
        restoreLayout();
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('renderiza o container com a scrollHeight informada', () => {
        const wrapper = mountScroller({ scrollHeight: '250px' });
        const el = wrapper.element as HTMLElement;

        expect(el.style.height).toBe('250px');
        expect(el.style.overflow).toBe('auto');
    });

    it('virtualiza: com 1000 itens renderiza muito menos que 1000 nós', async () => {
        const wrapper = mountScroller({ items: makeItems(1000) });
        await nextTick();

        const renderizados = wrapper.findAll('.linha').length;

        // este é o teste que distingue virtualizar de apenas renderizar tudo.
        // Contagem exata, não uma faixa frouxa: 400px de viewport / 40px = 10
        // visíveis + 5 de overscan (numToleratedItems default).
        expect(renderizados).toBe(15);
    });

    it('o espaçador reserva a altura total da lista completa', async () => {
        const wrapper = mountScroller({ items: makeItems(1000), itemSize: 40 });
        await nextTick();

        const content = wrapper.find('.p-virtualscroller-content').element as HTMLElement;
        expect(content.style.height).toBe('40000px'); // 1000 * 40
    });

    it('o slot item recebe o item correto e os options corretos', async () => {
        const wrapper = mountScroller({ items: makeItems(1000) });
        await nextTick();

        const primeira = wrapper.findAll('.linha')[0];
        expect(primeira.text()).toBe('item 0#0');
    });

    it('options.first é true só no índice 0 e options.last só no último', async () => {
        const wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(3), itemSize: 40, scrollHeight: `${VIEWPORT}px` },
            slots: {
                item: `<span class="linha"
                    :data-index="params.options.index"
                    :data-first="String(params.options.first)"
                    :data-last="String(params.options.last)"
                    :data-count="String(params.options.count)"
                    :data-even="String(params.options.even)"
                    :data-odd="String(params.options.odd)"
                >x</span>`
            },
            attachTo: document.body
        });
        await nextTick();

        const linhas = wrapper.findAll('.linha');
        expect(linhas.length).toBe(3);

        expect(linhas[0].attributes('data-first')).toBe('true');
        expect(linhas[1].attributes('data-first')).toBe('false');
        expect(linhas[2].attributes('data-last')).toBe('true');
        expect(linhas[0].attributes('data-last')).toBe('false');

        expect(linhas[0].attributes('data-count')).toBe('3');
        expect(linhas[0].attributes('data-even')).toBe('true');
        expect(linhas[0].attributes('data-odd')).toBe('false');
        expect(linhas[1].attributes('data-even')).toBe('false');
    });

    it('options.count é o total da coleção, não o número de itens renderizados', async () => {
        const wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(1000), itemSize: 40, scrollHeight: `${VIEWPORT}px` },
            slots: { item: '<span class="linha" :data-count="String(params.options.count)">x</span>' },
            attachTo: document.body
        });
        await nextTick();

        const linhas = wrapper.findAll('.linha');
        expect(linhas.length).toBe(15); // só a janela renderiza
        expect(linhas[0].attributes('data-count')).toBe('1000'); // mas count é o total
    });

    it('options.index é o índice ABSOLUTO, não a posição na fatia renderizada', async () => {
        // é o único campo de options que o consumidor real lê (MaxInputIconPicker o
        // usa como data-row-index); listas curtas mascaram o defeito, porque índice
        // absoluto e posição na fatia coincidem enquanto a janela começa no topo
        const wrapper = mount(MaxBaseVirtualScroller, {
            props: { items: makeItems(1000), itemSize: 40, scrollHeight: `${VIEWPORT}px` },
            slots: { item: '<span class="linha" :data-index="String(params.options.index)">x</span>' },
            attachTo: document.body
        });
        await nextTick();

        const el = wrapper.element as HTMLElement;
        Object.defineProperty(el, 'scrollTop', { configurable: true, value: 4000, writable: true });
        el.dispatchEvent(new Event('scroll'));
        await nextTick();

        const linhas = wrapper.findAll('.linha');
        const primeiro = Number(linhas[0].attributes('data-index'));

        expect(primeiro).toBeGreaterThan(50);
        expect(Number(linhas[1].attributes('data-index'))).toBe(primeiro + 1);
    });

    it('lista vazia não quebra', async () => {
        const wrapper = mountScroller({ items: [] });
        await nextTick();

        expect(wrapper.findAll('.linha').length).toBe(0);
        const content = wrapper.find('.p-virtualscroller-content').element as HTMLElement;
        expect(content.style.height).toBe('0px');

        // rolar uma lista vazia não pode reportar janela nenhuma: sem a guarda de
        // linhas ausentes o handler leria rows[0].index e produziria um payload com
        // índices undefined
        await wrapper.trigger('scroll');
        await nextTick();
        await nextTick();

        expect(wrapper.emitted('scroll-index-change')).toBeFalsy();
    });

    it('mudar items reativamente atualiza a renderização', async () => {
        const wrapper = mountScroller({ items: makeItems(3) });
        await nextTick();
        expect(wrapper.findAll('.linha').length).toBe(3);

        await wrapper.setProps({ items: makeItems(7) });
        await nextTick();
        expect(wrapper.findAll('.linha').length).toBe(7);

        const content = wrapper.find('.p-virtualscroller-content').element as HTMLElement;
        expect(content.style.height).toBe('280px'); // 7 * 40
    });

    it('itemSize governa a altura reservada de cada item', async () => {
        const wrapper = mountScroller({ items: makeItems(5), itemSize: 60 });
        await nextTick();

        const primeiro = wrapper.findAll('.p-virtualscroller-item')[0].element as HTMLElement;
        expect(primeiro.style.height).toBe('60px');

        const content = wrapper.find('.p-virtualscroller-content').element as HTMLElement;
        expect(content.style.height).toBe('300px'); // 5 * 60
    });

    it('cada item é posicionado por translateY no seu deslocamento', async () => {
        const wrapper = mountScroller({ items: makeItems(5), itemSize: 40 });
        await nextTick();

        const itens = wrapper.findAll('.p-virtualscroller-item');
        expect((itens[0].element as HTMLElement).style.transform).toBe('translateY(0px)');
        expect((itens[1].element as HTMLElement).style.transform).toBe('translateY(40px)');
        expect((itens[2].element as HTMLElement).style.transform).toBe('translateY(80px)');
    });

    /** Índices realmente montados no DOM, lidos via aria-posinset (que é 1-based). */
    const janelaNoDom = (wrapper: ReturnType<typeof mountScroller>) => {
        const itens = wrapper.findAll('.p-virtualscroller-item');
        const posicoes = itens.map((i) => Number(i.attributes('aria-posinset')) - 1);
        return { first: posicoes[0], last: posicoes[posicoes.length - 1] };
    };

    it('scroll-index-change reporta a janela NOVA, não a anterior', async () => {
        const wrapper = mountScroller({ items: makeItems(1000), itemSize: 40 });
        await nextTick();

        const el = wrapper.element as HTMLElement;
        el.scrollTop = 1200;
        await wrapper.trigger('scroll');
        await nextTick();

        const evento = wrapper.emitted('scroll-index-change');
        expect(evento).toBeTruthy();

        // o payload precisa descrever o que está MONTADO: ler virtualRows no handler
        // síncrono daria a janela anterior, e aritmética paralela sobre o scrollTop
        // ignoraria a tolerância e divergiria do DOM
        const payload = evento?.at(-1)?.[0] as { first: number; last: number };
        expect(payload).toEqual(janelaNoDom(wrapper));
        expect(payload.first).toBeGreaterThan(20);
        expect(payload.last).toBeGreaterThan(payload.first);
    });

    it('scroll-index-change acompanha o DOM em posição não alinhada ao itemSize', async () => {
        const wrapper = mountScroller({ items: makeItems(1000), itemSize: 40 });
        await nextTick();

        const el = wrapper.element as HTMLElement;
        el.scrollTop = 1210; // não é múltiplo de 40: floor e ceil divergem aqui
        await wrapper.trigger('scroll');
        await nextTick();

        const payload = wrapper.emitted('scroll-index-change')?.at(-1)?.[0] as { first: number; last: number };
        expect(payload).toEqual(janelaNoDom(wrapper));
    });

    it('scroll-index-change não repete a mesma janela', async () => {
        const wrapper = mountScroller({ items: makeItems(1000), itemSize: 40 });
        await nextTick();

        const el = wrapper.element as HTMLElement;
        el.scrollTop = 400;
        await wrapper.trigger('scroll');
        await nextTick();
        await wrapper.trigger('scroll'); // mesma posição: não emite de novo
        await nextTick();
        expect(wrapper.emitted('scroll-index-change')?.length).toBe(1);

        el.scrollTop = 800;
        await wrapper.trigger('scroll');
        await nextTick();
        expect(wrapper.emitted('scroll-index-change')?.length).toBe(2);
    });

    it('a dedup exige que AMBOS os limites coincidam', async () => {
        // uma lista menor que a viewport tem last fixo no fim: só o first muda ao
        // rolar. Deduplicar por qualquer um dos limites engoliria essas janelas.
        const wrapper = mountScroller({ items: makeItems(14), itemSize: 40 });
        await nextTick();

        const el = wrapper.element as HTMLElement;
        el.scrollTop = 200;
        await wrapper.trigger('scroll');
        await nextTick();
        const depoisDoPrimeiro = wrapper.emitted('scroll-index-change')?.length ?? 0;

        el.scrollTop = 360;
        await wrapper.trigger('scroll');
        await nextTick();

        expect(wrapper.emitted('scroll-index-change')?.length).toBeGreaterThan(depoisDoPrimeiro);
    });

    it('a dedup é invalidada quando a coleção muda', async () => {
        const wrapper = mountScroller({ items: makeItems(1000), itemSize: 40 });
        await nextTick();

        const el = wrapper.element as HTMLElement;
        el.scrollTop = 400;
        await wrapper.trigger('scroll');
        await nextTick();
        expect(wrapper.emitted('scroll-index-change')?.length).toBe(1);

        // coleção inteiramente nova: a mesma janela numérica descreve outros itens
        await wrapper.setProps({ items: makeItems(1000).reverse() });
        await nextTick();
        await wrapper.trigger('scroll');
        await nextTick();

        expect(wrapper.emitted('scroll-index-change')?.length).toBe(2);
    });

    it('scroll-index-change nunca emite intervalo invertido nem fora da coleção', async () => {
        // lista MENOR que a viewport, rolada muito além do fim
        const wrapper = mountScroller({ items: makeItems(5), itemSize: 40 });
        await nextTick();

        const el = wrapper.element as HTMLElement;
        el.scrollTop = 1000;
        await wrapper.trigger('scroll');
        await nextTick();

        const eventos = (wrapper.emitted('scroll-index-change') ?? []) as Array<[{ first: number; last: number }]>;
        for (const [payload] of eventos) {
            expect(payload.last).toBeGreaterThanOrEqual(payload.first);
            expect(payload.first).toBeGreaterThanOrEqual(0);
            expect(payload.last).toBeLessThanOrEqual(4);
        }
    });

    it('emite scroll com o evento do elemento que rola de fato', async () => {
        // o consumidor (MaxInputIconPicker) lê event.target.scrollTop/clientHeight
        const wrapper = mountScroller({ items: makeItems(1000) });
        await nextTick();

        await wrapper.trigger('scroll');

        const emitido = wrapper.emitted('scroll');
        expect(emitido).toBeTruthy();

        const evento = emitido?.[0][0] as Event;
        expect(evento.target).toBe(wrapper.element);
        expect((evento.target as HTMLElement).classList).toContain('max-virtual-scroller');
    });

    it('ARIA: aria-setsize é o total real e aria-posinset a posição absoluta', async () => {
        const wrapper = mountScroller({ items: makeItems(1000), role: 'listbox', itemRole: 'option' });
        await nextTick();

        expect(wrapper.attributes('role')).toBe('listbox');

        const primeiro = wrapper.findAll('.p-virtualscroller-item')[0];
        // sem isto, um leitor de tela anunciaria "item 1 de 10" numa lista de 1000
        expect(primeiro.attributes('aria-setsize')).toBe('1000');
        expect(primeiro.attributes('aria-posinset')).toBe('1');
        expect(primeiro.attributes('role')).toBe('option');
    });

    it('ARIA: aria-posinset é o índice ABSOLUTO, não a posição na fatia renderizada', async () => {
        const wrapper = mountScroller({ items: makeItems(1000), itemRole: 'option' });
        await nextTick();

        // rola para longe do topo: aqui a posição na fatia e o índice absoluto divergem
        const el = wrapper.element as HTMLElement;
        Object.defineProperty(el, 'scrollTop', { configurable: true, value: 4000, writable: true });
        el.dispatchEvent(new Event('scroll'));
        await nextTick();

        const itens = wrapper.findAll('.p-virtualscroller-item');
        const primeiroPos = Number(itens[0].attributes('aria-posinset'));

        // com a fatia começando bem depois do topo, 1 denunciaria posição relativa
        expect(primeiroPos).toBeGreaterThan(50);
        expect(itens[0].attributes('aria-setsize')).toBe('1000');

        // e os posinset seguem contíguos e absolutos
        expect(Number(itens[1].attributes('aria-posinset'))).toBe(primeiroPos + 1);
    });

    it('numToleratedItems controla quantos itens extras são renderizados', async () => {
        // 400px de viewport / 40px = 10 visíveis; o resto é overscan
        const semTolerancia = mountScroller({ items: makeItems(1000), numToleratedItems: 0 });
        await nextTick();
        const base = semTolerancia.findAll('.linha').length;

        const comTolerancia = mountScroller({ items: makeItems(1000), numToleratedItems: 20 });
        await nextTick();
        const ampliado = comTolerancia.findAll('.linha').length;

        expect(base).toBe(10);
        expect(ampliado).toBe(30);
    });

    it('expõe scrollToIndex chamável', async () => {
        const wrapper = mountScroller({ items: makeItems(1000) });
        await nextTick();

        const vm = wrapper.vm as unknown as { scrollToIndex: (i: number) => void };
        expect(typeof vm.scrollToIndex).toBe('function');

        const el = wrapper.element as HTMLElement;
        const scrollSpy = vi.fn();
        Object.defineProperty(el, 'scrollTop', {
            configurable: true,
            get: () => 0,
            set: scrollSpy
        });

        vm.scrollToIndex(500);

        // não basta não lançar: precisa de fato mandar o container rolar
        expect(scrollSpy).toHaveBeenCalled();
    });

    it('não emite marcação de componente PrimeVue', async () => {
        const wrapper = mountScroller({ items: makeItems(10) });
        await nextTick();

        expect(wrapper.html()).not.toContain('p-component');
    });
});
