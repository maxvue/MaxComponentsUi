import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createPinia } from 'pinia';
import MaxDrawer from '../../src/components/MaxDrawer.vue';
import MaxModal from '../../src/components/MaxModal.vue';
import MaxPdfView from '../../src/components/MaxPdfView.vue';
import MaxPopoverConfirm from '../../src/components/MaxPopoverConfirm.vue';
import MaxIcon from '../../src/components/MaxIcon.vue';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';
import Tooltip from '../../src/directives/tooltip';

describe('Overlays - Hidratação no Cliente', () => {
    let container: HTMLDivElement;
    let warnSpy: any;
    let cleanups: (() => void)[] = [];

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        warnSpy = vi.spyOn(console, 'warn');
        cleanups = [];
    });

    afterEach(() => {
        while (cleanups.length > 0) try {
            cleanups.pop()!();
        } catch {
            // no-op
        }

        delete (document.body as any)._lpa;
        if (container.parentNode) container.parentNode.removeChild(container);

        warnSpy.mockRestore();
    });

    const hydrateComponent = async (
        Component: any,
        props: any,
        configure?: (pinia: any, app: any) => void
    ) => {
        const pinia = createPinia();
        const ssrApp = createSSRApp(Component, props);
        ssrApp.use(pinia);
        ssrApp.directive('tooltip', Tooltip);
        ssrApp.component('MaxIcon', MaxIcon);
        configure?.(pinia, ssrApp);

        const ctx: any = {};
        const ssrHtml = await renderToString(ssrApp, ctx);
        container.innerHTML = ssrHtml;

        const teleportNodes: Node[] = [];
        if (ctx.teleports?.body) {
            const temp = document.createElement('div');
            temp.innerHTML = ctx.teleports.body;
            let startAnchor: Node | null = null;
            while (temp.firstChild) {
                const node = temp.firstChild;
                if (node.nodeType === 8 && (node as Comment).data === 'teleport start anchor') startAnchor = node;

                document.body.appendChild(node);
                teleportNodes.push(node);
            }
            if (startAnchor) (document.body as any)._lpa = startAnchor;

        }

        const clientApp = createSSRApp(Component, props);
        clientApp.use(pinia);
        clientApp.directive('tooltip', Tooltip);
        clientApp.component('MaxIcon', MaxIcon);
        configure?.(pinia, clientApp);
        const vm = clientApp.mount(container);

        const cleanup = () => {
            clientApp.unmount();
            delete (document.body as any)._lpa;
            for (const node of teleportNodes) if (node.parentNode) node.parentNode.removeChild(node);

        };

        cleanups.push(cleanup);

        return {
            clientApp,
            vm,
            cleanup
        };
    };

    it('hidrata MaxDrawer aberto sem warnings de mismatch e ativa listener/scroll lock', async () => {
        const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

        const { cleanup } = await hydrateComponent(MaxDrawer, {
            visible: true,
            header: 'Gaveta Hidratação',
            blockScroll: true
        });

        const mismatchWarnings = warnSpy.mock.calls.filter((c: any[]) =>
            typeof c[0] === 'string' && c[0].toLowerCase().includes('hydration')
        );
        expect(mismatchWarnings).toHaveLength(0);

        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), expect.any(Object));

        cleanup();
        addEventListenerSpy.mockRestore();
    });

    it('hidrata MaxDrawer fechado sem registrar listeners nem bloquear scroll', async () => {
        const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

        const { cleanup } = await hydrateComponent(MaxDrawer, {
            visible: false,
            blockScroll: true
        });

        expect(addEventListenerSpy).not.toHaveBeenCalled();

        cleanup();
        addEventListenerSpy.mockRestore();
    });

    it('hidrata MaxModal fechado e aberto com simetria de lifecycle', async () => {
        const { cleanup: cleanupClosed } = await hydrateComponent(MaxModal, { visible: false });

        const closedWarnings = warnSpy.mock.calls.filter((c: any[]) =>
            typeof c[0] === 'string' && c[0].toLowerCase().includes('hydration')
        );
        expect(closedWarnings).toHaveLength(0);
        cleanupClosed();

        const { cleanup: cleanupOpen } = await hydrateComponent(MaxModal, { visible: true, title: 'Modal Aberto' });
        const openWarnings = warnSpy.mock.calls.filter((c: any[]) =>
            typeof c[0] === 'string' && c[0].toLowerCase().includes('hydration')
        );
        expect(openWarnings).toHaveLength(0);
        cleanupOpen();
    });

    it('hidrata MaxPdfView fechado e aberto no cliente de forma segura', async () => {
        const { cleanup: cleanupClosed } = await hydrateComponent(MaxPdfView, { file: '' });

        const closedWarnings = warnSpy.mock.calls.filter((c: any[]) =>
            typeof c[0] === 'string' && c[0].toLowerCase().includes('hydration')
        );
        expect(closedWarnings).toHaveLength(0);
        cleanupClosed();

        const { cleanup: cleanupOpen } = await hydrateComponent(MaxPdfView, { file: 'https://example.com/doc.pdf' });
        const openWarnings = warnSpy.mock.calls.filter((c: any[]) =>
            typeof c[0] === 'string' && c[0].toLowerCase().includes('hydration')
        );
        expect(openWarnings).toHaveLength(0);
        cleanupOpen();
    });

    it('hidrata MaxPopoverConfirm mantendo estado do confirmStore', async () => {
        const { cleanup } = await hydrateComponent(
            MaxPopoverConfirm,
            {},
            (pinia) => {
                const store = useConfirmStore(pinia);
                store.show = false;
            }
        );

        const mismatchWarnings = warnSpy.mock.calls.filter((c: any[]) =>
            typeof c[0] === 'string' && c[0].toLowerCase().includes('hydration')
        );
        expect(mismatchWarnings).toHaveLength(0);

        cleanup();
    });
});
