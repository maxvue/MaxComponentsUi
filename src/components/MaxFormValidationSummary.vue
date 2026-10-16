<template>
    <div v-if="hasErrors" ref="summaryRef" class="max-form-validation-summary" tabindex="-1">
        <MaxAlert severity="danger" :title="props.title" live="assertive">
            <template #default>
                <div v-if="props.generalError" class="max-form-validation-summary__general-error">
                    {{ props.generalError }}
                </div>
                <ul v-if="props.errors && props.errors.length > 0" class="max-form-validation-summary__list">
                    <li v-for="issue in props.errors" :key="issue.key" class="max-form-validation-summary__item">
                        <button v-if="issue.inputId" type="button" class="max-form-validation-summary__link" @click="handleIssueClick(issue)">
                            <span class="max-form-validation-summary__label">{{ issue.label }}:</span>
                            <span class="max-form-validation-summary__message">{{ issue.message }}</span>
                        </button>
                        <span v-else class="max-form-validation-summary__text">
                            <span class="max-form-validation-summary__label">{{ issue.label }}:</span>
                            <span class="max-form-validation-summary__message">{{ issue.message }}</span>
                        </span>
                    </li>
                </ul>
            </template>
        </MaxAlert>
    </div>
</template>

<script setup lang="ts">
    import { computed, nextTick, ref } from 'vue';
    import MaxAlert from './MaxAlert.vue';
    import type { MaxValidationIssue, MaxFormValidationSummaryProps } from '../types/validation';

    const props = withDefaults(defineProps<MaxFormValidationSummaryProps>(), {
        errors: () => [],
        generalError: undefined,
        title: 'Erros encontrados no formulário',
        focusField: true
    });

    const emit = defineEmits<{
        navigate: [inputId: string];
    }>();

    const summaryRef = ref<HTMLElement | null>(null);

    const hasErrors = computed<boolean>(() => {
        const hasList = Boolean(props.errors && props.errors.length > 0);
        const hasGeneral = Boolean(props.generalError && props.generalError.trim().length > 0);
        return hasList || hasGeneral;
    });

    const focusSummary = (): void => {
        if (!summaryRef.value) return;
        summaryRef.value.focus({ preventScroll: false });
    };

    const handleIssueClick = async (issue: MaxValidationIssue): Promise<void> => {
        if (!issue.inputId) return;
        emit('navigate', issue.inputId);

        if (!props.focusField) return;

        await nextTick();

        if (typeof document === 'undefined') return;

        const target = document.getElementById(issue.inputId);
        if (!target) return;

        const prefersReducedMotion = typeof window !== 'undefined'
            && window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        try {
            target.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'center'
            });
            if (typeof (target as HTMLElement).focus === 'function') (target as HTMLElement).focus();

        } catch {
            // Elemento não suporta foco ou scroll no ambiente atual
        }
    };

    defineExpose({
        focusSummary
    });
</script>

<style lang="scss" scoped>
.max-form-validation-summary {
    width: 100%;
    margin-bottom: 16px;
    font-family: Quicksand, sans-serif;
    outline: none;

    &:focus-visible {
        box-shadow: 0 0 0 2px var(--max-focus-ring-color, #00768e);
        border-radius: 8px;
    }

    &__general-error {
        font-weight: 600;
        margin-bottom: 8px;
    }

    &__list {
        list-style: none;
        padding: 0;
        margin: 4px 0 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    &__item {
        display: flex;
        align-items: baseline;
    }

    &__link {
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        text-align: left;
        cursor: pointer;
        display: inline-flex;
        gap: 4px;
        text-decoration: underline;
        text-underline-offset: 3px;
        transition: opacity 0.15s ease;

        &:hover {
            opacity: 0.8;
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768e);
            outline-offset: 2px;
            border-radius: 2px;
        }
    }

    &__text {
        display: inline-flex;
        gap: 4px;
    }

    &__label {
        font-weight: 700;
    }

    &__message {
        font-weight: 500;
    }
}

@media (prefers-reduced-motion: reduce) {
    .max-form-validation-summary__link {
        transition: none !important;
    }
}
</style>
