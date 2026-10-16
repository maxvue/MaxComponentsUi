<template>
    <InputBase v-bind="{ ...props, ...attrsWithoutModelProps }" class="max-input-credential-base" :icon="props.icon ?? 'solar:key-minimalistic-line-duotone'">
        <template #default="{ inputAttrs }">
            <div class="max-credential-container">
                <input ref="inputRef" :type="isVisible ? 'text' : 'password'" class="max-input-native max-credential-input" v-bind="inputAttrs" :value="props.modelValue" :placeholder="props.placeholder ?? 'Insira a credencial...'" :disabled="props.disabled" :readonly="props.readonly" autocomplete="off" spellcheck="false" @input="onInput" @change="onChange" />

                <div class="max-credential-actions">
                    <button v-if="props.allowCopy && props.modelValue" type="button" class="max-credential-action-btn" :aria-label="copied ? 'Copiado para a área de transferência' : 'Copiar credencial'" :title="copied ? 'Copiado!' : 'Copiar credencial'" @click.stop="copyToClipboard">
                        <MaxIcon :icon="copied ? 'lucide:check' : 'lucide:copy'" size="0.9" :color="copied ? 'var(--max-success-500, #10B981)' : undefined" />
                    </button>

                    <button v-if="props.showVisibilityToggle" type="button" class="max-credential-action-btn" :aria-label="isVisible ? 'Ocultar credencial' : 'Exibir credencial'" :title="isVisible ? 'Ocultar' : 'Exibir'" @click.stop="toggleVisibility">
                        <MaxIcon :icon="isVisible ? 'lucide:eye-off' : 'lucide:eye'" size="0.9" />
                    </button>
                </div>
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';

    defineOptions({
        name: 'MaxInputCredential',
        inheritAttrs: false
    });

    export interface MaxInputCredentialProps {
        modelValue?: string | null;
        showVisibilityToggle?: boolean;
        allowCopy?: boolean;
        placeholder?: string;
        disabled?: boolean;
        readonly?: boolean;
        label?: string;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        done?: boolean | null;
        required?: boolean | null;
        message?: string;
        icon?: string;
    }

    const props = withDefaults(defineProps<MaxInputCredentialProps>(), {
        modelValue: '',
        showVisibilityToggle: true,
        allowCopy: false,
        placeholder: 'Insira a credencial...',
        disabled: false,
        readonly: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'change': [value: string];
        'toggle-visibility': [visible: boolean];
        'copy': [value: string];
    }>();

    const attrs = useAttrs();
    const attrsWithoutModelProps = computed(() => {
        const { modelValue: _, ...rest } = attrs;
        return rest;
    });

    const inputRef = ref<HTMLInputElement | null>(null);
    const isVisible = ref(false);
    const copied = ref(false);

    const toggleVisibility = () => {
        if (props.disabled) return;
        isVisible.value = !isVisible.value;
        emit('toggle-visibility', isVisible.value);
    };

    const copyToClipboard = async () => {
        if (props.disabled || !props.modelValue) return;
        try {
            if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(props.modelValue);

            copied.value = true;
            emit('copy', props.modelValue);
            setTimeout(() => {
                copied.value = false;
            }, 2000);
        } catch {
            // Se falhar ou não houver permissão, emite evento de cópia mesmo assim
            emit('copy', props.modelValue);
        }
    };

    const onInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        emit('update:modelValue', val);
    };

    const onChange = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        emit('change', val);
    };
</script>

<style lang="scss" scoped>
    .max-credential-container {
        display: flex;
        align-items: center;
        width: 100%;
        position: relative;
    }

    .max-credential-input {
        flex: 1;
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        font-size: 13px;
        color: inherit;
        font-family: monospace;

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
        }
    }

    .max-credential-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        padding-left: 6px;
    }

    .max-credential-action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--max-neutral-500, #6b7280);
        padding: 4px;
        border-radius: 4px;
        transition: all 0.15s ease;

        &:hover {
            color: var(--max-primary-500, #00768e);
            background: var(--background-100, #f3f4f6);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-credential-action-btn {
            transition: none;
        }
    }
</style>
