<template>
    <InputBase v-bind="props" :class="`max-input-switch max-switch ${props.disabled ? 'is-disabled' : ''}`">
        <template #default="{ inputId, messageId, hasMessage, isError: slotError, isRequired }">
            <div :class="`max-switch-input ${temp_value === props.trueValue ? 'active' : ''} ${props.disabled ? 'is-disabled' : ''}`">
                <div
                    class="max-switch-label left"
                    v-if="has_left_label"
                    :id="leftLabelId"
                    @click="() => setValue(props.falseValue)"
                >
                    {{ resolvedFalseLabel }}
                </div>
                <div
                    :id="inputId"
                    class="max-switch-toggle"
                    :class="{
                        'active': temp_value === props.trueValue,
                        'is-disabled': props.disabled
                    }"
                    role="switch"
                    :tabindex="props.disabled ? -1 : 0"
                    :aria-checked="temp_value === props.trueValue"
                    :aria-disabled="props.disabled ? 'true' : undefined"
                    :aria-label="switchAriaLabel"
                    :aria-labelledby="switchAriaLabelledby"
                    :aria-describedby="hasMessage ? messageId : undefined"
                    :aria-invalid="slotError || Boolean(props.error)"
                    :aria-required="isRequired || props.required"
                    @click="toggleValue"
                    @keydown.space.prevent="toggleValue"
                    @keydown.enter.prevent="toggleValue"
                >
                    <div class="max-switch-background">
                        <div class="max-switch-button"></div>
                    </div>
                </div>
                <div
                    class="max-switch-label right"
                    v-if="has_right_label"
                    :id="rightLabelId"
                    @click="() => setValue(props.trueValue)"
                >
                    {{ resolvedTrueLabel }}
                </div>
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente de interruptor (Switch/Toggle).
     * Ideal para opções binárias (Sim/Não, Ativo/Inativo).
     * Exibe uma pergunta ou rótulo ao lado do switch.
     */
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import { hasContent } from '@maxvue/max-use';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor booleano do switch */
            modelValue: any;
            /**
             * Rótulo exibido ao lado esquerdo do Switch.
             * Nome canônico: `falseLabel`. `labelLeft`/`leftLabel`/`labelFalse`
             * são aliases legados mantidos por compatibilidade — não remover.
             */
            labelLeft?: string;
            leftLabel?: string;
            falseLabel?: string;
            labelFalse?: string;
            /**
             * Rótulo exibido do lado direito do Switch.
             * Nome canônico: `trueLabel`. `labelRight`/`rightLabel`/`labelTrue`/
             * `question` são aliases legados mantidos por compatibilidade — não remover.
             */
            labelRight?: string;
            rightLabel?: string;
            trueLabel?: string;
            labelTrue?: string;
            question?: string;
            /** Valor retornado quando ativo (opcional) */
            trueValue?: any;
            /** Valor retornado quando inativo (opcional) */
            falseValue?: any;
            /** Ícone opcional */
            icon?: string | undefined;
            /** Alias para o ícone */
            i?: string | undefined;
            /** Desabilita o campo */
            disabled?: boolean | undefined;
            /** Estilo FloatLabel */
            float?: boolean | undefined;
            /** Mensagem de feedback (alias) */
            msg?: string | undefined;
            /** Mensagem de feedback */
            message?: string | undefined;
            /** Ícone da mensagem de feedback */
            iconMessage?: string | undefined;
            /** Rótulo do campo */
            label?: string | undefined;
            /** Estado de conclusão/validação manual */
            done?: boolean | undefined;
            /** Mensagem ou estado de erro */
            error?: string | boolean | undefined;
            /** Valor para comparação (opcional) */
            targetValue?: string;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean | undefined;
            /** Define se o campo é obrigatório */
            required?: boolean;
        }>(),
        { modelValue: false, done: undefined, required: false, caution: undefined, trueValue: true, falseValue: false }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: any];
    }>();

    const temp_value = ref(props.modelValue);

    const instanceId = `max-switch-${Math.random().toString(36).slice(2, 9)}`;
    const leftLabelId = `${instanceId}-label-left`;
    const rightLabelId = `${instanceId}-label-right`;

    const resolvedFalseLabel = computed(() => {
        return props.labelLeft ?? props.leftLabel ?? props.labelFalse ?? props.falseLabel ?? '';
    });

    const resolvedTrueLabel = computed(() => {
        return props.labelRight ?? props.rightLabel ?? props.labelTrue ?? props.trueLabel ?? props.question ?? '';
    });

    const has_left_label = computed(() => hasContent(resolvedFalseLabel.value));
    const has_right_label = computed(() => hasContent(resolvedTrueLabel.value));

    const switchAriaLabel = computed(() => {
        if (attrs['aria-label']) return attrs['aria-label'] as string;
        if (props.label && props.label.trim()) return props.label;
        if (props.question && props.question.trim()) return props.question;
        if (!resolvedFalseLabel.value && !resolvedTrueLabel.value) return 'Alternador';
        return undefined;
    });

    const switchAriaLabelledby = computed(() => {
        if (switchAriaLabel.value) return undefined;
        const ids: string[] = [];
        if (has_left_label.value) ids.push(leftLabelId);
        if (has_right_label.value) ids.push(rightLabelId);
        return ids.length > 0 ? ids.join(' ') : undefined;
    });

    /**
     * Define o valor do switch explicitamente. Usado pelos rotulos laterais,
     * onde cada lado representa um valor fixo (esquerda = falseValue,
     * direita = trueValue), e nao uma alternancia.
     */
    const setValue = (value: any) => {
        if (props.disabled) return;
        temp_value.value = value;
        emit('update:modelValue', temp_value.value);
    };

    /** Alterna entre trueValue e falseValue. Usado pelo toggle central. */
    const toggleValue = () => {
        if (props.disabled) return;
        setValue(temp_value.value === props.trueValue ? props.falseValue : props.trueValue);
    };

    watch(() => props.modelValue, (val) => {
        temp_value.value = val;
    });
