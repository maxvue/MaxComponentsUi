import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp, h, ref, nextTick, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxInputHtml from '../../src/components/MaxInputHtml.vue';
import MaxInputMarkdown from '../../src/components/MaxInputMarkdown.vue';
import { allowConsoleWarn } from '../helpers/consolePolicy';
import '../../src/themes/all.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function settle(): Promise<void> {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });
}

async function waitForCondition(condition: () => boolean, timeout = 3000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (condition()) return;
        await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error('Timeout atingido aguardando condição assíncrona.');
}

beforeEach(() => {
    // Permite aviso interno de inicialização idempotente do linkifyjs invocado pelo Tiptap Link
    allowConsoleWarn(/linkifyjs/);
    // Permite aviso específico do tiptap-markdown quando nó table é avaliado com html: false
    allowConsoleWarn(/Tiptap Markdown: "table" node is only available in html mode/);
});

afterEach(() => {
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

describe('Compatibilidade Tiptap em Navegador Real (Chromium)', () => {
    describe('MaxInputHtml com Tiptap Real', () => {
        it('inicializa com texto legado ql-align-justify, preserva alinhamento, formata e serializa HTML', async () => {
            hostElement = document.createElement('div');
            hostElement.id = 'browser-test-html-editor';
            document.body.appendChild(hostElement);

            const initialHtml = '<p class="ql-align-justify">Texto com alinhamento justificado legado</p>';
            const modelValue = ref(initialHtml);
            const disabled = ref(false);
            const emittedValues: string[] = [];
            const editorRef = ref<any>(null);

            const app = createApp({
                render() {
                    return h(MaxInputHtml, {
                        ref: (instance: any) => {
                            editorRef.value = instance;
                        },
                        modelValue: modelValue.value,
                        disabled: disabled.value,
                        'onUpdate:modelValue': (val: string) => {
                            modelValue.value = val;
                            emittedValues.push(val);
                        }
                    });
                }
            });

            app.use(createPinia());
            app.directive('tooltip', () => {});
            activeApp = app;
            app.mount(hostElement);
            await settle();

            await waitForCondition(() => Boolean(editorRef.value?.editor?.view?.dom));
            const editor = editorRef.value.editor;
            expect(editor).toBeDefined();
            expect(editor.isEditable).toBe(true);

            // 1. Preservação de alinhamento justificado legado
            expect(editor.isActive({ textAlign: 'justify' })).toBe(true);
            const currentHtml = editor.getHTML();
            expect(currentHtml).toMatch(/text-align:\s*justify|ql-align-justify/);

            // 2. Edição no editor e emissão de update:modelValue
            editor.commands.focus();
            editor.commands.insertContent('<p>Parágrafo inserido no teste real</p>');
            await settle();
            expect(emittedValues.length).toBeGreaterThan(0);
            const lastEmitted = emittedValues[emittedValues.length - 1];
            expect(lastEmitted).toContain('Parágrafo inserido no teste real');

            // 3. Atualização de prop externamente
            const externalHtml = '<p>Atualização externa de conteúdo</p>';
            modelValue.value = externalHtml;
            await nextTick();
            await settle();
            await waitForCondition(() => editor.getHTML().includes('Atualização externa de conteúdo'));
            expect(editor.getHTML()).toContain('Atualização externa de conteúdo');

            // 4. CustomTextAlign (alinhamento à direita)
            editor.commands.setTextAlign('right');
            await settle();
            expect(editor.isActive({ textAlign: 'right' })).toBe(true);
            expect(editor.getHTML()).toMatch(/text-align:\s*right/);

            // 5. Inserção de link seguro sobre seleção
            editor.commands.selectAll();
            editor.commands.setLink({ href: 'https://engeapp.com.br' });
            await settle();
            expect(editor.isActive('link')).toBe(true);
            expect(editor.getHTML()).toContain('https://engeapp.com.br');

            // 6. Inserção de tabela no final
            editor.commands.focus('end');
            editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: true });
            await settle();
            expect(editor.isActive('table')).toBe(true);
            expect(editor.getHTML()).toContain('<table');

            // 7. Estado disabled altera editabilidade e preserva conteúdo
            disabled.value = true;
            await nextTick();
            await settle();
            await waitForCondition(() => editor.isEditable === false);
            expect(editor.isEditable).toBe(false);
            expect(editor.getHTML()).toContain('https://engeapp.com.br');

            // 8. Desmontagem limpa o editor
            app.unmount();
            activeApp = null;
            expect(editor.isDestroyed).toBe(true);
        });
    });

    describe('MaxInputMarkdown com Tiptap e tiptap-markdown Real', () => {
        it('inicializa com Markdown estruturado, edita, reflete prop externa e serializa saída', async () => {
            hostElement = document.createElement('div');
            hostElement.id = 'browser-test-markdown-editor';
            document.body.appendChild(hostElement);

            const initialMd = '# Título Principal\n\n- Item da lista 1\n- Item da lista 2\n\nParágrafo descritivo inicial.';
            const modelValue = ref(initialMd);
            const disabled = ref(false);
            const emittedValues: string[] = [];
            const editorRef = ref<any>(null);

            const app = createApp({
                render() {
                    return h(MaxInputMarkdown, {
                        ref: (instance: any) => {
                            editorRef.value = instance;
                        },
                        modelValue: modelValue.value,
                        disabled: disabled.value,
                        'onUpdate:modelValue': (val: string) => {
                            modelValue.value = val;
                            emittedValues.push(val);
                        }
                    });
                }
            });

            app.use(createPinia());
            app.directive('tooltip', () => {});
            activeApp = app;
            app.mount(hostElement);
            await settle();

            await waitForCondition(() => Boolean(editorRef.value?.editor?.view?.dom));
            const editor = editorRef.value.editor;
            expect(editor).toBeDefined();
            expect(editor.isEditable).toBe(true);

            // 1. Confere serialização Markdown pelo plugin real
            const currentSerialized = editor.storage.markdown.getMarkdown();
            expect(currentSerialized).toContain('# Título Principal');
            expect(currentSerialized).toContain('Item da lista 1');

            // 2. Edição no editor e emissão de update:modelValue em Markdown serializado
            editor.commands.focus();
            editor.commands.insertContent('<p>Texto inserido no editor markdown</p>');
            await settle();
            expect(emittedValues.length).toBeGreaterThan(0);
            const lastEmitted = emittedValues[emittedValues.length - 1];
            expect(lastEmitted).toContain('Texto inserido no editor markdown');

            // 3. Atualização de prop externamente
            const externalMd = '## Subtítulo Atualizado Externamente\n\nLinha modificada via prop.';
            modelValue.value = externalMd;
            await nextTick();
            await settle();
            await waitForCondition(() => editor.storage.markdown.getMarkdown().includes('Subtítulo Atualizado Externamente'));
            expect(editor.storage.markdown.getMarkdown()).toContain('Subtítulo Atualizado Externamente');

            // 4. Inserção de link e tabela compatíveis
            editor.commands.setLink({ href: 'https://engeapp.com.br' });
            await settle();
            expect(editor.isActive('link')).toBe(true);

            editor.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: false });
            await settle();
            expect(editor.isActive('table')).toBe(true);
            const mdWithTable = editor.storage.markdown.getMarkdown();
            expect(mdWithTable).toBeDefined();

            // 5. Estado disabled
            disabled.value = true;
            await nextTick();
            await settle();
            await waitForCondition(() => editor.isEditable === false);
            expect(editor.isEditable).toBe(false);

            // 6. Desmontagem e destruição do editor
            app.unmount();
            activeApp = null;
            expect(editor.isDestroyed).toBe(true);
        });
    });
});
