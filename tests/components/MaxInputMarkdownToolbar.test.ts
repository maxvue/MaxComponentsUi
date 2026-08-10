import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMarkdownToolbar from '../../src/components/MaxInputMarkdownToolbar.vue';

/**
 * Fake mínimo de um `Editor` do Tiptap, cobrindo apenas a fatia de API usada
 * pela toolbar: `chain().focus().<comando>().run()`, `isActive(...)` e `can()`.
 * Cada método de comando é espionável via `vi.fn()` para asserção de chamadas.
 */
function createFakeEditor(overrides: Record<string, any> = {}) {
    const run = vi.fn();
    const commands: Record<string, ReturnType<typeof vi.fn>> = {
        toggleBold: vi.fn(() => ({ run })),
        toggleItalic: vi.fn(() => ({ run })),
        toggleUnderline: vi.fn(() => ({ run })),
        toggleStrike: vi.fn(() => ({ run })),
        toggleHeading: vi.fn(() => ({ run })),
        toggleBulletList: vi.fn(() => ({ run })),
        toggleOrderedList: vi.fn(() => ({ run })),
        toggleBlockquote: vi.fn(() => ({ run })),
        toggleCodeBlock: vi.fn(() => ({ run })),
        setHorizontalRule: vi.fn(() => ({ run })),
        insertTable: vi.fn(() => ({ run })),
        undo: vi.fn(() => ({ run })),
        redo: vi.fn(() => ({ run })),
        unsetAllMarks: vi.fn(() => ({ clearNodes: () => ({ run }) })),
        setLink: vi.fn(() => ({ run })),
        unsetLink: vi.fn(() => ({ run })),
        setImage: vi.fn(() => ({ run }))
    };

    const chainProxy: any = new Proxy({}, {
        get(_target, prop: string) {
            if (prop === 'focus') return () => chainProxy;
            if (prop in commands) return commands[prop];
            return () => chainProxy;
        }
    });

    return {
        chain: vi.fn(() => chainProxy),
        isActive: vi.fn(() => false),
        can: vi.fn(() => ({ undo: () => true, redo: () => true })),
        getAttributes: vi.fn(() => ({ href: '' })),
        _commands: commands,
        _run: run,
        ...overrides
    };
}

function mountToolbar(props: Record<string, any> = {}) {
    return mount(MaxInputMarkdownToolbar, { props });
}

describe('MaxInputMarkdownToolbar', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza como desabilitada quando editor é null', () => {
        const wrapper = mountToolbar({ editor: null });

        expect(wrapper.find('.md-toolbar--disabled').exists()).toBe(true);
    });

    it('renderiza o label quando informado', () => {
        const wrapper = mountToolbar({ editor: null, label: 'Editor' });

        expect(wrapper.find('.md-toolbar__label').text()).toBe('Editor');
    });

    it('chama toggleBold ao clicar no botão de negrito', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const boldButton = wrapper.find('button[title="Negrito (Ctrl+B)"]');
        await boldButton.trigger('click');

        expect(editor._commands.toggleBold).toHaveBeenCalled();
        expect(editor._run).toHaveBeenCalled();
    });

    it('marca o botão como ativo quando editor.isActive retorna true para o mark correspondente', () => {
        const editor = createFakeEditor({
            isActive: vi.fn((name: string) => name === 'bold')
        });
        const wrapper = mountToolbar({ editor });

        const boldButton = wrapper.find('button[title="Negrito (Ctrl+B)"]');
        expect(boldButton.classes()).toContain('active');
    });

    it('chama toggleHeading com o nível correto ao clicar em Título 2', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const h2Button = wrapper.find('button[title="Título 2"]');
        await h2Button.trigger('click');

        expect(editor._commands.toggleHeading).toHaveBeenCalledWith({ level: 2 });
    });

    it('desabilita os botões de desfazer/refazer quando editor.can() retorna false', () => {
        const editor = createFakeEditor({
            can: vi.fn(() => ({ undo: () => false, redo: () => false }))
        });
        const wrapper = mountToolbar({ editor });

        const undoButton = wrapper.find('button[title="Desfazer (Ctrl+Z)"]');
        const redoButton = wrapper.find('button[title="Refazer (Ctrl+Y)"]');

        expect(undoButton.attributes('disabled')).toBeDefined();
        expect(redoButton.attributes('disabled')).toBeDefined();
    });

    it('abre o popover de link ao clicar no botão de link e aplica a URL digitada', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const linkButton = wrapper.find('button[title="Link"]');
        await linkButton.trigger('click');

        const linkInput = wrapper.find('.md-popover__input');
        expect(linkInput.exists()).toBe(true);

        await linkInput.setValue('https://example.com');
        await wrapper.find('.md-popover__btn--primary').trigger('click');

        expect(editor._commands.setLink).toHaveBeenCalledWith({ href: 'https://example.com', target: '_blank' });
    });

    it('insere uma tabela 3x3 com header ao clicar no botão de tabela', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const tableButton = wrapper.find('button[title="Inserir tabela"]');
        await tableButton.trigger('click');

        expect(editor._commands.insertTable).toHaveBeenCalledWith({ rows: 3, cols: 3, withHeaderRow: true });
    });
});
