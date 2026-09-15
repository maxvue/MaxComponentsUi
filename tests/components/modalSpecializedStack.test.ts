import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick, ref, defineComponent } from 'vue';
import MaxModal from '../../src/components/MaxModal.vue';
import MaxImage from '../../src/components/MaxImage.vue';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';
import MaxInputMarkdown from '../../src/components/MaxInputMarkdown.vue';
import MaxTopMenuSearchBar from '../../src/components/MaxTopMenuSearchBar.vue';
import { useModalStore } from '../../src/stores/useModal.Store';
import { getActiveLockCount, forceReset } from '../../src/helpers/useScrollLock';

const mockEditor = {
    commands: {
        setContent: vi.fn(),
        focus: vi.fn()
    },
    getHTML: vi.fn(() => '<p>Hello</p>'),
    getText: vi.fn(() => 'Hello'),
    destroy: vi.fn(),
    setEditable: vi.fn(),
    isActive: vi.fn(() => false),
    getAttributes: vi.fn(() => ({})),
    on: vi.fn(),
    off: vi.fn()
};

vi.mock('@tiptap/vue-3', () => ({
    useEditor: vi.fn(() => ({ value: mockEditor })),
    EditorContent: {
        name: 'EditorContent',
        template: '<div class="editor-content-stub"></div>',
        props: ['editor']
    }
}));

vi.mock('tiptap-markdown', () => ({
    Markdown: { configure: vi.fn(() => ({})) }
}));

