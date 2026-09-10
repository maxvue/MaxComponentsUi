<template>
    <div class="max-input-code-toolbar" :class="{ 'max-input-code-toolbar--disabled': props.disabled }">
        <!-- Seletor de Linguagem -->
        <div class="max-input-code-toolbar__group">
            <select
                class="max-input-code-toolbar__select"
                :value="props.language"
                :disabled="props.disabled"
                aria-label="Linguagem de programação"
                @change="onLanguageSelect"
            >
                <option
                    v-for="lang in effectiveLanguages"
                    :key="lang.value"
                    :value="lang.value"
                >
                    {{ lang.label }}
                </option>
            </select>
        </div>

        <span class="max-input-code-toolbar__divider" />

        <!-- Formatação -->
        <div class="max-input-code-toolbar__group">
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                title="Formatar Código (Shift+Alt+F)"
                :disabled="props.disabled"
                @click="emit('format')"
            >
                <MaxIcon icon="mdi:code-tags-check" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span class="max-input-code-toolbar__divider" />

        <!-- Ações de Código -->
        <div class="max-input-code-toolbar__group">
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                title="Comentar Linhas (Ctrl+/)"
                :disabled="props.disabled"
                @click="emit('toggle-comment')"
            >
                <MaxIcon icon="mdi:comment-text-outline" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                title="Indentar (Tab)"
                :disabled="props.disabled"
                @click="emit('indent')"
            >
                <MaxIcon icon="mdi:format-indent-increase" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                title="Desindentar (Shift+Tab)"
                :disabled="props.disabled"
                @click="emit('outdent')"
            >
                <MaxIcon icon="mdi:format-indent-decrease" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span class="max-input-code-toolbar__divider" />

        <!-- Histórico -->
        <div class="max-input-code-toolbar__group">
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                title="Desfazer (Ctrl+Z)"
                :disabled="props.disabled"
                @click="emit('undo')"
            >
                <MaxIcon icon="mdi:undo" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                title="Refazer (Ctrl+Y)"
                :disabled="props.disabled"
                @click="emit('redo')"
            >
                <MaxIcon icon="mdi:redo" :size="1.1" color="currentColor" />
            </button>
        </div>

        <span class="max-input-code-toolbar__divider" />

        <!-- Utilitários -->
        <div class="max-input-code-toolbar__group">
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                :title="isCopied ? 'Copiado!' : 'Copiar Código'"
                :disabled="props.disabled"
                @click="handleCopy"
            >
                <MaxIcon
                    :icon="isCopied ? 'lets-icons:check-fill' : 'mdi:content-copy'"
                    :size="1.1"
                    :color="isCopied ? 'var(--green-500, #22c55e)' : 'currentColor'"
                />
            </button>
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                :class="{ active: props.wordWrap }"
                title="Alternar Quebra Automática de Linha"
                :disabled="props.disabled"
                @click="emit('toggle-wrap')"
            >
                <MaxIcon icon="mdi:wrap" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                :class="{ active: props.minimap }"
                title="Alternar Mini-mapa Lateral"
                :disabled="props.disabled"
                @click="emit('toggle-minimap')"
            >
                <MaxIcon icon="mdi:map-outline" :size="1.1" color="currentColor" />
            </button>
            <button
                type="button"
                class="max-input-code-toolbar__btn"
                :class="{ active: props.isFullscreen }"
                :title="props.isFullscreen ? 'Sair da Tela Cheia (Esc)' : 'Tela Cheia'"
                :disabled="props.disabled"
                @click="emit('toggle-fullscreen')"
            >
                <MaxIcon :icon="props.isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'" :size="1.1" color="currentColor" />
            </button>
        </div>

        <!-- Atalhos Informativos (Dica) -->
        <div class="max-input-code-toolbar__info">
            <span
                class="max-input-code-toolbar__info-badge"
                title="Atalhos: Ctrl+Shift+L (Multi-cursor em todas as ocorrências), Alt+Shift+F (Formatar), Ctrl+F (Buscar), Ctrl+H (Substituir), Ctrl+/ (Comentar)"
            >
                <MaxIcon icon="mdi:keyboard-outline" :size="1" color="currentColor" />
                <span class="max-input-code-toolbar__info-text">Ctrl+Shift+L</span>
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onBeforeUnmount, ref } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    export interface CodeLanguageOption {
        label: string;
        value: string;
    }

    const DEFAULT_LANGUAGES: CodeLanguageOption[] = [
        { label: 'TypeScript', value: 'typescript' },
        { label: 'JavaScript', value: 'javascript' },
        { label: 'PHP', value: 'php' },
        { label: 'SQL', value: 'sql' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'JSON', value: 'json' },
        { label: 'Python', value: 'python' },
        { label: 'Shell / Bash', value: 'shell' },
        { label: 'Markdown', value: 'markdown' },
        { label: 'YAML', value: 'yaml' },
        { label: 'XML', value: 'xml' },
        { label: 'C#', value: 'csharp' },
        { label: 'C++', value: 'cpp' },
        { label: 'Java', value: 'java' },
        { label: 'Rust', value: 'rust' },
        { label: 'Go', value: 'go' }
    ];

    const props = withDefaults(
        defineProps<{
            language?: string;
            languages?: CodeLanguageOption[];
            wordWrap?: boolean;
            minimap?: boolean;
            isFullscreen?: boolean;
            disabled?: boolean;
        }>(),
        {
            language: 'typescript',
            languages: () => [],
            wordWrap: true,
            minimap: false,
            isFullscreen: false,
            disabled: false
        }
    );

    const emit = defineEmits<{
        'update:language': [lang: string];
        'format': [];
        'toggle-comment': [];
        'indent': [];
        'outdent': [];
        'undo': [];
        'redo': [];
        'copy': [];
        'toggle-wrap': [];
        'toggle-minimap': [];
        'toggle-fullscreen': [];
    }>();

    const isCopied = ref(false);
    let copyTimeout: ReturnType<typeof setTimeout> | null = null;

    const effectiveLanguages = computed(() => {
        if (props.languages && props.languages.length > 0) return props.languages;
        return DEFAULT_LANGUAGES;
    });

    const onLanguageSelect = (event: Event) => {
        const target = event.target as HTMLSelectElement | null;
        if (target) emit('update:language', target.value);
    };

    const handleCopy = () => {
        emit('copy');
        isCopied.value = true;
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
            isCopied.value = false;
        }, 1800);
    };

    onBeforeUnmount(() => {
        if (copyTimeout) {
            clearTimeout(copyTimeout);
            copyTimeout = null;
        }
    });
