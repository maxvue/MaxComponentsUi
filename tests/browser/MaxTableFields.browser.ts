import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxTableFields from '../../src/components/MaxTableFields.vue';
import { installBrowserTestApp } from './bootstrap';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function mountTableAtWidth(widthPx: number, options: {
    columns?: any[];
    list?: any[];
    buttons?: any[];
    buttonsWidth?: string | number;
    ariaLabel?: string;
    slots?: Record<string, any>;
} = {}) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    hostElement = document.createElement('div');
    hostElement.id = 'table-test-host';
    hostElement.style.width = `${widthPx}px`;
    hostElement.style.height = '300px';
    hostElement.style.overflow = 'hidden';
    document.body.appendChild(hostElement);

    const app = createApp({
        render() {
            return h(MaxTableFields, {
                columns: options.columns,
                list: options.list,
                buttons: options.buttons,
                buttonsWidth: options.buttonsWidth,
                ariaLabel: options.ariaLabel
            }, options.slots);
        }
    });

    app.use(createPinia());
    installBrowserTestApp(app);
    activeApp = app;
    app.mount(hostElement);
    await nextFrame();
    await nextFrame();

    const scrollRegion = hostElement.querySelector('.max-table-fields-scroll-region') as HTMLElement;
    const table = hostElement.querySelector('table.max-table-fields') as HTMLElement;
    return { host: hostElement, scrollRegion, table, app };
}

