import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import fs from 'node:fs';
import { resolve } from 'node:path';
import MaxInputHtmlToolbar from '../../src/components/MaxInputHtmlToolbar.vue';

function createFakeEditor(overrides: Record<string, any> = {}) {
    const run = vi.fn();
    const commands: Record<string, ReturnType<typeof vi.fn>> = {
        toggleBold: vi.fn(() => ({ run })),
        toggleItalic: vi.fn(() => ({ run })),
        toggleUnderline: vi.fn(() => ({ run })),
        toggleStrike: vi.fn(() => ({ run })),
        setTextAlign: vi.fn(() => ({ run })),
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
    return mount(MaxInputHtmlToolbar, {
        props: {
            editor: null,
            ...props
        },
        ...options
    });
}

describe('MaxInputHtmlToolbar', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza como desabilitada quando editor é null', () => {
        const wrapper = mountToolbar({ editor: null });
        expect(wrapper.find('.html-toolbar--disabled').exists()).toBe(true);
    });

    it('renderiza o label quando informado', () => {
        const wrapper = mountToolbar({ editor: null, label: 'Editor HTML' });
        expect(wrapper.find('.html-toolbar__label').text()).toBe('Editor HTML');
    });

    it('chama toggleBold ao clicar no botão de negrito', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const boldButton = wrapper.find('button[title="Negrito (Ctrl+B)"]');
        await boldButton.trigger('click');

        expect(editor._commands.toggleBold).toHaveBeenCalled();
        expect(editor._run).toHaveBeenCalled();
    });

    it('chama setTextAlign com "left" ao clicar em Alinhar à esquerda', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const btn = wrapper.find('button[title="Alinhar à esquerda"]');
        await btn.trigger('click');

        expect(editor._commands.setTextAlign).toHaveBeenCalledWith('left');
        expect(editor._run).toHaveBeenCalled();
    });

    it('chama setTextAlign com "center" ao clicar em Centralizar', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const btn = wrapper.find('button[title="Centralizar"]');
        await btn.trigger('click');

        expect(editor._commands.setTextAlign).toHaveBeenCalledWith('center');
        expect(editor._run).toHaveBeenCalled();
    });

    it('chama setTextAlign com "right" ao clicar em Alinhar à direita', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const btn = wrapper.find('button[title="Alinhar à direita"]');
        await btn.trigger('click');

        expect(editor._commands.setTextAlign).toHaveBeenCalledWith('right');
        expect(editor._run).toHaveBeenCalled();
    });

    it('chama setTextAlign com "justify" ao clicar em Justificar', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const btn = wrapper.find('button[title="Justificar"]');
        await btn.trigger('click');

        expect(editor._commands.setTextAlign).toHaveBeenCalledWith('justify');
        expect(editor._run).toHaveBeenCalled();
    });

    it('marca o botão de justificar como ativo quando isActive({ textAlign: "justify" }) é true', () => {
        const editor = createFakeEditor({
            isActive: vi.fn((attrs: any) => typeof attrs === 'object' && attrs.textAlign === 'justify')
        });
        const wrapper = mountToolbar({ editor });

        const justifyBtn = wrapper.find('button[title="Justificar"]');
        expect(justifyBtn.classes()).toContain('active');
        expect(justifyBtn.attributes('aria-pressed')).toBe('true');
    });

    it('botão ativo possui aria-pressed=true e estilo consome tokens coerentes', () => {
        const editor = createFakeEditor({
            isActive: vi.fn((name: string) => name === 'bold')
        });
        const wrapper = mountToolbar({ editor });

        const boldButton = wrapper.find('button[title="Negrito (Ctrl+B)"]');
        expect(boldButton.classes()).toContain('active');
        expect(boldButton.attributes('aria-pressed')).toBe('true');

        const sfcContent = fs.readFileSync(resolve(__dirname, '../../src/components/MaxInputHtmlToolbar.vue'), 'utf-8');
        const activeMatch = sfcContent.match(/&\.active\s*\{([^}]+)\}/);
        expect(activeMatch).toBeTruthy();
        const activeCss = activeMatch![1];

        expect(activeCss).toContain('var(--blue-50)');
        expect(activeCss).toContain('var(--blue-800)');
        expect(activeCss).toContain('var(--blue-200)');
    });

    it('chama toggleHeading com o nível correto ao clicar em Título 1', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const h1Button = wrapper.find('button[title="Título 1"]');
        await h1Button.trigger('click');

        expect(editor._commands.toggleHeading).toHaveBeenCalledWith({ level: 1 });
    });

    it('filtra ferramentas visíveis através da prop tools', () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({
            editor,
            tools: ['bold', 'italic', 'align-justify']
        });

        expect(wrapper.find('button[title="Negrito (Ctrl+B)"]').exists()).toBe(true);
        expect(wrapper.find('button[title="Itálico (Ctrl+I)"]').exists()).toBe(true);
        expect(wrapper.find('button[title="Justificar"]').exists()).toBe(true);
        expect(wrapper.find('button[title="Sublinhado (Ctrl+U)"]').exists()).toBe(false);
        expect(wrapper.find('button[title="Título 1"]').exists()).toBe(false);
    });

    it('esconde ferramentas através da prop hideTools', () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({
            editor,
            hideTools: ['strike', 'alignment']
        });

        expect(wrapper.find('button[title="Negrito (Ctrl+B)"]').exists()).toBe(true);
        expect(wrapper.find('button[title="Tachado"]').exists()).toBe(false);
        expect(wrapper.find('button[title="Justificar"]').exists()).toBe(false);
        expect(wrapper.find('button[title="Alinhar à esquerda"]').exists()).toBe(false);
    });

    it('abre e fecha o popover de link corretamente', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const linkButton = wrapper.find('button[title="Link"]');
        expect(wrapper.find('.html-popover').exists()).toBe(false);

        await linkButton.trigger('click');
        expect(wrapper.find('.html-popover').exists()).toBe(true);

        const input = wrapper.find('input[placeholder="https://..."]');
        await input.setValue('https://example.com');
        await wrapper.find('.html-popover__btn--primary').trigger('click');

        expect(editor._commands.setLink).toHaveBeenCalledWith({
            href: 'https://example.com',
            target: '_blank'
        });
        expect(wrapper.find('.html-popover').exists()).toBe(false);
    });

    it('rejeita URLs inseguras no popover de link', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const linkButton = wrapper.find('button[title="Link"]');
        await linkButton.trigger('click');

        const input = wrapper.find('input[placeholder="https://..."]');
        await input.setValue('javascript:alert(1)');
        await wrapper.find('.html-popover__btn--primary').trigger('click');

        expect(editor._commands.setLink).not.toHaveBeenCalled();
        expect(wrapper.find('.html-popover__error').text()).toContain('URL inválida ou insegura');
    });

    it('insere tabela ao clicar no botão de tabela', async () => {
        const editor = createFakeEditor();
        const wrapper = mountToolbar({ editor });

        const tableButton = wrapper.find('button[title="Inserir tabela"]');
        await tableButton.trigger('click');

        expect(editor._commands.insertTable).toHaveBeenCalledWith({
            rows: 3,
            cols: 3,
            withHeaderRow: true
        });
    });
});
