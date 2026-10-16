<template>
    <MaxInputSelect class="max-input-social-platform" v-bind="forwardProps" :modelValue="props.modelValue" :options="resolvedOptions" :error="props.error" :caution="props.caution" :done="typeof props.done === 'boolean' ? props.done : undefined" @update:modelValue="onUpdateModelValue" @clear="onClear" />
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxInputSelect from './MaxInputSelect.vue';
    import type { MaxInputSocialPlatformProps, SocialPlatformOption } from '../types/semanticInputs';

    defineOptions({
        name: 'MaxInputSocialPlatform',
        inheritAttrs: false
    });

    const defaultOptions: SocialPlatformOption[] = [
        { name: 'Instagram', value: 'instagram' },
        { name: 'Facebook (Página)', value: 'facebook' },
        { name: 'Outra', value: '' }
    ];

    const props = withDefaults(defineProps<MaxInputSocialPlatformProps>(), {
        modelValue: null,
        options: undefined,
        disabled: false,
        required: false,
        clearable: true,
        done: undefined,
        error: undefined,
        caution: undefined,
        noMessage: false,
        float: undefined,
        placeholder: undefined,
        invalidMessage: undefined,
        requiredMessage: undefined
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string | null];
        'clear': [];
    }>();

    const resolvedOptions = computed<SocialPlatformOption[]>(() => {
        const base = (Array.isArray(props.options) && props.options.length > 0) ? props.options : defaultOptions;
        if (props.modelValue !== null && props.modelValue !== undefined) {
            const exists = base.some((opt) => opt.value === props.modelValue);
            if (!exists) return [...base, { name: props.modelValue, value: props.modelValue }];
        }
        return base;
    });

    const forwardProps = computed(() => ({
        id: props.id,
        label: props.label,
        disabled: props.disabled,
        required: props.required,
        float: props.float,
        msg: props.msg,
        message: props.message,
        iconMessage: props.iconMessage,
        icon: props.icon,
        i: props.i,
        noMessage: props.noMessage,
        placeholder: props.placeholder,
        clearable: props.clearable
    }));

    const onUpdateModelValue = (val: any) => {
        if (val === null || val === undefined) {
            emit('update:modelValue', null);
            return;
        }
        emit('update:modelValue', String(val));
    };

    const onClear = () => {
        emit('update:modelValue', null);
        emit('clear');
    };
</script>

<style lang="scss" scoped>
.max-input-social-platform {
    width: 100%;
}
</style>
