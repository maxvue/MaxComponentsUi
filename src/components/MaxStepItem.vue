<template>
    <div
        v-if="shouldRender"
        v-show="!context.lazy.value || is_active"
        class="max-step-item-content"
        role="tabpanel"
        :id="`max-step-panel-${uniqueStepId}`"
        :aria-labelledby="`max-step-header-${uniqueStepId}`"
        tabindex="0"
    >
        <div class="max-step-item-body">
            <slot></slot>
        </div>

        <div v-if="is_active && (context.showNext.value || context.showBack.value || context.showFinish.value)" class="max-steps-footer">
            <slot
                name="footer"
                :isFirst="context.isFirstStep.value"
                :isLast="context.isLastStep.value"
                :canGoNext="context.canGoNext.value"
                :next="context.next"
                :previous="context.previous"
                :finish="context.finish"
            >
                <div class="footer-left">
                    <MaxButton
                        v-if="context.showBack.value && !context.isFirstStep.value"
                        class="btn-step-prev"
                        variant="outlined"
                        severity="secondary"
                        icon="heroicons:arrow-left-20-solid"
                        :label="resolvedPreviousLabel"
                        @click="context.previous"
                    />
                </div>

                <div class="footer-right">
                    <MaxButton
                        v-if="context.showNext.value && !context.isLastStep.value"
                        class="btn-step-next"
                        icon-pos="right"
                        icon="heroicons:arrow-right-20-solid"
                        :disabled="!context.canGoNext.value"
                        :label="resolvedNextLabel"
                        @click="context.next"
                    />

                    <MaxButton
                        v-else-if="context.showFinish.value && context.isLastStep.value"
                        class="btn-step-finish"
                        severity="success"
                        icon="lets-icons:check-fill"
                        :label="context.finishLabel.value"
                        @click="context.finish"
                    />
                </div>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { Random } from '@maxvue/max-use';
    import MaxButton from './MaxButton.vue';
    import { injectStepsContext, type StepItemData, type StepStatus } from '../helpers/stepsContext';

    type Props = {
        value?: string | number;
        title?: string;
        labelMobile?: string;
        LabelMobile?: string;
        icon?: string;
        i?: string;
        disabled?: boolean;
        status?: StepStatus;
        Status?: StepStatus;
        done?: boolean;
        Done?: boolean;
        error?: boolean;
        Error?: boolean;
        caution?: boolean;
        Caution?: boolean;
        pending?: boolean;
        Pending?: boolean;
        pendencia?: boolean;
        Pendencia?: boolean;
        nextLabel?: string;
        NextLabel?: string;
        forwardLabel?: string;
        fowardLabel?: string;
        FowardLabel?: string;
        previousLabel?: string;
        PreviousLabel?: string;
        backLabel?: string;
        BackLabel?: string;
        onNext?: () => boolean | void | Promise<boolean | void>;
        onForward?: () => boolean | void | Promise<boolean | void>;
        onFoward?: () => boolean | void | Promise<boolean | void>;
        onPrevious?: () => boolean | void | Promise<boolean | void>;
        onBack?: () => boolean | void | Promise<boolean | void>;
        onEnter?: () => void;
        onShow?: () => void;
        onLeave?: () => void;
        onHide?: () => void;
    };

    const props = withDefaults(defineProps<Props>(), {
        title: '',
        disabled: false,
        status: undefined,
        Status: undefined,
        done: undefined,
        Done: undefined,
        error: undefined,
        Error: undefined,
        caution: undefined,
        Caution: undefined,
        pending: undefined,
        Pending: undefined,
        pendencia: undefined,
        Pendencia: undefined
    });

    const context = injectStepsContext('MaxStepItem');

    const generatedId = Random();
    const step_id = ref<string | number>(props.value ?? generatedId);
    const uniqueStepId = computed(() => String(step_id.value));

    const resolvedStatus = computed<StepStatus | undefined>(() => {
        const s = (props.status || props.Status)?.toLowerCase();
        if (s) return s as StepStatus;
        if (props.done || props.Done) return 'done';
        if (props.error || props.Error) return 'error';
        if (props.caution || props.Caution || props.pending || props.Pending || props.pendencia || props.Pendencia) return 'pending';
        return undefined;
    });

    const isDone = computed(() => {
        const s = resolvedStatus.value;
        return s === 'done' || s === 'completed' || s === 'concluido';
    });

    const isError = computed(() => {
        const s = resolvedStatus.value;
        return s === 'error' || s === 'erro';
    });

    const isCaution = computed(() => {
        const s = resolvedStatus.value;
        return s === 'pending' || s === 'pendencia' || s === 'caution' || s === 'alerta';
    });

    const resolvedLabelMobile = computed(() => props.labelMobile || props.LabelMobile);

    const resolvedNextLabel = computed(() => {
        return props.nextLabel
            || props.NextLabel
            || props.forwardLabel
            || props.fowardLabel
            || props.FowardLabel
            || context.currentNextLabel.value;
    });

    const resolvedPreviousLabel = computed(() => {
        return props.previousLabel
            || props.PreviousLabel
            || props.backLabel
            || props.BackLabel
            || context.currentPreviousLabel.value;
    });

    const resolvedOnNext = computed(() => props.onNext || props.onForward || props.onFoward);
    const resolvedOnPrevious = computed(() => props.onPrevious || props.onBack);
    const resolvedOnEnter = computed(() => props.onEnter || props.onShow);
    const resolvedOnLeave = computed(() => props.onLeave || props.onHide);

    const is_active = computed(() => String(context.active_step.value) === String(step_id.value));

    const has_been_active = ref(false);
    const shouldRender = computed(() => {
        if (!context.lazy.value) return is_active.value;
        return is_active.value || has_been_active.value;
    });

    watch(is_active, (active, previousActive) => {
        if (active) {
            has_been_active.value = true;
            resolvedOnEnter.value?.();
        } else if (previousActive) resolvedOnLeave.value?.();

    });

    let unregisterFn: (() => void) | null = null;

    const buildStepData = (): StepItemData => ({
        id: step_id.value,
        index: 0,
        title: props.title,
        labelMobile: resolvedLabelMobile.value,
        icon: props.icon || props.i,
        disabled: props.disabled,
        status: resolvedStatus.value,
        done: isDone.value,
        error: isError.value,
        caution: isCaution.value,
        pending: isCaution.value,
        nextLabel: resolvedNextLabel.value,
        previousLabel: resolvedPreviousLabel.value,
        onNext: resolvedOnNext.value,
        onPrevious: resolvedOnPrevious.value,
        onEnter: resolvedOnEnter.value,
        onLeave: resolvedOnLeave.value
    });

    onMounted(() => {
        const data = buildStepData();
        unregisterFn = context.registerStep(data);
        if (is_active.value) {
            has_been_active.value = true;
            resolvedOnEnter.value?.();
        }
    });

    watch([
        () => props.title,
        resolvedLabelMobile,
        () => props.icon,
        () => props.i,
        () => props.disabled,
        resolvedStatus,
        isDone,
        isError,
        isCaution,
        resolvedNextLabel,
        resolvedPreviousLabel,
        resolvedOnNext,
        resolvedOnPrevious
    ], () => {
        context.updateStep(buildStepData());
    });

    onBeforeUnmount(() => {
        if (is_active.value) resolvedOnLeave.value?.();

        unregisterFn?.();
    });
</script>

<style lang="scss" scoped>
.max-step-item-content {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    width: 100%;
    min-height: 0;
    box-sizing: border-box;

    &:focus-visible {
        outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
        outline-offset: -2px;
        border-radius: 4px;
    }

    .max-step-item-body {
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        box-sizing: border-box;
    }

    .max-steps-footer {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding-top: 1.5rem;
        margin-top: auto;
        border-top: 1px solid var(--background-200);
        box-sizing: border-box;

        .footer-left,
        .footer-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .footer-right {
            margin-left: auto;
        }
    }
}
</style>
