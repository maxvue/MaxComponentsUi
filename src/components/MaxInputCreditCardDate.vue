<template>
    <InputBase v-bind="props" class="max-input-credit-card-date input-credit-card-date-base" :text-center="true" :label="props.label" :done="done" :required="props.required" :error="resolvedError">
        <template #default="{ inputAttrs }">
            <MaxBaseInput
                v-bind="{ ...inputAttrs, ...attrs }"
                type="text"
                v-model="temp_value"
                v-maska:unmaskedValue.unmasked="maskValue"
                placeholder="MM/AA"
                @blur="onBlur"
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
    import type { InputBaseProps } from '../types';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<InputBaseProps & {
            modelValue: string;
            label?: string | undefined;
            required?: boolean;
            error?: string | boolean | null | undefined;
            caution?: string | boolean | null | undefined;
            done?: boolean | null | undefined;
        }>(),
        { modelValue: '', label: 'Validade', required: false, error: undefined, caution: undefined, done: undefined }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
    }>();

    const toText = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

    const temp_value = ref(toText(props.modelValue));
    const unmaskedValue = ref(onlyNumbers(toText(props.modelValue)));

    const hasBeenTouched = ref(false);
    const isSubmitted = ref(false);
    const isDone = ref<boolean | null>(null);

    /** Válido quando há 4 dígitos (MMAA) e o mês está entre 01 e 12. */
    const isValidDate = (value: string): boolean => {
        if (value.length !== 4) return false;
        const month = Number(value.slice(0, 2));
        return month >= 1 && month <= 12;
    };

    const done = computed(() => {
        if (props.done !== undefined) return props.done;
        return isDone.value ?? (unmaskedValue.value.length > 0 ? isValidDate(unmaskedValue.value) : null);
    });

    const checkDone = () => {
        hasBeenTouched.value = true;
        isDone.value = unmaskedValue.value.length > 0 ? isValidDate(unmaskedValue.value) : (props.required ? false : null);
    };

    const onBlur = () => {
        checkDone();
    };

    const submit = (): boolean => {
        isSubmitted.value = true;
        checkDone();
        return done.value === true;
    };

    const reset = (): void => {
        hasBeenTouched.value = false;
        isSubmitted.value = false;
        isDone.value = null;
    };

    const caution = computed(() => {
        if (props.caution !== undefined) return Boolean(props.caution);
        if (unmaskedValue.value.length === 0) return Boolean(props.required && (hasBeenTouched.value || isSubmitted.value));
        return done.value === false && (hasBeenTouched.value || isSubmitted.value);
    });

    const error_msg = computed<string | null>(() => {
        const attrs_msg = (props as any).errMsg
            ?? attrs.errMsg
            ?? (props as any).error_message
            ?? attrs.error_message
            ?? (props as any).error_msg
            ?? attrs.error_msg
            ?? null;
        if (isDone.value === false || ((hasBeenTouched.value || isSubmitted.value) && done.value === false)) return unmaskedValue.value.length === 0 ? (attrs_msg ?? 'Campo obrigatório') : (attrs_msg ?? 'Validade inválida');

        return null;
    });

    const resolvedError = computed<string | boolean | null | undefined>(() => {
        if (props.error !== undefined) {
            if (props.error === false || props.error === null) return undefined;
            if (props.error === true) return true;
            if (typeof props.error === 'string') return props.error;
        }

        return error_msg.value ?? undefined;
    });

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ }
        };

        return {
            tokens: tokens,
            mask: '##/##'
        };
    });

    watch(unmaskedValue, (val) => {
        emit('update:modelValue', val);
        if (val.length === 4 && isValidDate(val)) isDone.value = true;
        else if (isDone.value !== null) checkDone();

    });

    watch(
        () => props.modelValue,
        (newVal) => {
            const numbers = onlyNumbers(toText(newVal));
            if (numbers !== onlyNumbers(temp_value.value)) temp_value.value = toText(newVal);
            if (numbers !== unmaskedValue.value) unmaskedValue.value = numbers;
            if (!numbers) reset();

        }
    );

    defineExpose({
        unmaskedValue,
        temp_value,
        done,
        isDone,
        caution,
        error_msg,
        resolvedError,
        maskValue,
        checkDone,
        onBlur,
        submit,
        reset
    });
</script>

<style lang="scss" scoped>
.input-credit-card-date-base {
    :deep(input) {
        letter-spacing: 2px;
    }
}
</style>
