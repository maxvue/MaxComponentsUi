<template>
    <ul class="max-attachment-list" :aria-label="props.emptyLabel">
        <li v-for="file in props.files" :key="file.id"><MaxFilePreview :file="file" :disabled="props.disabled" @open="emit('open', $event)" @error="emit('error', $event)"><template #metadata="scope"><slot name="metadata" v-bind="scope" /></template><template #actions="scope"><slot name="actions" v-bind="scope" /></template></MaxFilePreview></li>
        <li v-if="!props.files.length"><slot name="empty">{{ props.emptyLabel }}</slot></li>
    </ul>
</template>

<script setup lang="ts">
    import MaxFilePreview from './MaxFilePreview.vue';
    import type { MaxAttachmentListProps } from '../types/attachmentList';
    import type { MaxPreviewFile } from '../types/filePreview';

    const props = withDefaults(defineProps<MaxAttachmentListProps>(), { disabled: false, emptyLabel: 'Nenhum anexo' });
    const emit = defineEmits<{ open: [file: MaxPreviewFile]; error: [payload: { id: string; reason: 'invalid-url' | 'load-failed' }] }>();
</script>

<style lang="scss" scoped>
.max-attachment-list { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; }
</style>
