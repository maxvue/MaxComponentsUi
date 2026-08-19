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
            maxRows?: number | string;
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

    const minLinesNormalized = computed(() => {
        const value = Number(props.minLines ?? props.minRows);
        return Number.isNaN(value) || value < 1 ? 1 : value;
    });

    const maxRowsNormalized = computed(() => {
        const value = Number(props.maxRows);
        return Number.isNaN(value) || value <= 0 ? undefined : value;
    });

    const resize = () => {
        if (!textAreaEl.value) return;

        const el = textAreaEl.value;

        if (!props.autoResize) {
            el.style.removeProperty('height');
            el.style.overflowY = 'auto';
            return;
        }

        // Reseta altura para auto antes de medir scrollHeight
        el.style.setProperty('height', 'auto', 'important');

        // Em ambientes de teste sem renderização de layout (ex: happy-dom), scrollHeight é 0
        if (el.scrollHeight === 0) return;

        const computedStyle = window.getComputedStyle(el);
        const lh = parseFloat(computedStyle.lineHeight);
        const fs = parseFloat(computedStyle.fontSize);
        const lineHeight = !Number.isNaN(lh) && lh > 0 ? lh : (!Number.isNaN(fs) && fs > 0 ? fs * 1.5 : 20);

        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
        const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
        const verticalPadding = paddingTop + paddingBottom + borderTop + borderBottom;

        const minRows = minLinesNormalized.value;
        const maxRows = maxRowsNormalized.value;

        const minHeight = minRows * lineHeight + verticalPadding;
        const maxHeight = maxRows !== undefined ? maxRows * lineHeight + verticalPadding : Infinity;

        const scrollHeight = el.scrollHeight;

        if (scrollHeight > maxHeight) {
            el.style.setProperty('height', `${maxHeight}px`, 'important');
            el.style.overflowY = 'auto';
        } else {
            const targetHeight = Math.max(minHeight, scrollHeight);
            el.style.setProperty('height', `${targetHeight}px`, 'important');
            el.style.overflowY = 'hidden';
        }
    };

    const onInput = (event: Event) => {
        temp_value.value = (event.target as HTMLTextAreaElement).value;
        resize();
    };

    onMounted(() => nextTick(resize));

    const computedLines = computed(() => (temp_value.value ?? '').split(/\r\n|\r|\n/).length);

    const lines = computed(() => props.rows ?? (computedLines.value > minLinesNormalized.value ? computedLines.value : minLinesNormalized.value));

    // Consolidado em um único watch: emite o v-model e reajusta a altura sempre que
    // temp_value mudar. immediate: true preservado do watch original de emissão —
    // sem ele o primeiro resize/emit no mount seria perdido (regressão já vista na Etapa 7b).
    watch(temp_value, () => {
        emit('update:modelValue', temp_value.value);
        nextTick(resize);
    }, { immediate: true });

    watch(() => props.modelValue, (val) => temp_value.value = val ?? '');
</script>

<style lang="scss">
    .input-text-area-main-div {
        grid-template-rows: auto auto;

        .max-input-field-div {
            height: auto !important;
            padding: 8px 0 5px !important;

            textarea {
                height: auto;
                min-height: 20px;
            }
        }

        textarea {
            box-shadow: none !important;
            width: 100%;
            background: transparent;
            outline: none;
            resize: none;
            overflow-y: auto;

            &[no-border] {
                border: none !important;
            }
        }
    }
</style>
