<template>
    <InputBase v-bind="{...props, ...attrs}" class="input-text-area-main-div">
        <Textarea v-bind="{...props, ...attrs}" :autoResize="props.autoResize" v-model="temp_value" @blur="checkDone()"/>
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
            autoResize?: boolean;
            rows?: number;
            minRows?: number;
            autofocus?: boolean;
            maxRows?: number;
            wrap?: string;
        }>(),
        { modelValue: '', autoResize: true, rows: 3, maxRows: 10 }
    );

    const isDone = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = props.done ?? null;
    };

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);

    watch( temp_value, () => emit('update:modelValue', temp_value.value),{ immediate: true });

    watch(() => props.modelValue, (val) => temp_value.value = val);
</script>

<style lang="scss">
    .input-text-area-main-div {
        textarea {
            box-shadow: none !important;
            width: 100%;
            background: transparent;
            outline: none;
            resize: none;

            &[no-border] {
                border: none !important;
            }
        }
    }
</style>
