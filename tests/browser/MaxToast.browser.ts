import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { page, cdp, userEvent } from 'vitest/browser';
import MaxToast from '../../src/components/MaxToast.vue';
import { useToastStore, type ToastItem } from '../../src/stores/useToast.Store';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function mountToastAtViewport(widthPx: number, heightPx = 600, toasts: Partial<ToastItem>[] = []) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    await page.viewport(widthPx, heightPx);

    hostElement = document.createElement('div');
    hostElement.id = 'toast-test-host';
    document.body.appendChild(hostElement);

    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useToastStore(pinia);

    toasts.forEach((t) => store.add({
        title: t.title ?? 'Notificação',
        message: t.message,
        severity: t.severity ?? 'info',
        duration: t.duration ?? 0,
        ...t
    }));

    const app = createApp({
        render() {
            return h(MaxToast);
        }
    });

    app.directive('tooltip', {});
    app.use(pinia);
    activeApp = app;
    app.mount(hostElement);

    await nextFrame();
    await nextFrame();

    const container = document.querySelector('.max-toast-container') as HTMLElement;
    const items = document.querySelectorAll<HTMLElement>('.max-toast-item');
    return { container, items, store, app };
}

function expectInsideViewport(element: HTMLElement, viewportWidth = window.innerWidth, tolerancePx = 1) {
    const rect = element.getBoundingClientRect();
    expect(rect.left).toBeGreaterThanOrEqual(-tolerancePx);
    expect(rect.right).toBeLessThanOrEqual(viewportWidth + tolerancePx);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(viewportWidth + tolerancePx);
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
    document.documentElement.style.removeProperty('--max-toast-safe-left');
    document.documentElement.style.removeProperty('--max-toast-safe-right');
    document.documentElement.style.removeProperty('--max-toast-safe-top');
    document.documentElement.style.removeProperty('--max-toast-safe-bottom');
});

