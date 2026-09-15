import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { page } from 'vitest/browser';
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

    it('mantém gutters e ausência de overflow horizontal em 320, 360, 390, 420 e 560px (#22)', async () => {
        for (const width of [320, 360, 390, 420, 560]) {
            const { items } = await mountToastAtViewport(width, 640, [
                { title: 'Aviso', message: 'Mensagem teste para validação de viewport móvel e tablet', severity: 'warning' }
            ]);
            expect(items.length).toBe(1);
            const rect = items[0].getBoundingClientRect();
            expect(rect.left).toBeGreaterThanOrEqual(15);
            expect(rect.right).toBeLessThanOrEqual(width - 15);
            expectInsideViewport(items[0], width);
        }
    });

    it('suporta zoom 200% sem overflow horizontal nem quebra de layout (#22)', async () => {
        const { items } = await mountToastAtViewport(320, 568, [
            { title: 'Zoom 200%', message: 'Texto escalado em alta densidade', severity: 'info' }
        ]);

        document.documentElement.style.fontSize = '32px';
        await nextFrame();

        expect(items.length).toBe(1);
        expectInsideViewport(items[0], 320);

        document.documentElement.style.removeProperty('font-size');
    });

    it('respeita safe-area vertical e horizontal insets determinísticos sem estourar viewport (#22)', async () => {
        const { container, items } = await mountToastAtViewport(360, 640, [
            { title: 'Notificação', message: 'Com safe-area vertical e horizontal', severity: 'info' }
        ]);

        container.style.setProperty('--max-toast-safe-left', '24px');
        container.style.setProperty('--max-toast-safe-right', '32px');
        container.style.setProperty('--max-toast-safe-top', '40px');
        container.style.setProperty('--max-toast-safe-bottom', '34px');
        await nextFrame();

        const rect = items[0].getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(23);
        expect(rect.right).toBeLessThanOrEqual(329);
        expect(rect.top).toBeGreaterThanOrEqual(113);
        expectInsideViewport(items[0], 360);
    });

    it('gerencia pilha vertical ordenada e expansão/recolhimento com foco/Tab acessível (#22)', async () => {
        const longText = 'Esta é uma mensagem intencionalmente longa com mais de 80 caracteres para permitir alternância de expansão e recolhimento sem quebras de layout.';
        const { items } = await mountToastAtViewport(390, 844, [
            { id: 'toast-1', title: 'Primeiro', message: 'Mensagem curta', severity: 'info' },
            { id: 'toast-2', title: 'Segundo', message: longText, severity: 'error' }
        ]);

        expect(items.length).toBe(2);
        const rect1 = items[0].getBoundingClientRect();
        const rect2 = items[1].getBoundingClientRect();

        // Pilha vertical: o segundo toast fica abaixo do primeiro
        expect(rect2.top).toBeGreaterThanOrEqual(rect1.bottom);

        // Expansão e recolhimento
        const itemLongo = items[1];
        const expandBtn = itemLongo.querySelector('.action-expand') as HTMLButtonElement;
        expect(expandBtn).not.toBeNull();
        expect(expandBtn.textContent?.trim()).toBe('Ver mais');

        expandBtn.click();
        await nextFrame();
        expect(expandBtn.textContent?.trim()).toBe('Ver menos');

        expandBtn.click();
        await nextFrame();
        expect(expandBtn.textContent?.trim()).toBe('Ver mais');

        // Tab e navegação por foco
        const closeBtn = itemLongo.querySelector('.max-toast-close') as HTMLButtonElement;
        const copyBtn = itemLongo.querySelector('.action-copy') as HTMLButtonElement;

        expandBtn.focus();
        expect(document.activeElement).toBe(expandBtn);

        copyBtn.focus();
        expect(document.activeElement).toBe(copyBtn);

        closeBtn.focus();
        expect(document.activeElement).toBe(closeBtn);
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
