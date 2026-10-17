<template>
    <section class="max-code-block" :aria-label="props.label">
        <header class="max-code-block__header"><span>{{ props.label }}<span v-if="props.language"> · {{ props.language }}</span></span><slot name="actions" /><MaxCopyButton v-if="props.copyable" :text="props.code" label="Copiar conteúdo completo" @copied="emit('copied')" @error="emit('copy-error', $event)" /></header>
        <pre :id="regionId" :class="{ 'is-wrapped': props.wrap, 'is-expanded': expanded }"><code>{{ visibleCode }}</code></pre>
        <MaxButton v-if="lineCount > props.maxLines" :label="expanded ? 'Recolher' : 'Expandir'" :aria-expanded="expanded" :aria-controls="regionId" @click="expanded = !expanded" />
    </section>
</template>

<script setup lang="ts">
    import { computed, ref, useId } from 'vue';
    import MaxButton from './MaxButton.vue';
    import MaxCopyButton from './MaxCopyButton.vue';
    import type { MaxCodeBlockProps } from '../types/codeBlock';

    const props = withDefaults(defineProps<MaxCodeBlockProps>(), { label: 'Conteúdo técnico', copyable: false, maxLines: 20, wrap: false });
    const emit = defineEmits<{ copied: []; 'copy-error': [payload: { reason: 'unsupported' | 'denied' | 'failed' }] }>();
    const expanded = ref(false);
    const regionId = useId();
    const lines = computed(() => props.code.split('\n'));
    const lineCount = computed(() => lines.value.length);
    const visibleCode = computed(() => expanded.value || lineCount.value <= props.maxLines ? props.code : lines.value.slice(0, Math.max(1, props.maxLines)).join('\n'));
</script>

<style lang="scss" scoped>
.max-code-block { min-width: 0; }
.max-code-block__header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
pre { max-height: 22em; overflow: auto; padding: 12px; background: var(--background-100, #f1f5f9); border-radius: 6px; }
pre:not(.is-expanded) { max-height: 22em; }
pre.is-wrapped { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
