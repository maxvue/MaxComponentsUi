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

        <!-- Visualizador Modal de Imagem (Lightbox) -->
        <Teleport to="body">
            <Transition name="max-fade">
                <div
                    v-if="isImageModalOpen"
                    class="max-image-preview-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Visualizador de Imagem"
                    tabindex="-1"
                    @click.self="closeImage"
                >
                    <div class="max-image-preview-modal__toolbar">
                        <button type="button" class="max-image-preview-modal__btn" title="Diminuir Zoom" @click="zoomOutImage">
                            <MaxIcon icon="iconamoon:zoom-out-light" :size="1.2" color="currentColor" />
                        </button>
                        <button type="button" class="max-image-preview-modal__btn" title="Resetar Zoom" @click="resetImageZoom">
                            <span>{{ Math.round(imageZoom * 100) }}%</span>
                        </button>
                        <button type="button" class="max-image-preview-modal__btn" title="Aumentar Zoom" @click="zoomInImage">
                            <MaxIcon icon="lucide:zoom-in" :size="1.2" color="currentColor" />
                        </button>
                        <a
                            v-if="activeImageSrc && isSafeUrl(activeImageSrc)"
                            :href="activeImageSrc"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="max-image-preview-modal__btn"
                            title="Abrir original em nova aba"
                        >
                            <MaxIcon icon="mdi:open-in-new" :size="1.2" color="currentColor" />
                        </a>
                        <button type="button" class="max-image-preview-modal__btn max-image-preview-modal__btn--close" title="Fechar (Esc)" @click="closeImage">
                            <MaxIcon icon="ic:round-close" :size="1.3" color="currentColor" />
                        </button>
                    </div>
                    <div class="max-image-preview-modal__content" @click.self="closeImage">
                        <img
                            :src="activeImageSrc"
                            :alt="activeImageAlt"
                            class="max-image-preview-modal__img"
                            :style="{ transform: `scale(${imageZoom})` }"
                        />
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Visualizador Modal de PDF -->
        <MaxPdfView :file="activePdfUrl" />
    </InputBase>
</template>

