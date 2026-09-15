import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxTable from '../../src/components/MaxTable.vue';
import MaxTableColumn from '../../src/components/MaxTableColumn.vue';
import { installBrowserTestApp } from './bootstrap';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function pressKeyOn(target: HTMLElement, key: string) {
    const event = new KeyboardEvent('keydown', {
        key,
        code: key === ' ' ? 'Space' : key,
        bubbles: true,
        cancelable: true
    });
    target.dispatchEvent(event);
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
    document.body.innerHTML = '';
});

describe('MaxTable no Chromium real — Acessibilidade e Ordenação por Teclado (R13 / F20)', () => {
    it('impõe scope="col" e aria-label em todos os th e garante nome estável mesmo com slot de header vazio', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'table-test-host';
        document.body.appendChild(hostElement);

        const sampleData = [
            { id: 1, name: 'Carlos', role: 'Dev' },
            { id: 2, name: 'Ana', role: 'Design' }
        ];

        const app = createApp({
            render() {
                return h(MaxTable, {
                    value: sampleData,
                    headerButton: 'Ações'
                }, {
                    default: () => [
                        // Coluna sortable com slot vazio
                        h(MaxTableColumn, { field: 'name', header: 'Nome', sortable: true }, {
                            header: () => []
                        }),
                        // Coluna estática com slot vazio
                        h(MaxTableColumn, { field: 'role', sortable: false }, {
                            header: () => null
                        }),
                        // Coluna sem header nem field
                        h(MaxTableColumn, { sortable: false })
                    ],
                    buttons: () => h('button', 'Excluir')
                });
            }
        });

        app.use(createPinia());
        installBrowserTestApp(app);
        activeApp = app;
        app.mount(hostElement);
        await nextFrame();
        await nextFrame();

        const thead = hostElement.querySelector('thead') as HTMLElement;
        expect(thead).not.toBeNull();

        const thList = thead.querySelectorAll<HTMLTableCellElement>('th');
        expect(thList.length).toBe(4);

        // Todos os th possuem rigorosamente scope="col"
        for (let i = 0; i < thList.length; i++) {
            expect(thList[i].getAttribute('scope')).toBe('col');
            expect(thList[i].getAttribute('aria-label')).toBeTruthy();
        }

        // Nome acessível estável mesmo com slots vazios
        expect(thList[0].getAttribute('aria-label')).toBe('Nome');
        const sortButton = thList[0].querySelector('button.max-table-header-button');
        expect(sortButton).not.toBeNull();
        expect(sortButton?.getAttribute('aria-label')).toBe('Nome');

        expect(thList[1].getAttribute('aria-label')).toBe('role');
        expect(thList[2].getAttribute('aria-label')).toBe('Coluna');
        expect(thList[3].getAttribute('aria-label')).toBe('Ações');
    });

    it('ordena por teclado com Enter e Espaço reais no Chromium, validando aria-sort e ordenação visual do DOM', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'table-test-host';
        document.body.appendChild(hostElement);

        const sampleData = [
            { id: 1, name: 'Carlos' },
            { id: 2, name: 'Ana' },
            { id: 3, name: 'Bruno' }
        ];

        const sortEmits: Array<{ sortField: string; sortOrder: number }> = [];

        const app = createApp({
            render() {
                return h(MaxTable, {
                    value: sampleData,
                    onSort: (e: any) => {
                        sortEmits.push(e);
                    }
                }, {
                    default: () => [
                        h(MaxTableColumn, { field: 'name', header: 'Nome', sortable: true })
                    ]
                });
            }
        });

        app.use(createPinia());
        installBrowserTestApp(app);
        activeApp = app;
        app.mount(hostElement);
        await nextFrame();
        await nextFrame();

        const th = hostElement.querySelector('thead th.max-table-th-sortable') as HTMLTableCellElement;
        const button = th.querySelector('button.max-table-header-button') as HTMLButtonElement;
        expect(th).not.toBeNull();
        expect(button).not.toBeNull();

        // Estado inicial
        expect(th.getAttribute('aria-sort')).toBe('none');
        expect(sortEmits.length).toBe(0);

        // Foca o botão nativo do cabeçalho
        button.focus();
        expect(document.activeElement).toBe(button);

        // 1. Aciona via tecla Enter real
        pressKeyOn(button, 'Enter');
        await nextFrame();
        await nextFrame();

        expect(th.getAttribute('aria-sort')).toBe('ascending');
        expect(sortEmits.length).toBe(1);
        expect(sortEmits[0]).toEqual({ sortField: 'name', sortOrder: 1 });

        // Valida ordenação no DOM real: Ana -> Bruno -> Carlos
        let rows = hostElement.querySelectorAll('tbody tr.max-table-row');
        expect(rows[0].textContent).toContain('Ana');
        expect(rows[1].textContent).toContain('Bruno');
        expect(rows[2].textContent).toContain('Carlos');

        // 2. Aciona via tecla Espaço real
        pressKeyOn(button, ' ');
        await nextFrame();
        await nextFrame();

        expect(th.getAttribute('aria-sort')).toBe('descending');
        expect(sortEmits.length).toBe(2);
        expect(sortEmits[1]).toEqual({ sortField: 'name', sortOrder: -1 });

        // Valida ordenação invertida no DOM: Carlos -> Bruno -> Ana
        rows = hostElement.querySelectorAll('tbody tr.max-table-row');
        expect(rows[0].textContent).toContain('Carlos');
        expect(rows[1].textContent).toContain('Bruno');
        expect(rows[2].textContent).toContain('Ana');

        // 3. Terceiro acionamento via Enter: limpa ordenação para none
        pressKeyOn(button, 'Enter');
        await nextFrame();
        await nextFrame();

        expect(th.getAttribute('aria-sort')).toBe('none');
        expect(sortEmits.length).toBe(3);
        expect(sortEmits[2]).toEqual({ sortField: '', sortOrder: 0 });

        // 4. Prevenção de disparo duplo: tecla seguida de clique sintético no mesmo tick
        pressKeyOn(button, 'Enter');
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await nextFrame();
        await nextFrame();

        expect(sortEmits.length).toBe(4);
        expect(th.getAttribute('aria-sort')).toBe('ascending');
    });
});
