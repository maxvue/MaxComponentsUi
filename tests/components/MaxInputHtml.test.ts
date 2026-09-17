import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import MaxInputHtml from '../../src/components/MaxInputHtml.vue';

let latestEditorOptions: any = null;
const { starterKitConfigure } = vi.hoisted(() => ({
    starterKitConfigure: vi.fn(() => ({ name: 'starterKit' }))
}));
const mockEditor = {
    chain: () => ({
        focus: () => ({
            toggleBold: () => ({ run: vi.fn() }),
            setImage: vi.fn(() => ({ run: vi.fn() })),
            insertContent: vi.fn(() => ({ run: vi.fn() }))
        })
    }),
    isActive: vi.fn(() => false),
    can: () => ({ undo: () => false, redo: () => false }),
    getHTML: vi.fn(() => '<p>Conteúdo HTML</p>'),
    commands: {
        setContent: vi.fn(),
        insertContent: vi.fn()
    },
    setEditable: vi.fn(),
    destroy: vi.fn(),
    getAttributes: vi.fn(() => ({})),
    on: vi.fn(),
    off: vi.fn()
};

vi.mock('@tiptap/vue-3', () => {
    return {
        useEditor: vi.fn((options) => {
            latestEditorOptions = options;
            return { value: mockEditor };
        }),
        EditorContent: {
            name: 'EditorContent',
            template: '<div class="editor-content-stub"></div>',
            props: ['editor']
        }
    };
});

vi.mock('@tiptap/starter-kit', () => ({ default: { configure: starterKitConfigure } }));
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
vi.mock('@tiptap/extension-text-align', () => {
    const TextAlign = {
        extend: vi.fn(() => ({
            configure: vi.fn(() => ({ name: 'textAlign' }))
        }))
    };
    return { default: TextAlign };
});

function mountHtml(props: Record<string, any> = {}) {
    return mount(MaxInputHtml, {
        props: { modelValue: '', ...props },
        global: {
            stubs: {
                teleport: true,
                MaxInputHtmlToolbar: {
                    name: 'MaxInputHtmlToolbar',
                    template: '<div class="toolbar-stub"></div>',
                    props: ['editor', 'hideTools', 'tools']
                },
                MaxIcon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size']
                },
                MaxPdfView: {
                    name: 'MaxPdfView',
                    template: '<div class="max-pdf-view-stub" :data-file="file"></div>',
                    props: ['file', 'labels']
                }
            }
        }
    });
}

describe('MaxInputHtml', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        latestEditorOptions = null;
        vi.clearAllMocks();
    });

    it('renderiza sem erros', () => {
        const wrapper = mountHtml();
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza com a classe BEM correta .max-input-html no wrapper externo', () => {
        const wrapper = mountHtml();
        expect(wrapper.find('.max-input-html').exists()).toBe(true);
    });

    it('renderiza a toolbar e o conteúdo do editor', () => {
        const wrapper = mountHtml();
        expect(wrapper.find('.toolbar-stub').exists()).toBe(true);
        expect(wrapper.find('.editor-content-stub').exists()).toBe(true);
    });

    it('aplica minHeight e maxHeight ao wrapper do conteúdo', () => {
        const wrapper = mountHtml({ minHeight: '300px', maxHeight: '600px' });
        const content = wrapper.find('.max-input-html__content');
        expect(content.attributes('style')).toContain('min-height: 300px');
        expect(content.attributes('style')).toContain('max-height: 600px');
    });

    it('ocupa 100% da altura disponível quando minHeight e maxHeight não são informados', () => {
        const wrapper = mountHtml();
        const content = wrapper.get('.max-input-html__content');
        const source = readFileSync(resolve(__dirname, '../../src/components/MaxInputHtml.vue'), 'utf-8');

        expect(source).toMatch(/\.max-input-html\s*\{[\s\S]*?height:\s*100%;/);
        expect(content.attributes('style') ?? '').not.toContain('min-height');
        expect(content.attributes('style') ?? '').not.toContain('max-height');
    });

    it('aplica classe disabled quando disabled=true', () => {
        const wrapper = mountHtml({ disabled: true });
        expect(wrapper.find('.max-input-html__editor-wrap--disabled').exists()).toBe(true);
    });

    it('inicializa o editor com o HTML do modelValue na montagem', () => {
        const initialHtml = '<p class="ql-align-justify"><span>Texto inicial</span></p>';
        mountHtml({ modelValue: initialHtml });

        expect(mockEditor.commands.setContent).toHaveBeenCalledWith(initialHtml);
    });

    it('atualiza o conteúdo do editor quando a prop modelValue muda externamente', async () => {
        const wrapper = mountHtml({ modelValue: '<p>Primeiro</p>' });
        expect(mockEditor.commands.setContent).toHaveBeenCalledWith('<p>Primeiro</p>');

        mockEditor.getHTML.mockReturnValueOnce('<p>Primeiro</p>');
        await wrapper.setProps({ modelValue: '<p>Segundo</p>' });

        expect(mockEditor.commands.setContent).toHaveBeenCalledWith('<p>Segundo</p>');
    });

    it('emite update:modelValue com HTML no evento onUpdate do editor', () => {
        const wrapper = mountHtml();
        expect(latestEditorOptions).toBeDefined();

        mockEditor.getHTML.mockReturnValueOnce('<p class="ql-align-justify">Texto salvo</p>');
        latestEditorOptions.onUpdate({ editor: mockEditor });

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]).toEqual(['<p class="ql-align-justify">Texto salvo</p>']);
    });

    it('expõe métodos do lightbox e editor através do defineExpose', () => {
        const wrapper = mountHtml();
        const vm: any = wrapper.vm;

        expect(vm.editor).toBeDefined();
        expect(typeof vm.openImage).toBe('function');
        expect(typeof vm.closeImage).toBe('function');
        expect(typeof vm.openPdf).toBe('function');
        expect(vm.isImageModalOpen).toBe(false);
    });

    it('contém regras CSS para suporte a classes do Quill e nowrap', () => {
        const source = readFileSync(resolve(__dirname, '../../src/components/MaxInputHtml.vue'), 'utf-8');

        expect(source).toContain('.ql-align-justify');
        expect(source).toContain('text-align: justify');
        expect(source).toContain('[nowrap]');
        expect(source).toContain('white-space: nowrap');
    });
});
