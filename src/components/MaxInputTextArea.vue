<template>
    <InputBase v-bind="{...props, ...attrs}" class="input-text-area-main-div">
        <Textarea v-bind="{...props, ...attrs}" :autoResize="attrs.autoResize !== false && attrs['auto-resize'] !== false" :rows="(attrs.rows as any) ?? 3" v-model="temp_value" @blur="checkDone()"/>
    </InputBase>
</template>

/**
 * Componente de área de texto multi-linha.
 * Suporta redimensionamento automático e integração com InputBase.
 */
<script setup lang="ts">
    import { ref, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import Textarea from 'primevue/textarea';

    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: any;
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
        { modelValue: '' }
    );

    const isDone = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = props.done ?? null;
    };

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);

    watch(
        temp_value,
        () => {
            emit('update:modelValue', temp_value.value);
        },
        { immediate: true }
    );

    watch(() => props.modelValue, (val) => temp_value.value = val);
</script>

<style lang="scss">
    .input-text-area-main-div {
        textarea {
            border: none !important;
            box-shadow: none !important;
            width: 100%;
            background: transparent;
            outline: none;
            resize: none;
        }
    }
</style>
