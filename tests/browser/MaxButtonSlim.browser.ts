import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createApp, h, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxButton from '../../src/components/MaxButton.vue';
import '../../src/themes/all.scss';

let app: App | undefined;
let host: HTMLElement | undefined;

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function mountButtons(builder: () => ReturnType<typeof h>[]) {
    host = document.createElement('div');
    host.style.cssText = 'padding: 16px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; background: var(--background-0, white);';
    document.body.append(host);
    app = createApp({
        render: () => h('div', { style: 'display: flex; gap: 16px; align-items: center; overflow: visible;' }, builder())
    });
    app.use(createPinia());
    app.mount(host);
    await nextFrame();
    await nextFrame();
}

afterEach(() => {
    app?.unmount();
    host?.remove();
    app = undefined;
    host = undefined;
    document.documentElement.classList.remove('dark');
    document.documentElement.style.zoom = '';
});

function parsePx(value: string): number {
    return parseFloat(value) || 0;
}

describe('MaxButton slim — geometria e estilos no navegador real', () => {
    it('reduz altura e padding vertical em botão padrão preservando largura e fonte', async () => {
        await mountButtons(() => [
            h(MaxButton, { label: 'Normal', 'data-testid': 'btn-normal' }),
            h(MaxButton, { label: 'Normal', slim: true, 'data-testid': 'btn-slim' })
        ]);

        const normalEl = host!.querySelector<HTMLButtonElement>('[data-testid="btn-normal"]')!;
        const slimEl = host!.querySelector<HTMLButtonElement>('[data-testid="btn-slim"]')!;

        const normalRect = normalEl.getBoundingClientRect();
        const slimRect = slimEl.getBoundingClientRect();

        expect(slimRect.height).toBeLessThan(normalRect.height);

        const normalStyle = getComputedStyle(normalEl);
        const slimStyle = getComputedStyle(slimEl);

        // 0.25rem em root 16px = 4px
        expect(parsePx(slimStyle.paddingTop)).toBeCloseTo(4, 0);
        expect(parsePx(slimStyle.paddingBottom)).toBeCloseTo(4, 0);

        // Padding horizontal e fonte preservados
        expect(parsePx(slimStyle.paddingLeft)).toBeCloseTo(parsePx(normalStyle.paddingLeft), 0);
        expect(parsePx(slimStyle.paddingRight)).toBeCloseTo(parsePx(normalStyle.paddingRight), 0);
        expect(slimStyle.fontSize).toBe(normalStyle.fontSize);
        expect(slimStyle.fontFamily).toBe(normalStyle.fontFamily);
    });

    it('aplica redução vertical em variantes outlined, text e dashed', async () => {
        await mountButtons(() => [
            h(MaxButton, { label: 'Outlined', variant: 'outlined', 'data-testid': 'outlined-normal' }),
            h(MaxButton, { label: 'Outlined', variant: 'outlined', slim: true, 'data-testid': 'outlined-slim' }),
            h(MaxButton, { label: 'Text', variant: 'text', 'data-testid': 'text-normal' }),
            h(MaxButton, { label: 'Text', variant: 'text', slim: true, 'data-testid': 'text-slim' }),
            h(MaxButton, { label: 'Dashed', dashed: true, 'data-testid': 'dashed-normal' }),
            h(MaxButton, { label: 'Dashed', dashed: true, slim: true, 'data-testid': 'dashed-slim' })
        ]);

        for (const variant of ['outlined', 'text', 'dashed']) {
            const normal = host!.querySelector<HTMLButtonElement>(`[data-testid="${variant}-normal"]`)!;
            const slim = host!.querySelector<HTMLButtonElement>(`[data-testid="${variant}-slim"]`)!;

            expect(slim.getBoundingClientRect().height).toBeLessThan(normal.getBoundingClientRect().height);
            const slimStyle = getComputedStyle(slim);
            expect(parsePx(slimStyle.paddingTop)).toBeCloseTo(4, 0);
            expect(parsePx(slimStyle.paddingBottom)).toBeCloseTo(4, 0);
        }
    });

    it('compõe com tamanhos small/sm e large/lg mantendo fontes dos tamanhos', async () => {
        await mountButtons(() => [
            h(MaxButton, { label: 'Small', size: 'small', 'data-testid': 'sm-normal' }),
            h(MaxButton, { label: 'Small', size: 'small', slim: true, 'data-testid': 'sm-slim' }),
            h(MaxButton, { label: 'Large', size: 'large', 'data-testid': 'lg-normal' }),
            h(MaxButton, { label: 'Large', size: 'large', slim: true, 'data-testid': 'lg-slim' })
        ]);

        const smNormal = host!.querySelector<HTMLButtonElement>('[data-testid="sm-normal"]')!;
        const smSlim = host!.querySelector<HTMLButtonElement>('[data-testid="sm-slim"]')!;
        const lgNormal = host!.querySelector<HTMLButtonElement>('[data-testid="lg-normal"]')!;
        const lgSlim = host!.querySelector<HTMLButtonElement>('[data-testid="lg-slim"]')!;

        expect(smSlim.getBoundingClientRect().height).toBeLessThan(smNormal.getBoundingClientRect().height);
        expect(lgSlim.getBoundingClientRect().height).toBeLessThan(lgNormal.getBoundingClientRect().height);

        // Fonte e padding horizontal específicos de cada tamanho são preservados
        const smNormalStyle = getComputedStyle(smNormal);
        const smSlimStyle = getComputedStyle(smSlim);
        expect(smSlimStyle.fontSize).toBe(smNormalStyle.fontSize);
        expect(parsePx(smSlimStyle.paddingLeft)).toBeCloseTo(parsePx(smNormalStyle.paddingLeft), 0);

        const lgNormalStyle = getComputedStyle(lgNormal);
        const lgSlimStyle = getComputedStyle(lgSlim);
        expect(lgSlimStyle.fontSize).toBe(lgNormalStyle.fontSize);
        expect(parsePx(lgSlimStyle.paddingLeft)).toBeCloseTo(parsePx(lgNormalStyle.paddingLeft), 0);
    });

    it('preserva integralmente a geometria da variante link', async () => {
        await mountButtons(() => [
            h(MaxButton, { label: 'Link', variant: 'link', 'data-testid': 'link-normal' }),
            h(MaxButton, { label: 'Link', variant: 'link', slim: true, 'data-testid': 'link-slim' })
        ]);

        const normal = host!.querySelector<HTMLButtonElement>('[data-testid="link-normal"]')!;
        const slim = host!.querySelector<HTMLButtonElement>('[data-testid="link-slim"]')!;

        const normalRect = normal.getBoundingClientRect();
        const slimRect = slim.getBoundingClientRect();

        expect(Math.abs(slimRect.height - normalRect.height)).toBeLessThanOrEqual(0.5);
        expect(getComputedStyle(slim).paddingTop).toBe(getComputedStyle(normal).paddingTop);
        expect(getComputedStyle(slim).paddingBottom).toBe(getComputedStyle(normal).paddingBottom);
    });

    it('preserva geometria do fallback apenas ícone sem alterações', async () => {
        await mountButtons(() => [
            h(MaxButton, { icon: 'mdi:pencil', 'data-testid': 'icon-normal' }),
            h(MaxButton, { icon: 'mdi:pencil', slim: true, 'data-testid': 'icon-slim' })
        ]);

        const normal = host!.querySelector<HTMLButtonElement>('[data-testid="icon-normal"]')!;
        const slim = host!.querySelector<HTMLButtonElement>('[data-testid="icon-slim"]')!;

        expect(normal.classList.contains('max-icon-button')).toBe(true);
        expect(slim.classList.contains('max-icon-button')).toBe(true);
        expect(slim.classList.contains('max-button-slim')).toBe(false);

        const normalRect = normal.getBoundingClientRect();
        const slimRect = slim.getBoundingClientRect();
        expect(Math.abs(slimRect.height - normalRect.height)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(slimRect.width - normalRect.width)).toBeLessThanOrEqual(0.5);
    });

    it('funciona com texto passado apenas via slot default', async () => {
        await mountButtons(() => [
            h(MaxButton, { 'data-testid': 'slot-normal' }, { default: () => 'Slot Normal' }),
            h(MaxButton, { slim: true, 'data-testid': 'slot-slim' }, { default: () => 'Slot Normal' })
        ]);

        const normal = host!.querySelector<HTMLButtonElement>('[data-testid="slot-normal"]')!;
        const slim = host!.querySelector<HTMLButtonElement>('[data-testid="slot-slim"]')!;

        expect(slim.getBoundingClientRect().height).toBeLessThan(normal.getBoundingClientRect().height);
    });

    it('preserva visibilidade do foco por teclado em tema claro, escuro e com zoom 200%', async () => {
        await mountButtons(() => [
            h(MaxButton, { label: 'Foco Padrão', 'data-testid': 'focus-normal' }),
            h(MaxButton, { label: 'Foco Slim', slim: true, 'data-testid': 'focus-slim' })
        ]);

        // Testar no tema normal
        await userEvent.keyboard('{Tab}');
        const first = document.activeElement as HTMLElement;
        expect(first).toBe(host!.querySelector('[data-testid="focus-normal"]'));

        await userEvent.keyboard('{Tab}');
        const second = document.activeElement as HTMLElement;
        const slimBtn = host!.querySelector<HTMLButtonElement>('[data-testid="focus-slim"]')!;
        expect(second).toBe(slimBtn);

        const style = getComputedStyle(slimBtn);
        expect(parseFloat(style.outlineWidth || '0')).toBeGreaterThanOrEqual(2);

        // Tema escuro
        document.documentElement.classList.add('dark');
        await nextFrame();
        expect(parseFloat(getComputedStyle(slimBtn).outlineWidth || '0')).toBeGreaterThanOrEqual(2);

        // Zoom 200%
        document.documentElement.style.zoom = '200%';
        await nextFrame();
        expect(parseFloat(getComputedStyle(slimBtn).outlineWidth || '0')).toBeGreaterThanOrEqual(2);
    });
});