vi.mock('@tiptap/starter-kit', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-image', () => ({ default: {} }));
vi.mock('@tiptap/extension-table', () => {
    const Table = { configure: vi.fn(() => ({})) };
    return { Table, default: Table };
});
vi.mock('@tiptap/extension-table-row', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-header', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-cell', () => ({ default: {} }));

const stubs = {
    MaxButton: {
        template: '<button class="max-button" v-bind="$attrs"><slot /></button>',
        props: ['icon', 'i', 'label', 'size', 'action']
    },
    MaxIconButton: {
        template: '<button class="icon-button" v-bind="$attrs"><slot /></button>',
        props: ['icon', 'i', 'size']
    },
    MaxTitle1: {
        template: '<div class="title" v-bind="$attrs"><slot /></div>',
        props: ['h1', 'h2', 'title', 'subtitle', 'subTitle']
    },
    MaxGrid: {
        template: '<div class="grid" v-bind="$attrs"><slot /></div>',
        props: ['label']
    },
    Teleport: true
};

describe('modalSpecializedStack (R07 — F09 / E04-04)', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        forceReset();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        forceReset();
        document.body.innerHTML = '';
    });

    describe('Balanceamento de stack e scroll lock com componentes especializados reais', () => {
        it('balanceia scroll lock e stack quando MaxImage abre sobre MaxModal', async () => {
            const modalStore = useModalStore();

            // 1. MaxModal abre via open()
            const modalWrapper = mount(MaxModal, {
                props: {
                    id: 'base-modal'
                },
                global: {
                    plugins: [pinia],
                    stubs
                },
                attachTo: document.body
            });

            modalWrapper.vm.open();
            await nextTick();
            expect(modalStore.stack).toContain('base-modal');
            expect(modalStore.isTop('base-modal')).toBe(true);
            expect(getActiveLockCount()).toBe(1);

            // 2. MaxImage abre
            const imageWrapper = mount(MaxImage, {
                props: {
                    src: 'https://example.com/photo.jpg',
                    preview: true
                },
                global: {
                    plugins: [pinia],
                    stubs
                },
                attachTo: document.body
            });

            await imageWrapper.vm.openPreview();
            await nextTick();

            // Agora a stack tem 2 modais
            expect(modalStore.stack.length).toBe(2);
            const imageModalId = modalStore.top;
            expect(imageModalId).toBeTruthy();
            expect(imageModalId).not.toBe('base-modal');
            expect(modalStore.isTop(imageModalId!)).toBe(true);
            expect(modalStore.isTop('base-modal')).toBe(false);
            expect(getActiveLockCount()).toBe(2);

            // O modal inferior (MaxModal) deve se tornar inerte / oculto para leitores
            const modalDialog = modalWrapper.find('.max-modal');
            expect(modalDialog.attributes('aria-hidden')).toBe('true');
            expect(modalDialog.attributes('inert')).toBeDefined();

            // 3. Pressionar Escape fecha apenas o topo (MaxImage)
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
            window.dispatchEvent(escapeEvent);
            await nextTick();

            // MaxImage fechou, MaxModal retomou posse e é topo
            expect(imageWrapper.vm.isOpen).toBe(false);
            expect(modalStore.stack.length).toBe(1);
            expect(modalStore.isTop('base-modal')).toBe(true);
            expect(getActiveLockCount()).toBe(1);
            expect(modalDialog.attributes('aria-hidden')).toBeUndefined();
            expect(modalDialog.attributes('aria-modal')).toBe('true');

            // 4. Fechar MaxModal esvazia stack e zera scroll lock
            modalWrapper.vm.close();
            await nextTick();
            expect(modalStore.stack.length).toBe(0);
            expect(getActiveLockCount()).toBe(0);

            modalWrapper.unmount();
            imageWrapper.unmount();
        });

        it('balanceia stack e locks com MaxInputIconPicker', async () => {
            const modalStore = useModalStore();

            const pickerWrapper = mount(MaxInputIconPicker, {
                props: {
                    modelValue: 'material-symbols:home'
                },
                global: {
                    plugins: [pinia],
                    stubs: {
                        Teleport: true,
                        InputBase: true,
                        MaxIcon: true,
                        MaxIconButton: true
                    }
                },
                attachTo: document.body
            });

            await pickerWrapper.vm.openDrawer();
            await nextTick();

            expect(modalStore.stack.length).toBe(1);
            const pickerId = modalStore.top!;
            expect(modalStore.isTop(pickerId)).toBe(true);
            expect(getActiveLockCount()).toBe(1);

            // Fecha dialog
            pickerWrapper.vm.closeDrawer();
            await nextTick();

            expect(modalStore.stack.length).toBe(0);
            expect(getActiveLockCount()).toBe(0);

            pickerWrapper.unmount();
        });

        it('balanceia stack e locks com MaxInputMarkdown lightbox', async () => {
            const modalStore = useModalStore();

            const markdownWrapper = mount(MaxInputMarkdown, {
                props: {
                    modelValue: 'Hello world'
                },
                global: {
                    plugins: [pinia],
                    stubs: {
                        Teleport: true,
                        InputBase: true,
                        MaxIcon: true,
                        MaxInputMarkdownToolbar: true,
                        MaxPdfView: true,
                        EditorContent: true
                    }
                },
                attachTo: document.body
            });

            await markdownWrapper.vm.openImage('https://example.com/test.png');
            await nextTick();

            expect(markdownWrapper.vm.isImageModalOpen).toBe(true);
            expect(modalStore.stack.length).toBe(1);
            const lightboxId = modalStore.top!;
            expect(modalStore.isTop(lightboxId)).toBe(true);
            expect(getActiveLockCount()).toBe(1);

            // Fecha lightbox
            markdownWrapper.vm.closeImage();
            await nextTick();

            expect(markdownWrapper.vm.isImageModalOpen).toBe(false);
            expect(modalStore.stack.length).toBe(0);
            expect(getActiveLockCount()).toBe(0);

            markdownWrapper.unmount();
        });

        it('balanceia stack e locks com MaxTopMenuSearchBar painel mobile', async () => {
            const modalStore = useModalStore();

            const searchWrapper = mount(MaxTopMenuSearchBar, {
                props: {
                    screen: 'mobile'
                },
                global: {
                    plugins: [pinia],
                    stubs: {
                        Teleport: true,
                        MaxInputText: true,
                        MaxIconButton: true
                    }
                },
                attachTo: document.body
            });

            // Abre mobile search
            searchWrapper.vm.openSearch();
            await nextTick();

            expect(searchWrapper.vm.is_open).toBe(true);
            expect(modalStore.stack.length).toBe(1);
            const searchModalId = modalStore.top!;
            expect(modalStore.isTop(searchModalId)).toBe(true);
            expect(getActiveLockCount()).toBe(1);

            // Escape fecha o painel mobile
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
            document.dispatchEvent(escapeEvent);
            await nextTick();

            expect(searchWrapper.vm.is_open).toBe(false);
            expect(modalStore.stack.length).toBe(0);
            expect(getActiveLockCount()).toBe(0);

            searchWrapper.unmount();
        });

        it('limpa stack e scroll lock ao desmontar componente aberto', async () => {
            const modalStore = useModalStore();

            const imageWrapper = mount(MaxImage, {
                props: {
                    src: 'https://example.com/photo.jpg',
                    preview: true
                },
                global: {
                    plugins: [pinia],
                    stubs: {
                        Teleport: true,
                        MaxIconButton: true
                    }
                },
                attachTo: document.body
            });

            await imageWrapper.vm.openPreview();
            await nextTick();

            expect(modalStore.stack.length).toBe(1);
            expect(getActiveLockCount()).toBe(1);

            // Desmonta sem chamar closePreview
            imageWrapper.unmount();
            await nextTick();

            expect(modalStore.stack.length).toBe(0);
            expect(getActiveLockCount()).toBe(0);
        });
    });

    describe('Foco cíclico (Tab / Shift+Tab) e isolamento da camada ativa', () => {
        it('mantém foco cíclico dentro do modal ativo (Tab no último vai para o primeiro)', async () => {
            const wrapper = mount(MaxModal, {
                props: { id: 'modal-tab-cycle', visible: true, title: 'Modal Cíclico' },
                slots: {
                    default: `
                        <input id="input-1" type="text" />
                        <button id="btn-middle">Meio</button>
                        <button id="btn-last">Último</button>
                    `
                },
                global: { stubs, plugins: [pinia] },
                attachTo: document.body
            });

            await nextTick();
            await nextTick();

            const modalEl = wrapper.find<HTMLElement>('.max-modal').element;
            const input1 = document.getElementById('input-1') as HTMLElement;
            const btnLast = document.getElementById('btn-last') as HTMLElement;
            const closeBtn = wrapper.find<HTMLElement>('.close-btn').element;

            expect(input1).not.toBeNull();
            expect(btnLast).not.toBeNull();

            // Foca o último elemento do modal
            btnLast.focus();
            expect(document.activeElement).toBe(btnLast);

            // Pressiona Tab no último elemento do modal -> deve mover foco para o primeiro focável
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
            modalEl.dispatchEvent(tabEvent);

            expect(document.activeElement).toBe(closeBtn);

            wrapper.unmount();
        });

        it('mantém foco cíclico reverso dentro do modal ativo (Shift+Tab no primeiro vai para o último)', async () => {
            const wrapper = mount(MaxModal, {
                props: { id: 'modal-shift-tab-cycle', visible: true, title: 'Modal Cíclico Reverso' },
                slots: {
                    default: `
                        <input id="input-first" type="text" />
                        <button id="btn-end">Final</button>
                    `
                },
                global: { stubs, plugins: [pinia] },
                attachTo: document.body
            });

            await nextTick();
            await nextTick();

            const modalEl = wrapper.find<HTMLElement>('.max-modal').element;
            const closeBtn = wrapper.find<HTMLElement>('.close-btn').element;
            const btnEnd = document.getElementById('btn-end') as HTMLElement;

            closeBtn.focus();
            expect(document.activeElement).toBe(closeBtn);

            const shiftTabEvent = new KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: true,
                bubbles: true,
                cancelable: true
            });
            modalEl.dispatchEvent(shiftTabEvent);

            expect(document.activeElement).toBe(btnEnd);

            wrapper.unmount();
        });
    });

    describe('Cadeia de retorno de foco e composição real de stack (Trigger -> Modal -> Especializado -> Retorno)', () => {
        it('restaura o foco corretamente em cadeia: Trigger -> MaxModal -> MaxImage preview -> Fecha Image -> Retorna foco em MaxModal -> Fecha MaxModal -> Retorna foco ao Trigger', async () => {
            const triggerBtn = document.createElement('button');
            triggerBtn.id = 'page-trigger-btn';
            triggerBtn.textContent = 'Abrir Documento';
            document.body.appendChild(triggerBtn);
            triggerBtn.focus();
            expect(document.activeElement).toBe(triggerBtn);

            const Orchestrator = defineComponent({
                components: { MaxModal, MaxImage },
                setup() {
                    const isModalOpen = ref(false);
                    const imageRef = ref<any>(null);
                    return { isModalOpen, imageRef };
                },
                template: `
                    <div>
                        <MaxModal id="doc-modal" v-model:visible="isModalOpen" title="Documento com Imagem">
                            <input id="doc-title-input" type="text" />
                            <button id="btn-open-preview" @click="imageRef?.openPreview?.()">Ver Foto</button>
                            <MaxImage
                                ref="imageRef"
                                src="https://example.com/doc-scan.jpg"
                                :preview="true"
                            />
                        </MaxModal>
                    </div>
                `
            });

            const wrapper = mount(Orchestrator, {
                global: {
                    plugins: [pinia],
                    stubs
                },
                attachTo: document.body
            });

            const modalStore = useModalStore();

            // 1. Trigger abre MaxModal
            wrapper.vm.isModalOpen = true;
            await nextTick();
            await nextTick();

            expect(modalStore.stack.length).toBe(1);
            expect(modalStore.isTop('doc-modal')).toBe(true);

            // Usuário foca o botão de preview dentro do modal
            const btnOpenPreview = document.getElementById('btn-open-preview') as HTMLElement;
            expect(btnOpenPreview).not.toBeNull();
            btnOpenPreview.focus();
            expect(document.activeElement).toBe(btnOpenPreview);

            // 2. Abre o MaxImage preview especializado
            btnOpenPreview.click();
            await nextTick();
            await nextTick();

            expect(modalStore.stack.length).toBe(2);
            const imageModalId = modalStore.top!;
            expect(imageModalId).not.toBe('doc-modal');
            expect(modalStore.isTop(imageModalId)).toBe(true);

            // MaxModal fica inerte
            const modalEl = wrapper.find('.max-modal');
            expect(modalEl.attributes('inert')).toBeDefined();
            expect(modalEl.attributes('aria-hidden')).toBe('true');

            // 3. Pressiona Escape para fechar o MaxImage do topo
            const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
            window.dispatchEvent(escEvent);
            await nextTick();
            await nextTick();

            // Apenas MaxImage fechou, MaxModal retomou posse e o foco voltou para o botão que o chamou
            expect(modalStore.stack.length).toBe(1);
            expect(modalStore.isTop('doc-modal')).toBe(true);
            expect(modalEl.attributes('inert')).toBeUndefined();
            expect(modalEl.attributes('aria-hidden')).toBeUndefined();
            expect(document.activeElement).toBe(btnOpenPreview);

            // 4. Fecha o MaxModal
            wrapper.vm.isModalOpen = false;
            await nextTick();
            await nextTick();

            expect(modalStore.stack.length).toBe(0);
            expect(document.activeElement).toBe(triggerBtn);

            wrapper.unmount();
            triggerBtn.remove();
        });
    });
});