function expectColumnsAligned(headerCells: NodeListOf<HTMLTableCellElement>, bodyCells: NodeListOf<HTMLTableCellElement>, tolerancePx = 1) {
    expect(headerCells.length).toBe(bodyCells.length);
    for (let i = 0; i < headerCells.length; i++) {
        const hRect = headerCells[i].getBoundingClientRect();
        const bRect = bodyCells[i].getBoundingClientRect();
        expect(Math.abs(hRect.left - bRect.left)).toBeLessThanOrEqual(tolerancePx);
        expect(Math.abs(hRect.right - bRect.right)).toBeLessThanOrEqual(tolerancePx);
        expect(Math.abs(hRect.width - bRect.width)).toBeLessThanOrEqual(tolerancePx);
    }
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

describe('MaxTableFields no Chromium real (ui-design/tabela-max-recorta-colunas-sem-scroll-compartilhado)', () => {
    it('compartilha a mesma região rolável para header e body a 320px, permitindo alcançar última coluna com alinhamento rigoroso', async () => {
        const columns = [
            { field: 'col1', header: 'Coluna 1', minWidth: '200px' },
            { field: 'col2', header: 'Coluna 2', minWidth: '200px' },
            { field: 'col3', header: 'Coluna 3', minWidth: '200px' }
        ];
        const list = Array.from({ length: 15 }, (_, i) => ({
            col1: `Val 1-${i}`,
            col2: `Val 2-${i}`,
            col3: `Val 3-${i}`
        }));

        const { scrollRegion } = await mountTableAtWidth(320, { columns, list });

        expect(scrollRegion).not.toBeNull();
        expect(scrollRegion.scrollWidth).toBeGreaterThanOrEqual(600);
        expect(scrollRegion.scrollWidth).toBeGreaterThan(scrollRegion.clientWidth);
        expect(scrollRegion.scrollHeight).toBeGreaterThan(scrollRegion.clientHeight);

        const headerCells = scrollRegion.querySelectorAll<HTMLTableCellElement>('thead th.max-table-fields-th');
        const firstRowCells = scrollRegion.querySelectorAll<HTMLTableCellElement>('tbody tr:first-child td.max-table-fields-td');
        expect(headerCells.length).toBe(3);
        expect(firstRowCells.length).toBe(3);

        // Alinhamento inicial (scrollLeft = 0)
        expectColumnsAligned(headerCells, firstRowCells, 1);

        // Alinhamento na metade da rolagem
        const maxScroll = scrollRegion.scrollWidth - scrollRegion.clientWidth;
        scrollRegion.scrollLeft = Math.floor(maxScroll / 2);
        await nextFrame();
        expectColumnsAligned(headerCells, firstRowCells, 1);

        // Rola até o final
        scrollRegion.scrollLeft = maxScroll;
        await nextFrame();
        expectColumnsAligned(headerCells, firstRowCells, 1);

        // A última coluna de header e body deve estar visível dentro do retângulo da scrollRegion
        const regionRect = scrollRegion.getBoundingClientRect();
        const lastThRect = headerCells[2].getBoundingClientRect();
        const lastTdRect = firstRowCells[2].getBoundingClientRect();

        expect(lastThRect.right).toBeLessThanOrEqual(regionRect.right + 2);
        expect(lastThRect.left).toBeGreaterThanOrEqual(regionRect.left - 2);
        expect(lastTdRect.right).toBeLessThanOrEqual(regionRect.right + 2);
        expect(lastTdRect.left).toBeGreaterThanOrEqual(regionRect.left - 2);

        // Header sticky no topo ao rolar verticalmente
        scrollRegion.scrollTop = 100;
        await nextFrame();
        const thead = scrollRegion.querySelector('thead') as HTMLElement;
        const theadRect = thead.getBoundingClientRect();
        expect(Math.abs(theadRect.top - regionRect.top)).toBeLessThanOrEqual(2);
    });

    it('permite alcançar controles e botões da terceira coluna por teclado (Tab) com scroll automático', async () => {
        const columns = [
            { field: 'col1', header: 'Col 1', minWidth: '200px' },
            { field: 'col2', header: 'Col 2', minWidth: '200px' },
            { field: 'col3', header: 'Col 3', minWidth: '200px', slot: 'col3' }
        ];
        const list = [{ col1: 'A', col2: 'B', col3: 'C' }];

        const { scrollRegion } = await mountTableAtWidth(320, {
            columns,
            list,
            slots: {
                col3: ({ value }: { value: string }) => h('button', { id: 'btn-distante' }, `Ação ${value}`)
            }
        });

        scrollRegion.scrollLeft = 0;
        await nextFrame();

        const btn = document.getElementById('btn-distante') as HTMLButtonElement;
        expect(btn).not.toBeNull();

        // Foca a região e depois foca o botão distante
        scrollRegion.focus();
        expect(document.activeElement).toBe(scrollRegion);

        btn.focus();
        await nextFrame();
        expect(document.activeElement).toBe(btn);

        // Ao focar o botão, o scrollLeft deve se ajustar para trazê-lo para a visualização
        const regionRect = scrollRegion.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        expect(btnRect.right).toBeLessThanOrEqual(regionRect.right + 2);
        expect(btnRect.left).toBeGreaterThanOrEqual(regionRect.left - 2);
    });

    it('renderiza a totalidade das linhas recebidas no DOM sem virtualização e alcança coluna de ações com buttonsWidth', async () => {
        const columns = [
            { field: 'col1', header: 'Coluna 1', minWidth: '150px' },
            { field: 'col2', header: 'Coluna 2', minWidth: '150px' }
        ];
        const list = Array.from({ length: 25 }, (_, i) => ({
            col1: `Valor 1-${i}`,
            col2: `Valor 2-${i}`
        }));
        const buttons = [{ id: 'delete', icon: 'mdi:trash', ariaLabel: 'Excluir item' }];

        const { scrollRegion } = await mountTableAtWidth(320, {
            columns,
            list,
            buttons,
            buttonsWidth: '120px'
        });

        // Confirma que não há virtualização: todas as 25 linhas estão no DOM
        const rows = scrollRegion.querySelectorAll('tbody tr.max-table-fields-row');
        expect(rows.length).toBe(25);

        // A coluna de ações tem botões alcançáveis no final da rolagem
        const maxScroll = scrollRegion.scrollWidth - scrollRegion.clientWidth;
        scrollRegion.scrollLeft = maxScroll;
        await nextFrame();

        const lastActionCell = rows[0].querySelector('.max-table-fields-buttons') as HTMLElement;
        expect(lastActionCell).not.toBeNull();
        const cellRect = lastActionCell.getBoundingClientRect();
        const regionRect = scrollRegion.getBoundingClientRect();
        expect(cellRect.right).toBeLessThanOrEqual(regionRect.right + 2);
        expect(cellRect.left).toBeGreaterThanOrEqual(regionRect.left - 2);
    });

    it('preenche 100% da largura em viewport ampla sem gerar overflow horizontal quando as colunas cabem', async () => {
        const columns = [
            { field: 'col1', header: 'Coluna 1', width: '200px' },
            { field: 'col2', header: 'Coluna 2', width: '200px' }
        ];
        const list = [{ col1: 'Dado A', col2: 'Dado B' }];

        const { scrollRegion, table } = await mountTableAtWidth(800, { columns, list });

        // Em 800px com duas colunas que cabem, table deve ocupar pelo menos a largura da região
        expect(scrollRegion.scrollWidth).toBeLessThanOrEqual(scrollRegion.clientWidth + 2);
        expect(table.clientWidth).toBeGreaterThanOrEqual(scrollRegion.clientWidth - 2);
    });
});
