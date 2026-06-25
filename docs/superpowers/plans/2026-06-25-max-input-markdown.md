# MaxInputMarkdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `MaxInputMarkdown`, a WYSIWYG Markdown editor component for `@maxvue/max-components-ui` using Tiptap, with full toolbar and `v-model` returning raw Markdown.

**Architecture:** Two Vue SFCs — `MaxInputMarkdownToolbar.vue` (toolbar isolada, recebe instância do editor como prop) e `MaxInputMarkdown.vue` (componente principal que integra `InputBase`, Tiptap editor e toolbar). A extensão `tiptap-markdown` faz a serialização/desserialização entre o estado interno ProseMirror e strings Markdown.

**Tech Stack:** `@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-table` + row/header/cell, `tiptap-markdown`, Vue 3 `<script setup lang="ts">`, SCSS com CSS variables do MaxStyle.

## Global Constraints

- 4-space indentation em todos os arquivos `.vue` e `.ts`
- Single quotes, semicolons obrigatórios (ESLint `@stylistic`)
- Ordem dos blocos em `.vue`: Template → Script → Style
- `defineProps<Interface>()` com `withDefaults()`
- `defineEmits<{ 'update:modelValue': [value: string] }>()`
- CSS variables do MaxStyle: `var(--max-primary-500)`, `var(--background-100)`, `var(--background-200)`, etc.
- Sem comentários desnecessários — apenas onde o "porquê" não é óbvio

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/components/MaxInputMarkdownToolbar.vue` | Criar | Toolbar com todos os grupos de botões |
| `src/components/MaxInputMarkdown.vue` | Criar | Componente principal WYSIWYG |
| `src/index.ts` | Modificar | Exportar `MaxInputMarkdown` |
| `tests/components/MaxInputMarkdown.test.ts` | Criar | Testes do componente |
| `package.json` | Modificar | Adicionar dependências Tiptap |

---

## Task 1: Instalar Dependências Tiptap

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: pacotes `@tiptap/*` e `tiptap-markdown` disponíveis em `node_modules`

- [ ] **Step 1: Instalar todas as dependências Tiptap**

```bash
cd /home/johnattas/GitHub/MaxComponentsUi
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-image @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-header @tiptap/extension-table-cell tiptap-markdown
```

Saída esperada: `added N packages` sem erros de conflito de peer dependency.

- [ ] **Step 2: Verificar instalação**

```bash
node -e "require('@tiptap/vue-3'); require('tiptap-markdown'); console.log('OK')"
```

Saída esperada: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install tiptap dependencies for MaxInputMarkdown"
```

---

## Task 2: Criar MaxInputMarkdownToolbar.vue

**Files:**
- Create: `src/components/MaxInputMarkdownToolbar.vue`

**Interfaces:**
- Consumes: `Editor` type from `@tiptap/core`
- Produces: componente `MaxInputMarkdownToolbar` com prop `editor: Editor | null` e emissão nenhuma (chama métodos diretamente no editor)

- [ ] **Step 1: Criar o arquivo da toolbar**

Criar `src/components/MaxInputMarkdownToolbar.vue` com o conteúdo completo abaixo.

A toolbar recebe a instância do Tiptap `Editor` como prop e chama métodos de formatação diretamente nela. Os popovers de Link e Imagem são divs simples controlados por `ref<boolean>`.

```vue
<template>
    <div class="md-toolbar" :class="{ 'md-toolbar--disabled': !editor }">
        <!-- Formatação inline -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('bold') }"
                title="Negrito (Ctrl+B)"
                @click="editor?.chain().focus().toggleBold().run()"
            >
                <MaxIcon icon="mdi:format-bold" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('italic') }"
                title="Itálico (Ctrl+I)"
                @click="editor?.chain().focus().toggleItalic().run()"
            >
                <MaxIcon icon="mdi:format-italic" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('underline') }"
                title="Sublinhado (Ctrl+U)"
                @click="editor?.chain().focus().toggleUnderline().run()"
            >
                <MaxIcon icon="mdi:format-underline" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('strike') }"
                title="Tachado"
                @click="editor?.chain().focus().toggleStrike().run()"
            >
                <MaxIcon icon="mdi:format-strikethrough" :size="1" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Títulos -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('heading', { level: 1 }) }"
                title="Título 1"
                @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
            >
                <MaxIcon icon="mdi:format-header-1" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('heading', { level: 2 }) }"
                title="Título 2"
                @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            >
                <MaxIcon icon="mdi:format-header-2" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('heading', { level: 3 }) }"
                title="Título 3"
                @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
            >
                <MaxIcon icon="mdi:format-header-3" :size="1" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Listas -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('bulletList') }"
                title="Lista com marcadores"
                @click="editor?.chain().focus().toggleBulletList().run()"
            >
                <MaxIcon icon="mdi:format-list-bulleted" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('orderedList') }"
                title="Lista numerada"
                @click="editor?.chain().focus().toggleOrderedList().run()"
            >
                <MaxIcon icon="mdi:format-list-numbered" :size="1" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Blocos -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('blockquote') }"
                title="Citação"
                @click="editor?.chain().focus().toggleBlockquote().run()"
            >
                <MaxIcon icon="mdi:format-quote-close" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('codeBlock') }"
                title="Bloco de código"
                @click="editor?.chain().focus().toggleCodeBlock().run()"
            >
                <MaxIcon icon="mdi:code-tags" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                title="Separador horizontal"
                @click="editor?.chain().focus().setHorizontalRule().run()"
            >
                <MaxIcon icon="mdi:minus" :size="1" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Link -->
        <div class="md-toolbar__group">
            <div class="md-toolbar__popover-anchor">
                <button
                    type="button"
                    class="md-toolbar__btn"
                    :class="{ active: editor?.isActive('link') }"
                    title="Link"
                    @click="openLinkPopover"
                >
                    <MaxIcon icon="mdi:link" :size="1" />
                </button>
                <div v-if="showLinkPopover" class="md-popover" @click.stop>
                    <input
                        ref="linkInputRef"
                        v-model="linkUrl"
                        class="md-popover__input"
                        placeholder="https://..."
                        @keydown.enter.prevent="applyLink"
                        @keydown.escape="showLinkPopover = false"
                    />
                    <button type="button" class="md-popover__btn md-popover__btn--primary" @click="applyLink">OK</button>
                    <button type="button" class="md-popover__btn" @click="removeLink">Remover</button>
                </div>
            </div>

            <!-- Imagem -->
            <div class="md-toolbar__popover-anchor">
                <button
                    type="button"
                    class="md-toolbar__btn"
                    title="Imagem"
                    @click="openImagePopover"
                >
                    <MaxIcon icon="mdi:image" :size="1" />
                </button>
                <div v-if="showImagePopover" class="md-popover" @click.stop>
                    <input
                        ref="imageInputRef"
                        v-model="imageUrl"
                        class="md-popover__input"
                        placeholder="https://..."
                        @keydown.enter.prevent="applyImage"
                        @keydown.escape="showImagePopover = false"
                    />
                    <button type="button" class="md-popover__btn md-popover__btn--primary" @click="applyImage">OK</button>
                </div>
            </div>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Tabela -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('table') }"
                title="Inserir tabela"
                @click="editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
            >
                <MaxIcon icon="mdi:table" :size="1" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Histórico -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                title="Desfazer (Ctrl+Z)"
                :disabled="!editor?.can().undo()"
                @click="editor?.chain().focus().undo().run()"
            >
                <MaxIcon icon="mdi:undo" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                title="Refazer (Ctrl+Y)"
                :disabled="!editor?.can().redo()"
                @click="editor?.chain().focus().redo().run()"
            >
                <MaxIcon icon="mdi:redo" :size="1" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                title="Limpar formatação"
                @click="editor?.chain().focus().unsetAllMarks().clearNodes().run()"
            >
                <MaxIcon icon="mdi:format-clear" :size="1" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, nextTick } from 'vue';
    import type { Editor } from '@tiptap/core';
    import MaxIcon from './MaxIcon.vue';

    const props = defineProps<{
        editor: Editor | null;
    }>();

    const showLinkPopover = ref(false);
    const linkUrl = ref('');
    const linkInputRef = ref<HTMLInputElement | null>(null);

    const showImagePopover = ref(false);
    const imageUrl = ref('');
    const imageInputRef = ref<HTMLInputElement | null>(null);

    const openLinkPopover = () => {
        const existing = props.editor?.getAttributes('link').href ?? '';
        linkUrl.value = existing;
        showLinkPopover.value = !showLinkPopover.value;
        showImagePopover.value = false;
        if (showLinkPopover.value) nextTick(() => linkInputRef.value?.focus());
    };

    const applyLink = () => {
        if (!linkUrl.value) {
            props.editor?.chain().focus().unsetLink().run();
        } else {
            props.editor?.chain().focus().setLink({ href: linkUrl.value, target: '_blank' }).run();
        }
        showLinkPopover.value = false;
        linkUrl.value = '';
    };

    const removeLink = () => {
        props.editor?.chain().focus().unsetLink().run();
        showLinkPopover.value = false;
        linkUrl.value = '';
    };

    const openImagePopover = () => {
        imageUrl.value = '';
        showImagePopover.value = !showImagePopover.value;
        showLinkPopover.value = false;
        if (showImagePopover.value) nextTick(() => imageInputRef.value?.focus());
    };

    const applyImage = () => {
        if (imageUrl.value) {
            props.editor?.chain().focus().setImage({ src: imageUrl.value }).run();
        }
        showImagePopover.value = false;
        imageUrl.value = '';
    };
</script>

<style lang="scss">
    .md-toolbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px;
        padding: 6px 8px;
        background: var(--background-50, rgb(0 0 0 / 1%));
        border-bottom: 1px solid var(--background-200, rgb(0 0 0 / 8%));
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;

        &__group {
            display: flex;
            align-items: center;
            gap: 1px;
        }

        &__divider {
            width: 1px;
            height: 20px;
            background: var(--background-200, rgb(0 0 0 / 10%));
            margin: 0 4px;
        }

        &__btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            border: none;
            border-radius: 4px;
            background: transparent;
            cursor: pointer;
            color: var(--background-600, #6b7280);
            transition: background 0.15s, color 0.15s;

            &:hover {
                background: var(--background-100, rgb(0 0 0 / 5%));
                color: var(--background-800, #1f2937);
            }

            &.active {
                background: var(--max-primary-100, #dbeafe);
                color: var(--max-primary-600, #2563eb);
            }

            &:disabled {
                opacity: 0.35;
                cursor: not-allowed;

                &:hover {
                    background: transparent;
                }
            }
        }

        &__popover-anchor {
            position: relative;
        }
    }

    .md-popover {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px;
        background: var(--background-0, #ffffff);
        border: 1px solid var(--background-200, rgb(0 0 0 / 10%));
        border-radius: 6px;
        box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
        min-width: 260px;

        &__input {
            flex: 1;
            padding: 4px 8px;
            border: 1px solid var(--background-300, rgb(0 0 0 / 15%));
            border-radius: 4px;
            font-size: 13px;
            outline: none;
            background: var(--background-0, #ffffff);
            color: inherit;

            &:focus {
                border-color: var(--max-primary-500, #3b82f6);
            }
        }

        &__btn {
            padding: 4px 10px;
            border: 1px solid var(--background-300, rgb(0 0 0 / 15%));
            border-radius: 4px;
            font-size: 13px;
            background: transparent;
            cursor: pointer;
            white-space: nowrap;
            color: inherit;

            &--primary {
                background: var(--max-primary-500, #3b82f6);
                border-color: var(--max-primary-500, #3b82f6);
                color: #ffffff;
            }
        }
    }
</style>
```

- [ ] **Step 2: Verificar que o arquivo foi criado**

```bash
ls src/components/MaxInputMarkdownToolbar.vue
```

Saída esperada: `src/components/MaxInputMarkdownToolbar.vue`

- [ ] **Step 3: Commit**

```bash
git add src/components/MaxInputMarkdownToolbar.vue
git commit -m "feat: add MaxInputMarkdownToolbar component"
```

---

## Task 3: Criar MaxInputMarkdown.vue

**Files:**
- Create: `src/components/MaxInputMarkdown.vue`

**Interfaces:**
- Consumes: `MaxInputMarkdownToolbar` (prop `editor: Editor | null`), `InputBase` (props padrão), `@tiptap/vue-3` (`useEditor`, `EditorContent`), `tiptap-markdown` (`Markdown`)
- Produces: componente `MaxInputMarkdown` com `v-model` string Markdown, props `minHeight`, `maxHeight`, `placeholder`, e todas as props do InputBase

- [ ] **Step 1: Criar MaxInputMarkdown.vue**

Criar `src/components/MaxInputMarkdown.vue`:

```vue
<template>
    <InputBase v-bind="inputBaseProps" class="max-input-markdown" :inLine="!!props.label">
        <div
            class="max-input-markdown__editor-wrap"
            :class="{ 'max-input-markdown__editor-wrap--disabled': props.disabled }"
            @click.stop="closePopovers"
        >
            <MaxInputMarkdownToolbar :editor="editor ?? null" />
            <EditorContent
                class="max-input-markdown__content"
                :style="{ minHeight: props.minHeight, maxHeight: props.maxHeight }"
                :editor="editor"
            />
        </div>
    </InputBase>
</template>

<script setup lang="ts">
    import { computed, onBeforeUnmount, watch } from 'vue';
    import { useEditor, EditorContent } from '@tiptap/vue-3';
    import StarterKit from '@tiptap/starter-kit';
    import Underline from '@tiptap/extension-underline';
    import Link from '@tiptap/extension-link';
    import Image from '@tiptap/extension-image';
    import Table from '@tiptap/extension-table';
    import TableRow from '@tiptap/extension-table-row';
    import TableHeader from '@tiptap/extension-table-header';
    import TableCell from '@tiptap/extension-table-cell';
    import { Markdown } from 'tiptap-markdown';
    import InputBase from './InputBase.vue';
    import MaxInputMarkdownToolbar from './MaxInputMarkdownToolbar.vue';

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            label?: string;
            icon?: string;
            i?: string;
            disabled?: boolean;
            float?: boolean;
            msg?: string;
            message?: string;
            iconMessage?: string;
            done?: boolean;
            error?: string | boolean;
            caution?: string | boolean;
            required?: boolean;
            placeholder?: string;
            minHeight?: string;
            maxHeight?: string;
        }>(),
        {
            modelValue: '',
            disabled: false,
            minHeight: '200px',
            maxHeight: '500px',
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
    }>();

    const inputBaseProps = computed(() => ({
        label: props.label,
        icon: props.icon,
        i: props.i,
        disabled: props.disabled,
        float: props.float,
        msg: props.msg,
        message: props.message,
        iconMessage: props.iconMessage,
        done: props.done,
        error: props.error,
        caution: props.caution,
        required: props.required,
    }));

    const editor = useEditor({
        content: props.modelValue,
        editable: !props.disabled,
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false }),
            Image,
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
            Markdown.configure({
                html: false,
                tightLists: true,
                bulletListMarker: '-',
                transformPastedText: true,
            }),
        ],
        editorProps: {
            attributes: {
                class: 'max-input-markdown__prosemirror',
                ...(props.placeholder ? { 'data-placeholder': props.placeholder } : {}),
            },
        },
        onUpdate: ({ editor: e }) => {
            emit('update:modelValue', e.storage.markdown.getMarkdown());
        },
    });

    const closePopovers = () => {
        // fecha popovers ao clicar fora deles (evento de clique no wrapper)
    };

    watch(
        () => props.modelValue,
        (val) => {
            if (!editor.value) return;
            const current = editor.value.storage.markdown.getMarkdown();
            if (val !== current) editor.value.commands.setContent(val ?? '');
        }
    );

    watch(
        () => props.disabled,
        (val) => editor.value?.setEditable(!val)
    );

    onBeforeUnmount(() => editor.value?.destroy());
</script>

<style lang="scss">
    .max-input-markdown {
        .max-input-markdown__editor-wrap {
            width: 100%;
            border-radius: inherit;
            overflow: hidden;

            &--disabled {
                opacity: 0.6;
                pointer-events: none;
            }
        }

        .max-input-markdown__content {
            overflow-y: auto;
            cursor: text;

            &:focus-within {
                outline: none;
            }
        }

        .max-input-markdown__prosemirror {
            padding: 12px 16px;
            outline: none;
            min-height: inherit;

            &.ProseMirror-focused {
                outline: none;
            }

            // Placeholder
            &:before {
                content: attr(data-placeholder);
                color: var(--background-400, #9ca3af);
                pointer-events: none;
                position: absolute;
                display: none;
            }

            &.is-empty:before {
                display: block;
            }

            // Headings
            h1 {
                font-size: 1.8em;
                font-weight: 700;
                margin: 0.6em 0 0.3em;
                line-height: 1.2;
            }

            h2 {
                font-size: 1.5em;
                font-weight: 600;
                margin: 0.6em 0 0.3em;
                line-height: 1.3;
            }

            h3 {
                font-size: 1.25em;
                font-weight: 600;
                margin: 0.5em 0 0.3em;
                line-height: 1.3;
            }

            // Inline
            strong { font-weight: 700; }
            em { font-style: italic; }
            u { text-decoration: underline; }
            s { text-decoration: line-through; }

            // Code inline
            code {
                background: var(--background-100, rgb(0 0 0 / 4%));
                border-radius: 3px;
                padding: 1px 5px;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 0.9em;
            }

            // Code block
            pre {
                background: var(--background-100, rgb(0 0 0 / 4%));
                border: 1px solid var(--background-300, rgb(0 0 0 / 10%));
                border-radius: 6px;
                padding: 12px 16px;
                overflow-x: auto;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 0.9em;
                margin: 0.8em 0;

                code {
                    background: none;
                    padding: 0;
                    border-radius: 0;
                    font-size: 1em;
                }
            }

            // Blockquote
            blockquote {
                border-left: 4px solid var(--max-primary-400, #60a5fa);
                padding-left: 14px;
                margin: 0.8em 0;
                color: var(--background-600, #6b7280);
                font-style: italic;
            }

            // Links
            a {
                color: var(--max-primary-500, #3b82f6);
                text-decoration: underline;
                cursor: pointer;
            }

            // Lists
            ul,
            ol {
                padding-left: 1.4em;
                margin: 0.5em 0;
            }

            ul { list-style-type: disc; }
            ol { list-style-type: decimal; }

            li { margin: 0.2em 0; }

            // Horizontal rule
            hr {
                border: none;
                border-top: 1px solid var(--background-300, rgb(0 0 0 / 10%));
                margin: 1em 0;
            }

            // Images
            img {
                max-width: 100%;
                height: auto;
                border-radius: 4px;
            }

            // Tables
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 0.8em 0;

                th,
                td {
                    border: 1px solid var(--background-200, rgb(0 0 0 / 8%));
                    padding: 6px 10px;
                    text-align: left;
                }

                th {
                    background: var(--background-100, rgb(0 0 0 / 4%));
                    font-weight: 600;
                }

                tr:nth-child(even) td {
                    background: var(--background-50, rgb(0 0 0 / 2%));
                }
            }

            // Paragraph spacing
            p {
                margin: 0.4em 0;
                line-height: 1.6;

                &:first-child { margin-top: 0; }
                &:last-child { margin-bottom: 0; }
            }
        }
    }
</style>
```

- [ ] **Step 2: Verificar que o arquivo foi criado**

```bash
ls src/components/MaxInputMarkdown.vue
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MaxInputMarkdown.vue
git commit -m "feat: add MaxInputMarkdown WYSIWYG component"
```

---

## Task 4: Registrar no src/index.ts e Regenerar Resolver

**Files:**
- Modify: `src/index.ts`
- Modify: `src/components-manifest.json` (gerado automaticamente)

**Interfaces:**
- Consumes: `MaxInputMarkdown` exportado de `./components/MaxInputMarkdown.vue`
- Produces: `MaxInputMarkdown` disponível para importação de `@maxvue/max-components-ui`

- [ ] **Step 1: Adicionar export em src/index.ts**

Localizar no `src/index.ts` a linha com `MaxInputTextArea` e adicionar logo abaixo:

```ts
export { default as MaxInputMarkdown } from './components/MaxInputMarkdown.vue';
```

A seção de Inputs no `src/index.ts` ficará assim (apenas as linhas relevantes):

```ts
export { default as MaxInputTextArea } from './components/MaxInputTextArea.vue';
export { default as MaxInputTextList } from './components/MaxInputTextList.vue';
export { default as MaxInputMarkdown } from './components/MaxInputMarkdown.vue';
```

- [ ] **Step 2: Regenerar o manifesto do resolver**

```bash
npx tsx src/scripts/generateResolver.ts
```

Saída esperada: mensagem indicando que o manifest foi gerado/atualizado sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts src/components-manifest.json
git commit -m "feat: register MaxInputMarkdown in library exports"
```

---

## Task 5: Escrever Testes

**Files:**
- Create: `tests/components/MaxInputMarkdown.test.ts`

**Interfaces:**
- Consumes: `MaxInputMarkdown` de `../../src/components/MaxInputMarkdown.vue`

> **Nota sobre Tiptap em testes:** O Tiptap usa ProseMirror que manipula DOM. Em happy-dom, o editor inicializa mas pode não disparar eventos nativos de input. Os testes cobrem a interface do componente (renderização, props, structure) e stub o editor para casos de emissão.

- [ ] **Step 1: Criar o arquivo de testes**

Criar `tests/components/MaxInputMarkdown.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar os testes**

```bash
npx vitest run tests/components/MaxInputMarkdown.test.ts
```

Saída esperada: todos os testes passando (6 passed).

- [ ] **Step 3: Commit**

```bash
git add tests/components/MaxInputMarkdown.test.ts
git commit -m "test: add MaxInputMarkdown component tests"
```

---

## Task 6: Build Final

**Files:**
- Nenhum arquivo modificado — apenas verificação

- [ ] **Step 1: Type check**

```bash
npm run type-check
```

Saída esperada: sem erros de tipagem.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Saída esperada: sem erros de lint (warnings são aceitáveis).

- [ ] **Step 3: Build**

```bash
npm run build
```

Saída esperada: build completo em `dist/` sem erros. Confirmar que `dist/index.es.js` existe.

- [ ] **Step 4: Commit final**

```bash
git add dist/
git commit -m "build: include MaxInputMarkdown in library dist"
```
