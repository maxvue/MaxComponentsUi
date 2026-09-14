import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
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

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
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

describe('F09 — E04-04: Modais especializados integrados ao stack canônico', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        forceReset();
    });

    afterEach(() => {
        forceReset();
    });

    it('balanceia scroll lock e stack quando MaxImage abre sobre MaxModal', async () => {
        const modalStore = useModalStore();

        // 1. MaxModal abre via open()
        const modalWrapper = mount(MaxModal, {
            props: {
                id: 'base-modal'
            },
            global: {
                plugins: [pinia],
                stubs: {
                    Teleport: true,
                    MaxButton: true,
                    MaxIconButton: true,
                    MaxTitle1: true
                }
            }
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
                stubs: {
                    Teleport: true,
                    MaxIconButton: true
                }
            }
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
            }
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
            }
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
            }
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
            }
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
