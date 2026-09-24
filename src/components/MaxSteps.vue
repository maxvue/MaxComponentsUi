<template>
    <div
        class="max-steps"
        :class="{
            'has-border': props.showBorder,
            'is-scrollable': props.scrollable
        }"
        :id="`max-steps-${steps_id}`"
    >
        <!-- TOPO: NAVEGADOR DE STEPS -->
        <div class="max-steps-header-wrapper">
            <MaxIconButton
                v-if="props.showTopButtons"
                class="step-nav-btn prev-btn"
                icon="mdi:chevron-left"
                aria-label="Passo anterior"
                :disabled="isFirstStep"
                @click="previous"
            />

            <div
                class="max-steps-header"
                role="tablist"
                aria-orientation="horizontal"
                @keydown="onKeydown"
            >
                <div
                    v-for="(step, index) in steps"
                    :key="step.id"
                    class="max-step-header-item"
                    :class="{
                        'is-active': isStepActive(step),
                        'is-done': step.done && !isStepActive(step),
                        'is-error': step.error && !isStepActive(step),
                        'is-caution': step.caution && !isStepActive(step),
                        'is-disabled': step.disabled || isStepClickBlocked(step),
                        'is-clickable': props.allowManual && !step.disabled && !isStepClickBlocked(step)
                    }"
                    role="tab"
                    :id="`max-step-header-${step.id}`"
                    :aria-selected="isStepActive(step) ? 'true' : 'false'"
                    :aria-controls="`max-step-panel-${step.id}`"
                    :tabindex="isStepActive(step) ? 0 : -1"
                    @click="onStepHeaderClick(step)"
                >
                    <!-- Conector com o próximo step -->
                    <div
                        v-if="index > 0"
                        class="step-connector"
                        :class="{
                            'is-completed': isConnectorCompleted(index)
                        }"
                    />

                    <!-- Card / Marcador do Step -->
                    <div class="step-marker-container">
                        <div class="step-marker-card">
                            <div class="step-circle">
                                <MaxIcon
                                    v-if="step.done && !isStepActive(step)"
                                    icon="lets-icons:check-fill"
                                    class="step-icon status-done"
                                    size="1.2"
                                />
                                <MaxIcon
                                    v-else-if="step.error && !isStepActive(step)"
                                    icon="material-symbols:close-rounded"
                                    class="step-icon status-error"
                                    size="1.2"
                                />
                                <MaxIcon
                                    v-else-if="step.caution && !isStepActive(step)"
                                    icon="humbleicons:exclamation"
                                    class="step-icon status-caution"
                                    size="1.1"
                                />
                                <MaxIcon
                                    v-else-if="step.icon"
                                    :icon="step.icon"
                                    class="step-icon custom-icon"
                                    size="1.1"
                                />
                                <span v-else class="step-number">{{ index + 1 }}</span>
                            </div>

                            <div class="step-label-wrapper">
                                <span class="step-label">
                                    <span class="step-prefix">{{ index + 1 }}. </span>
                                    <span class="step-title-text">{{ step.title }}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <MaxIconButton
                v-if="props.showTopButtons"
                class="step-nav-btn next-btn"
                icon="mdi:chevron-right"
                aria-label="Próximo passo"
                :disabled="isLastStep || !canGoNext"
                @click="next"
            />
        </div>

        <!-- ÁREA DE CONTEÚDO SCROLLÁVEL -->
        <div class="max-steps-content">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, provide, ref, watch, toRef } from 'vue';
    import { isValid, Random, useRefCached } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { STEPS_INJECTION_KEY, type StepItemData, type StepsContext } from '../helpers/stepsContext';

    type Props = {
        id?: string | number;
        cached?: boolean;
        lazy?: boolean;
        allowManual?: boolean;
        nextOnlyDone?: boolean;
        showTopButtons?: boolean;
        showNext?: boolean;
        nextLabel?: string;
        forwardLabel?: string;
        fowardLabel?: string;
        FowardLabel?: string;
        onNext?: (step?: StepItemData) => boolean | void | Promise<boolean | void>;
        onForward?: (step?: StepItemData) => boolean | void | Promise<boolean | void>;
        onFoward?: (step?: StepItemData) => boolean | void | Promise<boolean | void>;
        showBack?: boolean;
        previousLabel?: string;
        backLabel?: string;
        BackLabel?: string;
        onPrevious?: (step?: StepItemData) => boolean | void | Promise<boolean | void>;
        onBack?: (step?: StepItemData) => boolean | void | Promise<boolean | void>;
        showFinish?: boolean;
        finishLabel?: string;
        onFinish?: () => void | Promise<void>;
        showBorder?: boolean;
        scrollable?: boolean;
    };

    const props = withDefaults(defineProps<Props>(), {
        cached: true,
        lazy: false,
        allowManual: true,
        nextOnlyDone: false,
        showTopButtons: true,
        showNext: true,
        nextLabel: 'Avançar',
        showBack: true,
        previousLabel: 'Voltar',
        showFinish: true,
        finishLabel: 'Concluir',
        onFinish: undefined,
        showBorder: false,
        scrollable: false
    });

    const emit = defineEmits<{
        'update:value': [value: string | number];
        'update:modelValue': [value: string | number];
        'next': [step: StepItemData];
        'previous': [step: StepItemData];
        'finish': [];
        'change': [step: StepItemData];
    }>();

    const steps_id = computed(() => props.id ?? Random());

    // v-model bidirecional
    const active_model_value = defineModel<string | number>('value');
    const active_model_modelValue = defineModel<string | number>('modelValue');

    const active_step = ref<string | number | undefined>(active_model_value.value ?? active_model_modelValue.value);

    watch([active_model_value, active_model_modelValue], ([val, modelVal]) => {
        const newVal = val ?? modelVal;
        if (newVal !== undefined && newVal !== active_step.value) active_step.value = newVal;

    });

    const updateActiveStep = (val: string | number) => {
        active_step.value = val;
        active_model_value.value = val;
        active_model_modelValue.value = val;
        emit('update:value', val);
        emit('update:modelValue', val);
    };

    // Cache no localStorage se cached === true
    const NO_CACHED = 'no-cached';
    const active_step_cached = useRefCached<string | number>('max-steps-opened-' + (props.id ?? ''), NO_CACHED);

    watch(active_step_cached, () => {
        if (!props.cached || !isValid(props.id) || active_step_cached.value === NO_CACHED) return;
        if (active_step.value !== active_step_cached.value && isValid(active_step_cached.value)) updateActiveStep(active_step_cached.value);

    }, { immediate: true });

    watch(active_step, () => {
        if (props.cached && isValid(props.id) && isValid(active_step.value)) active_step_cached.value = active_step.value;

    });

    // Lista de steps registrados
    const steps = ref<StepItemData[]>([]);

    const registerStep = (step: StepItemData) => {
        const existingIdx = steps.value.findIndex((s) => String(s.id) === String(step.id));
        if (existingIdx >= 0) steps.value[existingIdx] = { ...step, index: existingIdx };
        else {
            step.index = steps.value.length;
            steps.value.push(step);
        }

        // Se nenhum step estiver ativo ainda, ativa o primeiro automaticamente
        if (active_step.value === undefined || active_step.value === '' || active_step.value === null) updateActiveStep(steps.value[0].id);


        return () => {
            steps.value = steps.value.filter((s) => String(s.id) !== String(step.id));
            steps.value.forEach((s, idx) => {
                s.index = idx;
            });
        };
    };

    const updateStep = (updated: StepItemData) => {
        const idx = steps.value.findIndex((s) => String(s.id) === String(updated.id));
        if (idx >= 0) steps.value[idx] = { ...updated, index: idx };

    };

    const isStepActive = (step: StepItemData): boolean => {
        return String(active_step.value) === String(step.id);
    };

    const currentIndex = computed(() => {
        return steps.value.findIndex((s) => String(s.id) === String(active_step.value));
    });

    const currentStep = computed(() => {
        const idx = currentIndex.value;
        return idx >= 0 ? steps.value[idx] : undefined;
    });

    const isFirstStep = computed(() => currentIndex.value <= 0);
    const isLastStep = computed(() => currentIndex.value >= steps.value.length - 1);

    const canGoNext = computed(() => {
        if (!props.nextOnlyDone) return true;
        const current = currentStep.value;
        return Boolean(current?.done);
    });

    const resolvedNextLabel = computed(() => {
        return props.nextLabel
            || props.forwardLabel
            || props.fowardLabel
            || props.FowardLabel
            || 'Avançar';
    });

    const resolvedPreviousLabel = computed(() => {
        return props.previousLabel
            || props.backLabel
            || props.BackLabel
            || 'Voltar';
    });

    const resolvedOnNext = computed(() => props.onNext || props.onForward || props.onFoward);
    const resolvedOnPrevious = computed(() => props.onPrevious || props.onBack);

    const currentNextLabel = computed(() => {
        return currentStep.value?.nextLabel || resolvedNextLabel.value;
    });

    const currentPreviousLabel = computed(() => {
        return currentStep.value?.previousLabel || resolvedPreviousLabel.value;
    });

    const isConnectorCompleted = (index: number): boolean => {
        const previousStep = steps.value[index - 1];
        return Boolean(previousStep?.done);
    };

    const isStepClickBlocked = (targetStep: StepItemData): boolean => {
        if (!props.nextOnlyDone) return false;
        const currIdx = currentIndex.value;
        const targetIdx = steps.value.findIndex((s) => String(s.id) === String(targetStep.id));
        if (targetIdx <= currIdx) return false;

        // Se o destino estiver à frente, todos os intermediários a partir do atual devem ser done
        for (let i = currIdx; i < targetIdx; i++) if (!steps.value[i]?.done) return true;

        return false;
    };

    const goTo = async (targetId: string | number): Promise<boolean> => {
        const targetStep = steps.value.find((s) => String(s.id) === String(targetId));
        if (!targetStep || targetStep.disabled) return false;
        if (String(targetStep.id) === String(active_step.value)) return true;

        if (isStepClickBlocked(targetStep)) return false;

        const current = currentStep.value;
        const targetIdx = targetStep.index;
        const currIdx = currentIndex.value;

        if (targetIdx > currIdx) {
            // Indo para frente
            if (current?.onNext) {
                const stepResult = await current.onNext();
                if (stepResult === false) return false;
            }
            if (resolvedOnNext.value) {
                const globalResult = await resolvedOnNext.value(current);
                if (globalResult === false) return false;
            }
        } else {
            // Indo para trás
            if (current?.onPrevious) {
                const stepResult = await current.onPrevious();
                if (stepResult === false) return false;
            }
            if (resolvedOnPrevious.value) {
                const globalResult = await resolvedOnPrevious.value(current);
                if (globalResult === false) return false;
            }
        }

        updateActiveStep(targetStep.id);
        emit('change', targetStep);
        return true;
    };

    const next = async (): Promise<boolean> => {
        if (isLastStep.value) return false;
        if (!canGoNext.value) return false;

        const current = currentStep.value;
        if (current?.onNext) {
            const stepResult = await current.onNext();
            if (stepResult === false) return false;
        }

        if (resolvedOnNext.value) {
            const globalResult = await resolvedOnNext.value(current);
            if (globalResult === false) return false;
        }

        const nextStep = steps.value[currentIndex.value + 1];
        if (!nextStep) return false;

        updateActiveStep(nextStep.id);
        emit('next', nextStep);
        emit('change', nextStep);
        return true;
    };

    const previous = async (): Promise<boolean> => {
        if (isFirstStep.value) return false;

        const current = currentStep.value;
        if (current?.onPrevious) {
            const stepResult = await current.onPrevious();
            if (stepResult === false) return false;
        }

        if (resolvedOnPrevious.value) {
            const globalResult = await resolvedOnPrevious.value(current);
            if (globalResult === false) return false;
        }

        const prevStep = steps.value[currentIndex.value - 1];
        if (!prevStep) return false;

        updateActiveStep(prevStep.id);
        emit('previous', prevStep);
        emit('change', prevStep);
        return true;
    };

    const finish = async (): Promise<void> => {
        if (props.onFinish) await props.onFinish();
        else emit('finish');

    };

    const onStepHeaderClick = (step: StepItemData) => {
        if (!props.allowManual) return;
        if (step.disabled || isStepClickBlocked(step)) return;
        goTo(step.id);
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (steps.value.length === 0) return;
        const enabledSteps = steps.value.filter((s) => !s.disabled && !isStepClickBlocked(s));
        if (enabledSteps.length === 0) return;

        const currentIdx = enabledSteps.findIndex((s) => isStepActive(s));
        let nextIdx = currentIdx;

        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                nextIdx = (currentIdx + 1) % enabledSteps.length;
                break;
            case 'ArrowLeft':
                event.preventDefault();
                nextIdx = (currentIdx - 1 + enabledSteps.length) % enabledSteps.length;
                break;
            case 'Home':
                event.preventDefault();
                nextIdx = 0;
                break;
            case 'End':
                event.preventDefault();
                nextIdx = enabledSteps.length - 1;
                break;
            default:
                return;
        }

        const target = enabledSteps[nextIdx];
        if (target) goTo(target.id);

    };

    provide<StepsContext>(STEPS_INJECTION_KEY, {
        active_step,
        steps,
        registerStep,
        updateStep,
        next,
        previous,
        goTo,
        finish,
        isFirstStep,
        isLastStep,
        allowManual: toRef(props, 'allowManual'),
        nextOnlyDone: toRef(props, 'nextOnlyDone'),
        showNext: toRef(props, 'showNext'),
        showBack: toRef(props, 'showBack'),
        showFinish: toRef(props, 'showFinish'),
        currentNextLabel,
        currentPreviousLabel,
        finishLabel: toRef(props, 'finishLabel'),
        canGoNext,
        steps_id,
        lazy: toRef(props, 'lazy')
    });

    defineExpose({
        next,
        previous,
        goTo,
        finish,
        active_step,
        steps
    });
