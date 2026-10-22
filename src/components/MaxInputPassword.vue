<template>
    <InputBase v-bind="forwardedAttrs" class="max-input-password" :suggestions="props.suggestions" :done="props.done" :error="resolvedError" :caution="resolvedCaution" :disabled="props.disabled" :required="props.required" :noMessage="props.noMessage" :noStatus="props.noStatus" :label="resolvedLabel" :placeholder="props.placeholder" :icon="props.icon" :iconLeft="props.iconLeft" :iconRight="props.iconRight" :msg="props.msg" :message="props.message" :ariaDescribedby="props.ariaDescribedby">
        <template #default="{ inputAttrs }">
            <div class="max-password-wrapper">
                <input v-bind="inputAttrs" ref="inputRef" class="max-input-native" :type="isRevealed ? 'text' : 'password'" :placeholder="props.placeholder" :disabled="props.disabled" :spellcheck="false" autocapitalize="none" :autocomplete="resolvedAutocomplete" :value="props.modelValue ?? ''" @input="onInput" @blur="onBlur" @focus="onFocus" />
                <MaxIconButton v-if="props.toggleVisibility" class="max-password-toggle" :icon="isRevealed ? 'lucide:eye-off' : 'lucide:eye'" size="1.25rem" :disabled="props.disabled" :aria-label="isRevealed ? 'Ocultar senha' : 'Exibir senha'" :aria-pressed="isRevealed" tabindex="-1" @click.stop.prevent="toggleReveal" />
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { computed, ref, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { useInputValidation } from '../helpers/useInputValidation';
    import type { MaxInputPasswordProps, SemanticTextInputExpose } from '../types/semanticInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const inputRef = ref<HTMLInputElement | null>(null);
    const isRevealed = ref(false);

    const props = withDefaults(defineProps<MaxInputPasswordProps>(), {
        modelValue: '',
        toggleVisibility: true,
        autocomplete: undefined,
        suggestions: false,
        minLength: undefined,
        targetValue: undefined,
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

    const resolvedAutocomplete = computed(() => props.autocomplete ?? (props.suggestions ? 'current-password' : 'off'));

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'blur': [event: FocusEvent];
        'focus': [event: FocusEvent];
    }>();

    const resolvedLabel = computed<string | undefined>(() => {
        if (props.label !== undefined) return props.label;
        return 'Senha';
    });

    const toggleReveal = () => {
        if (props.disabled) return;
        isRevealed.value = !isRevealed.value;
    };

    const modelValueRef = computed(() => props.modelValue ?? '');

    const resolveInvalidMessage = (): string => {
        const val = modelValueRef.value;
        if (props.minLength !== undefined && val.length > 0 && val.length < props.minLength) return `A senha deve ter no mínimo ${props.minLength} caracteres`;
        if (props.targetValue !== undefined && val !== props.targetValue) return 'As senhas não coincidem';
        return 'Valor inválido';
    };

    const validation = useInputValidation({
        value: modelValueRef,
        required: computed(() => props.required),
        caution: computed(() => (props.caution === null ? undefined : props.caution)),
        done: computed(() => props.done),
        validator: (val: any) => {
            const str = val === null || val === undefined ? '' : String(val);
            if (str.trim().length === 0) return !props.required;
            if (props.minLength !== undefined && str.length < props.minLength) return false;
            if (props.targetValue !== undefined && str !== props.targetValue) return false;
            return true;
        },
        invalidMessage: resolveInvalidMessage,
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
            toggleVisibility: _tv,
            autocomplete: _ac,
            minLength: _ml,
            targetValue: _tv2,
            ...rest
        } = attrs;
        return rest;
    });
</script>

<style lang="scss" scoped>
    .max-input-password {
        width: 100%;
    }

    .max-password-wrapper {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
        position: relative;

        .max-input-native {
            flex: 1;
            min-width: 0;
        }

        .max-password-toggle {
            flex-shrink: 0;
            margin-right: 4px;
            color: var(--background-500);
            cursor: pointer;
        }
    }
</style>