<script setup lang="ts">
    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
    import MaxPdfView from './MaxPdfView.vue';
    import MaxIcon from './MaxIcon.vue';
    import InputBase from './InputBase.vue';
    import { isSafeUrl } from '../helpers/isSafeUrl';
    import { useScrollLock } from '../helpers/useScrollLock';

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
            /** Habilita ou desabilita a verificação ortográfica nativa */
            spellcheck?: boolean;
            minHeight?: string;
            maxHeight?: string;
            onImageUpload?: (file: File) => Promise<string>;
            onFileUpload?: (file: File) => Promise<string>;
        }>(),
        {
            modelValue: '',
            disabled: false,
            inLine: false,
            spellcheck: true,
            minHeight: '200px',
            maxHeight: '500px',
            onImageUpload: undefined,
            onFileUpload: undefined
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'paste-image': [file: File];
        'paste-file': [file: File];
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

    const isImageModalOpen = ref(false);
    const activeImageSrc = ref('');
    const activeImageAlt = ref('');
    const imageZoom = ref(1);

    const activePdfUrl = ref('');

    const scrollLock = useScrollLock();

    const onImageModalEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isImageModalOpen.value) closeImage();
    };

    const openImage = (src: string, alt = '') => {
        activeImageSrc.value = src;
        activeImageAlt.value = alt;
        imageZoom.value = 1;
        isImageModalOpen.value = true;
        scrollLock.lock();
        document.addEventListener('keydown', onImageModalEscape);
    };

    const closeImage = () => {
        isImageModalOpen.value = false;
        activeImageSrc.value = '';
        activeImageAlt.value = '';
        scrollLock.unlock();
        document.removeEventListener('keydown', onImageModalEscape);
    };

    const zoomInImage = () => {
        imageZoom.value = Math.min(Number((imageZoom.value + 0.25).toFixed(2)), 3);
    };

    const zoomOutImage = () => {
        imageZoom.value = Math.max(Number((imageZoom.value - 0.25).toFixed(2)), 0.5);
    };

    const resetImageZoom = () => {
        imageZoom.value = 1;
    };

    const isPdfUrl = (url: string): boolean => {
        if (!url) return false;
        try {
            const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
            return cleanUrl.endsWith('.pdf') || url.toLowerCase().includes('.pdf');
        } catch {
            return false;
        }
    };

    const openPdf = (url: string) => {
        activePdfUrl.value = '';
        nextTick(() => {
            activePdfUrl.value = url;
        });
    };

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

    const insertPdfFile = (file: File) => {
        emit('paste-file', file);

        const uploadFn = props.onFileUpload || props.onImageUpload;
        if (uploadFn) uploadFn(file).then((url) => {
            if (url && isSafeUrl(url)) {
                const label = file.name || 'Documento PDF';
                editor.value?.chain().focus().insertContent(`[${label}](${url}) `).run();
            }
        }).catch((err) => {
            console.error('Erro ao processar upload do PDF:', err);
        });

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
            } else if (item.type === 'application/pdf') {
                const file = item.getAsFile();
                if (file) {
                    insertPdfFile(file);
                    handled = true;
                }
            }
        }


        if (!handled && clipboardData.files && clipboardData.files.length > 0) for (let i = 0; i < clipboardData.files.length; i++) {
            const file = clipboardData.files[i];
            if (file.type.startsWith('image/')) {
                insertImageFile(file);
                handled = true;
            } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                insertPdfFile(file);
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
            } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                insertPdfFile(file);
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
                spellcheck: props.spellcheck ? 'true' : 'false',
                ...(props.placeholder ? { 'data-placeholder': props.placeholder } : {})
            },
            handleClick: (_view, _pos, event) => {
                const target = event.target as HTMLElement | null;
                if (!target) return false;

                // 1. Clique em imagem: abre modal lightbox
                if (target.tagName === 'IMG') {
                    const src = target.getAttribute('src');
                    const alt = target.getAttribute('alt') || '';
                    if (src) {
                        openImage(src, alt);
                        event.preventDefault();
                        return true;
                    }
                }

                // 2. Clique em link PDF: abre MaxPdfView
                const linkEl = target.closest('a');
                if (linkEl) {
                    const href = linkEl.getAttribute('href');
                    if (href && isPdfUrl(href)) {
                        event.preventDefault();
                        event.stopPropagation();
                        openPdf(href);
                        return true;
                    }
                }

                return false;
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

    onBeforeUnmount(() => {
        document.removeEventListener('keydown', onImageModalEscape);
        if (isImageModalOpen.value) scrollLock.unlock();
        editor.value?.destroy();
    });

    defineExpose({
        editor,
        openImage,
        closeImage,
        openPdf,
        isImageModalOpen,
        activeImageSrc,
        activePdfUrl
    });
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

            // Links (Padrão e PDF)
            a {
                color: var(--max-primary-600, #2563eb);
                text-decoration: underline;
                text-underline-offset: 2px;
                cursor: pointer;

                &:hover {
                    color: var(--max-primary-700, #1d4ed8);
                }

                // Estilização diferenciada para links de PDF (card/chip com ícone de documento)
                &[href*='.pdf'],
                &[href$='.pdf'] {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 3px 10px;
                    background: var(--background-100, #f3f4f6);
                    border: 1px solid var(--background-300, #d1d5db);
                    border-radius: 6px;
                    color: var(--red-700, #dc2626) !important;
                    text-decoration: none !important;
                    font-weight: 500;
                    font-size: 0.9em;
                    line-height: 1.4;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    vertical-align: middle;
                    margin: 2px 4px 2px 0;

                    &::before {
                        content: '';
                        display: inline-block;
                        width: 16px;
                        height: 16px;
                        flex-shrink: 0;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23dc2626' d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-9.5 8.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5V9H8c.83 0 1.5.67 1.5 1.5zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V9H13c.83 0 1.5.67 1.5 1.5zm4-3.5H17v1.5h1.5V13H17v2h-1.5V9h3zM7 10.5h1v1H7zm5.5 0h1v3h-1z'/%3E%3C/svg%3E");
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                    }

                    &:hover {
                        background: var(--background-200, #e5e7eb);
                        border-color: var(--red-500, #ef4444);
                        color: var(--red-800, #991b1b) !important;
                        box-shadow: 0 2px 6px rgb(220 38 38 / 15%);
                        transform: translateY(-1px);
                    }
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

            // Imagens renderizadas como Miniaturas (Thumbnails)
            img {
                max-width: 240px;
                max-height: 160px;
                width: auto;
                height: auto;
                object-fit: cover;
                border-radius: 8px;
                border: 1px solid var(--background-300, #d1d5db);
                box-shadow: 0 2px 6px rgb(0 0 0 / 6%);
                cursor: zoom-in;
                transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                display: inline-block;
                margin: 0.5rem 0;
                vertical-align: middle;

                &:hover {
                    transform: scale(1.02);
                    box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
                    border-color: var(--max-primary-500, #3b82f6);
                }
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

    // Estilos do Modal Lightbox de Imagem
    .max-image-preview-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background-color: rgb(0 0 0 / 85%);
        backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        outline: none;

        &__toolbar {
            position: absolute;
            top: 24px;
            right: 24px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgb(30 41 59 / 85%);
            backdrop-filter: blur(6px);
            padding: 6px 12px;
            border-radius: 10px;
            border: 1px solid rgb(255 255 255 / 15%);
            box-shadow: 0 4px 16px rgb(0 0 0 / 30%);
            z-index: 10;
        }

        &__btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 32px;
            min-width: 32px;
            padding: 0 8px;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: rgb(255 255 255 / 85%);
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.15s ease;
            text-decoration: none;
            box-sizing: border-box;

            &:hover {
                background: rgb(255 255 255 / 20%);
                color: #fff;
            }

            &--close {
                margin-left: 4px;
                border-left: 1px solid rgb(255 255 255 / 20%);
                padding-left: 10px;

                &:hover {
                    background: rgb(239 68 68 / 80%);
                    color: #fff;
                }
            }
        }

        &__content {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
        }

        &__img {
            max-width: 90vw;
            max-height: 85vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 12px 40px rgb(0 0 0 / 50%);
            transition: transform 0.2s ease-out;
            user-select: none;
        }
    }

    .max-fade-enter-active,
    .max-fade-leave-active {
        transition: opacity 0.25s ease;
    }

    .max-fade-enter-from,
    .max-fade-leave-to {
        opacity: 0;
    }
</style>
