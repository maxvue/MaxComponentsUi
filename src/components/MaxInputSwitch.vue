<template>
    <InputBase v-bind="props" class="max-switch">
        <div :class="`max-switch-input ${temp_value === props.trueValue ? 'active' : ''}`">
            <div class="max-switch-label left" v-if="has_left_label" @click="() => changeValue(props.falseValue)">
                {{ props.labelLeft ?? props.leftLabel ?? props.labelFalse ?? props.falseLabel ?? '' }}
            </div>
            <div :class="`max-switch-toggle ${temp_value === props.trueValue ? 'active' : ''}`" @click="() => changeValue()">
                <div class="max-switch-background">
                    <div class="max-switch-button">

                    </div>
                </div>
            </div>
            <div class="max-switch-label right" v-if="has_right_label" @click="() => changeValue(props.falseValue)">
                {{ props.labelRight ?? props.rightLabel ?? props.labelTrue ?? props.trueLabel ?? props.question ?? '' }}
            </div>
        </div>
    </InputBase>
</template>

/**
 * Componente de interruptor (Switch/Toggle).
 * Ideal para opções binárias (Sim/Não, Ativo/Inativo).
 * Exibe uma pergunta ou rótulo ao lado do switch.
 */
<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import InputBase from './InputBase.vue';
    import { hasContent } from '@maxvue/max-use';

    const props = withDefaults(
        defineProps<{
            /** Valor booleano do switch */
            modelValue: any;
            /** Rótulo exibido ao lado esquerdo do Switch */
            labelLeft?: string;
            leftLabel?: string;
            falseLabel?: string;
            labelFalse?: string;
            /** Rótulo exibido do lado direito do Switch */
            labelRight?: string;
            rightLabel?: string;
            trueLabel?: string;
            labelTrue?: string;
            question?: string;
            /** Ícone opcional */
            trueValue: any;
            /** Ícone opcional */
            falseValue: any;
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

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);

    const has_left_label = computed(() => hasContent(props.labelLeft ?? props.leftLabel ?? props.labelFalse ?? props.falseLabel));
    const has_right_label = computed(() => hasContent(props.labelRight ?? props.rightLabel ?? props.labelTrue ?? props.trueLabel ?? props.question));

    const changeValue = (value: any = null) => {
        if (value) {
            temp_value.value = value;
            emit('update:modelValue', temp_value.value);
            return;
        }

        temp_value.value = temp_value.value === props.trueValue ? props.falseValue : props.trueValue;
        emit('update:modelValue', temp_value.value);
    };

    watch(() => props.modelValue, () => temp_value.value = props.modelValue);

</script>

<style lang="scss">
.max-switch {
    display: grid;
    grid-template-columns: 1fr;
    place-items: center;

    .max-switch-input {
        padding-left: 5px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        height: 20px;

        .max-switch-label {
            &.right {
                padding-left: 10px;
            }

            &.left {
                padding-right: 10px;
            }
        }

        .max-switch-toggle {
            position: relative;
            height: 20px;

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
