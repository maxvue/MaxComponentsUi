<template>
        <FloatLabel variant="on" class="max-input-base" :class="{ float: attrs.float !== undefined, done: done, caution: caution || done === false }">
        <IconField>
            <InputIcon v-if="icon ?? iconLeft ?? i">
                <MaxIcon :icon="icon ?? iconLeft ?? i" />
            </InputIcon>
            <InputText type="text" v-model="temp_value" fluid @blur="isDone = testIsDone()" />
            <InputIcon v-if="iconRight">
                <MaxIcon :icon="iconRight" />
            </InputIcon>
        </IconField>

        <label for="in_label" v-if="label" class="max-input-label active">{{ label }}</label>
        <Message size="small" :class="`input-message ${done === false ? 'error' : ''}`" variant="simple" v-if="message">
            <template #icon>
                <MaxIcon :icon="iconMessage" v-if="iconMessage" :size="0.9" />
            </template>
            {{ message }}
        </Message>
        <div v-else style="height: 16px; width: 100%"></div>
        <div class="is-done" v-if="done">
            <MaxIcon icon="lets-icons:check-fill" :size="0.9" />
        </div>
        <div class="required" v-else-if="required">**a</div>
    </FloatLabel>
</template>

<script setup lang="ts">
    import InputText from 'primevue/inputtext';
    import { hasContent } from '@/helpers/hasContent';
    import { normalizeToSearch } from '@/helpers/normalizeToSearch';
    import { computed, Ref, ref, useAttrs, watch } from 'vue';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            icon?: string | undefined;
            i?: string | undefined;
            iconLeft?: string | undefined;
            iconRight?: string | undefined;
            disabled?: boolean | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
            required?: boolean;
        }>(),
        { modelValue: '', done: undefined, required: false, caution: undefined },
    );

    const temp_value = ref(props.modelValue);

    const isDone: Ref = ref(props.done ?? null);

    const isEqual = computed(() => {
        return typeof props.targetValue === 'string' && hasContent(props.targetValue) ? normalizeToSearch(props.targetValue) === normalizeToSearch(temp_value.value) : null;
    });

    const isRequiredDone = computed(() => (props.required ? hasContent(temp_value.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isEqual.value !== null) return isEqual.value;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

    const message = computed(() => {
        if (hasContent(props.message ?? props.msg)) return props.message ?? props.msg;
        if (typeof props.error === 'string' && hasContent(props.error)) return props.error;
        if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;
        return false;
    });

    const emit = defineEmits(['update:modelValue']);
    watch(temp_value, () => {
        isDone.value = testIsDone();
        emit('update:modelValue', temp_value.value);
    });
    watch(
        () => props.modelValue,
        () => (temp_value.value = props.modelValue),
    );
</script>

<style lang="scss">
    .max-input {
        .max-input-label {
            &.active {
                top: 0;
                transform: translateY(-50%);
                border-radius: var(--max-floatlabel-on-border-radius);
                background: var(--max-floatlabel-on-active-background);
                padding: var(--max-floatlabel-on-active-padding);
                font-size: var(--max-floatlabel-active-font-size);
                font-weight: var(--max-floatlabel-active-font-weight);
            }
        }
        .required {
            position: absolute;
            top: 3px;
            right: 5px;
            color: darkred;
        }
    }
</style>
