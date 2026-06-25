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

    const closePopovers = () => {};

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
