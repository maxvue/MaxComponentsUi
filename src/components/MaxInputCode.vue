<template>
    <div
        class="max-input-code"
        :class="{
            'max-input-code--fullscreen': isFullscreen,
            'max-input-code--disabled': props.disabled,
            'max-input-code--dark': isEffectiveDark
        }"
        :style="{ width: props.width, height: isFullscreen ? '100vh' : props.height }"
    >
        <!-- Toolbar Superior -->
        <MaxInputCodeToolbar
            v-if="props.toolbar"
            :language="currentLanguage"
            :languages="props.languages"
            :word-wrap="isWordWrap"
            :minimap="isMinimap"
            :is-fullscreen="isFullscreen"
            :disabled="props.disabled || props.readOnly"
            @update:language="onLanguageChange"
            @format="handleFormat"
            @toggle-comment="handleToggleComment"
            @indent="handleIndent"
            @outdent="handleOutdent"
            @undo="handleUndo"
            @redo="handleRedo"
            @copy="handleCopy"
            @toggle-wrap="handleToggleWrap"
            @toggle-minimap="handleToggleMinimap"
            @toggle-fullscreen="toggleFullscreen"
        />

        <!-- Área de Edição do Monaco -->
        <div class="max-input-code__editor-container">
            <div
                v-if="isLoading"
                class="max-input-code__loading"
                role="status"
                aria-label="Carregando editor de código"
            >
                <MaxIcon icon="eos-icons:loading" :size="1.8" color="var(--max-primary-500, #00768E)" />
                <span class="max-input-code__loading-text">Carregando editor...</span>
            </div>
            <div
                ref="editorContainerRef"
                class="max-input-code__mount-point"
                :class="{ 'max-input-code__mount-point--hidden': isLoading }"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import loader from '@monaco-editor/loader';
    import type * as MonacoType from 'monaco-editor';
    import MaxIcon from './MaxIcon.vue';
    import MaxInputCodeToolbar, { type CodeLanguageOption } from './MaxInputCodeToolbar.vue';
    import { useScrollLock } from '../helpers/useScrollLock';

    type MonacoInstance = typeof MonacoType;
    type EditorInstance = MonacoType.editor.IStandaloneCodeEditor;

    const props = withDefaults(
        defineProps<{
            modelValue?: string;
            language?: string;
            languages?: CodeLanguageOption[];
            dark?: boolean;
            height?: string;
            width?: string;
            disabled?: boolean;
            readOnly?: boolean;
            lineNumbers?: 'on' | 'off' | 'relative';
            minimap?: boolean;
            wordWrap?: boolean;
            toolbar?: boolean;
            fontSize?: number;
            tabSize?: number;
            options?: MonacoType.editor.IStandaloneEditorConstructionOptions;
        }>(),
        {
            modelValue: '',
            language: 'typescript',
            languages: () => [],
            dark: undefined,
            height: '100%',
            width: '100%',
            disabled: false,
            readOnly: false,
            lineNumbers: 'on',
            minimap: false,
            wordWrap: true,
            toolbar: true,
            fontSize: 13,
            tabSize: 4,
            options: () => ({})
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'update:language': [lang: string];
        'change': [value: string];
        'mount': [editor: EditorInstance, monaco: MonacoInstance];
    }>();

    const editorContainerRef = ref<HTMLDivElement | null>(null);
    const isLoading = ref(true);
    const isFullscreen = ref(false);

    const currentLanguage = ref(props.language);
    const isWordWrap = ref(props.wordWrap);
    const isMinimap = ref(props.minimap);

    let editorInstance: EditorInstance | null = null;
    let monacoInstance: MonacoInstance | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let htmlClassObserver: MutationObserver | null = null;
    let isApplyingExternalChange = false;

    const scrollLock = useScrollLock();

    // Detecção reativa de dark mode
    const checkSystemDarkMode = (): boolean => {
        if (typeof document !== 'undefined') return document.documentElement.classList.contains('dark');

        return false;
    };

    const systemDarkMode = ref(checkSystemDarkMode());

    const updateSystemDarkMode = () => {
        systemDarkMode.value = checkSystemDarkMode();
    };

    const isEffectiveDark = computed(() => {
        if (props.dark !== undefined) return props.dark;
        return systemDarkMode.value;
    });

    const activeTheme = computed(() => (isEffectiveDark.value ? 'vs-dark' : 'vs'));

    // Sincronização do tema Monaco
    watch(activeTheme, (newTheme) => {
        if (monacoInstance) monacoInstance.editor.setTheme(newTheme);

    });

    // Sincronização da linguagem
    watch(
        () => props.language,
        (newLang) => {
            if (newLang && newLang !== currentLanguage.value) {
                currentLanguage.value = newLang;
                if (editorInstance && monacoInstance) {
                    const model = editorInstance.getModel();
                    if (model) monacoInstance.editor.setModelLanguage(model, newLang);

                }
            }
        }
    );

    // Sincronização do modelValue externo
    watch(
        () => props.modelValue,
        (newValue) => {
            if (editorInstance && newValue !== undefined) {
                const currentValue = editorInstance.getValue();
                if (newValue !== currentValue && !isApplyingExternalChange) {
                    isApplyingExternalChange = true;
                    editorInstance.setValue(newValue);
                    isApplyingExternalChange = false;
                }
            }
        }
    );

    // Sincronização do disabled / readOnly
    watch(
        () => [props.disabled, props.readOnly],
        ([disabled, readOnly]) => {
            if (editorInstance) editorInstance.updateOptions({ readOnly: Boolean(disabled || readOnly) });

        }
    );

    // Sincronização das opções de lineNumbers
    watch(
        () => props.lineNumbers,
        (newVal) => {
            if (editorInstance) editorInstance.updateOptions({ lineNumbers: newVal });

        }
    );

    // Ações de Toolbar
    const onLanguageChange = (lang: string) => {
        currentLanguage.value = lang;
        emit('update:language', lang);
        if (editorInstance && monacoInstance) {
            const model = editorInstance.getModel();
            if (model) monacoInstance.editor.setModelLanguage(model, lang);

        }
    };

    const handleFormat = () => {
        if (!editorInstance) return;
        const action = editorInstance.getAction('editor.action.formatDocument');
        if (action) action.run();
        else editorInstance.trigger('toolbar', 'editor.action.formatDocument', null);

    };

    const handleToggleComment = () => {
        if (!editorInstance) return;
        const action = editorInstance.getAction('editor.action.commentLine');
        if (action) action.run();
        else editorInstance.trigger('toolbar', 'editor.action.commentLine', null);

    };

    const handleIndent = () => {
        if (!editorInstance) return;
        editorInstance.trigger('toolbar', 'editor.action.indentLines', null);
    };

    const handleOutdent = () => {
        if (!editorInstance) return;
        editorInstance.trigger('toolbar', 'editor.action.outdentLines', null);
    };

    const handleUndo = () => {
        if (!editorInstance) return;
        editorInstance.trigger('toolbar', 'undo', null);
    };

    const handleRedo = () => {
        if (!editorInstance) return;
        editorInstance.trigger('toolbar', 'redo', null);
    };

    const handleCopy = () => {
        if (!editorInstance) return;
        const code = editorInstance.getValue();
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code);

    };

    const handleToggleWrap = () => {
        isWordWrap.value = !isWordWrap.value;
        if (editorInstance) editorInstance.updateOptions({ wordWrap: isWordWrap.value ? 'on' : 'off' });

    };

    const handleToggleMinimap = () => {
        isMinimap.value = !isMinimap.value;
        if (editorInstance) editorInstance.updateOptions({ minimap: { enabled: isMinimap.value } });

    };

    const onFullscreenEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isFullscreen.value) toggleFullscreen();

    };

    const toggleFullscreen = () => {
        isFullscreen.value = !isFullscreen.value;
        if (isFullscreen.value) {
            scrollLock.lock();
            document.addEventListener('keydown', onFullscreenEscape);
        } else {
            scrollLock.unlock();
            document.removeEventListener('keydown', onFullscreenEscape);
        }
        nextTick(() => {
            if (editorInstance) editorInstance.layout();

        });
    };

    // Inicialização do Monaco Editor
    onMounted(async () => {
        updateSystemDarkMode();

        // Observer para classe .dark no <html>
        if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
            htmlClassObserver = new MutationObserver(() => {
                updateSystemDarkMode();
            });
            htmlClassObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        try {
            const monaco = await loader.init();
            monacoInstance = monaco;

            if (!editorContainerRef.value) return;

            const initialOptions: MonacoType.editor.IStandaloneEditorConstructionOptions = {
                value: props.modelValue ?? '',
                language: currentLanguage.value,
                theme: activeTheme.value,
                automaticLayout: false, // Gerenciado de forma explícita via ResizeObserver
                minimap: { enabled: isMinimap.value },
                wordWrap: isWordWrap.value ? 'on' : 'off',
                lineNumbers: props.lineNumbers,
                readOnly: Boolean(props.disabled || props.readOnly),
                fontSize: props.fontSize,
                tabSize: props.tabSize,
                scrollBeyondLastLine: false,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                renderWhitespace: 'selection',
                padding: { top: 8, bottom: 8 },
                ...props.options
            };

            const createdEditor = monaco.editor.create(editorContainerRef.value, initialOptions);
            editorInstance = createdEditor;

            // Ouvinte de modificação de texto
            createdEditor.onDidChangeModelContent(() => {
                if (isApplyingExternalChange || !editorInstance) return;
                const value = createdEditor.getValue();
                emit('update:modelValue', value);
                emit('change', value);
            });

            // Gerenciamento de dimensões via ResizeObserver
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(() => {
                    if (editorInstance) editorInstance.layout();

                });
                resizeObserver.observe(editorContainerRef.value);
            }

            isLoading.value = false;
            nextTick(() => {
                createdEditor.layout();
            });

            emit('mount', createdEditor, monaco);
        } catch (error) {
            console.error('Erro ao carregar o Monaco Editor:', error);
            isLoading.value = false;
        }
    });

    onBeforeUnmount(() => {
        if (isFullscreen.value) {
            scrollLock.unlock();
            document.removeEventListener('keydown', onFullscreenEscape);
        }
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (htmlClassObserver) {
            htmlClassObserver.disconnect();
            htmlClassObserver = null;
        }
        if (editorInstance) {
            editorInstance.dispose();
            editorInstance = null;
        }
    });

    defineExpose({
        getEditor: () => editorInstance,
        getMonaco: () => monacoInstance,
        format: handleFormat,
        toggleFullscreen
    });
