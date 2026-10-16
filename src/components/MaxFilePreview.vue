<template>
    <div class="max-file-preview" :class="[`max-file-preview--${fileType}`, { 'is-disabled': props.disabled }]" role="group" :aria-label="fileName">
        <div class="max-file-preview__thumbnail" @click="handleOpen">
            <template v-if="props.preview && fileType === 'image' && resolvedUrl && !imageLoadFailed">
                <img :src="resolvedUrl" :alt="fileName" class="max-file-preview__img" @error="handleImageError" />
            </template>
            <template v-else>
                <slot name="fallback" :file="props.file">
                    <div class="max-file-preview__icon-fallback">
                        <MaxIcon :icon="formatIcon" size="24px" class="max-file-preview__type-icon" aria-hidden="true" />
                    </div>
                </slot>
            </template>
        </div>
        <div class="max-file-preview__info">
            <div class="max-file-preview__name" :title="fileName">{{ fileName }}</div>
            <div class="max-file-preview__meta">
                <slot name="metadata" :file="props.file" :formatted-size="formattedFileSize">
                    <span v-if="formattedFileSize" class="max-file-preview__size">{{ formattedFileSize }}</span>
                    <span v-if="fileExtension" class="max-file-preview__extension">{{ fileExtension }}</span>
                </slot>
            </div>
        </div>
        <div class="max-file-preview__actions">
            <slot name="actions" :file="props.file" :disabled="props.disabled">
                <button type="button" class="max-file-preview__btn max-file-preview__btn--open" :disabled="props.disabled" :aria-label="`Abrir ${fileName}`" @click="handleOpen">
                    <MaxIcon icon="lucide:external-link" size="16px" aria-hidden="true" />
                </button>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onUnmounted, ref, watch } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { formatBytes } from '@maxvue/max-use';
    import type { MaxFilePreviewProps, MaxPreviewFile } from '../types/filePreview';

    const props = withDefaults(defineProps<MaxFilePreviewProps>(), {
        preview: true,
        disabled: false
    });

    const emit = defineEmits<{
        open: [file: MaxPreviewFile];
        error: [payload: { id: string; reason: 'invalid-url' | 'load-failed' }];
    }>();

    const localBlobUrl = ref<string | null>(null);
    const imageLoadFailed = ref<boolean>(false);

    const isSafeUrl = (url: string | null | undefined): boolean => {
        if (!url) return false;
        const trimmed = url.trim();
        if (/^(?:javascript|vbscript|data):/i.test(trimmed)) return false;
        return true;
    };

    const cleanupLocalBlobUrl = (): void => {
        if (localBlobUrl.value && typeof window !== 'undefined' && typeof window.URL?.revokeObjectURL === 'function') {
            window.URL.revokeObjectURL(localBlobUrl.value);
            localBlobUrl.value = null;
        }
    };

    const setupLocalBlobUrl = (): void => {
        cleanupLocalBlobUrl();
        imageLoadFailed.value = false;

        if (props.file.kind === 'local' && typeof window !== 'undefined' && typeof window.URL?.createObjectURL === 'function') try {
            localBlobUrl.value = window.URL.createObjectURL(props.file.file);
        } catch {
            localBlobUrl.value = null;
        }
        else if (props.file.kind === 'remote') {
            const remoteUrl = props.file.thumbnailUrl || props.file.url;
            if (remoteUrl && !isSafeUrl(remoteUrl)) emit('error', { id: props.file.id, reason: 'invalid-url' });

        }
    };

    watch(() => props.file, () => {
        setupLocalBlobUrl();
    }, { immediate: true });

    onUnmounted(() => {
        cleanupLocalBlobUrl();
    });

    const fileName = computed<string>(() => {
        if (props.file.kind === 'local') return props.file.file.name;
        return props.file.name;
    });

    const fileExtension = computed<string>(() => {
        const parts = fileName.value.split('.');
        if (parts.length > 1) return parts.pop()?.toUpperCase() ?? '';

        return '';
    });

    const mimeType = computed<string>(() => {
        if (props.file.kind === 'local') return props.file.file.type || '';
        return props.file.mimeType || '';
    });

    const fileType = computed<'image' | 'pdf' | 'other'>(() => {
        const mime = mimeType.value.toLowerCase();
        const ext = fileExtension.value.toLowerCase();

        if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return 'image';

        if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';

        return 'other';
    });

    const formatIcon = computed<string>(() => {
        switch (fileType.value) {
            case 'image':
                return 'lucide:image';
            case 'pdf':
                return 'lucide:file-text';
            default:
                return 'lucide:file';
        }
    });

    const formattedFileSize = computed<string>(() => {
        const bytes = props.file.kind === 'local' ? props.file.file.size : props.file.size;
        if (typeof bytes !== 'number' || bytes < 0) return '';
        try {
            return formatBytes(bytes);
        } catch {
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    });

    const resolvedUrl = computed<string | null>(() => {
        if (props.file.kind === 'local') return localBlobUrl.value;

        const url = props.file.thumbnailUrl || props.file.url;
        if (!url || !isSafeUrl(url)) return null;
        return url;
    });

    const handleImageError = (): void => {
        imageLoadFailed.value = true;
        emit('error', { id: props.file.id, reason: 'load-failed' });
    };

    const handleOpen = (): void => {
        if (props.disabled) return;
        emit('open', props.file);
    };
</script>

<style lang="scss" scoped>
.max-file-preview {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background-color: var(--background-0, #fff);
    border: 1px solid var(--background-200, #e2e8f0);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: Quicksand, sans-serif;
    max-width: 380px;
    width: 100%;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:hover:not(.is-disabled) {
        border-color: var(--max-primary-300, #2EA4BC);
        box-shadow: 0 1px 4px rgb(0 0 0 / 5%);
    }

    &.is-disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
    }

    &__thumbnail {
        width: 44px;
        height: 44px;
        border-radius: 6px;
        overflow: hidden;
        flex-shrink: 0;
        background-color: var(--background-100, #f1f5f9);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    &__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &__icon-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--max-primary-500, #00768e);
    }

    &__info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    &__name {
        font-size: 13px;
        font-weight: 700;
        color: var(--background-900, #0f172a);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--background-600, #64748b);
        font-weight: 500;
    }

    &__extension {
        background-color: var(--background-100, #f1f5f9);
        border: 1px solid var(--background-200, #e2e8f0);
        padding: 0 4px;
        border-radius: 4px;
        font-weight: 700;
    }

    &__actions {
        flex-shrink: 0;
        display: flex;
        align-items: center;
    }

    &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: transparent;
        border: none;
        color: var(--background-700, #334155);
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;

        &:hover:not(:disabled) {
            background-color: var(--background-100, #f1f5f9);
            color: var(--max-primary-600, #005F77);
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768e);
            outline-offset: 1px;
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    .max-file-preview,
    .max-file-preview__btn {
        transition: none !important;
    }
}
</style>
