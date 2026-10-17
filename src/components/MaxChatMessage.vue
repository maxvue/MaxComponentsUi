<template>
    <article :id="props.id" class="max-chat-message" :class="`is-${props.direction}`" :aria-label="props.author">
        <slot name="avatar" />
        <div class="max-chat-message__body"><header><strong>{{ props.author }}</strong><time v-if="validTimestamp || props.timeLabel" :datetime="validTimestamp ? props.timestamp : undefined">{{ props.timeLabel }}</time></header>
            <slot name="content"><MaxMarkdownViewer v-if="props.renderMarkdown" :source="props.text" :render-markdown="props.renderMarkdown" /><p v-else>{{ props.text }}</p></slot>
            <slot name="attachments" /><footer v-if="props.status">{{ statusLabel }}</footer><slot name="actions" />
        </div>
    </article>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxMarkdownViewer from './MaxMarkdownViewer.vue';
    import type { MaxChatMessageProps } from '../types/chatMessage';

    const props = withDefaults(defineProps<MaxChatMessageProps>(), { direction: 'incoming', text: '' });
    const validTimestamp = computed(() => !!props.timestamp && !Number.isNaN(Date.parse(props.timestamp)));
    const statusLabel = computed(() => ({ pending: 'Pendente', sent: 'Enviada', error: 'Falha ao enviar' })[props.status!]);
</script>

<style lang="scss" scoped>
.max-chat-message { display: flex; gap: 10px; max-width: 100%; }
.max-chat-message.is-outgoing { flex-direction: row-reverse; }
.max-chat-message__body { min-width: 0; padding: 10px 12px; border-radius: 8px; background: var(--background-100, #f1f5f9); overflow-wrap: anywhere; }
.max-chat-message__body header { display: flex; gap: 12px; justify-content: space-between; font-size: 12px; }
.max-chat-message__body p { margin: 6px 0; white-space: pre-wrap; }
</style>
