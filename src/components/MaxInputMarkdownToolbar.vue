<template>
    <div
        ref="toolbarRef"
        class="max-input-markdown-toolbar md-toolbar"
        :class="{ 'md-toolbar--disabled': !editor || editor.isEditable === false }"
        role="toolbar"
        aria-label="Barra de ferramentas de formatação markdown"
        @keydown="onToolbarKeydown"
    >
        <span v-if="props.label" class="md-toolbar__label">{{ props.label }}</span>
        <span v-if="props.label" class="md-toolbar__divider" />

        <!-- Formatação inline -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('bold') }"
                :aria-pressed="Boolean(editor?.isActive('bold'))"
                title="Negrito (Ctrl+B)"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleBold().run()"
            >
                <MaxIcon icon="mdi:format-bold" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('italic') }"
                :aria-pressed="Boolean(editor?.isActive('italic'))"
                title="Itálico (Ctrl+I)"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleItalic().run()"
            >
                <MaxIcon icon="mdi:format-italic" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('underline') }"
                :aria-pressed="Boolean(editor?.isActive('underline'))"
                title="Sublinhado (Ctrl+U)"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleUnderline().run()"
            >
                <MaxIcon icon="mdi:format-underline" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('strike') }"
                :aria-pressed="Boolean(editor?.isActive('strike'))"
                title="Tachado"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleStrike().run()"
            >
                <MaxIcon icon="mdi:format-strikethrough" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Títulos -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('heading', { level: 1 }) }"
                :aria-pressed="Boolean(editor?.isActive('heading', { level: 1 }))"
                title="Título 1"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
            >
                <MaxIcon icon="mdi:format-header-1" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('heading', { level: 2 }) }"
                :aria-pressed="Boolean(editor?.isActive('heading', { level: 2 }))"
                title="Título 2"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            >
                <MaxIcon icon="mdi:format-header-2" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('heading', { level: 3 }) }"
                :aria-pressed="Boolean(editor?.isActive('heading', { level: 3 }))"
                title="Título 3"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
            >
                <MaxIcon icon="mdi:format-header-3" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Listas -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('bulletList') }"
                :aria-pressed="Boolean(editor?.isActive('bulletList'))"
                title="Lista com marcadores"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleBulletList().run()"
            >
                <MaxIcon icon="mdi:format-list-bulleted" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('orderedList') }"
                :aria-pressed="Boolean(editor?.isActive('orderedList'))"
                title="Lista numerada"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleOrderedList().run()"
            >
                <MaxIcon icon="mdi:format-list-numbered" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Blocos -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('blockquote') }"
                :aria-pressed="Boolean(editor?.isActive('blockquote'))"
                title="Citação"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleBlockquote().run()"
            >
                <MaxIcon icon="mdi:format-quote-close" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('codeBlock') }"
                :aria-pressed="Boolean(editor?.isActive('codeBlock'))"
                title="Bloco de código"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleCodeBlock().run()"
            >
                <MaxIcon icon="mdi:code-tags" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                title="Separador horizontal"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().setHorizontalRule().run()"
            >
                <MaxIcon icon="mdi:minus" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Mídia: Link e Imagem -->
        <div class="md-toolbar__group">
            <div ref="linkPopoverRef" class="md-toolbar__popover-anchor">
                <button
                    type="button"
                    class="md-toolbar__btn"
                    :class="{ active: editor?.isActive('link') }"
                    title="Link"
                    :disabled="!editor || editor.isEditable === false"
                    @click="openLinkPopover"
                >
                    <MaxIcon icon="mdi:link" :size="1.1" color="currentColor" />
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

            <div ref="imagePopoverRef" class="md-toolbar__popover-anchor">
                <button
                    type="button"
                    class="md-toolbar__btn"
                    title="Imagem"
                    :disabled="!editor || editor.isEditable === false"
                    @click="openImagePopover"
                >
                    <MaxIcon icon="mdi:image" :size="1.1" color="currentColor" />
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

            <button
                type="button"
                class="md-toolbar__btn"
                :class="{ active: editor?.isActive('table') }"
                title="Inserir tabela"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
            >
                <MaxIcon icon="mdi:table" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span class="md-toolbar__divider"></span>

        <!-- Histórico e Limpeza -->
        <div class="md-toolbar__group">
            <button
                type="button"
                class="md-toolbar__btn"
                title="Desfazer (Ctrl+Z)"
                :disabled="!editor || editor.isEditable === false || !editor.can().undo()"
                @click="editor?.chain().focus().undo().run()"
            >
                <MaxIcon icon="mdi:undo" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                title="Refazer (Ctrl+Y)"
                :disabled="!editor || editor.isEditable === false || !editor.can().redo()"
                @click="editor?.chain().focus().redo().run()"
            >
                <MaxIcon icon="mdi:redo" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="md-toolbar__btn"
                title="Limpar formatação"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().unsetAllMarks().clearNodes().run()"
            >
                <MaxIcon icon="mdi:format-clear" :size="1.1" color="currentColor" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, nextTick, onMounted } from 'vue';
    import { onClickOutside } from '@vueuse/core';
    import type { Editor } from '@tiptap/core';
    import MaxIcon from './MaxIcon.vue';
    import { isSafeUrl } from '../helpers/isSafeUrl';

    const props = defineProps<{
        editor: Editor | null;
        label?: string;
    }>();

    const toolbarRef = ref<HTMLElement | null>(null);

    const getFocusableItems = (): HTMLElement[] => {
        if (!toolbarRef.value) return [];
        return Array.from(toolbarRef.value.querySelectorAll<HTMLElement>('.md-toolbar__btn:not(:disabled)'));
    };

    const onToolbarKeydown = (event: KeyboardEvent) => {
        const items = getFocusableItems();
        if (items.length === 0) return;

        const activeEl = document.activeElement as HTMLElement | null;
        const currentIndex = activeEl ? items.indexOf(activeEl) : -1;

        let targetIndex = -1;

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown': {
                event.preventDefault();
                targetIndex = currentIndex >= 0 ? (currentIndex + 1) % items.length : 0;
                break;
            }
            case 'ArrowLeft':
            case 'ArrowUp': {
                event.preventDefault();
                targetIndex = currentIndex >= 0 ? (currentIndex - 1 + items.length) % items.length : items.length - 1;
                break;
            }
            case 'Home': {
                event.preventDefault();
                targetIndex = 0;
                break;
            }
            case 'End': {
                event.preventDefault();
                targetIndex = items.length - 1;
                break;
            }
        }

        if (targetIndex >= 0 && items[targetIndex]) {
            items.forEach((item, idx) => {
                item.setAttribute('tabindex', idx === targetIndex ? '0' : '-1');
            });
            items[targetIndex].focus();
        }
    };

    onMounted(() => {
        const items = getFocusableItems();
        items.forEach((item, idx) => {
            item.setAttribute('tabindex', idx === 0 ? '0' : '-1');
            item.addEventListener('focus', () => {
                items.forEach((other) => other.setAttribute('tabindex', other === item ? '0' : '-1'));
            });
        });
    });

    const linkPopoverRef = ref<HTMLElement | null>(null);
    const showLinkPopover = ref(false);
    const linkUrl = ref('');
    const linkInputRef = ref<HTMLInputElement | null>(null);

    const imagePopoverRef = ref<HTMLElement | null>(null);
    const showImagePopover = ref(false);
    const imageUrl = ref('');
    const imageInputRef = ref<HTMLInputElement | null>(null);

    onClickOutside(linkPopoverRef, () => {
        showLinkPopover.value = false;
    });

    onClickOutside(imagePopoverRef, () => {
        showImagePopover.value = false;
    });

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

