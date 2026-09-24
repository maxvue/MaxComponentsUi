<template>
    <div
        ref="toolbarRef"
        class="max-input-html-toolbar html-toolbar"
        :class="{ 'html-toolbar--disabled': !editor || editor.isEditable === false }"
        role="toolbar"
        :aria-label="props.ariaLabel"
        @keydown="onToolbarKeydown"
    >
        <span v-if="props.label" class="html-toolbar__label">{{ props.label }}</span>
        <span v-if="props.label" class="html-toolbar__divider" />

        <!-- Formatação inline -->
        <div v-if="isGroupVisible('inline')" class="html-toolbar__group">
            <button
                v-if="isToolVisible('bold')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('bold') }"
                :aria-pressed="Boolean(editor?.isActive('bold'))"
                title="Negrito (Ctrl+B)"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleBold().run()"
            >
                <MaxIcon icon="mdi:format-bold" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('italic')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('italic') }"
                :aria-pressed="Boolean(editor?.isActive('italic'))"
                title="Itálico (Ctrl+I)"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleItalic().run()"
            >
                <MaxIcon icon="mdi:format-italic" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('underline')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('underline') }"
                :aria-pressed="Boolean(editor?.isActive('underline'))"
                title="Sublinhado (Ctrl+U)"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleUnderline().run()"
            >
                <MaxIcon icon="mdi:format-underline" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('strike')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('strike') }"
                :aria-pressed="Boolean(editor?.isActive('strike'))"
                title="Tachado"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleStrike().run()"
            >
                <MaxIcon icon="mdi:format-strikethrough" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span v-if="isGroupVisible('inline') && hasVisibleGroupAfter('inline')" class="html-toolbar__divider" />

        <!-- Alinhamento de texto -->
        <div v-if="isGroupVisible('alignment')" class="html-toolbar__group">
            <button
                v-if="isToolVisible('align-left')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive({ textAlign: 'left' }) }"
                :aria-pressed="Boolean(editor?.isActive({ textAlign: 'left' }))"
                title="Alinhar à esquerda"
                :disabled="!editor || editor.isEditable === false"
                @click="(editor?.chain().focus() as any)?.setTextAlign('left').run()"
            >
                <MaxIcon icon="mdi:format-align-left" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('align-center')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive({ textAlign: 'center' }) }"
                :aria-pressed="Boolean(editor?.isActive({ textAlign: 'center' }))"
                title="Centralizar"
                :disabled="!editor || editor.isEditable === false"
                @click="(editor?.chain().focus() as any)?.setTextAlign('center').run()"
            >
                <MaxIcon icon="mdi:format-align-center" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('align-right')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive({ textAlign: 'right' }) }"
                :aria-pressed="Boolean(editor?.isActive({ textAlign: 'right' }))"
                title="Alinhar à direita"
                :disabled="!editor || editor.isEditable === false"
                @click="(editor?.chain().focus() as any)?.setTextAlign('right').run()"
            >
                <MaxIcon icon="mdi:format-align-right" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('align-justify')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive({ textAlign: 'justify' }) }"
                :aria-pressed="Boolean(editor?.isActive({ textAlign: 'justify' }))"
                title="Justificar"
                :disabled="!editor || editor.isEditable === false"
                @click="(editor?.chain().focus() as any)?.setTextAlign('justify').run()"
            >
                <MaxIcon icon="mdi:format-align-justify" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span v-if="isGroupVisible('alignment') && hasVisibleGroupAfter('alignment')" class="html-toolbar__divider" />

        <!-- Títulos -->
        <div v-if="isGroupVisible('heading')" class="html-toolbar__group">
            <button
                v-if="isToolVisible('heading-1')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('heading', { level: 1 }) }"
                :aria-pressed="Boolean(editor?.isActive('heading', { level: 1 }))"
                title="Título 1"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
            >
                <MaxIcon icon="mdi:format-header-1" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('heading-2')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('heading', { level: 2 }) }"
                :aria-pressed="Boolean(editor?.isActive('heading', { level: 2 }))"
                title="Título 2"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
            >
                <MaxIcon icon="mdi:format-header-2" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('heading-3')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('heading', { level: 3 }) }"
                :aria-pressed="Boolean(editor?.isActive('heading', { level: 3 }))"
                title="Título 3"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
            >
                <MaxIcon icon="mdi:format-header-3" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span v-if="isGroupVisible('heading') && hasVisibleGroupAfter('heading')" class="html-toolbar__divider" />

        <!-- Listas -->
        <div v-if="isGroupVisible('lists')" class="html-toolbar__group">
            <button
                v-if="isToolVisible('bullet-list')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('bulletList') }"
                :aria-pressed="Boolean(editor?.isActive('bulletList'))"
                title="Lista com marcadores"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleBulletList().run()"
            >
                <MaxIcon icon="mdi:format-list-bulleted" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('ordered-list')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('orderedList') }"
                :aria-pressed="Boolean(editor?.isActive('orderedList'))"
                title="Lista numerada"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleOrderedList().run()"
            >
                <MaxIcon icon="mdi:format-list-numbered" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span v-if="isGroupVisible('lists') && hasVisibleGroupAfter('lists')" class="html-toolbar__divider" />

        <!-- Blocos -->
        <div v-if="isGroupVisible('blocks')" class="html-toolbar__group">
            <button
                v-if="isToolVisible('blockquote')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('blockquote') }"
                :aria-pressed="Boolean(editor?.isActive('blockquote'))"
                title="Citação"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleBlockquote().run()"
            >
                <MaxIcon icon="mdi:format-quote-close" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('code-block')"
                type="button"
                class="html-toolbar__btn"
                :class="{ active: editor?.isActive('codeBlock') }"
                :aria-pressed="Boolean(editor?.isActive('codeBlock'))"
                title="Bloco de código"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().toggleCodeBlock().run()"
            >
                <MaxIcon icon="mdi:code-tags" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('horizontal-rule')"
                type="button"
                class="html-toolbar__btn"
                title="Separador horizontal"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().setHorizontalRule().run()"
            >
                <MaxIcon icon="mdi:minus" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span v-if="isGroupVisible('blocks') && hasVisibleGroupAfter('blocks')" class="html-toolbar__divider" />

        <!-- Mídia: Link e Imagem -->
        <div v-if="isGroupVisible('media')" class="html-toolbar__group">
            <div v-if="isToolVisible('link')" ref="linkPopoverRef" class="html-toolbar__popover-anchor">
                <button
                    ref="linkTriggerRef"
                    type="button"
                    class="html-toolbar__btn"
                    :class="{ active: editor?.isActive('link') }"
                    :aria-pressed="Boolean(editor?.isActive('link'))"
                    :aria-expanded="showLinkPopover"
                    aria-haspopup="dialog"
                    title="Link"
                    :disabled="!editor || editor.isEditable === false"
                    @click="openLinkPopover"
                >
                    <MaxIcon icon="mdi:link" :size="1.1" color="currentColor" />
                </button>
                <div
                    v-if="showLinkPopover"
                    class="html-popover"
                    role="dialog"
                    aria-label="Inserir link"
                    @click.stop
                >
                    <label :for="linkInputId" class="html-popover__label">URL do link</label>
                    <input
                        :id="linkInputId"
                        ref="linkInputRef"
                        v-model="linkUrl"
                        class="html-popover__input"
                        :class="{ 'is-invalid': Boolean(linkError) }"
                        aria-label="URL do link"
                        :aria-invalid="Boolean(linkError)"
                        :aria-describedby="linkError ? linkErrorId : undefined"
                        placeholder="https://..."
                        @input="linkError = ''"
                        @keydown.enter.prevent="applyLink"
                        @keydown.escape="closeLinkPopover()"
                    />
                    <span v-if="linkError" :id="linkErrorId" class="html-popover__error" role="alert">
                        {{ linkError }}
                    </span>
                    <div class="html-popover__actions">
                        <button
                            type="button"
                            class="html-popover__btn html-popover__btn--primary"
                            @click="applyLink"
                        >
                            Inserir link
                        </button>
                        <button
                            type="button"
                            class="html-popover__btn"
                            @click="removeLink"
                        >
                            Remover
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="isToolVisible('image')" ref="imagePopoverRef" class="html-toolbar__popover-anchor">
                <button
                    ref="imageTriggerRef"
                    type="button"
                    class="html-toolbar__btn"
                    :aria-expanded="showImagePopover"
                    aria-haspopup="dialog"
                    title="Imagem"
                    :disabled="!editor || editor.isEditable === false"
                    @click="openImagePopover"
                >
                    <MaxIcon icon="mdi:image" :size="1.1" color="currentColor" />
                </button>
                <div
                    v-if="showImagePopover"
                    class="html-popover"
                    role="dialog"
                    aria-label="Inserir imagem"
                    @click.stop
                >
                    <label :for="imageInputId" class="html-popover__label">URL da imagem</label>
                    <input
                        :id="imageInputId"
                        ref="imageInputRef"
                        v-model="imageUrl"
                        class="html-popover__input"
                        :class="{ 'is-invalid': Boolean(imageError) }"
                        aria-label="URL da imagem"
                        :aria-invalid="Boolean(imageError)"
                        :aria-describedby="imageError ? imageErrorId : undefined"
                        placeholder="https://..."
                        @input="imageError = ''"
                        @keydown.enter.prevent="applyImage"
                        @keydown.escape="closeImagePopover()"
                    />
                    <span v-if="imageError" :id="imageErrorId" class="html-popover__error" role="alert">
                        {{ imageError }}
                    </span>
                    <div class="html-popover__actions">
                        <button
                            type="button"
                            class="html-popover__btn html-popover__btn--primary"
                            @click="applyImage"
                        >
                            Inserir imagem
                        </button>
                    </div>
                </div>
            </div>

            <button
                v-if="isToolVisible('table')"
                type="button"
                class="html-toolbar__btn"
                title="Inserir tabela"
                :disabled="!editor || editor.isEditable === false"
                @click="editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
            >
                <MaxIcon icon="mdi:table" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span v-if="isGroupVisible('media') && hasVisibleGroupAfter('media')" class="html-toolbar__divider" />

        <!-- Histórico e Limpeza -->
        <div v-if="isGroupVisible('history')" class="html-toolbar__group">
            <button
                v-if="isToolVisible('undo')"
                type="button"
                class="html-toolbar__btn"
                title="Desfazer (Ctrl+Z)"
                :disabled="!editor || editor.isEditable === false || !editor.can().undo()"
                @click="editor?.chain().focus().undo().run()"
            >
                <MaxIcon icon="mdi:undo" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('redo')"
                type="button"
                class="html-toolbar__btn"
                title="Refazer (Ctrl+Y)"
                :disabled="!editor || editor.isEditable === false || !editor.can().redo()"
                @click="editor?.chain().focus().redo().run()"
            >
                <MaxIcon icon="mdi:redo" :size="1.1" color="currentColor" />
            </button>
            <button
                v-if="isToolVisible('clear')"
                type="button"
                class="html-toolbar__btn"
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
    import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
    import { useOutsidePointer } from '../helpers/useOutsidePointer';
    import type { Editor } from '@tiptap/core';
    import MaxIcon from './MaxIcon.vue';
    import { isSafeUrl } from '../helpers/isSafeUrl';
    import { useToolbarNavigation } from '../helpers/useToolbarNavigation';

    export type HtmlToolbarTool =
        | 'bold'
        | 'italic'
        | 'underline'
        | 'strike'
        | 'alignment'
        | 'align-left'
        | 'align-center'
        | 'align-right'
        | 'align-justify'
        | 'heading'
        | 'heading-1'
        | 'heading-2'
        | 'heading-3'
        | 'lists'
        | 'bullet-list'
        | 'ordered-list'
        | 'blocks'
        | 'blockquote'
        | 'code-block'
        | 'horizontal-rule'
        | 'media'
        | 'link'
        | 'image'
        | 'table'
        | 'history'
        | 'undo'
        | 'redo'
        | 'clear';

    type ToolbarGroupKey = 'inline' | 'alignment' | 'heading' | 'lists' | 'blocks' | 'media' | 'history';

    const props = withDefaults(
        defineProps<{
            editor: Editor | null;
            label?: string;
            ariaLabel?: string;
            hideTools?: HtmlToolbarTool[];
            tools?: HtmlToolbarTool[];
        }>(),
        {
            label: undefined,
            ariaLabel: 'Editor HTML',
            hideTools: undefined,
            tools: undefined
        }
    );

    const groupToolMap: Record<ToolbarGroupKey, HtmlToolbarTool[]> = {
        inline: ['bold', 'italic', 'underline', 'strike'],
        alignment: ['align-left', 'align-center', 'align-right', 'align-justify'],
        heading: ['heading-1', 'heading-2', 'heading-3'],
        lists: ['bullet-list', 'ordered-list'],
        blocks: ['blockquote', 'code-block', 'horizontal-rule'],
        media: ['link', 'image', 'table'],
        history: ['undo', 'redo', 'clear']
    };

    const groupKeys: ToolbarGroupKey[] = ['inline', 'alignment', 'heading', 'lists', 'blocks', 'media', 'history'];

    const isToolVisible = (tool: HtmlToolbarTool): boolean => {
        if (props.hideTools && props.hideTools.length > 0) {
            if (props.hideTools.includes(tool)) return false;
            // Aliases de grupo em hideTools
            if (tool.startsWith('align-') && props.hideTools.includes('alignment')) return false;
            if (tool.startsWith('heading-') && props.hideTools.includes('heading')) return false;
            if ((tool === 'bullet-list' || tool === 'ordered-list') && props.hideTools.includes('lists')) return false;
            if ((tool === 'blockquote' || tool === 'code-block' || tool === 'horizontal-rule') && props.hideTools.includes('blocks')) return false;
            if ((tool === 'link' || tool === 'image' || tool === 'table') && props.hideTools.includes('media')) return false;
            if ((tool === 'undo' || tool === 'redo' || tool === 'clear') && props.hideTools.includes('history')) return false;
        }

        if (props.tools && props.tools.length > 0) {
            if (props.tools.includes(tool)) return true;
            if (tool.startsWith('align-') && props.tools.includes('alignment')) return true;
            if (tool.startsWith('heading-') && props.tools.includes('heading')) return true;
            if ((tool === 'bullet-list' || tool === 'ordered-list') && props.tools.includes('lists')) return true;
            if ((tool === 'blockquote' || tool === 'code-block' || tool === 'horizontal-rule') && props.tools.includes('blocks')) return true;
            if ((tool === 'link' || tool === 'image' || tool === 'table') && props.tools.includes('media')) return true;
            if ((tool === 'undo' || tool === 'redo' || tool === 'clear') && props.tools.includes('history')) return true;
            return false;
        }

        return true;
    };

    const isGroupVisible = (group: ToolbarGroupKey): boolean => {
        return groupToolMap[group].some((tool) => isToolVisible(tool));
    };

    const hasVisibleGroupAfter = (group: ToolbarGroupKey): boolean => {
        const index = groupKeys.indexOf(group);
        if (index === -1) return false;
        return groupKeys.slice(index + 1).some((nextGroup) => isGroupVisible(nextGroup));
    };

    const toolbarRef = ref<HTMLElement | null>(null);

    const { onToolbarKeydown, updateTabindices } = useToolbarNavigation(toolbarRef, {
        buttonSelector: '.html-toolbar__btn'
    });

    const editorTick = ref(0);
    const updateEditorState = () => {
        editorTick.value++;
        nextTick(() => updateTabindices());
    };

    watch(
        () => props.editor,
        (newEd, oldEd) => {
            oldEd?.off?.('selectionUpdate', updateEditorState);
            oldEd?.off?.('transaction', updateEditorState);
            newEd?.on?.('selectionUpdate', updateEditorState);
            newEd?.on?.('transaction', updateEditorState);
            nextTick(() => updateTabindices());
        },
        { immediate: true }
    );

    onBeforeUnmount(() => {
        props.editor?.off?.('selectionUpdate', updateEditorState);
        props.editor?.off?.('transaction', updateEditorState);
    });

    const linkTriggerRef = ref<HTMLButtonElement | null>(null);
    const linkPopoverRef = ref<HTMLElement | null>(null);
    const showLinkPopover = ref(false);
    const linkUrl = ref('');
    const linkError = ref('');
    const linkInputRef = ref<HTMLInputElement | null>(null);
    const linkInputId = 'html-toolbar-link-input';
    const linkErrorId = 'html-toolbar-link-error';

    const imageTriggerRef = ref<HTMLButtonElement | null>(null);
    const imagePopoverRef = ref<HTMLElement | null>(null);
    const showImagePopover = ref(false);
    const imageUrl = ref('');
    const imageError = ref('');
    const imageInputRef = ref<HTMLInputElement | null>(null);
    const imageInputId = 'html-toolbar-image-input';
    const imageErrorId = 'html-toolbar-image-error';

    const closeLinkPopover = (restoreFocus = true) => {
        showLinkPopover.value = false;
        linkUrl.value = '';
        linkError.value = '';
        if (restoreFocus) linkTriggerRef.value?.focus();
    };

    const closeImagePopover = (restoreFocus = true) => {
        showImagePopover.value = false;
        imageUrl.value = '';
        imageError.value = '';
        if (restoreFocus) imageTriggerRef.value?.focus();
    };

    useOutsidePointer(showLinkPopover, {
        elements: () => [linkPopoverRef.value],
        triggerEl: linkTriggerRef,
        onClose: () => {
            closeLinkPopover(false);
        }
    });

    useOutsidePointer(showImagePopover, {
        elements: () => [imagePopoverRef.value],
        triggerEl: imageTriggerRef,
        onClose: () => {
            closeImagePopover(false);
        }
    });

    const openLinkPopover = () => {
        const existing = props.editor?.getAttributes('link')?.href ?? '';
        linkUrl.value = existing;
        linkError.value = '';
        showLinkPopover.value = !showLinkPopover.value;
        showImagePopover.value = false;
        if (showLinkPopover.value) nextTick(() => linkInputRef.value?.focus());
    };

    const applyLink = () => {
        const trimmed = linkUrl.value.trim();
        if (!trimmed) {
            props.editor?.chain().focus().unsetLink().run();
            closeLinkPopover();
            return;
        }

        if (!isSafeUrl(trimmed)) {
            linkError.value = 'URL inválida ou insegura';
            nextTick(() => linkInputRef.value?.focus());
            return;
        }

        props.editor?.chain().focus().setLink({ href: trimmed, target: '_blank' }).run();
        closeLinkPopover();
    };

    const removeLink = () => {
        props.editor?.chain().focus().unsetLink().run();
        closeLinkPopover();
    };

    const openImagePopover = () => {
        imageUrl.value = '';
        imageError.value = '';
        showImagePopover.value = !showImagePopover.value;
        showLinkPopover.value = false;
        if (showImagePopover.value) nextTick(() => imageInputRef.value?.focus());
    };

    const applyImage = () => {
        const trimmed = imageUrl.value.trim();
        if (!trimmed) {
            imageError.value = 'Informe a URL da imagem';
            nextTick(() => imageInputRef.value?.focus());
            return;
        }

        if (!isSafeUrl(trimmed)) {
            imageError.value = 'URL inválida ou insegura';
            nextTick(() => imageInputRef.value?.focus());
            return;
        }

        props.editor?.chain().focus().setImage({ src: trimmed }).run();
        closeImagePopover();
    };
