<template>
    <article class="max-social-post-preview">
        <header><slot name="header">{{ props.author }}</slot></header>
        <div v-if="activeMedia" class="max-social-post-preview__media"><MaxImage :src="activeMedia.src" :alt="activeMedia.alt" /><MaxIconButton v-if="props.media.length > 1" icon="lucide:chevron-left" aria-label="Imagem anterior" @click="move(-1)" /><MaxIconButton v-if="props.media.length > 1" icon="lucide:chevron-right" aria-label="Próxima imagem" @click="move(1)" /></div>
        <slot v-else name="empty">{{ props.emptyLabel }}</slot>
        <p>{{ props.caption }}</p><footer><slot name="footer" /></footer>
    </article>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import MaxImage from './MaxImage.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import type { MaxSocialPostPreviewProps } from '../types/socialPostPreview';

    const props = withDefaults(defineProps<MaxSocialPostPreviewProps>(), { caption: '', emptyLabel: 'Sem imagem para pré-visualizar' });
    const emit = defineEmits<{ 'update:activeMediaId': [id: string] }>();
    const localId = ref<string>();
    const activeMedia = computed(() => props.media.find((item) => item.id === (props.activeMediaId ?? localId.value)) ?? props.media[0]);
    watch(() => props.media.map((item) => item.id).join('\u0000'), () => { if (!props.media.some((item) => item.id === localId.value)) localId.value = props.media[0]?.id; });
    function move(offset: number): void { const index = props.media.findIndex((item) => item.id === activeMedia.value?.id); const next = props.media[(index + offset + props.media.length) % props.media.length]; if (!next) return; if (props.activeMediaId !== undefined) emit('update:activeMediaId', next.id); else localId.value = next.id; }
</script>

<style lang="scss" scoped>
.max-social-post-preview { max-width: 560px; border: 1px solid var(--background-300, #cbd5e1); border-radius: 8px; overflow: hidden; }
.max-social-post-preview > :deep(header), .max-social-post-preview > p, .max-social-post-preview > footer { padding: 12px; }
.max-social-post-preview > p { white-space: pre-wrap; }
.max-social-post-preview__media { position: relative; }
.max-social-post-preview__media :deep(img) { display: block; width: 100%; object-fit: cover; }
</style>
