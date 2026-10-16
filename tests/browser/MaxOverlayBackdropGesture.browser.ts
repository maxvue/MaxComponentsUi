import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, ref, type App } from 'vue';
import { createPinia } from 'pinia';
import { commands } from 'vitest/browser';
import MaxModal from '../../src/components/MaxModal.vue';
import MaxDrawer from '../../src/components/MaxDrawer.vue';
import MaxInputText from '../../src/components/MaxInputText.vue';

declare module 'vitest/browser' {
    export const commands: BrowserCommands;
    interface BrowserCommands {
        dragOverlaySelection: (options: {
            fromSelector: string;
            toSelector: string;
            steps?: number;
            reverse?: boolean;
            toSide?: 'left' | 'right';
        }) => Promise<void>;
        clickOverlayDirect: (options: {
            selector: string;
            offsetX?: number;
            offsetY?: number;
            side?: 'left' | 'right';
        }) => Promise<void>;
    }
}

declare module 'vitest/internal/browser' {
    interface BrowserCommands {
        dragOverlaySelection: (options: {
            fromSelector: string;
            toSelector: string;
            steps?: number;
            reverse?: boolean;
            toSide?: 'left' | 'right';
        }) => Promise<void>;
        clickOverlayDirect: (options: {
            selector: string;
            offsetX?: number;
            offsetY?: number;
            side?: 'left' | 'right';
        }) => Promise<void>;
    }
}

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function waitForNextTick(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));
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

