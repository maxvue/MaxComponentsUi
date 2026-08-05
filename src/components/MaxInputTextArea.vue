<template>
    <InputBase v-bind="{...props}" class="input-text-area-main-div">
        <textarea
            ref="textAreaEl"
            class="max-textarea"
            :value="temp_value"
            :rows="lines"
            :disabled="props.disabled"
            :autofocus="props.autofocus"
            :wrap="props.wrap"
            :auto-resize="props.autoResize ? '' : undefined"
            v-bind="attrs"
            @input="onInput"
            @blur="checkDone()"
        ></textarea>
    </InputBase>
</template>

/**
 * Componente de área de texto multi-linha.
 * Suporta redimensionamento automático e integração com InputBase.
 */
<script setup lang="ts">
    import { ref, computed, watch, useAttrs, onMounted, nextTick } from 'vue';
    import InputBase from './InputBase.vue';

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
            rows?: string | number;
            minRows?: number | string;
            minLines?: string | number;
            autofocus?: boolean;
            maxRows?: number;
            wrap?: string;
        }>(),
        { modelValue: '', autoResize: true, maxRows: 10, minRows: 1, done: undefined }
    );

    const isDone = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = props.done ?? null;
    };

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);

    const textAreaEl = ref<HTMLTextAreaElement | null>(null);

    const resize = () => {
        if (!props.autoResize || !textAreaEl.value) return;

        const el = textAreaEl.value;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    const onInput = (event: Event) => {
        temp_value.value = (event.target as HTMLTextAreaElement).value;
        resize();
    };

    onMounted(() => nextTick(resize));

    const computedLines = computed(() => (temp_value.value ?? '').split(/\r\n|\r|\n/).length);

    const lines = computed(() => props.rows ?? (computedLines.value > (props.minLines ?? props.minRows) ? computedLines.value : (props.minLines ?? props.minRows)));

    watch( temp_value, () => emit('update:modelValue', temp_value.value),{ immediate: true });

    watch(() => props.modelValue, (val) => temp_value.value = val ?? '');

    watch(temp_value, () => nextTick(resize));
</script>

<style lang="scss">
    .input-text-area-main-div {
        grid-template-rows: auto auto;

        .max-input-field-div {
            height: auto !important;
            padding: 8px 0 5px !important;
        }

        textarea {
            box-shadow: none !important;
            width: 100%;
            background: transparent;
            outline: none;
            resize: none;

            &[no-border] {
                border: none !important;
            }

            &[auto-resize] {
                overflow-y: hidden;
            }
        }
    }
</style>
