import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, ref, type App, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import MaxModal from '../../src/components/MaxModal.vue';
import MaxDrawer from '../../src/components/MaxDrawer.vue';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function waitForLayout(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));
}

function mountTestApp(renderFn: () => any): App {
    hostElement = document.createElement('div');
    document.body.appendChild(hostElement);

    const app = createApp({
        setup() {
            return renderFn;
        }
    });

    app.directive('tooltip', {});
    const pinia = createPinia();
    setActivePinia(pinia);
    app.use(pinia);
    app.mount(hostElement);

    activeApp = app;
    return app;
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
    document.body.innerHTML = '';
});

describe('Layout real de larguras de overlay no Chromium', () => {
    it('MaxDrawer: preserva largura padrão de 20rem nas laterais sem props', async () => {
        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'left',
            header: 'Gaveta Padrão'
        }, {
            default: () => h('div', 'Conteúdo')
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        expect(drawerEl).not.toBeNull();

        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const expectedWidth = 20 * rootFontSize;
        const rect = drawerEl.getBoundingClientRect();
        expect(Math.abs(rect.width - expectedWidth)).toBeLessThanOrEqual(1.5);
    });

    it('MaxDrawer: preserva largura da máscara na posição top sem props', async () => {
        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'top',
            header: 'Gaveta Top Padrão'
        }, {
            default: () => h('div', 'Conteúdo')
        }));

        await nextTick();
        await waitForLayout();

        const maskEl = document.querySelector('.max-drawer-mask') as HTMLElement;
        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        expect(maskEl).not.toBeNull();
        expect(drawerEl).not.toBeNull();

        const maskWidth = maskEl.getBoundingClientRect().width;
        const drawerWidth = drawerEl.getBoundingClientRect().width;
        expect(Math.abs(drawerWidth - maskWidth)).toBeLessThanOrEqual(1.5);
    });

    it('MaxDrawer: aplica largura solicitada numérica em pixels', async () => {
        const sampleWidth = Math.min(280, Math.floor(window.innerWidth * 0.7));

        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'left',
            width: sampleWidth,
            header: 'Largura Solicitada'
        }, {
            default: () => h('div', 'Texto curto')
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        const rect = drawerEl.getBoundingClientRect();
        expect(Math.abs(rect.width - sampleWidth)).toBeLessThanOrEqual(1.5);
    });

    it('MaxDrawer: maxWidth limita a largura quando for menor que a width solicitada', async () => {
        const baseWidth = Math.min(320, Math.floor(window.innerWidth * 0.8));
        const maxLimit = baseWidth - 60;

        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'left',
            width: baseWidth,
            maxWidth: maxLimit,
            header: 'Limitado por maxWidth'
        }, {
            default: () => h('div', 'Texto curto')
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        const rect = drawerEl.getBoundingClientRect();
        expect(Math.abs(rect.width - maxLimit)).toBeLessThanOrEqual(1.5);
    });

    it('MaxDrawer: minWidth expande o painel quando for maior que a width solicitada', async () => {
        const minTarget = Math.min(300, Math.floor(window.innerWidth * 0.75));
        const smallWidth = minTarget - 70;

        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'left',
            width: smallWidth,
            minWidth: minTarget,
            header: 'Expandido por minWidth'
        }, {
            default: () => h('div', 'Texto curto')
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        const rect = drawerEl.getBoundingClientRect();
        expect(Math.abs(rect.width - minTarget)).toBeLessThanOrEqual(1.5);
    });

    it('MaxDrawer: minWidth supera maxWidth quando conflitantes conforme regra CSS', async () => {
        const minTarget = Math.min(300, Math.floor(window.innerWidth * 0.75));
        const smallerMax = minTarget - 50;

        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'left',
            maxWidth: smallerMax,
            minWidth: minTarget,
            header: 'Conflito minWidth x maxWidth'
        }, {
            default: () => h('div', 'Texto curto')
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        const rect = drawerEl.getBoundingClientRect();
        expect(Math.abs(rect.width - minTarget)).toBeLessThanOrEqual(1.5);
    });

    it('MaxDrawer: maxWidth superior à viewport é contido pelo teto de 100vw', async () => {
        const excessiveWidth = window.innerWidth + 600;

        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'left',
            width: excessiveWidth,
            maxWidth: excessiveWidth,
            header: 'Teto viewport'
        }, {
            default: () => h('div', 'Texto curto')
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        const rect = drawerEl.getBoundingClientRect();
        expect(rect.width).toBeLessThanOrEqual(window.innerWidth + 1.5);
    });

    it('MaxDrawer: suporta minWidth responsivo via expressão CSS', async () => {
        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'left',
            width: '10rem',
            minWidth: 'min(16rem, 70vw)',
            header: 'Mínimo responsivo'
        }, {
            default: () => h('div', 'Texto curto')
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        const rect = drawerEl.getBoundingClientRect();
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const expectedPx = Math.min(16 * rootFontSize, window.innerWidth * 0.7);
        expect(Math.abs(rect.width - expectedPx)).toBeLessThanOrEqual(2);
    });

    it('MaxDrawer: remoção reativa de props restaura largura padrão pelo CSS', async () => {
        const sampleWidth = Math.min(280, Math.floor(window.innerWidth * 0.7));
        const customWidth = ref<string | number | undefined>(sampleWidth);

        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'left',
            width: customWidth.value,
            header: 'Reatividade'
        }, {
            default: () => h('div', 'Texto')
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        expect(Math.abs(drawerEl.getBoundingClientRect().width - sampleWidth)).toBeLessThanOrEqual(1.5);

        customWidth.value = undefined;
        await nextTick();
        await waitForLayout();

        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const defaultWidth = 20 * rootFontSize;
        expect(Math.abs(drawerEl.getBoundingClientRect().width - defaultWidth)).toBeLessThanOrEqual(1.5);
    });

    it('MaxDrawer: aplica largura informada em posições superiores (top)', async () => {
        const sampleWidth = Math.min(280, Math.floor(window.innerWidth * 0.7));

        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'top',
            width: sampleWidth,
            header: 'Posição Top com Width'
        }, {
            default: () => h('div', 'Conteúdo')
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        expect(Math.abs(drawerEl.getBoundingClientRect().width - sampleWidth)).toBeLessThanOrEqual(1.5);
    });

    it('MaxModal: aplica minWidth explícito mantendo integridade do layout', async () => {
        const minTarget = Math.min(340, Math.max(260, window.innerWidth - 60));

        mountTestApp(() => h(MaxModal, {
            visible: true,
            noButton: true,
            minWidth: minTarget,
            title: 'Modal com minWidth'
        }, {
            content: () => h('div', 'Conteúdo interno curto')
        }));

        await nextTick();
        await waitForLayout();

        const modalEl = document.querySelector('.max-modal') as HTMLElement;
        expect(modalEl).not.toBeNull();
        expect(modalEl.getBoundingClientRect().width).toBeGreaterThanOrEqual(minTarget - 2);
    });

    it('MaxModal: minWidth supera maxWidth quando conflitantes conforme regra CSS', async () => {
        const minTarget = Math.min(320, Math.max(250, window.innerWidth - 70));
        const smallerMax = minTarget - 60;

        mountTestApp(() => h(MaxModal, {
            visible: true,
            noButton: true,
            maxWidth: smallerMax,
            minWidth: minTarget,
            title: 'Modal Conflito Dimensões'
        }, {
            content: () => h('div', 'Conteúdo')
        }));

        await nextTick();
        await waitForLayout();

        const modalEl = document.querySelector('.max-modal') as HTMLElement;
        expect(modalEl).not.toBeNull();
        expect(modalEl.getBoundingClientRect().width).toBeGreaterThanOrEqual(minTarget - 2);
    });

    it('MaxModal: remoção reativa de minWidth devolve o modal ao dimensionamento padrão', async () => {
        const minTarget = Math.min(340, Math.max(260, window.innerWidth - 60));
        const modalMin = ref<string | number | undefined>(minTarget);

        mountTestApp(() => h(MaxModal, {
            visible: true,
            noButton: true,
            minWidth: modalMin.value,
            title: 'Modal Reativo'
        }, {
            content: () => h('div', 'Texto curto')
        }));

        await nextTick();
        await waitForLayout();

        const modalEl = document.querySelector('.max-modal') as HTMLElement;
        expect(modalEl.getBoundingClientRect().width).toBeGreaterThanOrEqual(minTarget - 2);

        modalMin.value = undefined;
        await nextTick();
        await waitForLayout();

        const style = modalEl.getAttribute('style') ?? '';
        expect(style).not.toMatch(/min-width:/);
    });

    it('MaxDrawer: conteúdo longo e rolável preserva a largura do painel sem distorções', async () => {
        const sampleWidth = Math.min(280, Math.floor(window.innerWidth * 0.7));

        mountTestApp(() => h(MaxDrawer, {
            visible: true,
            position: 'left',
            width: sampleWidth,
            header: 'Gaveta com Scroll'
        }, {
            default: () => h('div', {
                style: { height: '2000px', display: 'flex', flexDirection: 'column', gap: '20px' }
            }, Array.from({ length: 30 }, (_, i) => h('p', `Linha de teste ${i + 1}`)))
        }));

        await nextTick();
        await waitForLayout();

        const drawerEl = document.querySelector('.max-drawer') as HTMLElement;
        expect(drawerEl).not.toBeNull();
        expect(Math.abs(drawerEl.getBoundingClientRect().width - sampleWidth)).toBeLessThanOrEqual(1.5);

        const contentEl = document.querySelector('.max-drawer-content') as HTMLElement;
        expect(contentEl).not.toBeNull();
        expect(contentEl.scrollHeight).toBeGreaterThan(contentEl.clientHeight);
    });
});