</script>

<style lang="scss" scoped>
    .max-input-code-toolbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px 4px;
        padding: 6px 10px;
        background-color: var(--background-50, #f8fafc);
        border-bottom: 1px solid var(--background-200, #e2e8f0);
        user-select: none;
        box-sizing: border-box;
        width: 100%;
        min-height: 40px;

        &--disabled {
            opacity: 0.6;
            pointer-events: none;
        }

        &__group {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            height: auto;
        }

        &__divider {
            display: inline-block;
            width: 1px;
            height: 18px;
            background-color: var(--background-300, #cbd5e1);
            margin: 0 4px;
            flex-shrink: 0;
        }

        &__select {
            height: 28px;
            padding: 2px 8px;
            font-size: 0.8rem;
            font-weight: 500;
            color: var(--background-750, #334155);
            background-color: var(--background-0, #fff);
            border: 1px solid var(--background-300, #cbd5e1);
            border-radius: 4px;
            outline: none;
            cursor: pointer;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;

            &:focus {
                border-color: var(--max-primary-500, #3b82f6);
                box-shadow: 0 0 0 2px rgb(59 130 246 / 15%);
            }

            &:disabled {
                cursor: not-allowed;
                opacity: 0.7;
            }
        }

        &__btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            border: 1px solid transparent;
            border-radius: 4px;
            background: transparent;
            color: var(--background-650, #475569);
            cursor: pointer;
            transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;

            &:hover:not(:disabled) {
                background-color: var(--background-150, #e2e8f0);
                color: var(--background-900, #0f172a);
            }

            &.active {
                background-color: var(--background-200, #cbd5e1);
                color: var(--max-primary-500, #3b82f6);
                border-color: var(--background-300, #94a3b8);
            }

            &:disabled {
                cursor: not-allowed;
                opacity: 0.4;
            }
        }

        &__info {
            display: inline-flex;
            align-items: center;
            margin-left: auto;

            .max-input-code-toolbar__info-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.72rem;
                color: var(--background-500, #64748b);
                background-color: var(--background-100, #f1f5f9);
                border: 1px solid var(--background-200, #e2e8f0);
                cursor: help;

                .max-input-code-toolbar__info-text {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-weight: 600;
                }
            }
        }
    }
</style>