</script>

<style lang="scss" scoped>
.max-switch {
    display: grid;
    grid-template-columns: 1fr;
    place-items: center;

    &.is-disabled,
    &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .max-switch-input {
        padding-left: 5px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        height: 20px;
        align-items: center;

        &.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;

            .max-switch-label,
            .max-switch-toggle {
                cursor: not-allowed !important;
            }
        }

        .max-switch-label {
            cursor: pointer;

            &.left {
                padding-right: 10px;
            }

            &.right {
                padding-left: 10px;
            }
        }

        .max-switch-toggle {
            position: relative;
            height: 20px;
            cursor: pointer;
            border-radius: 9999px;
            outline: none;
            transition: outline 0.15s ease, box-shadow 0.15s ease;

            &:focus-visible {
                outline: 2px solid var(--max-primary-500, #00768e);
                outline-offset: 3px;
            }

            &.is-disabled {
                cursor: not-allowed;
                opacity: 0.5;
            }

            .max-switch-background {
                width: 38px;
                height: 20px;
                display: grid;
                place-items: center;
                border-radius: 14px;
            }

            .max-switch-button {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                position: absolute;
                transition: left 0.2s ease, background-color 0.2s ease, color 0.2s ease;
            }
        }

        &.active {
            .max-switch-label {
                &.right {
                    color: var(--blue-800);
                }
            }

            .max-switch-background {
                background-color: var(--blue-200);
            }

            .max-switch-button {
                background-color: var(--blue-750);
                left: 21px;
            }
        }

        &:not(.active) {
            .max-switch-label {
                &.right {
                    color: var(--background-700);
                }
            }

            .max-switch-background {
                background-color: var(--background-200);
            }

            .max-switch-button {
                background-color: var(--background-600);
                left: 5px;
            }
        }
    }
}
</style>
