<template>
    <InputBase
        v-bind="props"
        class="max-input-text"
        :done="props.done ?? validation.done.value"
        :error="props.error ?? (typeof props.caution === 'string' ? null : validation.error.value)"
        :caution="props.caution ?? validation.caution.value"
    >
        <template #default="{ inputAttrs }">
            <input
                v-bind="inputAttrs"
                class="max-input-native"
                :type="props.type"
                :placeholder="props.placeholder"
                :disabled="props.disabled"
                :spellcheck="resolvedSpellcheck"
                :value="temp_value"
                @input="onInput"
                @blur="validation.onBlur"
            />
            <slot></slot>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { toSearchableString, hasContent } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import { useInputValidation } from '../helpers/useInputValidation';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            type?: string;
            /** Valor atual do input */
            modelValue: any;
            /** Ícone opcional (ex: 'mdi:email') */
            icon?: string | undefined;
            /** Alias para o ícone */
            i?: string | undefined;
            /** Desabilita o campo */
            disabled?: boolean | undefined;
            /** Ativa estilo FloatLabel */
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
            /** Valor para comparação (valida se o input é igual a este valor) */
            targetValue?: string;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean | undefined;
            /** Define se o campo é obrigatório */
            required?: boolean;
            /** Texto de placeholder do campo */
            placeholder?: string | undefined;
            /** Habilita ou desabilita a verificação ortográfica nativa */
            spellcheck?: boolean | undefined;
        }>(),
        { modelValue: '', done: undefined, required: false, type: 'text', caution: undefined, disabled: false, error: undefined, spellcheck: true }
    );

    const resolvedSpellcheck = computed(() => {
        if (props.type === 'password') return false;
        return props.spellcheck;
    });

    const temp_value = ref<any>(props.modelValue);

    const customErrorMessage = computed(() => attrs.errMsg ?? attrs.error_message ?? attrs.error_msg);

    const validation = useInputValidation({
        value: temp_value,
        required: computed(() => props.required),
        targetValue: computed(() => props.targetValue),
        caution: computed(() => props.caution),
        done: computed(() => props.done),
        validator: (val) => {
            if (typeof props.targetValue === 'string' && hasContent(props.targetValue)) return toSearchableString(props.targetValue) === toSearchableString(val);

            return hasContent(val);
        },
        invalidMessage: customErrorMessage.value ?? (typeof props.targetValue === 'string' && hasContent(props.targetValue)
            ? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value'] ?? props.targetValue)
            : 'Valor inválido'),
        requiredMessage: customErrorMessage.value ?? 'Campo obrigatório'
    });

    const onInput = (event: Event) => {
        temp_value.value = (event.target as HTMLInputElement).value;
        validation.onInput();
    };

    const emit = defineEmits<{ 'update:modelValue': [value: string | number | undefined] }>();
    watch(temp_value, () => {
        emit('update:modelValue', temp_value.value);
    });
    watch(
        () => props.modelValue,
        () => (temp_value.value = props.modelValue)
    );
</script>