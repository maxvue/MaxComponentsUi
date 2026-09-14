import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import MaxBaseOverlay from '../../src/components/base/MaxBaseOverlay.vue';
import MaxDrawer from '../../src/components/MaxDrawer.vue';

async function settle() {
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();
    await nextTick();
}

function mockRect(el: HTMLElement, rect: Partial<DOMRect> = {}) {
    el.getBoundingClientRect = () => ({
        top: 100,
        left: 100,
        right: 200,
        bottom: 120,
        width: 100,
        height: 20,
        x: 100,
        y: 100,
        toJSON: () => ({}),
        ...rect
    } as DOMRect);
}

describe('Composição de Camadas Visuais (Layer Composition)', () => {
    let container: HTMLDivElement;
    let target: HTMLButtonElement;
    let wrapper: VueWrapper | null = null;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        target = document.createElement('button');
        container.appendChild(target);
        mockRect(target);
    });

    afterEach(() => {
        wrapper?.unmount();
        container.remove();
        document.querySelectorAll('.max-base-overlay').forEach((el) => el.remove());
    });

    it('dropdown padrão fora de modais recebe token var(--max-layer-dropdown, 1000)', async () => {
        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('var(--max-layer-dropdown, 1000)');
    });

    it('dropdown com target dentro de .max-modal é contextualizado para calc(var(--max-layer-modal, 1310) + 10)', async () => {
        const modalContainer = document.createElement('div');
        modalContainer.className = 'max-modal';
        document.body.appendChild(modalContainer);

        const modalTarget = document.createElement('button');
        modalContainer.appendChild(modalTarget);
        mockRect(modalTarget);

        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target: modalTarget }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('calc(var(--max-layer-modal, 1310) + 10)');

        modalContainer.remove();
    });

    it('dropdown com target dentro de elemento com role="dialog" é contextualizado para calc(var(--max-layer-modal, 1310) + 10)', async () => {
        const dialogContainer = document.createElement('div');
        dialogContainer.setAttribute('role', 'dialog');
        document.body.appendChild(dialogContainer);

        const dialogTarget = document.createElement('button');
        dialogContainer.appendChild(dialogTarget);
        mockRect(dialogTarget);

        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target: dialogTarget }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('calc(var(--max-layer-modal, 1310) + 10)');

        dialogContainer.remove();
    });

    it('dropdown com target dentro de .max-drawer é contextualizado para calc(var(--max-layer-modal, 1310) + 10)', async () => {
        const drawerContainer = document.createElement('div');
        drawerContainer.className = 'max-drawer';
        document.body.appendChild(drawerContainer);

        const drawerTarget = document.createElement('button');
        drawerContainer.appendChild(drawerTarget);
        mockRect(drawerTarget);

        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target: drawerTarget }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('calc(var(--max-layer-modal, 1310) + 10)');

        drawerContainer.remove();
    });

    it('suporta explicitamente a camada popover (var(--max-layer-popover, 1200))', async () => {
        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target, layer: 'popover' }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('var(--max-layer-popover, 1200)');
    });

    it('suporta explicitamente a camada modal (var(--max-layer-modal, 1310))', async () => {
        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target, layer: 'modal' }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('var(--max-layer-modal, 1310)');
    });

    it('suporta explicitamente a camada fullscreen (var(--max-layer-fullscreen, 1400))', async () => {
        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target, layer: 'fullscreen' }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('var(--max-layer-fullscreen, 1400)');
    });

    it('suporta explicitamente a camada tooltip (var(--max-layer-tooltip, 1600))', async () => {
        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target, layer: 'tooltip' }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('var(--max-layer-tooltip, 1600)');
    });

    it('aplica o layerOffset configurado sobre o token', async () => {
        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target, layer: 'dropdown', layerOffset: 5 }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('calc(var(--max-layer-dropdown, 1000) + 5)');
    });

    it('MaxDrawer com autoZIndex padrão recebe token var(--max-layer-modal, 1310)', async () => {
        wrapper = mount(MaxDrawer, {
            props: { visible: true }
        });
        await settle();
        const mask = document.querySelector('.max-drawer-mask') as HTMLElement;
        expect(mask).not.toBeNull();
        expect(mask.style.zIndex).toBe('var(--max-layer-modal, 1310)');
    });

    it('MaxDrawer com autoZIndex e baseZIndex customizado calcula offset sobre o token', async () => {
        wrapper = mount(MaxDrawer, {
            props: { visible: true, baseZIndex: 25 }
        });
        await settle();
        const mask = document.querySelector('.max-drawer-mask') as HTMLElement;
        expect(mask).not.toBeNull();
        expect(mask.style.zIndex).toBe('calc(var(--max-layer-modal, 1310) + 25)');
    });

    it('MaxDrawer com autoZIndex desativado respeita baseZIndex fixo sem token', async () => {
        wrapper = mount(MaxDrawer, {
            props: { visible: true, autoZIndex: false, baseZIndex: 50 }
        });
        await settle();
        const mask = document.querySelector('.max-drawer-mask') as HTMLElement;
        expect(mask).not.toBeNull();
        expect(mask.style.zIndex).toBe('50');
    });

    it('herda tokens sobrescritos via estilo customizado de :root ou host', async () => {
        document.documentElement.style.setProperty('--max-layer-dropdown', '2500');
        wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target }
        });
        await settle();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(panel.style.zIndex).toBe('var(--max-layer-dropdown, 1000)');
        expect(document.documentElement.style.getPropertyValue('--max-layer-dropdown')).toBe('2500');
        document.documentElement.style.removeProperty('--max-layer-dropdown');
    });

    it('valida hierarquia de composição completa sem inversão de prioridade', () => {
        const dropdownBase = 1000;
        const popoverBase = 1200;
        const modalBackdrop = 1300;
        const modalDialog = 1310;
        const dropdownInModal = 1320;
        const fullscreenPreview = 1400;
        const toast = 1500;
        const tooltip = 1600;
        const screenBlock = 10000;

        expect(dropdownBase).toBeLessThan(popoverBase);
        expect(popoverBase).toBeLessThan(modalBackdrop);
        expect(modalBackdrop).toBeLessThan(modalDialog);
        expect(modalDialog).toBeLessThan(dropdownInModal);
        expect(dropdownInModal).toBeLessThan(fullscreenPreview);
        expect(fullscreenPreview).toBeLessThan(toast);
        expect(toast).toBeLessThan(tooltip);
        expect(tooltip).toBeLessThan(screenBlock);
    });
});
