<template>
    <InputBase v-bind="forwardedAttrs" class="max-input-email" :suggestions="props.suggestions" :done="props.done" :error="resolvedError" :caution="resolvedCaution" :disabled="props.disabled" :required="props.required" :noMessage="props.noMessage" :noStatus="props.noStatus" :label="resolvedLabel" :placeholder="props.placeholder" :icon="props.icon" :iconLeft="props.iconLeft" :iconRight="props.iconRight" :msg="props.msg" :message="props.message" :ariaDescribedby="props.ariaDescribedby">
        <template #default="{ inputAttrs }">
            <input v-bind="inputAttrs" ref="inputRef" class="max-input-native" type="email" inputmode="email" :placeholder="props.placeholder" :disabled="props.disabled" :spellcheck="false" autocapitalize="none" :autocomplete="resolvedAutocomplete" :value="props.modelValue ?? ''" @input="onInput" @blur="onBlur" @focus="onFocus" />
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { computed, ref, useAttrs } from 'vue';
    import { isEmail } from '@maxvue/max-use';
    import InputBase from './InputBase.vue';
    import { useInputValidation } from '../helpers/useInputValidation';
    import type { MaxInputEmailProps, SemanticTextInputExpose } from '../types/semanticInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const inputRef = ref<HTMLInputElement | null>(null);

    const props = withDefaults(defineProps<MaxInputEmailProps>(), {
        modelValue: '',
        autocomplete: undefined,
        suggestions: false,
        label: undefined,
        placeholder: undefined,
        disabled: false,
        required: false,
        done: undefined,
        error: undefined,
        caution: undefined,
        noMessage: false,
        noStatus: false
    });

    const resolvedAutocomplete = computed(() => props.autocomplete ?? (props.suggestions ? 'email' : 'off'));

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'blur': [event: FocusEvent];
        'focus': [event: FocusEvent];
    }>();

    const resolvedLabel = computed<string | undefined>(() => {
        if (props.label !== undefined) return props.label;
        return 'E-mail';
    });

    const modelValueRef = computed(() => props.modelValue ?? '');

    const validation = useInputValidation({
        value: modelValueRef,
        required: computed(() => props.required),
        caution: computed(() => (props.caution === null ? undefined : props.caution)),
        done: computed(() => props.done),
        validator: (val: any) => {
            if (val === null || val === undefined || String(val).trim() === '') return !props.required;
            return isEmail(String(val));
        },
        invalidMessage: 'E-mail inválido',
        requiredMessage: 'Campo obrigatório'
    });

    const resolvedError = computed(() => {
        if (props.error === false) return null;
        if (typeof props.error === 'string') return props.error;
        if (typeof props.caution === 'string') return null;
        return validation.error.value;
    });

    const resolvedCaution = computed(() => {
        if (props.caution !== undefined && props.caution !== null) return Boolean(props.caution);
        return validation.caution.value;
    });

    const onInput = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const val = target.value;
        emit('update:modelValue', val);
        validation.onInput(val);
    };

    const onBlur = (event: FocusEvent) => {
        validation.onBlur();
        emit('blur', event);
    };

    const onFocus = (event: FocusEvent) => {
        emit('focus', event);
    };

    const focus = (options?: FocusOptions) => {
        inputRef.value?.focus(options);
    };

    const setFocus = () => {
        inputRef.value?.focus();
    };

    defineExpose<SemanticTextInputExpose>({
        focus,
        setFocus
    });

    const forwardedAttrs = computed(() => {
        const {
            modelValue: _mv,
            autocomplete: _ac,
            ...rest
        } = attrs;
        return rest;
    });
</script>

<style lang="scss" scoped>
    .max-input-email {
        width: 100%;
    }
</style>
