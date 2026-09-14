<template>
    <InputBase v-bind="{...props}" class="max-input-text-list max-input-text-list-div">
        <template #default="{ inputAttrs }">
            <div
                class="max-code-editor"
                :style="{ '--text-list-line-height': `${LINE_HEIGHT}px` }"
            >
                <div
                    ref="lineNumbersRef"
                    class="line-numbers"
                    aria-hidden="true"
                    :style="{ minWidth: lineGutterWidth }"
                >
                    <div class="line-numbers-spacer" :style="{ height: `${totalHeight}px` }">
                        <div class="line-numbers-window" :style="{ transform: `translateY(${offsetY}px)` }">
                            <div v-for="n in visibleLineNumbers" :key="n" class="line-number">{{ n }}</div>
                        </div>
                    </div>
                </div>
                <textarea
                    ref="textareaRef"
                    v-model="temp_value"
                    v-bind="{ ...inputAttrs, ...attrs }"
                    class="code-textarea"
                    wrap="off"
                    spellcheck="false"
                    :disabled="props.disabled"
                    :aria-describedby="combinedAriaDescribedby(inputAttrs?.['aria-describedby'])"
                    @scroll="syncScroll"
                    @keydown="handleKeydown"
                    @blur="handleBlur"
                ></textarea>
                <div
                    v-if="props.indentWithTab"
                    :id="instructionId"
                    class="sr-only text-list-keyboard-instruction"
                >
                    Pressione Escape e depois Tab para sair do editor
                </div>
                <div
                    v-if="props.indentWithTab && isEscapeArmed"
                    class="sr-only escape-armed-status"
                    role="status"
                    aria-live="polite"
                >
                    Modo de saída do editor ativado. Pressione Tab para sair.
                </div>
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs, nextTick, onMounted, onUnmounted } from 'vue';
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
            noMessage?: boolean;
            /** Define se a tecla Tab insere 4 espaços ou se navega nativamente entre campos */
            indentWithTab?: boolean;
        }>(),
        {
            modelValue: '',
            indentWithTab: true
        }
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
    const isEscapeArmed = ref(false);

    const instructionId = `max-textlist-instruction-${Math.random().toString(36).slice(2, 9)}`;

    const combinedAriaDescribedby = (inputDescribedby?: string) => {
        const ids: string[] = [];
        if (attrs['aria-describedby']) ids.push(String(attrs['aria-describedby']));
        if (inputDescribedby) ids.push(inputDescribedby);
        if (props.indentWithTab) ids.push(instructionId);
        return ids.length > 0 ? ids.join(' ') : undefined;
    };

    /** Contagem de linhas em passagem única O(N), sem alocar arrays de strings */
    function countLines(text: string): number {
        if (!text) return 1;
        let count = 1;
        for (let i = 0; i < text.length; i++) {
            const ch = text.charCodeAt(i);
            if (ch === 10) count++;
            else if (ch === 13) {
                count++;
                if (i + 1 < text.length && text.charCodeAt(i + 1) === 10) i++;
            }
        }
        return count;
    }

    const lineCount = computed(() => countLines(temp_value.value));

    // Constantes de virtualização da calha
    const LINE_HEIGHT = 21;
    const OVERSCAN = 10;

    const scrollTop = ref(0);
    const viewportHeight = ref(400);

    const totalHeight = computed(() => lineCount.value * LINE_HEIGHT);

    const startIndex = computed(() => {
        const first = Math.floor(scrollTop.value / LINE_HEIGHT);
        const maxStart = Math.max(0, lineCount.value - 1);
        return Math.min(maxStart, Math.max(0, first - OVERSCAN));
    });

    const endIndex = computed(() => {
        const visibleCount = Math.ceil(viewportHeight.value / LINE_HEIGHT);
        const first = Math.floor(scrollTop.value / LINE_HEIGHT);
        const last = first + visibleCount + OVERSCAN;
        return Math.min(lineCount.value, Math.max(startIndex.value + 1, last));
    });

    const offsetY = computed(() => startIndex.value * LINE_HEIGHT);

    const visibleLineNumbers = computed(() => {
        const start = startIndex.value + 1;
        const end = endIndex.value;
        const numbers: number[] = [];
        for (let i = start; i <= end; i++) numbers.push(i);
        return numbers;
    });

    const lineGutterWidth = computed(() => {
        const digits = Math.max(2, String(lineCount.value).length);
        return `${Math.max(40, digits * 9 + 20)}px`;
    });

    const syncScroll = () => {
        if (!textareaRef.value) return;
        const st = textareaRef.value.scrollTop;
        const ch = textareaRef.value.clientHeight;
        scrollTop.value = st;
        if (ch > 0) viewportHeight.value = ch;
        if (lineNumbersRef.value) lineNumbersRef.value.scrollTop = st;
    };

    let resizeObserver: ResizeObserver | null = null;

    onMounted(() => {
        if (textareaRef.value) {
            if (textareaRef.value.clientHeight > 0) viewportHeight.value = textareaRef.value.clientHeight;
            scrollTop.value = textareaRef.value.scrollTop;
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(() => {
                    if (textareaRef.value && textareaRef.value.clientHeight > 0) viewportHeight.value = textareaRef.value.clientHeight;
                });
                resizeObserver.observe(textareaRef.value);
            }
        }
    });

    onUnmounted(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
    });

    const handleBlur = () => {
        isEscapeArmed.value = false;
    };

    const handleKeydown = async (e: KeyboardEvent) => {
        if (!textareaRef.value) return;
        const el = textareaRef.value;

        if (e.key === 'Escape') {
            if (props.indentWithTab) {
                e.stopPropagation();
                isEscapeArmed.value = true;
            }
            return;
        }

        if (e.key === 'Tab') {
            if (!props.indentWithTab) return;

            if (isEscapeArmed.value) {
                isEscapeArmed.value = false;
                return;
            }

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
            return;
        }

        if (isEscapeArmed.value) isEscapeArmed.value = false;

        if (e.key === 'Enter') {
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

<style lang="scss" scoped>
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

            .line-numbers {
                position: relative;
                padding: 10px 8px;
                background-color: var(--background-100, rgb(0 0 0 / 2%));
                color: var(--background-650);
                text-align: right;
                min-width: 40px;
                overflow-y: hidden;
                user-select: none;
                border-right: 1px solid var(--background-200, rgb(0 0 0 / 5%));
                border-top-left-radius: inherit;
                border-bottom-left-radius: inherit;

                .line-numbers-spacer {
                    position: relative;
                    width: 100%;
                }

                .line-numbers-window {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                }

                .line-number {
                    height: var(--text-list-line-height);
                    line-height: var(--text-list-line-height);
                    font-size: 14px;
                }
            }

            .code-textarea {
                flex-grow: 1;
                padding: 10px;
                border: none !important;
                box-shadow: none !important;
                outline: none;
                resize: none;
                white-space: pre;
                line-height: var(--text-list-line-height);
                font-size: 14px;
                background: transparent;
                color: inherit;
                overflow: auto;
            }

            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
                border: 0;
            }
        }
    }
</style>
