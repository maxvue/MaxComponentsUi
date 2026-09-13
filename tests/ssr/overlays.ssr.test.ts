// @vitest-environment node
import { describe, it, expect } from 'vitest';
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

describe('Overlays SSR - Renderização Server-side pura (Node.js)', () => {
    it('ambiente de teste é Node puro sem globals de navegador', () => {
        expect(typeof window).toBe('undefined');
        expect(typeof document).toBe('undefined');
    });

    describe('MaxDrawer', () => {
        it('renderiza fechado em SSR sem lançar exceção', async () => {
            const app = createSSRApp(MaxDrawer, { visible: false });
            app.use(createPinia());
            app.directive('tooltip', Tooltip);
            const html = await renderToString(app);
            expect(typeof html).toBe('string');
        });

        it('renderiza aberto em SSR sem lançar exceção e inclui conteúdo no contexto', async () => {
            const app = createSSRApp(MaxDrawer, { visible: true, header: 'Gaveta SSR' });
            app.use(createPinia());
            app.directive('tooltip', Tooltip);
            const ctx: any = {};
            const html = await renderToString(app, ctx);
            const totalHtml = html + (ctx.teleports?.body ?? '');
            expect(totalHtml).toContain('Gaveta SSR');
        });
    });

    describe('MaxModal', () => {
        it('renderiza fechado em SSR sem lançar exceção', async () => {
            const app = createSSRApp(MaxModal, { visible: false });
            app.use(createPinia());
            app.directive('tooltip', Tooltip);
            app.component('MaxIcon', MaxIcon);
            const html = await renderToString(app);
            expect(typeof html).toBe('string');
        });

        it('renderiza aberto em SSR sem lançar exceção', async () => {
            const app = createSSRApp(MaxModal, { visible: true, title: 'Modal SSR' });
            app.use(createPinia());
            app.directive('tooltip', Tooltip);
            app.component('MaxIcon', MaxIcon);
            const ctx: any = {};
            const html = await renderToString(app, ctx);
            const totalHtml = html + (ctx.teleports?.body ?? '');
            expect(typeof totalHtml).toBe('string');
        });
    });

    describe('MaxPdfView', () => {
        it('renderiza fechado em SSR sem lançar exceção', async () => {
            const app = createSSRApp(MaxPdfView, { file: '' });
            app.use(createPinia());
            app.directive('tooltip', Tooltip);
            const html = await renderToString(app);
            expect(typeof html).toBe('string');
        });

        it('renderiza aberto em SSR sem lançar exceção nem carregar runtime DOM', async () => {
            const app = createSSRApp(MaxPdfView, { file: 'https://example.com/doc.pdf' });
            app.use(createPinia());
            app.directive('tooltip', Tooltip);
            const html = await renderToString(app);
            expect(typeof html).toBe('string');
        });
    });

    describe('MaxPopoverConfirm', () => {
        it('renderiza fechado em SSR sem lançar exceção', async () => {
            const pinia = createPinia();
            const app = createSSRApp(MaxPopoverConfirm);
            app.use(pinia);
            app.directive('tooltip', Tooltip);
            const store = useConfirmStore(pinia);
            store.show = false;

            const html = await renderToString(app);
            expect(typeof html).toBe('string');
        });

        it('renderiza aberto em SSR sem lançar exceção', async () => {
            const pinia = createPinia();
            const app = createSSRApp(MaxPopoverConfirm);
            app.use(pinia);
            app.directive('tooltip', Tooltip);
            const store = useConfirmStore(pinia);
            store.show = true;
            store.message = 'Confirmar exclusão SSR?';

            const ctx: any = {};
            const html = await renderToString(app, ctx);
            const totalHtml = html + (ctx.teleports?.body ?? '');
            expect(totalHtml).toContain('Confirmar exclusão SSR?');
        });
    });
});
