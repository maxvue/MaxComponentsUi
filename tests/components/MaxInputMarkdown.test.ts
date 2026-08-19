import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMarkdown from '../../src/components/MaxInputMarkdown.vue';

let latestEditorOptions: any = null;
const mockEditor = {
    chain: () => ({
        focus: () => ({
            toggleBold: () => ({ run: vi.fn() }),
            setImage: vi.fn(() => ({ run: vi.fn() }))
        })
    }),
    isActive: vi.fn(() => false),
    can: () => ({ undo: () => false, redo: () => false }),
    storage: { markdown: { getMarkdown: vi.fn(() => '') } },
    commands: { setContent: vi.fn() },
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

vi.mock('tiptap-markdown', () => ({
    Markdown: { configure: vi.fn(() => ({})) }
}));

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-image', () => ({ default: {} }));
// `@tiptap/extension-table` exporta `Table` de forma nomeada (diferente das
// extensoes irmas, que usam default). O mock expoe os dois formatos para nao
// quebrar caso o estilo de import mude.
vi.mock('@tiptap/extension-table', () => {
    const Table = { configure: vi.fn(() => ({})) };
    return { Table, default: Table };
});
vi.mock('@tiptap/extension-table-row', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-header', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-cell', () => ({ default: {} }));

function mountMarkdown(props: Record<string, any> = {}) {
    return mount(MaxInputMarkdown, {
        props: { modelValue: '', ...props },
        global: {
            stubs: {
                teleport: true,
                MaxInputMarkdownToolbar: {
                    name: 'MaxInputMarkdownToolbar',
                    template: '<div class="toolbar-stub"></div>',
                    props: ['editor']
                },
                MaxIcon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size']
                },
                MaxPdfView: {
                    name: 'MaxPdfView',
                    template: '<div class="max-pdf-view-stub" :data-file="file"></div>',
                    props: ['file']
                }
            }
        }
    });
}

