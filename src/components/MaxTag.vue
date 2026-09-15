<template>
    <MaxBadge
        :label="resolvedLabel"
        :color="resolvedColor"
        :icon="props.icon"
        :neon="props.neon"
        :status="props.status"
        :overlay="props.overlay"
        :uppercase="props.uppercase"
        :no-uppercase="props.noUppercase"
        :size="props.size"
        :background="props.background"
        :text-color="props.textColor"
        :dark="props.dark"
    />
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxBadge, { type MaxBadgeStatus } from './MaxBadge.vue';

    export type MaxTagSeverity = 'success' | 'info' | 'warn' | 'warning' | 'danger' | 'error' | 'secondary';

    export interface MaxTagProps {
        value?: string | number;
        label?: string | number;
        severity?: MaxTagSeverity;
        color?: string;
        icon?: string;
        neon?: boolean;
        status?: MaxBadgeStatus;
        overlay?: boolean | string | number;
        uppercase?: boolean;
        noUppercase?: boolean;
        size?: string | number;
        background?: string;
        textColor?: string;
        dark?: boolean;
    }

    const props = withDefaults(defineProps<MaxTagProps>(), {
        value: undefined,
        label: undefined,
        severity: undefined,
        color: undefined,
        icon: undefined,
        neon: false,
        status: undefined,
        overlay: undefined,
        uppercase: true,
        noUppercase: false,
        size: undefined,
        background: undefined,
        textColor: undefined,
        dark: undefined
    });

    const resolvedLabel = computed<string | number>(() => {
        if (props.label !== undefined && props.label !== null) return props.label;
        if (props.value !== undefined && props.value !== null) return props.value;
        return '';
    });

    const severityColorMap: Record<MaxTagSeverity, string> = {
        success: 'var(--max-success-500, #10b981)',
        info: 'var(--max-info-500, #3b82f6)',
        warn: 'var(--max-warning-500, #f59e0b)',
        warning: 'var(--max-warning-500, #f59e0b)',
        danger: 'var(--max-danger-500, #ef4444)',
        error: 'var(--max-danger-500, #ef4444)',
        secondary: 'var(--background-700, #64748b)'
    };

    const resolvedColor = computed<string | undefined>(() => {
        if (props.color) return props.color;
        return props.severity ? severityColorMap[props.severity] : undefined;
    });
</script>