</script>

<style lang="scss" scoped>
    .html-toolbar {
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
            color: var(--max-content-secondary, var(--background-700, #4b5563));
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
                background: var(--blue-50);
                color: var(--blue-800);
                border-color: var(--blue-200);
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

    .html-popover {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: 100;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 6px;
        padding: 8px 10px;
        background: var(--background-0, #fff);
        border: 1px solid var(--background-200, #e5e7eb);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgb(0 0 0 / 12%), 0 1px 3px rgb(0 0 0 / 8%);
        min-width: 280px;
        height: auto;
        box-sizing: border-box;

        &__label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--max-content-secondary, var(--background-700, #4b5563));
        }

        &__input {
            width: 100%;
            height: 30px;
            padding: 4px 8px;
            border: 1px solid var(--background-300, #d1d5db);
            border-radius: 6px;
            font-size: 13px;
            outline: none;
            background: var(--background-0, #fff);
            color: var(--background-750);
            transition: border-color 0.15s;
            box-sizing: border-box;

            &::placeholder {
                color: var(--background-500);
            }

            &:focus {
                border-color: var(--max-primary-500, #00768E);
            }

            &.is-invalid,
            &[aria-invalid='true'] {
                border-color: var(--max-danger-500, #ef4444);
            }
        }

        &__error {
            display: block;
            font-size: 0.75rem;
            color: var(--max-danger-500, #ef4444);
            line-height: 1.2;
            overflow-wrap: break-word;
        }

        &__actions {
            display: flex;
            align-items: center;
            gap: 6px;
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

    @media (prefers-reduced-motion: reduce) {
        *,
        ::before,
        ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }
    }
</style>
