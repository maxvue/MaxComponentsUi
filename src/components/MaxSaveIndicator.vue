<template>
    <span v-if="props.state !== 'idle'" class="max-save-indicator" :class="`is-${props.state}`" aria-live="polite">
        <slot name="icon">{{ stateLabels[props.state].icon }}</slot><slot>{{ props.message || stateLabels[props.state].label }}</slot>
        <MaxButton v-if="props.state === 'error' && props.retryable" label="Tentar novamente" @click="emit('retry')" />
    </span>
</template>

<script setup lang="ts">
    import MaxButton from './MaxButton.vue';
    import type { MaxSaveIndicatorProps, MaxSaveState } from '../types/saveIndicator';

    const props = withDefaults(defineProps<MaxSaveIndicatorProps>(), { retryable: false });
    const emit = defineEmits<{ retry: [] }>();
    const stateLabels: Record<MaxSaveState, { icon: string; label: string }> = { idle: { icon: '', label: '' }, pending: { icon: '◷', label: 'Alterações pendentes' }, saving: { icon: '…', label: 'Salvando' }, saved: { icon: '✓', label: 'Salvo' }, error: { icon: '!', label: 'Falha ao salvar' }, offline: { icon: '⌁', label: 'Sem conexão' } };
</script>

<style lang="scss" scoped>
.max-save-indicator { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.is-error { color: var(--max-danger-600, #dc2626); }
.is-saved { color: var(--max-success-600, #059669); }
</style>
