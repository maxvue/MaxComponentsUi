<template>
    <div class="md-toolbar" :class="{ 'md-toolbar--disabled': !editor }">
        <span v-if="props.label" class="md-toolbar__label">{{ props.label }}</span>
        <div v-if="props.label" class="md-toolbar__divider" />
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
    import { isSafeUrl } from '../helpers/isSafeUrl';

    const props = defineProps<{
        editor: Editor | null;
        label?: string;
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
        if (!linkUrl.value) props.editor?.chain().focus().unsetLink().run();
        else if (isSafeUrl(linkUrl.value)) props.editor?.chain().focus().setLink({ href: linkUrl.value, target: '_blank' }).run();


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
        if (imageUrl.value && isSafeUrl(imageUrl.value)) props.editor?.chain().focus().setImage({ src: imageUrl.value }).run();


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

        &__label {
            font-size: 0.8em;
            font-weight: 600;
            color: var(--background-500, #6b7280);
            white-space: nowrap;
            padding: 0 4px;
        }

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
        background: var(--background-0, #fff);
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
            background: var(--background-0, #fff);
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
                color: #fff;
            }
        }
    }
</style>
