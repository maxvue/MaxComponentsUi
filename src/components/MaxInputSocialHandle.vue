<template>
    <InputBase v-bind="{ ...props, ...attrsWithoutModelProps }" class="max-input-social-handle-base" :icon="props.icon ?? 'lucide:at-sign'">
        <template #default="{ inputAttrs }">
            <div class="max-social-handle-container">
                <span v-if="props.prefix && !hasPrefixInValue" class="max-social-handle-prefix" aria-hidden="true">{{ props.prefix }}</span>
                <input ref="inputRef" type="text" class="max-input-native max-social-handle-input" v-bind="inputAttrs" :value="displayValue" :placeholder="props.placeholder ?? 'usuario'" :disabled="props.disabled" :readonly="props.readonly" @input="onInput" @blur="onBlur" />
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';

    defineOptions({
        name: 'MaxInputSocialHandle',
        inheritAttrs: false
    });

    export interface MaxInputSocialHandleProps {
        modelValue?: string | null;
        prefix?: string;
        autoPrefix?: boolean;
        cleanUrl?: boolean;
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

    const props = withDefaults(defineProps<MaxInputSocialHandleProps>(), {
        modelValue: '',
        prefix: '@',
        autoPrefix: true,
        cleanUrl: true,
        placeholder: 'usuario',
        disabled: false,
        readonly: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'change': [value: string];
    }>();

    const attrs = useAttrs();
    const attrsWithoutModelProps = computed(() => {
        const { modelValue: _, ...rest } = attrs;
        return rest;
    });

    const inputRef = ref<HTMLInputElement | null>(null);

    const sanitizeHandle = (val: string): string => {
        let cleaned = val.trim();
        if (props.cleanUrl && (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.includes('.com/') || cleaned.includes('.me/'))) try {
            const url = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
            const segments = url.pathname.split('/').filter(Boolean);
            if (segments.length > 0) cleaned = segments[segments.length - 1];

        } catch {
            const parts = cleaned.split('/');
            cleaned = parts[parts.length - 1] ?? cleaned;
        }

        // Remove espaços
        cleaned = cleaned.replace(/\s+/g, '');
        // Se autoPrefix for false e começar com o prefixo, ou se autoPrefix for true
        if (props.autoPrefix && props.prefix) if (cleaned && !cleaned.startsWith(props.prefix)) cleaned = `${props.prefix}${cleaned}`;


        return cleaned;
    };

    const hasPrefixInValue = computed(() => {
        if (!props.prefix || !props.modelValue) return false;
        return String(props.modelValue).startsWith(props.prefix);
    });

    const displayValue = computed(() => {
        if (!props.modelValue) return '';
        const str = String(props.modelValue);
        // Se já tiver prefixo visual e o valor começar com prefixo quando autoPrefix for falso
        return str;
    });

    const onInput = (e: Event) => {
        const raw = (e.target as HTMLInputElement).value;
        const processed = sanitizeHandle(raw);
        emit('update:modelValue', processed);
    };

    const onBlur = (e: Event) => {
        const raw = (e.target as HTMLInputElement).value;
        const processed = sanitizeHandle(raw);
        emit('change', processed);
    };
</script>

<style lang="scss" scoped>
    .max-social-handle-container {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .max-social-handle-prefix {
        font-size: 13px;
        font-weight: 600;
        color: var(--max-neutral-500, #6b7280);
        user-select: none;
        padding-right: 2px;
    }

    .max-social-handle-input {
        flex: 1;
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        font-size: 13px;
        color: inherit;

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
        }
    }
</style>