describe('MaxInputMarkdown', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        latestEditorOptions = null;
        vi.clearAllMocks();
    });

    it('renderiza sem erros', () => {
        const wrapper = mountMarkdown();
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza com a classe BEM correta .max-input-markdown no wrapper externo', () => {
        const wrapper = mountMarkdown();
        expect(wrapper.find('.max-input-markdown').exists()).toBe(true);
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

    it('passa label para InputBase via inLine quando inLine=true', () => {
        const wrapper = mountMarkdown({ label: 'Descrição', inLine: true });
        expect(wrapper.find('.in-line-label').text()).toBe('Descrição');
    });

    it('passa label para InputBase como floating label padrão quando inLine=false', () => {
        const wrapper = mountMarkdown({ label: 'Descrição' });
        expect(wrapper.find('.max-input-label').text()).toBe('Descrição');
    });

    it('processa colagem (Ctrl+V) de imagem e emite evento paste-image', () => {
        const wrapper = mountMarkdown();
        const file = new File(['dummy content'], 'screenshot.png', { type: 'image/png' });
        const mockClipboardEvent = {
            clipboardData: {
                items: [
                    {
                        type: 'image/png',
                        getAsFile: () => file
                    }
                ],
                files: []
            },
            preventDefault: vi.fn()
        };

        const result = latestEditorOptions.editorProps.handlePaste({}, mockClipboardEvent);

        expect(result).toBe(true);
        expect(mockClipboardEvent.preventDefault).toHaveBeenCalled();
        expect(wrapper.emitted('paste-image')?.[0]).toEqual([file]);
    });

    it('processa drag and drop de imagem', () => {
        const wrapper = mountMarkdown();
        const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
        const mockDropEvent = {
            dataTransfer: {
                files: [file]
            },
            preventDefault: vi.fn()
        };

        const result = latestEditorOptions.editorProps.handleDrop({}, mockDropEvent, null, false);

        expect(result).toBe(true);
        expect(mockDropEvent.preventDefault).toHaveBeenCalled();
        expect(wrapper.emitted('paste-image')?.[0]).toEqual([file]);
    });

    it('utiliza onImageUpload customizado quando fornecido', async () => {
        const onImageUpload = vi.fn().mockResolvedValue('https://example.com/uploaded.png');
        const wrapper = mountMarkdown({ onImageUpload });
        expect(wrapper.exists()).toBe(true);
        const file = new File(['dummy content'], 'uploaded.png', { type: 'image/png' });
        const mockClipboardEvent = {
            clipboardData: {
                items: [
                    {
                        type: 'image/png',
                        getAsFile: () => file
                    }
                ]
            },
            preventDefault: vi.fn()
        };

        latestEditorOptions.editorProps.handlePaste({}, mockClipboardEvent);

        expect(onImageUpload).toHaveBeenCalledWith(file);
    });

    it('emite update:modelValue quando o callback onUpdate do editor é acionado', () => {
        const wrapper = mountMarkdown();
        mockEditor.storage.markdown.getMarkdown.mockReturnValue('# Titulo');

        latestEditorOptions.onUpdate({ editor: mockEditor });

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['# Titulo']);
    });

    it('sincroniza modelValue do pai para o editor quando diverge', async () => {
        const wrapper = mountMarkdown({ modelValue: '# Inicial' });
        mockEditor.storage.markdown.getMarkdown.mockReturnValue('# Inicial');

        await wrapper.setProps({ modelValue: '# Novo' });

        expect(mockEditor.commands.setContent).toHaveBeenCalledWith('# Novo');
    });

    it('evita loop de atualização se o modelValue for idêntico ao conteúdo atual do editor', async () => {
        const wrapper = mountMarkdown({ modelValue: '# Mesma coisa' });
        mockEditor.storage.markdown.getMarkdown.mockReturnValue('# Mesma coisa');
        mockEditor.commands.setContent.mockClear();

        await wrapper.setProps({ modelValue: '# Mesma coisa' });

        expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
    });

    it('carrega o conteúdo inicial no onMounted quando modelValue é fornecido', () => {
        mockEditor.commands.setContent.mockClear();
        mountMarkdown({ modelValue: '# Inicial' });

        expect(mockEditor.commands.setContent).toHaveBeenCalledWith('# Inicial');
    });

    it('destrói o editor TipTap no unmount para evitar vazamento de memória', () => {
        const wrapper = mountMarkdown();
        expect(mockEditor.destroy).not.toHaveBeenCalled();

        wrapper.unmount();

        expect(mockEditor.destroy).toHaveBeenCalledOnce();
    });

    it('reage a alteração da prop disabled invocando setEditable', async () => {
        const wrapper = mountMarkdown({ disabled: false });

        await wrapper.setProps({ disabled: true });
        expect(mockEditor.setEditable).toHaveBeenCalledWith(false);

        await wrapper.setProps({ disabled: false });
        expect(mockEditor.setEditable).toHaveBeenCalledWith(true);
    });

    describe('Visualizador Modal de Imagens (Lightbox)', () => {
        it('abre o modal lightbox ao clicar em uma imagem no editor', async () => {
            const wrapper = mountMarkdown();
            const mockImg = document.createElement('img');
            mockImg.setAttribute('src', 'https://example.com/foto.jpg');
            mockImg.setAttribute('alt', 'Foto de Exemplo');

            const mockClickEvent = {
                target: mockImg,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            };

            const handled = latestEditorOptions.editorProps.handleClick({}, 0, mockClickEvent);

            expect(handled).toBe(true);
            expect(mockClickEvent.preventDefault).toHaveBeenCalled();

            await wrapper.vm.$nextTick();

            const modal = wrapper.find('.max-image-preview-modal');
            expect(modal.exists()).toBe(true);
            const img = modal.find('img.max-image-preview-modal__img');
            expect(img.attributes('src')).toBe('https://example.com/foto.jpg');
            expect(img.attributes('alt')).toBe('Foto de Exemplo');
        });

        it('aumenta, diminui e reseta o zoom da imagem no modal', async () => {
            const wrapper = mountMarkdown();
            const vm = wrapper.vm as any;

            vm.openImage('https://example.com/foto.jpg');
            await wrapper.vm.$nextTick();

            expect(vm.imageZoom).toBe(1);

            vm.zoomInImage();
            expect(vm.imageZoom).toBe(1.25);

            vm.zoomOutImage();
            expect(vm.imageZoom).toBe(1);

            vm.zoomInImage();
            vm.zoomInImage();
            expect(vm.imageZoom).toBe(1.5);

            vm.resetImageZoom();
            expect(vm.imageZoom).toBe(1);
        });

        it('fecha o modal de imagem ao clicar no botão de fechar ou no backdrop', async () => {
            const wrapper = mountMarkdown();
            const vm = wrapper.vm as any;

            vm.openImage('https://example.com/foto.jpg');
            await wrapper.vm.$nextTick();
            expect(wrapper.find('.max-image-preview-modal').exists()).toBe(true);

            await wrapper.find('.max-image-preview-modal__btn--close').trigger('click');
            await wrapper.vm.$nextTick();
            expect(wrapper.find('.max-image-preview-modal').exists()).toBe(false);

            vm.openImage('https://example.com/foto.jpg');
            await wrapper.vm.$nextTick();
            expect(wrapper.find('.max-image-preview-modal').exists()).toBe(true);

            await wrapper.find('.max-image-preview-modal').trigger('click');
            await wrapper.vm.$nextTick();
            expect(wrapper.find('.max-image-preview-modal').exists()).toBe(false);
        });

        it('fecha o modal de imagem ao pressionar Escape', async () => {
            const wrapper = mountMarkdown();
            const vm = wrapper.vm as any;

            vm.openImage('https://example.com/foto.jpg');
            await wrapper.vm.$nextTick();
            expect(wrapper.find('.max-image-preview-modal').exists()).toBe(true);

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await wrapper.vm.$nextTick();
            expect(wrapper.find('.max-image-preview-modal').exists()).toBe(false);
        });
    });

    describe('Visualizador Modal de PDF', () => {
        it('abre o visualizador de PDF ao clicar em link com terminação .pdf', async () => {
            const wrapper = mountMarkdown();
            const mockLink = document.createElement('a');
            mockLink.setAttribute('href', 'https://example.com/relatorio.pdf');
            mockLink.textContent = 'Relatório Técnico';

            const mockClickEvent = {
                target: mockLink,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            };

            const handled = latestEditorOptions.editorProps.handleClick({}, 0, mockClickEvent);

            expect(handled).toBe(true);
            expect(mockClickEvent.preventDefault).toHaveBeenCalled();
            expect(mockClickEvent.stopPropagation).toHaveBeenCalled();

            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const pdfStub = wrapper.findComponent({ name: 'MaxPdfView' });
            expect(pdfStub.exists()).toBe(true);
            expect(pdfStub.props('file')).toBe('https://example.com/relatorio.pdf');
        });

        it('ignora clique em links normais que não são PDF', () => {
            const _wrapper = mountMarkdown();
            const mockLink = document.createElement('a');
            mockLink.setAttribute('href', 'https://example.com/pagina-web');
            mockLink.textContent = 'Site Principal';

            const mockClickEvent = {
                target: mockLink,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            };

            const handled = latestEditorOptions.editorProps.handleClick({}, 0, mockClickEvent);

            expect(handled).toBe(false);
            expect(mockClickEvent.preventDefault).not.toHaveBeenCalled();
        });

        it('processa drag and drop de arquivo PDF e emite paste-file', () => {
            const wrapper = mountMarkdown();
            const file = new File(['dummy pdf content'], 'contrato.pdf', { type: 'application/pdf' });
            const mockDropEvent = {
                dataTransfer: {
                    files: [file]
                },
                preventDefault: vi.fn()
            };

            const result = latestEditorOptions.editorProps.handleDrop({}, mockDropEvent, null, false);

            expect(result).toBe(true);
            expect(mockDropEvent.preventDefault).toHaveBeenCalled();
            expect(wrapper.emitted('paste-file')?.[0]).toEqual([file]);
        });
    });
});
