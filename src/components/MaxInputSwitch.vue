<template>
    <InputBase v-bind="props" :modelValue="(props.modelValue as any)" class="input-switch-main" :caution="caution" :done="isDone ?? undefined" :icon-right="icon ?? 'ph:toggle-right-duotone'">
        <div class="input-grid-switch">
            <ToggleSwitch v-bind="attrs" v-model="temp_value" />
            <div class="rotulo">{{ question }}</div>
        </div>
    </InputBase>
</template>

<script setup lang="ts">
    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: boolean;
            question?: string;
            icon?: string | undefined;
            i?: string | undefined;
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
        { modelValue: false, done: undefined, required: false, caution: undefined }
    );

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);
    const isDone = ref(props.done ?? null);

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        return isDone.value === false;
    });

    watch(
        temp_value,
        () => {
            isDone.value = props.done ?? null;
            emit('update:modelValue', temp_value.value);
        },
        { immediate: true }
    );

    watch(
        () => props.modelValue,
        (val) => {
            temp_value.value = val;
        }
    );
</script>

<style lang="scss">
    .input-switch {
        outline: none !important;
    }

    .input-grid-switch {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        width: 100%;
        height: 100%;
        align-items: center;

        .p-toggleswitch {
            grid-column: 1;
        }

        .rotulo {
            text-align: left;
            width: 100%;
            font-size: 0.8rem;
            color: var(--background-700);
        }
    }
</style>