describe('MaxToast no Chromium real (ui-design/toast-recortado-em-viewport-movel)', () => {
    it('permanece perfeitamente dentro da viewport móvel de 320px com gutter de 16px', async () => {
        const { items } = await mountToastAtViewport(320, 568, [
            { title: 'Sucesso', message: 'Operação concluída', severity: 'success' }
        ]);

        expect(items.length).toBe(1);
        const item = items[0];
        const rect = item.getBoundingClientRect();

        expect(rect.left).toBeGreaterThanOrEqual(15);
        expect(rect.right).toBeLessThanOrEqual(305);
        expect(rect.width).toBeLessThanOrEqual(289);
        expectInsideViewport(item, 320);
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    });

    it('mantém responsividade e clamp correto em viewports 320, 360, 390, 420 e 560px', async () => {
        for (const width of [320, 360, 390, 420, 560]) {
            const { items } = await mountToastAtViewport(width, 640, [
                { title: `Viewport ${width}px`, message: 'Mensagem para validação de layout e clamp', severity: 'info' }
            ]);
            expect(items.length).toBe(1);
            const item = items[0];
            const rect = item.getBoundingClientRect();

            // Ausência de overflow horizontal e respeita limites da viewport
            expectInsideViewport(item, width);
            expect(rect.left).toBeGreaterThanOrEqual(15);
            expect(rect.right).toBeLessThanOrEqual(width - 15);

            if (width <= 480) {
                // Em telas móveis (<= 480px), container estica com gutters de 16px
                const expectedWidth = width - 32;
                expect(Math.abs(rect.width - expectedWidth)).toBeLessThanOrEqual(2);
            } else {
                // Em 560px (> 480px), o card tem clamp com max-width min(420px, 100%) e min-width 320px
                expect(rect.width).toBeLessThanOrEqual(421);
                expect(rect.width).toBeGreaterThanOrEqual(319);
                // Alinhado à direita respeitando o gutter
                expect(rect.right).toBeLessThanOrEqual(width - 15);
            }
        }
    });

    it('respeita safe-area nos 4 lados (top, bottom, left, right) sem corte', async () => {
        const viewportWidth = 390;
        const viewportHeight = 844;
        const { container, items } = await mountToastAtViewport(viewportWidth, viewportHeight, [
            { title: 'Safe Area Test', message: 'Testando insets nos 4 lados', severity: 'info' }
        ]);

        const safeTop = 44;
        const safeBottom = 34;
        const safeLeft = 20;
        const safeRight = 24;

        container.style.setProperty('--max-toast-safe-top', `${safeTop}px`);
        container.style.setProperty('--max-toast-safe-bottom', `${safeBottom}px`);
        container.style.setProperty('--max-toast-safe-left', `${safeLeft}px`);
        container.style.setProperty('--max-toast-safe-right', `${safeRight}px`);
        await nextFrame();

        const containerRect = container.getBoundingClientRect();
        const itemRect = items[0].getBoundingClientRect();

        // Top: respeita offset base (74px) + safe-top (44px)
        expect(containerRect.top).toBeGreaterThanOrEqual(74 + safeTop - 1);

        // Left e Right: respeita os safe-insets
        expect(itemRect.left).toBeGreaterThanOrEqual(safeLeft - 1);
        expect(itemRect.right).toBeLessThanOrEqual(viewportWidth - safeRight + 1);

        // Bottom: container não deve ultrapassar a área segura inferior
        expect(containerRect.bottom).toBeLessThanOrEqual(viewportHeight - safeBottom + 1);

        // Nao há corte horizontal
        expectInsideViewport(items[0], viewportWidth);
    });

    it('aplica zoom de 200% via CDP validando window.visualViewport?.scale === 2 e resetando em finally', async () => {
        const session = cdp() as unknown as { send(command: string, params?: unknown): Promise<unknown> };
        try {
            await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2.0 });
            expect(window.visualViewport?.scale).toBe(2);

            const { items } = await mountToastAtViewport(360, 640, [
                { title: 'Zoom CDP 200%', message: 'Verificando escala e integridade visual', severity: 'warning' }
            ]);

            expect(items.length).toBe(1);
            const rect = items[0].getBoundingClientRect();
            expect(rect.width).toBeGreaterThan(0);
            expect(rect.height).toBeGreaterThan(0);
        } finally {
            await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1.0 });
            expect(window.visualViewport?.scale).toBe(1);
        }
    });

    it('percorre os elementos interativos com foco completo via tecla Tab (expandir -> copiar -> fechar)', async () => {
        const longMessage = 'Esta é uma mensagem intencionalmente longa com mais de oitenta caracteres para que o botão de expandir seja renderizado junto com o botão de copiar.';
        const { items } = await mountToastAtViewport(400, 600, [
            { title: 'Foco por Tab', message: longMessage, severity: 'info' }
        ]);

        const item = items[0];
        const expandBtn = item.querySelector('.action-expand') as HTMLButtonElement;
        const copyBtn = item.querySelector('.action-copy') as HTMLButtonElement;
        const closeBtn = item.querySelector('.max-toast-close') as HTMLButtonElement;

        expect(expandBtn).not.toBeNull();
        expect(copyBtn).not.toBeNull();
        expect(closeBtn).not.toBeNull();

        // Limpa foco ativo inicial
        (document.activeElement as HTMLElement)?.blur();

        // 1º Tab -> botão Expandir
        await userEvent.tab();
        expect(document.activeElement).toBe(expandBtn);

        // 2º Tab -> botão Copiar
        await userEvent.tab();
        expect(document.activeElement).toBe(copyBtn);

        // 3º Tab -> botão Fechar
        await userEvent.tab();
        expect(document.activeElement).toBe(closeBtn);
    });

    it('gerencia overflow rolável em pilha de 8 toasts preservando alturas com flex-shrink: 0', async () => {
        const toastList: Partial<ToastItem>[] = Array.from({ length: 8 }, (_, i) => ({
            title: `Toast #${i + 1}`,
            message: `Descrição informativa para o item ${i + 1} da pilha de notificações.`,
            severity: i % 2 === 0 ? 'info' : 'success'
        }));

        // Monta com viewport vertical contido (ex: 450px) para induzir overflow do container
        const { container, items } = await mountToastAtViewport(400, 450, toastList);

        expect(items.length).toBe(8);

        const computedStyle = window.getComputedStyle(container);
        expect(computedStyle.overflowY).toBe('auto');

        // Confirma que a altura total do conteúdo excede a altura visível do container
        expect(container.scrollHeight).toBeGreaterThan(container.clientHeight);

        // Verifica que todos os toasts preservaram suas alturas nominais graças a flex-shrink: 0
        // (cada item possui padding e textos, devendo medir no mínimo 60px)
        const heights: number[] = [];
        items.forEach((item) => {
            const itemStyle = window.getComputedStyle(item);
            expect(itemStyle.flexShrink).toBe('0');
            const h = item.getBoundingClientRect().height;
            expect(h).toBeGreaterThanOrEqual(60);
            heights.push(h);
        });

        // O primeiro e o último item têm alturas proporcionais e não foram esmagados
        const firstHeight = heights[0];
        const lastHeight = heights[heights.length - 1];
        expect(Math.abs(firstHeight - lastHeight)).toBeLessThanOrEqual(10);

        // Valida que o container é efetivamente rolável
        const initialScrollTop = container.scrollTop;
        expect(initialScrollTop).toBe(0);

        container.scrollTop = 100;
        await nextFrame();
        expect(container.scrollTop).toBeGreaterThan(0);
    });

    it('quebra mensagem com token longo > 200 caracteres sem aumentar largura nem quebrar botões', async () => {
        const longToken = 'https://example.com/very/long/url/with/token?key=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz5678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
        const { items } = await mountToastAtViewport(320, 568, [
            { title: 'Erro de token', message: longToken, severity: 'error' }
        ]);

        expect(items.length).toBe(1);
        const item = items[0];
        expectInsideViewport(item, 320);

        const content = item.querySelector('.max-toast-content') as HTMLElement;
        expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth + 2);

        const expandBtn = item.querySelector('.action-expand') as HTMLButtonElement;
        const copyBtn = item.querySelector('.action-copy') as HTMLButtonElement;
        const closeBtn = item.querySelector('.max-toast-close') as HTMLButtonElement;

        expect(expandBtn).not.toBeNull();
        expect(copyBtn).not.toBeNull();
        expect(closeBtn).not.toBeNull();

        const itemRect = item.getBoundingClientRect();
        [expandBtn, copyBtn, closeBtn].forEach((btn) => {
            const bRect = btn.getBoundingClientRect();
            expect(bRect.left).toBeGreaterThanOrEqual(itemRect.left - 1);
            expect(bRect.right).toBeLessThanOrEqual(itemRect.right + 1);
        });
    });

    it('preserva apresentação desktop compacta e alinhada à direita em 1024px', async () => {
        const { items } = await mountToastAtViewport(1024, 768, [
            { title: 'Curto', message: 'OK', severity: 'info' },
            { title: 'Longo', message: 'Mensagem com detalhes moderados para teste desktop', severity: 'info' }
        ]);

        expect(items.length).toBe(2);
        const rect1 = items[0].getBoundingClientRect();
        const rect2 = items[1].getBoundingClientRect();

        expect(rect1.width).toBeGreaterThanOrEqual(319);
        expect(rect2.width).toBeLessThanOrEqual(421);
        expect(rect1.right).toBeLessThanOrEqual(1024);
        expect(rect2.right).toBeLessThanOrEqual(1024);
    });
});
