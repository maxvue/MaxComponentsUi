<template>
    <section class="max-usage-meter" :aria-label="props.label">
        <div class="max-usage-meter__heading"><strong>{{ props.label }}</strong><span>{{ summary }}<span v-if="thresholdMessage"> · {{ thresholdMessage }}</span></span></div>
        <MaxProgressBar v-if="validMeter" mode="meter" :value="clamped" :max="props.limit!" :ariaLabel="props.label" :value-text="summary" />
        <MaxButton v-if="props.actionLabel" :label="props.actionLabel" @click="emit('action')" />
        <slot name="details" /><slot name="actions" />
    </section>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxProgressBar from './MaxProgressBar.vue';
    import MaxButton from './MaxButton.vue';
    import type { MaxUsageMeterProps } from '../types/usageMeter';

    const props = withDefaults(defineProps<MaxUsageMeterProps>(), { unlimited: false, unit: '', warningThreshold: 0.8 });
    const emit = defineEmits<{ action: [] }>();
    const validUsed = computed(() => typeof props.used === 'number' && Number.isFinite(props.used) && props.used >= 0);
    const validMeter = computed(() => validUsed.value && typeof props.limit === 'number' && Number.isFinite(props.limit) && props.limit > 0 && !props.unlimited);
    const clamped = computed(() => validMeter.value ? Math.min(props.used!, props.limit!) : 0);
    const thresholdMessage = computed(() => {
        const threshold = Number.isFinite(props.warningThreshold) && props.warningThreshold >= 0 && props.warningThreshold <= 1 ? props.warningThreshold : 0.8;
        if (!validMeter.value) return '';
        const ratio = props.used! / props.limit!;
        if (ratio > 1) return 'Acima do limite';
        if (ratio === 1) return 'Limite atingido';
        if (ratio >= threshold) return 'Próximo do limite';
        return '';
    });
    const summary = computed(() => {
        if (props.unlimited) return 'Sem limite';
        if (!validUsed.value || props.limit === null || !Number.isFinite(props.limit) || props.limit < 0) return 'Consumo indisponível';
        if (props.limit === 0) return 'Limite zero';
        return `${props.used} / ${props.limit}${props.unit ? ` ${props.unit}` : ''}`;
    });
</script>

<style lang="scss" scoped>
.max-usage-meter { display: grid; gap: 8px; }
.max-usage-meter__heading { display: flex; justify-content: space-between; gap: 12px; }
</style>