</script>

<style lang="scss" scoped>
    .max-input-code {
        width: 100%;
        height: 100%;
        min-height: 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--background-300, #cbd5e1);
        border-radius: 8px;
        overflow: hidden;
        background-color: var(--background-0, #fff);
        box-sizing: border-box;
        position: relative;
        transition: border-color 0.15s ease-in-out;

        &:focus-within {
            border-color: var(--max-primary-500, #00768E);
        }

        &--dark {
            border-color: var(--background-700, #334155);
            background-color: #1e1e1e;

            &:focus-within {
                border-color: var(--max-primary-500, #00768E);
            }
        }

        &--disabled {
            opacity: 0.65;
            pointer-events: none;
            background-color: var(--background-75, #f1f5f9);
        }

        &--fullscreen {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
        }

        .max-input-code__editor-container {
            flex: 1;
            width: 100%;
            height: 100%;
            min-height: 0;
            min-width: 0;
            position: relative;
            overflow: hidden;

            .max-input-code__loading {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                background-color: var(--background-0, #fff);
                z-index: 5;

                .max-input-code__loading-text {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--background-600, #475569);
                }
            }

            .max-input-code__mount-point {
                width: 100%;
                height: 100%;
                min-height: 0;
                min-width: 0;

                &--hidden {
                    visibility: hidden;
                }
            }
        }
    }
</style>
