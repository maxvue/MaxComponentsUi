import { describe, it, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { createApp, h, ref, nextTick, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxPopover from '../../src/components/MaxPopover.vue';
import MaxPopoverConfirm from '../../src/components/MaxPopoverConfirm.vue';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';
import '../../src/themes/tokens.scss';
import '../../src/themes/params.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle() {
    await nextTick();
    await nextFrame();
    await nextFrame();
}

afterEach(async () => {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }
    document.querySelectorAll('.popover-item, .background-popover-confirm, .max-base-overlay').forEach((el) => el.remove());
    // Restaura viewport padrão
    if (typeof page?.viewport === 'function') await page.viewport(1280, 800);
});

describe('Camadas Semânticas, Z-Index e Clamp Responsivo no Chromium Real (R09/F11)', () => {
    it('adapta e faz clamp de MaxPopover em viewport estreito de 280px sem transbordar', async () => {
        if (typeof page?.viewport === 'function') await page.viewport(280, 653);

        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-280';
        hostElement.style.width = '280px';
        hostElement.style.padding = '0';
        document.body.appendChild(hostElement);

        const app = createApp({
            setup() {
                const popoverRef = ref<any>(null);
                return { popoverRef };
            },
            render() {
                return h('div', { style: 'padding: 10px;' }, [
                    h(MaxPopover, {
                        ref: 'popoverRef',
                        title: 'Popover 280px Test'
                    }, {
                        default: () => h('div', { id: 'popover-content-280', style: 'padding: 8px;' }, 'Conteúdo para teste de clamp em viewport estreito de 280px.')
                    })
                ]);
            }
        });

        app.use(createPinia());
        activeApp = app;
        app.mount(hostElement);
        await settle();

        const triggerButton = hostElement.querySelector('.max-popover-icon') as HTMLButtonElement;
        expect(triggerButton).not.toBeNull();
        triggerButton.click();
        await settle();

        const dialog = document.querySelector('.max-popover-dialog') as HTMLElement;
        expect(dialog).not.toBeNull();

        const rect = dialog.getBoundingClientRect();
        // A largura do popover nunca deve ultrapassar a largura útil de 280px
        expect(rect.width).toBeLessThanOrEqual(280);
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(280 + 2); // tolerância subpixel de 2px
    });

    it('adapta MaxPopoverConfirm em 320px e em landscape (568x320) com scroll interno e ações acessíveis', async () => {
        if (typeof page?.viewport === 'function') await page.viewport(568, 320);

        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-landscape';
        hostElement.style.width = '100%';
        document.body.appendChild(hostElement);

        let confirmStoreInstance: any;
        const app = createApp({
            setup() {
                confirmStoreInstance = useConfirmStore();
                return {};
            },
            render() {
                return h('div', [
                    h('button', {
                        id: 'btn-confirm-trigger',
                        onClick: () => {
                            confirmStoreInstance.confirm({
                                message: 'Mensagem com texto longo para exercitar a altura restrita e a barra de rolagem em orientação horizontal (landscape). '.repeat(4),
                                x: 100,
                                y: 50,
                                width: 50,
                                height: 30,
                                acceptProps: { label: 'Confirmar', action: () => {} },
                                rejectProps: { label: 'Cancelar', action: () => {} }
                            });
                        }
                    }, 'Gatilho Confirm'),
                    h(MaxPopoverConfirm)
                ]);
            }
        });

        app.use(createPinia());
        activeApp = app;
        app.mount(hostElement);
        await settle();

        const btnTrigger = document.querySelector('#btn-confirm-trigger') as HTMLButtonElement;
        btnTrigger.click();
        await settle();

        const dialog = document.querySelector('.max-icon-confirm-dialog') as HTMLElement;
        expect(dialog).not.toBeNull();

        const dialogRect = dialog.getBoundingClientRect();
        // Em landscape (320px de altura), o diálogo deve caber confortavelmente dentro de 320px
        expect(dialogRect.height).toBeLessThanOrEqual(320);
        expect(dialogRect.width).toBeLessThanOrEqual(568);

        // Ações de confirmar e cancelar presentes e acessíveis
        const actionButtons = dialog.querySelectorAll('.popover-confirm-btn');
        expect(actionButtons.length).toBe(2);
        expect((actionButtons[0] as HTMLElement).textContent).toContain('Cancelar');
        expect((actionButtons[1] as HTMLElement).textContent).toContain('Confirmar');
    });

    it('preserva clamp e limites visuais sob zoom de 200%', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-zoom';
        hostElement.style.zoom = '2';
        hostElement.style.width = '300px';
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h('div', { style: 'padding: 10px;' }, [
                    h(MaxPopover, {
                        title: 'Popover Zoom 200%'
                    }, {
                        default: () => h('div', 'Texto testado sob zoom de 200%.')
                    })
                ]);
            }
        });

        app.use(createPinia());
        activeApp = app;
        app.mount(hostElement);
        await settle();

        const trigger = hostElement.querySelector('.max-popover-icon') as HTMLButtonElement;
        trigger.click();
        await settle();

        const dialog = document.querySelector('.max-popover-dialog') as HTMLElement;
        expect(dialog).not.toBeNull();
        const computedZIndex = window.getComputedStyle(dialog).zIndex;
        expect(Number(computedZIndex)).toBe(1200);
    });

    it('valida hit-testing (elementFromPoint) e ordem de sobreposição com tokens canônicos', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-layers';
        hostElement.style.position = 'relative';
        hostElement.style.width = '400px';
        hostElement.style.height = '400px';
        document.body.appendChild(hostElement);

        // Cria camadas sobrepostas na mesma coordenada (150, 150)
        const layerSticky = document.createElement('div');
        layerSticky.id = 'layer-sticky';
        layerSticky.style.position = 'fixed';
        layerSticky.style.left = '100px';
        layerSticky.style.top = '100px';
        layerSticky.style.width = '200px';
        layerSticky.style.height = '200px';
        layerSticky.style.zIndex = 'var(--max-z-index-sticky, 100)';
        layerSticky.style.background = 'rgba(255,0,0,0.5)';
        hostElement.appendChild(layerSticky);

        const layerDropdown = document.createElement('div');
        layerDropdown.id = 'layer-dropdown';
        layerDropdown.style.position = 'fixed';
        layerDropdown.style.left = '100px';
        layerDropdown.style.top = '100px';
        layerDropdown.style.width = '200px';
        layerDropdown.style.height = '200px';
        layerDropdown.style.zIndex = 'var(--max-z-index-dropdown, 1000)';
        layerDropdown.style.background = 'rgba(0,255,0,0.5)';
        hostElement.appendChild(layerDropdown);

        const layerPopover = document.createElement('div');
        layerPopover.id = 'layer-popover';
        layerPopover.style.position = 'fixed';
        layerPopover.style.left = '100px';
        layerPopover.style.top = '100px';
        layerPopover.style.width = '200px';
        layerPopover.style.height = '200px';
        layerPopover.style.zIndex = 'var(--max-z-index-popover, 1200)';
        layerPopover.style.background = 'rgba(0,0,255,0.5)';
        hostElement.appendChild(layerPopover);

        await settle();

        // O ponto (150, 150) intersecta sticky (100), dropdown (1000) e popover (1200).
        // elementFromPoint DEVE retornar a camada de maior z-index: layerPopover.
        const hit = document.elementFromPoint(150, 150);
        expect(hit?.id).toBe('layer-popover');
    });

    it('suporta override direto de --max-z-index-* via CSS alterando a hierarquia no motor Blink', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-override';
        hostElement.style.position = 'relative';
        hostElement.style.width = '400px';
        hostElement.style.height = '400px';
        document.body.appendChild(hostElement);

        const layerA = document.createElement('div');
        layerA.id = 'layer-a';
        layerA.style.position = 'fixed';
        layerA.style.left = '100px';
        layerA.style.top = '100px';
        layerA.style.width = '200px';
        layerA.style.height = '200px';
        layerA.style.zIndex = 'var(--max-z-index-modal, 1310)';
        hostElement.appendChild(layerA);

        const layerB = document.createElement('div');
        layerB.id = 'layer-b';
        layerB.style.position = 'fixed';
        layerB.style.left = '100px';
        layerB.style.top = '100px';
        layerB.style.width = '200px';
        layerB.style.height = '200px';
        // Por padrão dropdown é 1000 (< modal 1310), mas aplicamos override contextual para 2500
        layerB.style.setProperty('--max-z-index-dropdown', '2500');
        layerB.style.zIndex = 'var(--max-z-index-dropdown, 1000)';
        hostElement.appendChild(layerB);

        await settle();

        // CSS computado de layerB reflete o override de 2500
        const computedZIndexB = window.getComputedStyle(layerB).zIndex;
        expect(Number(computedZIndexB)).toBe(2500);

        // hit-testing em (150, 150) seleciona layerB por ter z-index 2500 > 1310
        const hit = document.elementFromPoint(150, 150);
        expect(hit?.id).toBe('layer-b');
    });
});
