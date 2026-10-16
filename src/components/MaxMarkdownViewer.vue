<template>
    <div class="max-markdown-viewer" @click="handleContainerClick">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="max-markdown-viewer__content" v-html="sanitizedHtml" />
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { sanitizeMarkdownHtml, escapeHtml, isSafeMarkdownUrl } from '../helpers/sanitizeMarkdownHtml';
    import type { MaxMarkdownViewerProps, MaxMarkdownImageClickPayload } from '../types/markdownViewer';

    const props = withDefaults(defineProps<MaxMarkdownViewerProps>(), {
        source: ''
    });

    const emit = defineEmits<{
        'image-click': [payload: MaxMarkdownImageClickPayload];
    }>();

    const sanitizedHtml = computed<string>(() => {
        const text = props.source ?? '';
        if (!text) return '';

        try {
            const rawHtml = props.renderMarkdown(text);
            return sanitizeMarkdownHtml(rawHtml);
        } catch {
            return escapeHtml(text);
        }
    });

    const handleContainerClick = (event: MouseEvent): void => {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        if (target.tagName.toLowerCase() === 'img') {
            const img = target as HTMLImageElement;
            const src = img.getAttribute('src');
            const alt = img.getAttribute('alt') ?? '';

            if (src && isSafeMarkdownUrl(src)) emit('image-click', { src, alt });

        }
    };
</script>

<style lang="scss" scoped>
.max-markdown-viewer {
    width: 100%;
    font-family: Quicksand, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: var(--background-900, #0f172a);
    overflow-wrap: break-word;

    &__content {
        :deep(p) {
            margin: 0 0 12px;

            &:last-child {
                margin-bottom: 0;
            }
        }

        :deep(h1),
        :deep(h2),
        :deep(h3),
        :deep(h4),
        :deep(h5),
        :deep(h6) {
            margin: 16px 0 8px;
            font-weight: 700;
            line-height: 1.3;
            color: var(--background-950, #020617);

            &:first-child {
                margin-top: 0;
            }
        }

        :deep(h1) { font-size: 20px; }
        :deep(h2) { font-size: 18px; }
        :deep(h3) { font-size: 16px; }
        :deep(h4) { font-size: 14px; }

        :deep(ul),
        :deep(ol) {
            margin: 0 0 12px;
            padding-left: 20px;
        }

        :deep(li) {
            margin-bottom: 4px;
        }

        :deep(blockquote) {
            margin: 0 0 12px;
            padding: 8px 12px;
            border-left: 3px solid var(--max-primary-500, #00768e);
            background-color: var(--background-50, #f8fafc);
            color: var(--background-700, #334155);
            font-style: italic;
        }

        :deep(code) {
            font-family: monospace;
            font-size: 12px;
            background-color: var(--background-100, #f1f5f9);
            padding: 2px 4px;
            border-radius: 4px;
            color: var(--max-primary-700, #004860);
        }

        :deep(pre) {
            margin: 0 0 12px;
            padding: 12px;
            background-color: var(--background-100, #f1f5f9);
            border-radius: 6px;
            overflow-x: auto;

            code {
                background-color: transparent;
                padding: 0;
            }
        }

        :deep(table) {
            width: 100%;
            border-collapse: collapse;
            margin: 0 0 12px;
            font-size: 13px;

            th, td {
                padding: 6px 10px;
                border: 1px solid var(--background-200, #e2e8f0);
            }

            th {
                background-color: var(--background-100, #f1f5f9);
                font-weight: 700;
                text-align: left;
            }
        }

        :deep(a) {
            color: var(--max-primary-600, #005F77);
            text-decoration: underline;
            text-underline-offset: 2px;

            &:hover {
                color: var(--max-primary-700, #004860);
            }
        }

        :deep(img) {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            cursor: pointer;
            transition: opacity 0.15s ease;

            &:hover {
                opacity: 0.9;
            }
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    :deep(img) {
        transition: none !important;
    }
}
</style>
