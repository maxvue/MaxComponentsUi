import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import axe from 'axe-core';
import MaxBaseVirtualScroller from '../../src/components/base/MaxBaseVirtualScroller.vue';
import MaxListBox from '../../src/components/MaxListBox.vue';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(): Promise<void> {
    await nextFrame();
    await nextFrame();
}

afterEach(() => {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }
});

interface ScrollerItem {
    id: number;
    label: string;
    disabled?: boolean;
}

function makeItems(count: number): ScrollerItem[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        label: `Item ${i}`,
        disabled: i === 3
    }));
}

describe('F14 / E06-01, E06-02 — MaxBaseVirtualScroller e Listbox no Chromium Real (axe, teclado e activedescendant em scroll)', () => {
    it('Chromium Blink: conformidade total WCAG com axe-core sem violações em role="listbox"', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const items = makeItems(50);
        let selectedValue: any = items[0];

        const app = createApp({
            render() {
                return h(MaxBaseVirtualScroller, {
                    items,
                    itemSize: 40,
                    style: { height: '200px', width: '300px' },
                    role: 'listbox',
                    ariaLabel: 'Lista de Opções Virtuais',
                    modelValue: selectedValue,
                    'onUpdate:modelValue': (val: any) => {
                        selectedValue = val;
                    }
                }, {
                    item: ({ item, options }: any) => h('span', {
                        class: ['custom-item', { 'is-selected': options.selected }]
                    }, item.label)
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const scrollerEl = hostElement.querySelector('.max-base-virtual-scroller') as HTMLElement;
        expect(scrollerEl).toBeTruthy();
        expect(scrollerEl.getAttribute('role')).toBe('listbox');
        expect(scrollerEl.getAttribute('aria-label')).toBe('Lista de Opções Virtuais');

        // Executa axe-core real no motor Blink
        const axeResults = await axe.run(scrollerEl, {
            rules: {
                'region': { enabled: false }
            }
        });

        expect(axeResults.violations).toHaveLength(0);
    });

    it('Chromium Blink: navegação por teclado completa (ArrowDown, ArrowUp, Home, End, Enter, Space) gerencia foco e seleção', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const items = makeItems(20);
        let selectedValue: any = null;

        const app = createApp({
            render() {
                return h(MaxBaseVirtualScroller, {
                    items,
                    itemSize: 40,
                    style: { height: '200px', width: '300px' },
                    role: 'listbox',
                    ariaLabel: 'Navegação por Teclado',
                    modelValue: selectedValue,
                    'onUpdate:modelValue': (val: any) => {
                        selectedValue = val;
                    }
                }, {
                    item: ({ item, ariaProps }: any) => h('div', ariaProps, item.label)
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const scrollerEl = hostElement.querySelector('.max-base-virtual-scroller') as HTMLElement;
        scrollerEl.focus();
        await settle();

        expect(document.activeElement).toBe(scrollerEl);

        // 1. ArrowDown move para o primeiro item (índice 0)
        scrollerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await settle();

        const firstItemId = scrollerEl.getAttribute('aria-activedescendant');
        expect(firstItemId).toBeTruthy();
        expect(firstItemId).toContain('-option-0');

        // 2. ArrowDown avança para o próximo item (índice 1)
        scrollerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await settle();

        const secondItemId = scrollerEl.getAttribute('aria-activedescendant');
        expect(secondItemId).toBeTruthy();
        expect(secondItemId).toContain('-option-1');

        // 3. Enter seleciona o item ativo (índice 1)
        scrollerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await settle();

        expect(selectedValue).toMatchObject({ id: 1, label: 'Item 1' });

        // 4. End navega para o último item (índice 19)
        scrollerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        await settle();

        const lastItemId = scrollerEl.getAttribute('aria-activedescendant');
        expect(lastItemId).toBeTruthy();
        expect(lastItemId).toContain('-option-19');

        // 5. Home retorna para o primeiro item (índice 0)
        scrollerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
        await settle();

        const backToFirst = scrollerEl.getAttribute('aria-activedescendant');
        expect(backToFirst).toContain('-option-0');

        // 6. Space seleciona o primeiro item
        scrollerEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        await settle();

        expect(selectedValue).toMatchObject({ id: 0, label: 'Item 0' });
    });

    it('Chromium Blink: integridade estrita de aria-activedescendant durante scroll virtual real (nós desmontados)', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const items = makeItems(100);

        const app = createApp({
            render() {
                return h(MaxBaseVirtualScroller, {
                    items,
                    itemSize: 40,
                    style: { height: '200px', width: '300px', overflowY: 'auto' },
                    role: 'listbox',
                    ariaLabel: 'Lista Virtual Longa com Scroll'
                }, {
                    item: ({ item, ariaProps }: any) => h('div', ariaProps, item.label)
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const scrollerEl = hostElement.querySelector('.max-base-virtual-scroller') as HTMLElement;
        scrollerEl.focus();

        // Ativa o item 0 no topo
        scrollerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await settle();

        const activeIdAtTop = scrollerEl.getAttribute('aria-activedescendant');
        expect(activeIdAtTop).toBeTruthy();
        expect(activeIdAtTop).toContain('-option-0');

        // Comprova que o elemento apontado está presente no DOM
        const mountedElAtTop = hostElement.querySelector(`#${activeIdAtTop}`);
        expect(mountedElAtTop).not.toBeNull();

        // Rola bruscamente 2000px para baixo (o item 0 sai completamente da janela virtual e é desmontado)
        scrollerEl.scrollTop = 2000;
        scrollerEl.dispatchEvent(new Event('scroll'));
        await settle();

        // O item 0 foi desmontado pelo TanStack Virtual
        const oldItemInDom = hostElement.querySelector(`#${activeIdAtTop}`);
        expect(oldItemInDom).toBeNull();

        // O scroller blinda aria-activedescendant: ele NÃO referencia o nó desmontado
        const activedescendantAfterScroll = scrollerEl.getAttribute('aria-activedescendant');
        expect(activedescendantAfterScroll).toBeNull();

        // Rola de volta para o topo (scrollTop = 0)
        scrollerEl.scrollTop = 0;
        scrollerEl.dispatchEvent(new Event('scroll'));
        await settle();

        // O item 0 é remontado e volta a ser apontado seguramente
        const activedescendantAtTopAgain = scrollerEl.getAttribute('aria-activedescendant');
        expect(activedescendantAtTopAgain).toBeTruthy();
        expect(activedescendantAtTopAgain).toContain('-option-0');
        expect(hostElement.querySelector(`#${activedescendantAtTopAgain}`)).not.toBeNull();
    });

    it('Chromium Blink: MaxListBox com virtualização e filtro atende 100% axe-core sem violações', async () => {
        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const options = makeItems(30);

        const app = createApp({
            render() {
                return h(MaxListBox, {
                    options,
                    title: 'Cidades Disponíveis',
                    filter: true,
                    virtualScroll: true,
                    height: '250px',
                    modelValue: options[2]
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const listboxContainer = hostElement.querySelector('.max-listbox') as HTMLElement;
        expect(listboxContainer).toBeTruthy();

        // Auditoria de acessibilidade via axe-core
        const axeResults = await axe.run(listboxContainer, {
            rules: {
                'region': { enabled: false }
            }
        });

        expect(axeResults.violations).toHaveLength(0);
    });
});
