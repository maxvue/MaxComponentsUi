<template>
    <span class="max-copy-button">
        <MaxButton :label="props.iconOnly ? undefined : (copied ? props.copiedLabel : props.label)" :aria-label="props.iconOnly ? props.label : undefined" :disabled="props.disabled || copying || !props.text" @click="copyText" />
        <span class="max-copy-button__status" role="status" aria-live="polite">{{ status }}</span>
    </span>
</template>

<script setup lang="ts">
    import { onBeforeUnmount, ref, watch } from 'vue';
    import { useClipboardItems } from '@maxvue/max-use';
    import MaxButton from './MaxButton.vue';
    import type { MaxCopyButtonProps, MaxCopyButtonErrorReason } from '../types/copyButton';

    const props = withDefaults(defineProps<MaxCopyButtonProps>(), { label: 'Copiar', copiedLabel: 'Copiado', iconOnly: false, disabled: false, copiedDuration: 1500 });
    const emit = defineEmits<{ copied: []; error: [payload: { reason: MaxCopyButtonErrorReason }] }>();
    const { copy, isSupported } = useClipboardItems({ read: false, copiedDuring: props.copiedDuration });
    const copied = ref(false);
    const copying = ref(false);
    const status = ref('');
    let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

    watch(() => props.text, () => { copied.value = false; status.value = ''; clearTimeout(feedbackTimer); });
    onBeforeUnmount(() => clearTimeout(feedbackTimer));

    async function copyText(): Promise<void> {
        if (copying.value || !props.text) return;
        if (typeof window === 'undefined' || !isSupported.value || typeof ClipboardItem === 'undefined' || typeof Blob === 'undefined' || !navigator.clipboard?.write || !window.isSecureContext) {
            emit('error', { reason: 'unsupported' });
            status.value = 'Copie o texto manualmente.';
            return;
        }
        copying.value = true;
        try {
            await copy([new ClipboardItem({ 'text/plain': new Blob([props.text], { type: 'text/plain' }) })]);
            copied.value = true;
            status.value = props.copiedLabel;
            emit('copied');
            clearTimeout(feedbackTimer);
            feedbackTimer = setTimeout(() => { copied.value = false; status.value = ''; }, props.copiedDuration);
        } catch (error) {
            emit('error', { reason: typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'failed' });
            status.value = 'Não foi possível copiar.';
        } finally {
            copying.value = false;
        }
    }
</script>

<style lang="scss" scoped>
.max-copy-button { display: inline-flex; align-items: center; gap: 6px; }
.max-copy-button__status { font-size: 12px; }
</style>
