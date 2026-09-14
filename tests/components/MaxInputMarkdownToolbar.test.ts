import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import fs from 'node:fs';
import { resolve } from 'node:path';
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

function mountToolbar(props: Record<string, any> = {}, options: Record<string, any> = {}) {
    return mount(MaxInputMarkdownToolbar, {
        props: {
            editor: null,
            ...props
        },
        ...options
    });
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

    it('botão ativo possui aria-pressed=true e estilo consome os tokens aprovados --blue-50, --blue-800 e --blue-200', () => {
        const editor = createFakeEditor({
            isActive: vi.fn((name: string) => name === 'bold')
        });
        const wrapper = mountToolbar({ editor });

        const boldButton = wrapper.find('button[title="Negrito (Ctrl+B)"]');
        expect(boldButton.classes()).toContain('active');
        expect(boldButton.attributes('aria-pressed')).toBe('true');

        const sfcContent = fs.readFileSync(resolve(__dirname, '../../src/components/MaxInputMarkdownToolbar.vue'), 'utf-8');
        const activeMatch = sfcContent.match(/&\.active\s*\{([^}]+)\}/);
        expect(activeMatch).toBeTruthy();
        const activeCss = activeMatch![1];

        expect(activeCss).toContain('var(--blue-50)');
        expect(activeCss).toContain('var(--blue-800)');
        expect(activeCss).toContain('var(--blue-200)');
        expect(activeCss).not.toContain('--max-primary-50');
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

    it('nao aplica o link quando a URL e um esquema malicioso (javascript:alert(1))', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const linkButton = wrapper.find('button[title="Link"]');
        await linkButton.trigger('click');

        const linkInput = wrapper.find('.md-popover__input');
        await linkInput.setValue('javascript:alert(1)');
        await wrapper.find('.md-popover__btn--primary').trigger('click');

        expect(editor._commands.setLink).not.toHaveBeenCalled();
    });

    it('nao aplica a imagem quando a URL e um esquema malicioso (javascript:alert(1))', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const imgButton = wrapper.find('button[title="Imagem"]');
        await imgButton.trigger('click');

        const imgInput = wrapper.find('.md-popover__input');
        await imgInput.setValue('javascript:alert(1)');
        await wrapper.find('.md-popover__btn--primary').trigger('click');

        expect(editor._commands.setImage).not.toHaveBeenCalled();
    });

    it('insere uma tabela 3x3 com header ao clicar no botão de tabela', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const tableButton = wrapper.find('button[title="Inserir tabela"]');
        await tableButton.trigger('click');

        expect(editor._commands.insertTable).toHaveBeenCalledWith({ rows: 3, cols: 3, withHeaderRow: true });
    });

    it('expõe role="toolbar" e nome acessível padrão e configurável', () => {
        const wDefault = mountToolbar();
        expect(wDefault.attributes('role')).toBe('toolbar');
        expect(wDefault.attributes('aria-label')).toBe('Editor de Markdown');

        const wCustom = mountToolbar({ ariaLabel: 'Barra de formatação' });
        expect(wCustom.attributes('aria-label')).toBe('Barra de formatação');
    });

    it('aplica aria-pressed apenas em toggles persistentes e omite em ações momentâneas', () => {
        const editor = createFakeEditor({
            isActive: vi.fn((name: string) => name === 'bold' || name === 'link')
        });
        const wrapper = mountToolbar({ editor });

        // Toggles persistentes
        expect(wrapper.find('button[title="Negrito (Ctrl+B)"]').attributes('aria-pressed')).toBe('true');
        expect(wrapper.find('button[title="Itálico (Ctrl+I)"]').attributes('aria-pressed')).toBe('false');
        expect(wrapper.find('button[title="Link"]').attributes('aria-pressed')).toBe('true');

        // Ações momentâneas NÃO devem ter aria-pressed
        expect(wrapper.find('button[title="Separador horizontal"]').attributes('aria-pressed')).toBeUndefined();
        expect(wrapper.find('button[title="Imagem"]').attributes('aria-pressed')).toBeUndefined();
        expect(wrapper.find('button[title="Desfazer (Ctrl+Z)"]').attributes('aria-pressed')).toBeUndefined();
        expect(wrapper.find('button[title="Refazer (Ctrl+Y)"]').attributes('aria-pressed')).toBeUndefined();
        expect(wrapper.find('button[title="Limpar formatação"]').attributes('aria-pressed')).toBeUndefined();
    });

    it('mantém popover aberto, preserva valor digitado e exibe role="alert" ao tentar inserir link ou imagem com URL inválida', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        // Link com URL insegura
        await wrapper.find('button[title="Link"]').trigger('click');
        const linkInput = wrapper.find('.md-popover__input');
        await linkInput.setValue('javascript:alert(1)');
        await wrapper.find('.md-popover__btn--primary').trigger('click');

        expect(wrapper.find('.md-popover').exists()).toBe(true);
        expect((wrapper.find('.md-popover__input').element as HTMLInputElement).value).toBe('javascript:alert(1)');
        expect(wrapper.find('.md-popover__input').attributes('aria-invalid')).toBe('true');
        const alertEl = wrapper.find('[role="alert"]');
        expect(alertEl.exists()).toBe(true);
        expect(alertEl.text()).toContain('URL inválida ou insegura');

        // Fecha via Escape e restaura foco
        await linkInput.trigger('keydown', { key: 'Escape' });
        expect(wrapper.find('.md-popover').exists()).toBe(false);
    });

    it('mantém popover de imagem aberto com aria-invalid e role="alert" ao tentar URL inválida', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        await wrapper.find('button[title="Imagem"]').trigger('click');
        expect(wrapper.find('.md-popover').exists()).toBe(true);

        const imgInput = wrapper.find('.md-popover__input');
        await imgInput.setValue('javascript:alert(1)');
        await wrapper.find('.md-popover__btn--primary').trigger('click');

        expect(wrapper.find('.md-popover').exists()).toBe(true);
        expect((wrapper.find('.md-popover__input').element as HTMLInputElement).value).toBe('javascript:alert(1)');
        expect(wrapper.find('.md-popover__input').attributes('aria-invalid')).toBe('true');
        const alertEl = wrapper.find('[role="alert"]');
        expect(alertEl.exists()).toBe(true);
        expect(alertEl.text()).toContain('URL inválida ou insegura');

        // Fecha via Escape
        await imgInput.trigger('keydown', { key: 'Escape' });
        expect(wrapper.find('.md-popover').exists()).toBe(false);
    });

    it('navega entre botões habilitados com setas e Home/End via roving tabindex', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor }, { attachTo: document.body });

        const buttons = wrapper.findAll<HTMLButtonElement>('.md-toolbar__btn');
        expect(buttons.length).toBeGreaterThan(1);

        expect(buttons[0].attributes('tabindex')).toBe('0');
        expect(buttons[1].attributes('tabindex')).toBe('-1');

        buttons[0].element.focus();

        await wrapper.trigger('keydown', { key: 'ArrowRight' });
        expect(buttons[1].attributes('tabindex')).toBe('0');
        expect(buttons[0].attributes('tabindex')).toBe('-1');

        await wrapper.trigger('keydown', { key: 'End' });
        const lastIndex = buttons.length - 1;
        expect(buttons[lastIndex].attributes('tabindex')).toBe('0');

        await wrapper.trigger('keydown', { key: 'Home' });
        expect(buttons[0].attributes('tabindex')).toBe('0');

        wrapper.unmount();
    });

    describe('customização de ferramentas (hideTools e tools)', () => {
        it('oculta botões individuais quando informados em hideTools', () => {
            const editor = createFakeEditor();
            const wrapper = mountToolbar({
                editor,
                hideTools: ['image', 'table', 'strike']
            });

            expect(wrapper.find('button[title="Imagem"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Inserir tabela"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Tachado"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Negrito (Ctrl+B)"]').exists()).toBe(true);
            expect(wrapper.find('button[title="Link"]').exists()).toBe(true);
        });

        it('oculta grupos inteiros quando a chave de grupo é informada em hideTools', () => {
            const editor = createFakeEditor();
            const wrapper = mountToolbar({
                editor,
                hideTools: ['heading', 'history']
            });

            expect(wrapper.find('button[title="Título 1"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Título 2"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Título 3"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Desfazer (Ctrl+Z)"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Refazer (Ctrl+Y)"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Limpar formatação"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Negrito (Ctrl+B)"]').exists()).toBe(true);
        });

        it('exibe apenas as ferramentas permitidas quando tools é fornecido', () => {
            const editor = createFakeEditor();
            const wrapper = mountToolbar({
                editor,
                tools: ['bold', 'italic']
            });

            expect(wrapper.find('button[title="Negrito (Ctrl+B)"]').exists()).toBe(true);
            expect(wrapper.find('button[title="Itálico (Ctrl+I)"]').exists()).toBe(true);
            expect(wrapper.find('button[title="Sublinhado (Ctrl+U)"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Título 1"]').exists()).toBe(false);
            expect(wrapper.find('button[title="Link"]').exists()).toBe(false);
            expect(wrapper.findAll('.md-toolbar__divider').length).toBe(0);
        });

        it('não exibe divisores órfãos no final quando grupos subsequentes estão ocultos', () => {
            const editor = createFakeEditor();
            const wrapper = mountToolbar({
                editor,
                hideTools: ['heading', 'lists', 'blocks', 'media', 'history']
            });

            expect(wrapper.findAll('.md-toolbar__group').length).toBe(1);
            expect(wrapper.findAll('.md-toolbar__divider').length).toBe(0);
        });
    });
});
