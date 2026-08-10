<template>
    <InputBase v-bind="{...props}" class="max-input-text-list-div">
        <div class="max-code-editor">
            <div class="line-numbers" ref="lineNumbersRef">
                <div v-for="n in lineCount" :key="n" class="line-number">{{ n }}</div>
            </div>
            <textarea
                ref="textareaRef"
                v-model="temp_value"
                v-bind="attrs"
                class="code-textarea"
                wrap="off"
                spellcheck="false"
                @scroll="syncScroll"
                @keydown="handleKeydown"
            ></textarea>
        </div>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs, nextTick } from 'vue';
    import InputBase from './InputBase.vue';
    import { useMirroredModel } from '../helpers/useMirroredModel';

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

    const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

    // temp_value espelha props.modelValue sempre convertido para string.
    // A conversao ocorre tanto na leitura (getter, usado na inicializacao e no
    // watch reativo de props.modelValue -> temp_value) quanto na emissao
    // (transform), preservando o comportamento original de `String(val ?? '')`
    // em ambos os sentidos.
    const temp_value = useMirroredModel(
        { get modelValue() { return String(props.modelValue ?? ''); } },
        emit,
        { transform: (value: string) => String(value ?? '') }
    );

    const textareaRef = ref<HTMLTextAreaElement | null>(null);
    const lineNumbersRef = ref<HTMLDivElement | null>(null);

    const lineCount = computed(() => {
        return (temp_value.value || '').split(/\r\n|\r|\n/).length || 1;
    });

    const syncScroll = () => {
        if (textareaRef.value && lineNumbersRef.value) lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop;

    };

    const handleKeydown = async (e: KeyboardEvent) => {
        if (!textareaRef.value) return;
        const el = textareaRef.value;

        if (e.key === 'Tab') {
            e.preventDefault();
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const spaces = '    ';

            if (start === end) {
                // Sem seleção: insere os espaços na posição do cursor
                temp_value.value = temp_value.value.substring(0, start) + spaces + temp_value.value.substring(end);
                await nextTick();
                el.selectionStart = el.selectionEnd = start + spaces.length;
            } else {
                // Com seleção: indenta cada linha do bloco selecionado
                const lineStart = temp_value.value.lastIndexOf('\n', start - 1) + 1;
                const block = temp_value.value.substring(lineStart, end);
                const indented = block.replace(/^/gm, spaces);
                temp_value.value = temp_value.value.substring(0, lineStart) + indented + temp_value.value.substring(end);

                await nextTick();
                el.selectionStart = start + spaces.length;
                el.selectionEnd = end + (indented.length - block.length);
            }
        }

        else if (e.key === 'Enter') {
            e.preventDefault();
            const start = el.selectionStart;
            const end = el.selectionEnd;

            const currentLine = temp_value.value.substring(0, start).split('\n').pop() || '';
            const match = currentLine.match(/^\s+/);
            const indentation = match ? match[0] : '';

            temp_value.value = temp_value.value.substring(0, start) + '\n' + indentation + temp_value.value.substring(end);

            await nextTick();
            el.selectionStart = el.selectionEnd = start + 1 + indentation.length;
        }
    };
</script>

<style lang="scss">
    .max-input-text-list-div {
        .max-code-editor {
            display: flex;
            align-items: stretch;
            width: 100%;
            overflow: hidden;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
            background: transparent;
            min-height: 150px;
            max-height: 400px;
        }

        .line-numbers {
            padding: 10px 8px;
            background-color: var(--background-100, rgb(0 0 0 / 2%));
            color: var(--background-400, #9ca3af);
            text-align: right;
            min-width: 40px;
            overflow-y: hidden;
            user-select: none;
            border-right: 1px solid var(--background-200, rgb(0 0 0 / 5%));
            border-top-left-radius: inherit;
            border-bottom-left-radius: inherit;
        }

        .line-number {
            line-height: 1.5;
            font-size: 14px;
        }

        .code-textarea {
            flex-grow: 1;
            padding: 10px;
            border: none !important;
            box-shadow: none !important;
            outline: none;
            resize: none;
            white-space: pre;
            line-height: 1.5;
            font-size: 14px;
            background: transparent;
            color: inherit;
            overflow: auto;
        }
    }
</style>
