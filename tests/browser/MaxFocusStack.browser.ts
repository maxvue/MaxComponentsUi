import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, ref, type App, defineComponent } from 'vue';
import { createPinia } from 'pinia';
import { useFocusTrap, getActiveFocusTrapsCount, clearFocusTrapStack } from '../../src/helpers/useFocusTrap';
import MaxPopover from '../../src/components/MaxPopover.vue';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';
import MaxInputMarkdown from '../../src/components/MaxInputMarkdown.vue';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function pressKey(key: string, options: { shiftKey?: boolean } = {}) {
    const target = document.activeElement || document.body;
    const event = new KeyboardEvent('keydown', {
        key,
        code: key === ' ' ? 'Space' : key,
        bubbles: true,
        cancelable: true,
        shiftKey: options.shiftKey ?? false
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
    clearFocusTrapStack();
    document.body.innerHTML = '';
});

describe('Encadeamento de Foco e Escape em Overlays (Chromium Real)', () => {
    it('coordena IconPicker + lightbox Markdown + Popover reais: Tab, Escape, pointer externo e ausência de click-through', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-real-overlay-stack';
        document.body.appendChild(hostElement);

        const pinia = createPinia();
        const popoverRef = ref<any>(null);
        const iconPickerRef = ref<any>(null);
        const markdownRef = ref<any>(null);

        const RealOverlayStack = defineComponent({
            setup() {
                return () => h(MaxPopover, {
                    ref: popoverRef,
                    title: 'Popover real',
                    label: 'Abrir popover real',
                    ariaLabel: 'Popover real',
                    noHeader: true
                }, {
                    content: () => h('div', { class: 'real-overlay-stack-content' }, [
                        h('button', { id: 'popover-first-action' }, 'Primeira ação do Popover'),
                        h(MaxInputIconPicker, {
                            ref: iconPickerRef,
                            label: 'Ícone do teste',
                            listUrl: '/api/icons/picker'
                        }),
                        h(MaxInputMarkdown, {
                            ref: markdownRef,
                            modelValue: '![Imagem do teste](https://example.test/overlay.png)',
                            label: 'Markdown do teste',
                            hideTools: ['image', 'file']
                        }),
                        h('button', { id: 'popover-last-action' }, 'Última ação do Popover')
                    ])
                });
            }
        });

        activeApp = createApp({ render: () => h(RealOverlayStack) });
        activeApp.directive('tooltip', {});
        activeApp.use(pinia);
        activeApp.mount(hostElement);
        await nextFrame();
        await nextFrame();

        const popoverTrigger = document.querySelector<HTMLButtonElement>('.max-popover-icon')!;
        popoverTrigger.focus();
        pressKey('Enter');
        await nextFrame();
        await nextFrame();
        expect(document.querySelector('.max-popover-dialog')).toBeTruthy();
        expect(getActiveFocusTrapsCount()).toBe(1);
        expect(popoverRef.value).toBeTruthy();
        expect(iconPickerRef.value).toBeTruthy();
        expect(markdownRef.value).toBeTruthy();

        // A imagem é renderizada pelo editor Tiptap real. O browser runner não expõe
        // a API de ponteiro físico do ProseMirror, então acionamos a entrada pública
        // do mesmo componente que o `handleClick` chama (`openImage`), sem dublê.
        const markdownImage = document.querySelector<HTMLImageElement>('.max-input-markdown__prosemirror img')!;
        expect(markdownImage).toBeTruthy();
        markdownRef.value.openImage(markdownImage.src, markdownImage.alt);
        await nextFrame();
        await nextFrame();
        expect(document.querySelector('.max-image-preview-modal')).toBeTruthy();
        expect(getActiveFocusTrapsCount()).toBe(2);

        // A abertura é disparada pelo trigger público real. O click é deliberadamente
        // direcionado ao trigger sob o lightbox para construir a pilha de três componentes
        // reais sem introduzir uma camada de teste sintética.
        const iconTrigger = document.querySelector<HTMLElement>('.icon-picker-trigger')!;
        iconTrigger.click();
        await nextFrame();
        await nextFrame();
        expect(document.querySelector('.max-icon-picker-drawer')).toBeTruthy();
        expect(getActiveFocusTrapsCount()).toBe(3);

        const iconSearch = document.querySelector<HTMLInputElement>('.picker-search-input')!;
        expect(document.activeElement).toBe(iconSearch);
        pressKey('Tab');
        expect(document.activeElement).toBe(document.querySelector('.max-icon-picker-close-button'));
        pressKey('Tab', { shiftKey: true });
        expect(document.activeElement).toBe(iconSearch);

        // Pointer externo ao drawer atinge apenas o backdrop do topo. Não pode vazar
        // para o lightbox Markdown nem para o Popover abaixo (click-through).
        const iconBackdrop = document.querySelector<HTMLElement>('.max-icon-picker-drawer-backdrop')!;
        iconBackdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        iconBackdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await nextFrame();
        await nextFrame();
        expect(document.querySelector('.max-icon-picker-drawer')).toBeNull();
        expect(document.querySelector('.max-image-preview-modal')).toBeTruthy();
        expect(document.querySelector('.max-popover-dialog')).toBeTruthy();
        expect(getActiveFocusTrapsCount()).toBe(2);

        // Reabre o topo real e fecha exatamente uma camada real por Escape.
        iconTrigger.click();
        await nextFrame();
        await nextFrame();
        expect(getActiveFocusTrapsCount()).toBe(3);
        pressKey('Escape');
        await nextFrame();
        await nextFrame();
        expect(document.querySelector('.max-icon-picker-drawer')).toBeNull();
        expect(document.querySelector('.max-image-preview-modal')).toBeTruthy();
        expect(getActiveFocusTrapsCount()).toBe(2);

        pressKey('Escape');
        await nextFrame();
        await nextFrame();
        // A transição de saída mantém o nó por alguns frames; o estado público e
        // a pilha são a evidência determinística de fechamento no Chromium.
        expect(markdownRef.value.isImageModalOpen).toBe(false);
        expect(document.querySelector('.max-popover-dialog')).toBeTruthy();
        expect(getActiveFocusTrapsCount()).toBe(1);

        pressKey('Escape');
        await nextFrame();
        await nextFrame();
        expect(document.querySelector('.max-popover-dialog')).toBeNull();
        expect(getActiveFocusTrapsCount()).toBe(0);
        expect(document.activeElement).toBe(popoverTrigger);

    });

    it('executa cadeia completa A -> B -> A -> gatilho inicial com Tab, Shift+Tab e Escape no Chromium real', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-host';
        document.body.appendChild(hostElement);

        const pinia = createPinia();

        const isBOpen = ref(false);
        const bContainerRef = ref<HTMLElement | null>(null);
        const trapB = useFocusTrap(bContainerRef, {
            onEscape: () => {
                isBOpen.value = false;
                trapB.deactivate();
            }
        });

        const openB = () => {
            isBOpen.value = true;
            trapB.activate();
        };

        const TestNestedOverlays = defineComponent({
            setup() {
                return () => h('div', { class: 'test-page-container', style: { padding: '20px' } }, [
                    h(MaxPopover, { title: 'Camada A', ariaLabel: 'Camada A', label: 'Abrir Camada A' }, {
                        content: () => h('div', { class: 'layer-a-content', style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
                            h('button', { id: 'btn-a1' }, 'Botão A1'),
                            h('button', { id: 'btn-open-b', onClick: openB }, 'Abrir Camada B'),
                            h('button', { id: 'btn-a2' }, 'Botão A2')
                        ])
                    }),
                    isBOpen.value ? h('div', {
                        ref: bContainerRef,
                        id: 'layer-b-dialog',
                        role: 'dialog',
                        'aria-label': 'Camada B',
                        tabindex: -1,
                        style: {
                            position: 'fixed',
                            top: '100px',
                            left: '100px',
                            padding: '16px',
                            background: 'white',
                            border: '1px solid black',
                            zIndex: 9999
                        }
                    }, [
                        h('h3', 'Camada B'),
                        h('button', { id: 'btn-b1' }, 'Botão B1'),
                        h('button', { id: 'btn-b2' }, 'Botão B2')
                    ]) : null
                ]);
            }
        });

        const app = createApp({
            render() {
                return h(TestNestedOverlays);
            }
        });

        app.directive('tooltip', {});
        app.use(pinia);
        activeApp = app;
        app.mount(hostElement);

        await nextFrame();
        await nextFrame();

        const triggerA = document.querySelector<HTMLButtonElement>('.max-popover-icon')!;
        expect(triggerA).toBeTruthy();

        // 1. Foco no gatilho inicial e abertura da Camada A via tecla Enter
        triggerA.focus();
        expect(document.activeElement).toBe(triggerA);

        pressKey('Enter');
        await nextFrame();
        await nextFrame();

        // Camada A aberta: o foco deve estar retido nela e trap de A ativo
        const dialogA = document.querySelector('.max-popover-dialog');
        expect(dialogA).toBeTruthy();
        expect(getActiveFocusTrapsCount()).toBe(1);

        // Foca no botão que abre a Camada B
        const btnOpenB = document.querySelector<HTMLButtonElement>('#btn-open-b')!;
        expect(btnOpenB).toBeTruthy();
        btnOpenB.focus();
        expect(document.activeElement?.id).toBe('btn-open-b');

        // 2. Abre a Camada B via clique no botão dentro de A
        btnOpenB.click();
        await nextFrame();
        await nextFrame();

        const dialogB = document.querySelector<HTMLElement>('#layer-b-dialog');
        expect(dialogB).toBeTruthy();
        expect(getActiveFocusTrapsCount()).toBe(2);

        // Foco inicial deve estar em B (no primeiro item focável b1)
        expect(document.activeElement?.id).toBe('btn-b1');

        // 3. Tab e Shift+Tab confinam o foco ciclicamente dentro de B
        pressKey('Tab');
        expect(document.activeElement?.id).toBe('btn-b2');

        pressKey('Tab');
        expect(document.activeElement?.id).toBe('btn-b1');

        pressKey('Tab', { shiftKey: true });
        expect(document.activeElement?.id).toBe('btn-b2');

        // 4. Tecla Escape: fecha APENAS a Camada B (topo da pilha)
        pressKey('Escape');
        await nextFrame();
        await nextFrame();

        // Camada B foi fechada, trap de B desativado
        expect(document.querySelector('#layer-b-dialog')).toBeNull();
        expect(getActiveFocusTrapsCount()).toBe(1);

        // O foco DEVE ter retornado precisamente para o botão em A que abriu B!
        expect(document.activeElement?.id).toBe('btn-open-b');

        // 5. Tecla Escape novamente: fecha a Camada A
        pressKey('Escape');
        await nextFrame();
        await nextFrame();

        expect(getActiveFocusTrapsCount()).toBe(0);

        // O foco DEVE ter retornado precisamente para o gatilho inicial de A
        expect(document.activeElement).toBe(triggerA);
    });

    it('unmount de camada intermediária preserva a integridade do foco e limpa todos os listeners', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-host-2';
        document.body.appendChild(hostElement);

        const isAVisible = ref(true);
        const isBVisible = ref(false);

        const aContainerRef = ref<HTMLElement | null>(null);
        const bContainerRef = ref<HTMLElement | null>(null);

        const trapA = useFocusTrap(aContainerRef);
        const trapB = useFocusTrap(bContainerRef);

        const TestUnmountComponent = defineComponent({
            setup() {
                return () => h('div', [
                    h('button', { id: 'root-btn' }, 'Root Trigger'),
                    isAVisible.value ? h('div', { ref: aContainerRef, id: 'container-a' }, [
                        h('button', { id: 'btn-a' }, 'Botão A')
                    ]) : null,
                    isBVisible.value ? h('div', { ref: bContainerRef, id: 'container-b' }, [
                        h('button', { id: 'btn-b' }, 'Botão B')
                    ]) : null
                ]);
            }
        });

        const app = createApp({
            render() {
                return h(TestUnmountComponent);
            }
        });

        activeApp = app;
        app.mount(hostElement);

        await nextFrame();
        await nextFrame();

        const rootBtn = document.querySelector<HTMLButtonElement>('#root-btn')!;
        expect(rootBtn).toBeTruthy();
        rootBtn.focus();
        expect(document.activeElement?.id).toBe('root-btn');

        // Ativa trap A
        trapA.activate();
        await nextFrame();
        expect(document.activeElement?.id).toBe('btn-a');
        expect(getActiveFocusTrapsCount()).toBe(1);

        // Abre B
        isBVisible.value = true;
        await nextFrame();
        trapB.activate();
        await nextFrame();
        expect(document.activeElement?.id).toBe('btn-b');
        expect(getActiveFocusTrapsCount()).toBe(2);

        // Desmonta A enquanto B ainda está aberto
        isAVisible.value = false;
        trapA.deactivate();
        await nextFrame();

        // O foco NÃO pode ser roubado de B!
        expect(document.activeElement?.id).toBe('btn-b');
        expect(getActiveFocusTrapsCount()).toBe(1);

        // Quando B for desativado, o foco é restaurado com segurança para o rootBtn (herança de previous)
        trapB.deactivate();
        isBVisible.value = false;
        await nextFrame();

        expect(document.activeElement?.id).toBe('root-btn');
        expect(getActiveFocusTrapsCount()).toBe(0);
    });
});