describe('Proteção contra fechamento por arraste no Chromium real', () => {
    it('MaxModal: seleção com mouse real arrastando até a máscara mantém o modal aberto e com seleção ativa', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-modal-host';
        document.body.appendChild(hostElement);

        const isModalOpen = ref(true);
        const inputValue = ref('Texto longo para seleção física com mouse real e soltura na máscara');
        const beforeCloseReasons: string[] = [];

        activeApp = createApp({
            setup() {
                return () => h(MaxModal, {
                    id: 'modal-gesture-test',
                    title: 'Modal de Teste de Arraste',
                    noButton: true,
                    visible: isModalOpen.value,
                    'onUpdate:visible': (v: boolean) => {
                        isModalOpen.value = v;
                    },
                    'onBefore-close': (event: any) => {
                        beforeCloseReasons.push(event.reason);
                    }
                }, {
                    default: () => h('div', { class: 'modal-body-container', style: { padding: '16px' } }, [
                        h(MaxInputText, {
                            id: 'input-modal-test',
                            modelValue: inputValue.value,
                            'onUpdate:modelValue': (v: unknown) => {
                                inputValue.value = String(v ?? '');
                            }
                        })
                    ])
                });
            }
        });

        activeApp.directive('tooltip', {});
        activeApp.use(createPinia());
        activeApp.mount(hostElement);
        await waitForNextTick();

        const backdropEl = document.querySelector('.background-modal');
        const inputNative = document.querySelector<HTMLInputElement>('.max-input-native');
        expect(backdropEl).not.toBeNull();
        expect(inputNative).not.toBeNull();

        // 1. Executa arraste físico: inicia no input nativo e solta na máscara
        await commands.dragOverlaySelection({
            fromSelector: '.max-input-native',
            toSelector: '.background-modal',
            steps: 15
        });
        await waitForNextTick();

        // Modal deve continuar aberto, sem acionar beforeClose
        expect(isModalOpen.value).toBe(true);
        expect(document.querySelector('.background-modal')).not.toBeNull();
        expect(beforeCloseReasons.length).toBe(0);

        // A seleção física deve estar presente no input
        const selStart = inputNative?.selectionStart ?? 0;
        const selEnd = inputNative?.selectionEnd ?? 0;
        expect(selEnd).toBeGreaterThan(selStart);
        expect(inputNative?.value).toBe('Texto longo para seleção física com mouse real e soltura na máscara');

        // 2. Arraste reverso: inicia na máscara e solta no conteúdo
        await commands.dragOverlaySelection({
            fromSelector: '.max-input-native',
            toSelector: '.background-modal',
            reverse: true,
            steps: 15
        });
        await waitForNextTick();

        expect(isModalOpen.value).toBe(true);
        expect(document.querySelector('.background-modal')).not.toBeNull();
        expect(beforeCloseReasons.length).toBe(0);

        // 3. Clique físico direto na máscara: deve fechar com sucesso
        await commands.clickOverlayDirect({
            selector: '.background-modal',
            offsetX: 20,
            offsetY: 20
        });
        await waitForNextTick();

        expect(isModalOpen.value).toBe(false);
        expect(beforeCloseReasons).toContain('backdrop');
    });

    it('MaxModal com veto em beforeClose: clique direto aciona hook com reason backdrop e permanece aberto', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-modal-veto-host';
        document.body.appendChild(hostElement);

        const isModalOpen = ref(true);
        const hookCalls: string[] = [];

        activeApp = createApp({
            setup() {
                return () => h(MaxModal, {
                    id: 'modal-veto-test',
                    title: 'Modal com Veto',
                    noButton: true,
                    visible: isModalOpen.value,
                    'onUpdate:visible': (v: boolean) => {
                        isModalOpen.value = v;
                    },
                    beforeClose: (event: any) => {
                        hookCalls.push(event.reason);
                        event.preventDefault();
                    }
                }, {
                    default: () => h('div', [
                        h(MaxInputText, {
                            id: 'input-veto-test',
                            modelValue: 'Teste de veto'
                        })
                    ])
                });
            }
        });

        activeApp.directive('tooltip', {});
        activeApp.use(createPinia());
        activeApp.mount(hostElement);
        await waitForNextTick();

        // Arraste não deve acionar o hook
        await commands.dragOverlaySelection({
            fromSelector: '.max-input-native',
            toSelector: '.background-modal'
        });
        await waitForNextTick();
        expect(hookCalls.length).toBe(0);
        expect(isModalOpen.value).toBe(true);

        // Clique direto deve acionar o hook com 'backdrop'
        await commands.clickOverlayDirect({
            selector: '.background-modal',
            offsetX: 20,
            offsetY: 20
        });
        await waitForNextTick();

        expect(hookCalls).toEqual(['backdrop']);
        // Permanece aberto devido ao veto preventDefault
        expect(isModalOpen.value).toBe(true);
    });

    it('MaxDrawer: seleção com mouse real arrastando até a máscara mantém drawer aberto e clique direto fecha', async () => {
        hostElement = document.createElement('div');
        hostElement.id = 'browser-test-drawer-host';
        document.body.appendChild(hostElement);

        const isDrawerOpen = ref(true);
        const drawerInputValue = ref('Texto longo dentro da gaveta para validar seleção física no browser');

        activeApp = createApp({
            setup() {
                return () => h(MaxDrawer, {
                    visible: isDrawerOpen.value,
                    dismissable: true,
                    header: 'Gaveta de Teste',
                    'onUpdate:visible': (v: boolean) => {
                        isDrawerOpen.value = v;
                    }
                }, {
                    default: () => h('div', { class: 'drawer-inner-content', style: { padding: '20px' } }, [
                        h(MaxInputText, {
                            id: 'input-drawer-test',
                            modelValue: drawerInputValue.value,
                            'onUpdate:modelValue': (v: unknown) => {
                                drawerInputValue.value = String(v ?? '');
                            }
                        })
                    ])
                });
            }
        });

        activeApp.directive('tooltip', {});
        activeApp.use(createPinia());
        activeApp.mount(hostElement);
        await waitForNextTick();

        const maskEl = document.querySelector('.max-drawer-mask');
        const inputNative = document.querySelector<HTMLInputElement>('.max-input-native');
        expect(maskEl).not.toBeNull();
        expect(inputNative).not.toBeNull();

        // 1. Arraste físico do input para a máscara livre à direita
        await commands.dragOverlaySelection({
            fromSelector: '.max-input-native',
            toSelector: '.max-drawer-mask',
            toSide: 'right',
            steps: 15
        });
        await waitForNextTick();

        // Gaveta deve permanecer aberta
        expect(isDrawerOpen.value).toBe(true);
        expect(document.querySelector('.max-drawer-mask')).not.toBeNull();

        // Seleção física foi criada
        const selStart = inputNative?.selectionStart ?? 0;
        const selEnd = inputNative?.selectionEnd ?? 0;
        expect(selEnd).toBeGreaterThan(selStart);

        // 2. Arraste reverso: da máscara livre à direita para o input
        await commands.dragOverlaySelection({
            fromSelector: '.max-input-native',
            toSelector: '.max-drawer-mask',
            toSide: 'right',
            reverse: true,
            steps: 15
        });
        await waitForNextTick();
        expect(isDrawerOpen.value).toBe(true);

        // 3. Clique direto na máscara livre à direita: deve fechar a gaveta
        await commands.clickOverlayDirect({
            selector: '.max-drawer-mask',
            side: 'right'
        });
        await waitForNextTick();

        expect(isDrawerOpen.value).toBe(false);
    });
});
