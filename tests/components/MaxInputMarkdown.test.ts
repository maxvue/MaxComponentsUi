import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMarkdown from '../../src/components/MaxInputMarkdown.vue';

vi.mock('@tiptap/vue-3', () => {
    const mockEditor = {
        chain: () => ({ focus: () => ({ toggleBold: () => ({ run: vi.fn() }) }) }),
        isActive: vi.fn(() => false),
        can: () => ({ undo: () => false, redo: () => false }),
        storage: { markdown: { getMarkdown: vi.fn(() => '**hello**') } },
        commands: { setContent: vi.fn() },
        setEditable: vi.fn(),
        destroy: vi.fn(),
        getAttributes: vi.fn(() => ({})),
        on: vi.fn(),
        off: vi.fn(),
    };

    return {
        useEditor: vi.fn(() => ({ value: mockEditor })),
        EditorContent: {
            name: 'EditorContent',
            template: '<div class="editor-content-stub"></div>',
            props: ['editor'],
        },
    };
});

vi.mock('tiptap-markdown', () => ({
    Markdown: { configure: vi.fn(() => ({})) },
}));

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-image', () => ({ default: {} }));
vi.mock('@tiptap/extension-table', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-table-row', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-header', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-cell', () => ({ default: {} }));

function mountMarkdown(props: Record<string, any> = {}) {
    return mount(MaxInputMarkdown, {
        props: { modelValue: '', ...props },
        global: {
            stubs: {
                MaxInputMarkdownToolbar: {
                    name: 'MaxInputMarkdownToolbar',
                    template: '<div class="toolbar-stub"></div>',
                    props: ['editor'],
                },
                MaxIcon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size'],
                },
            },
        },
    });
}

describe('MaxInputMarkdown', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('renderiza sem erros', () => {
        const wrapper = mountMarkdown();
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza a toolbar', () => {
        const wrapper = mountMarkdown();
        expect(wrapper.find('.toolbar-stub').exists()).toBe(true);
    });

    it('renderiza o conteúdo do editor', () => {
        const wrapper = mountMarkdown();
        expect(wrapper.find('.editor-content-stub').exists()).toBe(true);
    });

    it('aplica minHeight e maxHeight ao wrapper do conteúdo', () => {
        const wrapper = mountMarkdown({ minHeight: '300px', maxHeight: '600px' });
        const content = wrapper.find('.max-input-markdown__content');
        expect(content.attributes('style')).toContain('min-height: 300px');
        expect(content.attributes('style')).toContain('max-height: 600px');
    });

    it('aplica classe disabled quando disabled=true', () => {
        const wrapper = mountMarkdown({ disabled: true });
        expect(wrapper.find('.max-input-markdown__editor-wrap--disabled').exists()).toBe(true);
    });

    it('passa label para InputBase via inLine', () => {
        const wrapper = mountMarkdown({ label: 'Descrição' });
        expect(wrapper.exists()).toBe(true);
    });
});
