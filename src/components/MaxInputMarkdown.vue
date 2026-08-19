<template>
    <InputBase v-bind="inputBaseProps" class="max-input-markdown">
        <div class="max-input-markdown__editor-wrap" :class="{ 'max-input-markdown__editor-wrap--disabled': props.disabled }">
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
    import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
    import { useEditor, EditorContent } from '@tiptap/vue-3';
    import StarterKit from '@tiptap/starter-kit';
    import Underline from '@tiptap/extension-underline';
    import Link from '@tiptap/extension-link';
    import Image from '@tiptap/extension-image';
    import { Table } from '@tiptap/extension-table';
    import TableRow from '@tiptap/extension-table-row';
    import TableHeader from '@tiptap/extension-table-header';
    import TableCell from '@tiptap/extension-table-cell';
    import { Markdown } from 'tiptap-markdown';
    import MaxInputMarkdownToolbar from './MaxInputMarkdownToolbar.vue';
    import InputBase from './InputBase.vue';
    import { isSafeUrl } from '../helpers/isSafeUrl';

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            label?: string;
            icon?: string;
            i?: string;
            disabled?: boolean;
            float?: boolean;
            inLine?: boolean;
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
            onImageUpload?: (file: File) => Promise<string>;
        }>(),
        {
            modelValue: '',
            disabled: false,
            inLine: false,
            minHeight: '200px',
            maxHeight: '500px',
            onImageUpload: undefined
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'paste-image': [file: File];
    }>();

    const inputBaseProps = computed(() => ({
        label: props.label,
        icon: props.icon,
        i: props.i,
        disabled: props.disabled,
        float: props.float,
        inLine: props.inLine,
        msg: props.msg,
        message: props.message,
        iconMessage: props.iconMessage,
        done: props.done,
        error: props.error,
        caution: props.caution,
        required: props.required
    }));

    const insertImageFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;

        emit('paste-image', file);

        if (props.onImageUpload) {
            props.onImageUpload(file).then((url) => {
                if (url && isSafeUrl(url)) editor.value?.chain().focus().setImage({ src: url }).run();

            }).catch((err) => {
                console.error('Erro ao processar upload da imagem:', err);
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            if (base64) editor.value?.chain().focus().setImage({ src: base64 }).run();

        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (_view: any, event: ClipboardEvent) => {
        if (props.disabled) return false;
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const items = clipboardData.items;
        let handled = false;

        if (items && items.length > 0) for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    insertImageFile(file);
                    handled = true;
                }
            }
        }


        if (!handled && clipboardData.files && clipboardData.files.length > 0) for (let i = 0; i < clipboardData.files.length; i++) {
            const file = clipboardData.files[i];
            if (file.type.startsWith('image/')) {
                insertImageFile(file);
                handled = true;
            }
        }


        if (handled) {
            event.preventDefault();
            return true;
        }

        return false;
    };

    const handleDrop = (_view: any, event: DragEvent, _slice: any, moved: boolean) => {
        if (moved || props.disabled) return false;
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        let handled = false;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                insertImageFile(file);
                handled = true;
            }
        }

        if (handled) {
            event.preventDefault();
            return true;
        }

        return false;
    };

    const editor = useEditor({
        content: '',
        editable: !props.disabled,
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                protocols: ['http', 'https', 'mailto', 'tel'],
                isAllowedUri: (url) => isSafeUrl(url)
            }),
            Image,
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
            Markdown.configure({
                html: false,
                tightLists: true,
                bulletListMarker: '-',
                transformPastedText: true
            })
        ],
        editorProps: {
            attributes: {
                class: 'max-input-markdown__prosemirror',
                ...(props.placeholder ? { 'data-placeholder': props.placeholder } : {})
            },
            handlePaste: (view, event) => handlePaste(view, event),
            handleDrop: (view, event, slice, moved) => handleDrop(view, event, slice, moved)
        },
        onUpdate: ({ editor: e }) => {
            emit('update:modelValue', (e.storage as Record<string, any>).markdown.getMarkdown());
        }
    });

    onMounted(() => {
        if (props.modelValue) editor.value?.commands.setContent(props.modelValue);
    });

    watch(
        () => props.modelValue,
        (val) => {
            if (!editor.value) return;
            const current = (editor.value.storage as Record<string, any>).markdown.getMarkdown();
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
        &.max-input-main-div {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            grid-template-rows: auto auto !important;
            height: auto !important;
            width: 100%;
            position: relative;

            .max-input-field-div {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
                height: auto !important;
                min-height: 120px;
                padding: 0 !important;
                position: relative;
                overflow: visible !important;
                background-color: var(--background-0, #fff);
                border-radius: 8px;
                outline: 1px solid var(--background-300, #d1d5db) !important;
                transition: outline 0.15s ease-in-out;

                &:focus-within {
                    outline: 1px solid var(--blue-700, #2563eb) !important;
                }

                .input-slot-div {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    min-height: unset !important;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }

                .input-status-icon {
                    top: 8px;
                    right: 8px;
                    z-index: 10;
                }
            }

            // Reseta regras invasivas que possam vir de classes irmas
            div, span {
                height: auto;
            }
        }

        .max-input-markdown__editor-wrap {
            width: 100%;
            display: flex;
            flex-direction: column;
            border-radius: inherit;
            position: relative;
            overflow: visible;

            &--disabled {
                opacity: 0.6;
                pointer-events: none;
                background-color: var(--background-75, #f3f4f6);
            }
        }

        .max-input-markdown__content {
            flex: 1;
            overflow-y: auto;
            cursor: text;
            width: 100%;
            box-sizing: border-box;

            &:focus-within {
                outline: none;
            }
        }

        .max-input-markdown__prosemirror {
            padding: 12px 16px;
            outline: none;
            min-height: inherit;
            font-family: inherit;
            font-size: 0.95rem;
            line-height: 1.6;
            color: var(--background-900, #1f2937);
            box-sizing: border-box;
            position: relative;

            &.ProseMirror-focused {
                outline: none;
            }

            // Placeholder
            &[data-placeholder] {
                &.is-editor-empty::before,
                &.is-empty::before,
                > p:first-child:empty::before,
                &:has(> p:only-child > br:only-child)::before {
                    content: attr(data-placeholder);
                    color: var(--background-400, #9ca3af);
                    pointer-events: none;
                    position: absolute;
                    float: left;
                    height: 0;
                }
            }

            // Headings
            h1, h2, h3, h4, h5, h6 {
                color: var(--background-950, #111827);
                font-weight: 700;
                line-height: 1.3;
                margin: 1.25rem 0 0.5rem;

                &:first-child {
                    margin-top: 0;
                }
            }

            h1 { font-size: 1.75rem; }
            h2 { font-size: 1.4rem; }
            h3 { font-size: 1.15rem; }
            h4 { font-size: 1rem; }

            // Paragraphs
            p {
                margin: 0.5rem 0;
                line-height: 1.6;

                &:first-child { margin-top: 0; }
                &:last-child { margin-bottom: 0; }
            }

            // Inline
            strong, b { font-weight: 700; color: inherit; }
            em, i { font-style: italic; }
            u { text-decoration: underline; text-underline-offset: 2px; }
            s, del, strike { text-decoration: line-through; }

            // Inline code
            code {
                background: var(--background-100, #f3f4f6);
                color: var(--max-primary-700, #1d4ed8);
                border: 1px solid var(--background-200, #e5e7eb);
                border-radius: 4px;
                padding: 2px 6px;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 0.875em;
            }

            // Code block
            pre {
                background: var(--background-900, #1e293b);
                color: var(--background-50, #f8fafc);
                border-radius: 8px;
                padding: 12px 16px;
                overflow-x: auto;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: 0.875rem;
                line-height: 1.5;
                margin: 0.75rem 0;

                code {
                    background: transparent;
                    border: none;
                    padding: 0;
                    color: inherit;
                    font-size: inherit;
                }
            }

            // Blockquote
            blockquote {
                border-left: 4px solid var(--max-primary-500, #3b82f6);
                padding: 4px 12px 4px 16px;
                margin: 0.75rem 0;
                color: var(--background-600, #4b5563);
                font-style: italic;
                background: var(--background-50, #f9fafb);
                border-radius: 0 6px 6px 0;

                p {
                    margin: 0.25rem 0;
                }
            }

            // Links
            a {
                color: var(--max-primary-600, #2563eb);
                text-decoration: underline;
                text-underline-offset: 2px;
                cursor: pointer;

                &:hover {
                    color: var(--max-primary-700, #1d4ed8);
                }
            }

            // Lists
            ul, ol {
                padding-left: 1.5rem;
                margin: 0.5rem 0;

                li {
                    margin: 0.25rem 0;

                    > p {
                        margin: 0;
                    }
                }
            }

            ul { list-style-type: disc; }
            ol { list-style-type: decimal; }

            // Horizontal rule
            hr {
                border: none;
                border-top: 1px solid var(--background-250, #e5e7eb);
                margin: 1.25rem 0;
            }

            // Images
            img {
                max-width: 100%;
                height: auto;
                border-radius: 6px;
                margin: 0.5rem 0;
                display: inline-block;
            }

            // Tables
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 0.75rem 0;
                overflow: hidden;
                border-radius: 6px;
                border: 1px solid var(--background-300, #d1d5db);

                th, td {
                    border: 1px solid var(--background-250, #e5e7eb);
                    padding: 8px 12px;
                    text-align: left;
                    vertical-align: top;
                    box-sizing: border-box;
                    position: relative;
                    min-width: 80px;
                }

                th {
                    background: var(--background-100, #f3f4f6);
                    font-weight: 600;
                    color: var(--background-800, #1f2937);
                }

                tr:nth-child(even) td {
                    background: var(--background-50, #f9fafb);
                }

                .selectedCell::after {
                    z-index: 2;
                    position: absolute;
                    content: '';
                    inset: 0;
                    background: rgb(59 130 246 / 15%);
                    pointer-events: none;
                }
            }
        }
    }
</style>
