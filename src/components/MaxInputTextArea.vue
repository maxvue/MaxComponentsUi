<template>
    <InputBase v-bind="attrs" class="input-text-area-main-div">
        <Textarea v-bind="attrs" :autoResize="attrs.autoResize !== false && attrs['auto-resize'] !== false" :rows="(attrs.rows as any) ?? 3" v-model="temp_value" @blur="checkDone()"/>
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
            /** Valor do texto */
            modelValue: string;
            /** Estado de conclusão/validação */
            done?: boolean;
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
