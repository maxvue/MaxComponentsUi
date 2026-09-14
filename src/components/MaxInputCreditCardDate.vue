<template>
    <InputBase
        v-bind="props"
        class="max-input-credit-card-date input-credit-card-date-base"
        :text-center="true"
        :label="props.label"
        :done="done ?? undefined"
        :caution="caution"
        :required="props.required"
        :error="error_msg ?? undefined"
    >
        <template #default="{ inputAttrs }">
            <MaxBaseInput
                v-bind="{ ...inputAttrs, ...attrs }"
                type="text"
                v-model="temp_value"
                v-maska:unmaskedValue.unmasked="maskValue"
                placeholder="MM/AA"
                @blur="checkDone"
            />
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { vMaska } from 'maska/vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxBaseInput from './base/MaxBaseInput.vue';
    import { onlyNumbers } from '@maxvue/max-use';
    import { useInputValidation } from '../helpers/useInputValidation';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            label?: string | undefined;
            required?: boolean;
            done?: boolean | undefined;
            caution?: boolean | string | undefined;
            error?: string | boolean | undefined;
            noMessage?: boolean;
        }>(),
        { modelValue: '', label: 'Validade', required: false, done: undefined, caution: undefined, error: undefined, noMessage: false }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
    }>();

    const toText = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

    const temp_value = ref(toText(props.modelValue));
    const unmaskedValue = ref(onlyNumbers(toText(props.modelValue)));

    /** Válido quando há 4 dígitos (MMAA) e o mês está entre 01 e 12. */
    const isValidDate = (raw: any): boolean => {
        const value = onlyNumbers(String(raw ?? ''));
        if (value.length !== 4) return false;
        const month = Number(value.slice(0, 2));
        return month >= 1 && month <= 12;
    };

    const isComplete = (raw: any): boolean => {
        const value = onlyNumbers(String(raw ?? ''));
        return value.length === 4;
    };

    const explicitErrorMsg = computed<string | null>(() =>
        (typeof props.error === 'string' ? props.error : null)
        ?? (props as any).errMsg
        ?? attrs.errMsg
        ?? (props as any).error_message
        ?? attrs.error_message
        ?? (props as any).error_msg
        ?? attrs.error_msg
        ?? null
    );

    const hasExplicitBooleanError = computed(() => props.error === true || attrs.error === true || attrs.error === '');

    const invalidMessage = computed(() => explicitErrorMsg.value ?? 'Validade inválida');

    const validation = useInputValidation({
        value: unmaskedValue,
        required: computed(() => props.required),
        caution: computed(() => props.caution),
        done: computed(() => props.done),
        validator: isValidDate,
        isComplete,
        invalidMessage,
        requiredMessage: computed(() => explicitErrorMsg.value ?? 'Campo obrigatório')
    });

    const done = validation.done;
    const caution = computed(() => hasExplicitBooleanError.value || (explicitErrorMsg.value ? true : validation.caution.value));
    const error_msg = computed(() => {
        if (explicitErrorMsg.value) return explicitErrorMsg.value;
        if (hasExplicitBooleanError.value) return true;
        return validation.error.value;
    });

    const checkDone = () => {
        validation.onBlur();
    };

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ }
        };

        return {
            tokens: tokens,
            mask: '##/##'
        };
    });

    watch(unmaskedValue, () => {
        emit('update:modelValue', unmaskedValue.value);
        validation.onInput();
    });

    watch(
        () => props.modelValue,
        () => {
            const numbers = onlyNumbers(toText(props.modelValue));
            if (numbers !== onlyNumbers(temp_value.value)) temp_value.value = toText(props.modelValue);
        }
    );

    defineExpose({
        unmaskedValue,
        checkDone,
        done,
        caution,
        error_msg,
        maskValue,
        validation,
        submit: validation.submit,
        reset: validation.reset
    });
</script>

<style lang="scss" scoped>
.input-credit-card-date-base {
    :deep(input) {
        letter-spacing: 2px;
    }
}
</style>