</script>

<style lang="scss" scoped>
.max-steps {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    max-height: 100%;
    box-sizing: border-box;
    background-color: var(--background-0);

    &.has-border {
        border: 1px solid var(--background-300);
        border-radius: 1rem;
        overflow: hidden;
    }

    .max-steps-header-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 1.25rem 1.5rem;
        box-sizing: border-box;
        border-bottom: 1px solid var(--background-200);
        background-color: var(--background-50);
        gap: 16px;

        .step-nav-btn {
            flex-shrink: 0;
            color: var(--background-700);

            &:disabled {
                opacity: 0.35;
                cursor: not-allowed;
            }
        }

        .max-steps-header {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            flex: 1 1 auto;
            position: relative;
            overflow-x: auto;
            scrollbar-width: none;
            user-select: none;

            &::-webkit-scrollbar {
                display: none;
            }
        }
    }

    .max-step-header-item {
        display: flex;
        align-items: center;
        position: relative;
        flex: 1 1 0;
        min-width: 120px;
        justify-content: center;

        &:first-child {
            .step-connector {
                display: none;
            }
        }

        .step-connector {
            position: absolute;
            top: 26px;
            right: 50%;
            width: 100%;
            height: 2px;
            background-color: var(--background-300);
            z-index: 1;
            transition: background-color 0.25s ease;

            &.is-completed {
                background-color: var(--emerald-600);
            }
        }

        .step-marker-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 2;
            cursor: default;
        }

        &.is-clickable {
            .step-marker-container {
                cursor: pointer;
            }
        }

        &.is-disabled {
            opacity: 0.55;
            cursor: not-allowed;

            .step-marker-container {
                cursor: not-allowed;
            }
        }

        .step-marker-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8px 14px;
            border-radius: 12px;
            background: transparent;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

            .step-circle {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.95rem;
                background-color: var(--background-100);
                border: 2px solid var(--background-300);
                color: var(--background-500);
                transition: all 0.25s ease;

                .step-icon {
                    color: #fff;
                }
            }

            .step-label-wrapper {
                margin-top: 8px;
                font-size: 0.85rem;
                font-weight: 500;
                color: var(--background-600);
                text-align: center;
                white-space: nowrap;
                transition: color 0.2s ease;
            }
        }

        /* ESTADO: ATIVO (Card elevado flutuante com destaque visual azul-petróleo) */
        &.is-active {
            .step-marker-card {
                background-color: var(--background-0);
                box-shadow: 0 10px 25px -3px rgb(0 118 142 / 18%), 0 4px 10px -2px rgb(0 118 142 / 12%);
                border: 1px solid rgb(0 118 142 / 18%);
                transform: translateY(-2px);

                .step-circle {
                    background-color: var(--max-primary-500, #00768e);
                    border-color: var(--max-primary-500, #00768e);
                    color: #fff;
                    box-shadow: 0 0 12px rgb(0 118 142 / 35%);
                }

                .step-label-wrapper {
                    font-weight: 700;
                    color: var(--max-primary-500, #00768e);
                }
            }
        }

        /* ESTADO: CONCLUÍDO (DONE) */
        &.is-done {
            .step-marker-card {
                .step-circle {
                    background-color: var(--emerald-600);
                    border-color: var(--emerald-600);
                    color: #fff;
                }

                .step-label-wrapper {
                    color: var(--background-800);
                }
            }
        }

        /* ESTADO: ERRO (ERROR) */
        &.is-error {
            .step-marker-card {
                .step-circle {
                    background-color: var(--red-600);
                    border-color: var(--red-600);
                    color: #fff;
                }

                .step-label-wrapper {
                    color: var(--red-600);
                }
            }
        }

        /* ESTADO: ALERTA (CAUTION) */
        &.is-caution {
            .step-marker-card {
                .step-circle {
                    background-color: var(--orange-600);
                    border-color: var(--orange-600);
                    color: #fff;
                }

                .step-label-wrapper {
                    color: var(--orange-600);
                }
            }
        }

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
            outline-offset: 2px;
            border-radius: 8px;
        }
    }

    .max-steps-content {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        overflow-y: auto;
        padding: 1.5rem;
        box-sizing: border-box;
    }
}

@media (prefers-reduced-motion: reduce) {
    .step-marker-card,
    .step-circle,
    .step-connector {
        transition: none !important;
        transform: none !important;
    }
}
</style>
