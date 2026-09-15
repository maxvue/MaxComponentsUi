<template>
    <InputBase v-bind="{...props}" class="max-input-text-area input-text-area-main-div">
        <template #default="{ inputAttrs }">
            <textarea
                ref="textAreaEl"
                class="max-textarea"
                v-bind="{ ...inputAttrs, ...attrs }"
                :value="temp_value"
                :rows="lines"
                :disabled="props.disabled"
                :autofocus="props.autofocus"
                :wrap="props.wrap"
                :spellcheck="props.spellcheck"
                :auto-resize="props.autoResize ? '' : undefined"
                @input="onInput"
                @blur="checkDone()"
            ></textarea>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente de área de texto multi-linha.
     * Suporta redimensionamento automático e integração com InputBase.
     */
    import { ref, computed, watch, useAttrs, onMounted, onUnmounted, nextTick } from 'vue';
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
            noMessage?: boolean;
            autoResize?: boolean;
            /** Habilita ou desabilita a verificação ortográfica nativa */
            spellcheck?: boolean;
            rows?: string | number;
            minRows?: number | string;
            minLines?: string | number;
            autofocus?: boolean;
            maxRows?: number | string;
            wrap?: string;
        }>(),
        { modelValue: '', autoResize: true, maxRows: 10, minRows: 1, done: undefined, spellcheck: true }
    );

    const isDone = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = props.done ?? null;
    };

    const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>();
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

    let isUnmounted = false;
    let resizePending = false;

    const resize = () => {
        if (isUnmounted || !textAreaEl.value) return;

        const el = textAreaEl.value;

        if (!props.autoResize) {
            el.style.removeProperty('height');
            el.style.overflowY = 'auto';
            return;
        }

        // Reseta altura para auto antes de medir scrollHeight
        el.style.setProperty('height', 'auto', 'important');

        // Lê scrollHeight UMA ÚNICA VEZ por ciclo
        const scrollHeight = el.scrollHeight;

        // Em ambientes de teste sem renderização de layout (ex: happy-dom), scrollHeight é 0
        if (scrollHeight === 0) return;

        // Obtém getComputedStyle UMA ÚNICA VEZ por ciclo
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

        if (scrollHeight > maxHeight) {
            el.style.setProperty('height', `${maxHeight}px`, 'important');
            el.style.overflowY = 'auto';
        } else {
            const targetHeight = Math.max(minHeight, scrollHeight);
            el.style.setProperty('height', `${targetHeight}px`, 'important');
            el.style.overflowY = 'hidden';
        }
    };

    const scheduleResize = () => {
        if (isUnmounted || resizePending) return;
        resizePending = true;
        nextTick(() => {
            resizePending = false;
            if (isUnmounted) return;
            resize();
        });
    };

    const onInput = (event: Event) => {
        temp_value.value = (event.target as HTMLTextAreaElement).value;
    };

    onMounted(() => {
        scheduleResize();
    });

    onUnmounted(() => {
        isUnmounted = true;
    });

    const computedLines = computed(() => (temp_value.value ?? '').split(/\r\n|\r|\n/).length);

    const lines = computed(() => props.rows ?? (computedLines.value > minLinesNormalized.value ? computedLines.value : minLinesNormalized.value));

    // Emissão de update:modelValue isolada de efeitos de layout
    // immediate: true preservado do contrato original (emissão inicial no mount)
    watch(temp_value, (val) => {
        emit('update:modelValue', val);
    }, { immediate: true });

    watch(() => props.modelValue, (val) => temp_value.value = val ?? '');

    // Centraliza o auto-resize pós-render (flush: 'post') para temp_value e props de dimensionamento
    watch(
        [
            temp_value,
            () => props.autoResize,
            () => props.rows,
            () => props.minRows,
            () => props.minLines,
            () => props.maxRows
        ],
        () => {
            scheduleResize();
        },
        { flush: 'post' }
    );

    defineExpose({ resize, scheduleResize });
</script>

<style lang="scss" scoped>
    .input-text-area-main-div {
        grid-template-rows: auto auto;

        :deep(.max-input-field-div) {
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
            color: var(--background-700);
            font-family: inherit;

            &::placeholder {
                color: var(--max-content-placeholder);
            }

            &[no-border] {
                border: none !important;
            }
        }
    }
</style>