<style lang="scss" scoped>
    .md-toolbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px 4px;
        padding: 6px 8px;
        background: var(--background-50, #f9fafb);
        border-bottom: 1px solid var(--background-200, #e5e7eb);
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;
        user-select: none;
        box-sizing: border-box;
        width: 100%;

        &--disabled {
            opacity: 0.6;
            pointer-events: none;
        }

        &__label {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--background-650, #4b5563);
            white-space: nowrap;
            padding: 0 4px;
            height: auto;
        }

        &__group {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            height: auto;
        }

        &__divider {
            display: inline-block;
            width: 1px;
            height: 18px;
            background: var(--background-300, #d1d5db);
            margin: 0 4px;
            flex-shrink: 0;
        }

        &__btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            min-width: 28px;
            min-height: 28px;
            padding: 0;
            border: 1px solid transparent;
            border-radius: 6px;
            background: transparent;
            cursor: pointer;
            color: var(--background-700);
            transition: all 0.15s ease;
            box-sizing: border-box;
            outline: none;

            &:focus:not(:focus-visible) {
                outline: none;
            }

            &:focus-visible {
                outline: var(--max-focus-outline);
                outline-offset: 1px;
            }

            &:hover:not(:disabled) {
                background: var(--background-150, #e5e7eb);
                color: var(--background-775);
            }

            &.active {
                background: var(--max-primary-50);
                color: var(--max-primary-600, #005F77);
                border-color: var(--max-primary-200);
            }

            &:disabled {
                opacity: 0.35;
                cursor: not-allowed;
            }
        }

        &__popover-anchor {
            position: relative;
            display: inline-flex;
            height: auto;
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
        padding: 8px 10px;
        background: var(--background-0, #fff);
        border: 1px solid var(--background-200, #e5e7eb);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgb(0 0 0 / 12%), 0 1px 3px rgb(0 0 0 / 8%);
        min-width: 280px;
        height: auto;
        box-sizing: border-box;

        &__input {
            flex: 1;
            height: 30px;
            padding: 4px 8px;
            border: 1px solid var(--background-300, #d1d5db);
            border-radius: 6px;
            font-size: 13px;
            outline: none;
            background: var(--background-0, #fff);
            color: var(--background-700);
            transition: border-color 0.15s;
            box-sizing: border-box;

            &:focus {
                border-color: var(--max-primary-500, #00768E);
            }
        }

        &__btn {
            height: 30px;
            padding: 0 12px;
            border: 1px solid var(--background-300, #d1d5db);
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            background: var(--background-50, #f9fafb);
            cursor: pointer;
            white-space: nowrap;
            color: var(--background-750, #374151);
            transition: all 0.15s;
            box-sizing: border-box;

            &:hover {
                background: var(--background-150, #e5e7eb);
            }

            &--primary {
                background: var(--max-primary-500, #00768E);
                border-color: var(--max-primary-500, #00768E);
                color: var(--background-0);

                &:hover {
                    background: var(--max-primary-600, #005F77);
                    border-color: var(--max-primary-600, #005F77);
                }
            }
        }
    }
</style>
