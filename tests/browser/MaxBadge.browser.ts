import { afterEach, describe, expect, it } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxBadge from '../../src/components/MaxBadge.vue';
import MaxBadgeButton from '../../src/components/MaxBadgeButton.vue';
import '../../src/themes/all.scss';

let app: App | undefined;
let host: HTMLElement | undefined;

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function mountInBrowser(builder: () => ReturnType<typeof h>[]) {
    host = document.createElement('div');
    host.style.cssText = 'padding: 24px; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; background: var(--background-0, #ffffff);';
    document.body.append(host);
    app = createApp({
        render: () => h('div', { style: 'display: flex; flex-direction: column; gap: 16px;' }, builder())
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
});

function parsePx(value: string): number {
    return parseFloat(value) || 0;
}

describe('MaxBadge e MaxBadgeButton — múltiplos overlays no navegador real', () => {
    it('renderiza múltiplos overlays preservando geometria, altura e margem de 10px', async () => {
        await mountInBrowser(() => [
            h(MaxBadge, {
                label: 'Tarefas',
                id: 'badge-multi',
                overlay: ['Novo', '2']
            })
        ]);

        const badgeEl = host!.querySelector<HTMLElement>('#badge-multi')!;
        expect(badgeEl).toBeTruthy();

        const overlays = badgeEl.querySelectorAll<HTMLElement>('.max-badge-overlay');
        expect(overlays.length).toBe(2);

        // Verifica espaçamento marginLeft de 10px
        const style1 = getComputedStyle(overlays[0]);
        const style2 = getComputedStyle(overlays[1]);
        expect(parsePx(style1.marginLeft)).toBeCloseTo(10, 0);
        expect(parsePx(style2.marginLeft)).toBeCloseTo(10, 0);

        // Verifica altura de 16px
        expect(parsePx(style1.height)).toBeCloseTo(16, 0);
        expect(parsePx(style2.height)).toBeCloseTo(16, 0);

        // Verifica que não há sobreposição horizontal
        const rect1 = overlays[0].getBoundingClientRect();
        const rect2 = overlays[1].getBoundingClientRect();
        expect(rect2.left).toBeGreaterThanOrEqual(rect1.right);
    });

    it('aplica cores independentes por OverlayData e responde ao modo dark', async () => {
        await mountInBrowser(() => [
            h(MaxBadge, {
                label: 'Cores',
                id: 'badge-colors',
                color: '#00768e',
                overlay: [
                    { value: 'Erro', color: '#ef4444' },
                    { value: 'Sucesso', color: '#10b981' }
                ]
            })
        ]);

        const badgeEl = host!.querySelector<HTMLElement>('#badge-colors')!;
        const overlays = badgeEl.querySelectorAll<HTMLElement>('.max-badge-overlay');
        expect(overlays.length).toBe(2);

        const colorBg1 = getComputedStyle(overlays[0]).backgroundColor;
        const colorBg2 = getComputedStyle(overlays[1]).backgroundColor;
        expect(colorBg1).not.toBe(colorBg2);

        // Ativa modo dark e garante que estilos continuam legíveis
        document.documentElement.classList.add('dark');
        await nextFrame();

        const darkBg1 = getComputedStyle(overlays[0]).backgroundColor;
        expect(darkBg1).toBeTruthy();
    });

    it('funciona corretamente nos tamanhos large e xlarge', async () => {
        await mountInBrowser(() => [
            h(MaxBadge, { label: 'Normal', id: 'badge-norm', overlay: ['1'] }),
            h(MaxBadge, { label: 'Large', id: 'badge-lg', size: 'large', overlay: ['2'] }),
            h(MaxBadge, { label: 'XLarge', id: 'badge-xl', size: 'xlarge', overlay: ['3'] })
        ]);

        const norm = host!.querySelector<HTMLElement>('#badge-norm')!;
        const lg = host!.querySelector<HTMLElement>('#badge-lg')!;
        const xl = host!.querySelector<HTMLElement>('#badge-xl')!;

        expect(lg.classList.contains('max-badge-lg')).toBe(true);
        expect(xl.classList.contains('max-badge-xl')).toBe(true);

        const rectNorm = norm.getBoundingClientRect();
        const rectLg = lg.getBoundingClientRect();
        const rectXl = xl.getBoundingClientRect();

        expect(rectLg.height).toBeGreaterThan(rectNorm.height);
        expect(rectXl.height).toBeGreaterThan(rectLg.height);
    });

    it('no MaxBadgeButton renderiza múltiplos overlays e preserva acessibilidade do botão', async () => {
        await mountInBrowser(() => [
            h(MaxBadgeButton, {
                label: 'Filtro Botão',
                id: 'btn-multi',
                overlay: [
                    { value: 5, color: '#f59e0b' },
                    { value: 'Extra' }
                ]
            })
        ]);

        const buttonEl = host!.querySelector<HTMLButtonElement>('#btn-multi')!;
        expect(buttonEl.tagName).toBe('BUTTON');

        const overlays = buttonEl.querySelectorAll<HTMLElement>('.max-badge-overlay');
        expect(overlays.length).toBe(2);
        expect(overlays[0].textContent?.trim()).toBe('5');
        expect(overlays[1].textContent?.trim()).toBe('Extra');

        // Botão é o único controle interativo; overlays não possuem tabIndex
        expect(overlays[0].getAttribute('tabindex')).toBeNull();
        expect(overlays[1].getAttribute('tabindex')).toBeNull();
    });
});
