<template>
    <div v-if="!isMobile" class="max-top-menu-search-bar search-top-bar">
        <MaxInputText
            ref="input_search_ref"
            v-model="search_bar.input_value"
            :placeholder="props.placeholder"
            class="search-top-bar-input"
            :icon="search_bar.is_filtering ? 'eos-icons:loading' : 'material-symbols:search-rounded'"
            :aria-keyshortcuts="computedAriaKeyshortcuts"
            no-message
        >
            <template #default>
                <kbd v-if="props.showShortcutBadge && props.shortcut !== false" class="search-shortcut-badge">
                    {{ shortcutLabel }}
                </kbd>
                <slot></slot>
            </template>
        </MaxInputText>
    </div>

    <!-- Versão Mobile: MaxIconButton que abre painel flutuante com slide-down -->
    <div v-else class="search-top-bar-mobile">
        <MaxIconButton
            ref="mobileTriggerBtnRef"
            icon="material-symbols:search-rounded"
            size="1.3"
            light
            aria-label="Abrir pesquisa"
            @click.stop="toggleMobileSearch"
        />

        <Teleport to="body">
            <Transition name="search-fade">
                <div v-if="is_open" class="mobile-search-overlay" @click="closeSearch" />
            </Transition>

            <Transition name="search-slide-down">
                <div
                    v-if="is_open"
                    ref="mobilePanelRef"
                    class="mobile-search-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Pesquisa"
                    tabindex="-1"
                    @keydown="trap.onKeydown"
                >
                    <div class="mobile-search-content">
                        <MaxInputText
                            ref="input_search_mobile_ref"
                            v-model="search_bar.input_value"
                            :placeholder="props.placeholder"
                            class="search-top-bar-input mobile-input"
                            :icon="search_bar.is_filtering ? 'eos-icons:loading' : 'material-symbols:search-rounded'"
                            :aria-keyshortcuts="computedAriaKeyshortcuts"
                            no-message
                        >
                            <slot></slot>
                        </MaxInputText>
                        <MaxIconButton
                            icon="material-symbols:close-rounded"
                            size="1.3"
                            light
                            class="btn-close-search"
                            aria-label="Fechar pesquisa"
                            @click.stop="closeSearch"
                        />
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import type { Ref } from 'vue';
    import { ref, computed, nextTick, onMounted, onUnmounted, useAttrs } from 'vue';
    import MaxInputText from './MaxInputText.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';
    import { useSystemStore } from '../stores/useSystem.Store';
    import { useFocusTrap } from '../helpers/useFocusTrap';

    const props = withDefaults(defineProps<{
        /**
         * Texto do campo. No engeapp exibia a contagem de projetos, que vinha da
         * store do board — domínio da aplicação, por isso agora é uma prop.
         */
        placeholder?: string;
        /** Dispositivo atual ('desktop' | 'mobile'). Quando omitido, consulta useSystemStore(). */
        screen?: string;
        /** Atalho de teclado para focar na pesquisa (default: 'ctrl+k'). Passe false para desabilitar. */
        shortcut?: boolean | string;
        /** Exibir o badge visual do atalho no campo de busca. */
        showShortcutBadge?: boolean;
    }>(), {
        placeholder: 'Pesquisar',
        shortcut: 'ctrl+k',
        showShortcutBadge: true
    });

    const attrs = useAttrs();
    const system = useSystemStore();
    const search_bar = useSearchBarStore();
    const input_search_ref: Ref<any> = ref();
    const input_search_mobile_ref: Ref<any> = ref();
    const mobilePanelRef = ref<HTMLElement | null>(null);
    const mobileTriggerBtnRef = ref<any>(null);
    let triggerElement: HTMLElement | null = null;
    const trap = useFocusTrap(mobilePanelRef);
    const is_open = ref(false);

    const isMobile = computed<boolean>(() => {
        const target = props.screen ?? (attrs.screen as string | undefined);
        if (target) return target === 'mobile';
        return system.type_device === 'mobile';
    });

    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

    const parsedShortcutKey = computed<string>(() => {
        if (props.shortcut === false) return '';
        if (typeof props.shortcut === 'string') {
            const parts = props.shortcut.toLowerCase().split('+');
            return parts[parts.length - 1] || 'k';
        }
        return 'k';
    });

    const shortcutLabel = computed(() => {
        if (props.shortcut === false) return '';
        const key = parsedShortcutKey.value.toUpperCase();
        return isMac ? `⌘${key}` : `Ctrl+${key}`;
    });

    const computedAriaKeyshortcuts = computed<string | undefined>(() => {
        if (props.shortcut === false) return undefined;
        const key = parsedShortcutKey.value.toUpperCase();
        return isMac ? `Meta+${key}` : `Control+${key}`;
    });

    const openSearch = (): void => {
        if (typeof document !== 'undefined') {
            triggerElement = document.activeElement as HTMLElement | null;
        }
        is_open.value = true;
        trap.activate();
        nextTick(() => {
            input_search_mobile_ref.value?.focus?.();
            input_search_mobile_ref.value?.setFocus?.();
        });
    };

    const closeSearch = (): void => {
        is_open.value = false;
        trap.deactivate();
        const elToFocus = triggerElement || mobileTriggerBtnRef.value?.$el?.querySelector?.('button') || mobileTriggerBtnRef.value?.$el;
        triggerElement = null;
        if (elToFocus && typeof elToFocus.focus === 'function') {
            setTimeout(() => {
                elToFocus.focus();
            }, 50);
        }
    };

    const toggleMobileSearch = (): void => {
        if (is_open.value) closeSearch();
        else openSearch();
    };

    const handleSearchKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape' && is_open.value) {
            closeSearch();
            return;
        }

        if (props.shortcut === false) return;

        // Ignora quando o foco ativo for outro input/textarea editável externo à busca
        const target = (event.target as HTMLElement | null) || (document.activeElement as HTMLElement | null);
        if (target) {
            const selfInput = isMobile.value
                ? (input_search_mobile_ref.value?.input?.value || input_search_mobile_ref.value?.$el?.querySelector?.('input'))
                : (input_search_ref.value?.input?.value || input_search_ref.value?.$el?.querySelector?.('input'));
            const selfRoot = isMobile.value ? mobilePanelRef.value : input_search_ref.value?.$el;
            const isSelf = target === selfInput || Boolean(selfRoot && selfRoot.contains(target));
            if (!isSelf) {
                const tagName = target.tagName?.toLowerCase();
                const isEditable = target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
                if (isEditable) return;
            }
        }

        const isMod = isMac ? (event.metaKey || event.ctrlKey) : event.ctrlKey;
        const key = event.key.toLowerCase();
        const expectedKey = parsedShortcutKey.value.toLowerCase();

        if (isMod && key === expectedKey) {
            event.preventDefault();
            if (isMobile.value) openSearch();
            else {
                input_search_ref.value?.focus?.();
                input_search_ref.value?.setFocus?.();
            }
        }
    };

    onMounted(() => document.addEventListener('keydown', handleSearchKeydown));
    onUnmounted(() => {
        trap.deactivate();
        document.removeEventListener('keydown', handleSearchKeydown);
    });
</script>

<style lang="scss" scoped>
    .search-top-bar {
        position: relative;
        display: grid;
        width: 100%;
        height: 38px;
        place-items: center;

        :deep(.max-input-main-div) {
            grid-template-rows: 1fr !important;
            height: 100% !important;
            width: 100% !important;
        }

        :deep(.input-message) {
            display: none !important;
        }

        :deep(.max-input-field-div) {
            border: none !important;
            outline: rgb(255 255 255 / 10%) 1px solid !important;
            background-color: rgb(0 0 0 / 10%) !important;
            height: 38px !important;
            width: 100% !important;
            border-radius: 8px;
        }

        .search-top-bar-input {
            position: relative;
            width: 100%;
            max-width: 520px;
            display: flex;
            align-items: center;

            .search-shortcut-badge {
                position: absolute;
                right: 12px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.125rem 0.375rem;
                font-family: inherit;
                font-size: 0.6875rem;
                font-weight: 600;
                color: var(--background-600);
                background: var(--background-100);
                border: 1px solid var(--background-300);
                border-radius: 4px;
                pointer-events: none;
                user-select: none;
            }

            :deep(input) {
                border-color: rgb(255 255 255 / 7%);
                background-color: rgb(255 255 255 / 7%);
                color: rgb(255 255 255 / 70%);
                padding: 0 48px 0 38px !important;
                height: 100% !important;
                font-size: 0.9rem;
            }

            :deep(.max-icon-div) {
                margin-left: 6px;

                svg {
                    color: rgb(255 255 255 / 40%) !important;
                }
            }

            :deep(.checkbox-search-top) {
                position: absolute;
                right: 12px;
                bottom: 9px;
                display: grid;
                place-items: center start;

                svg {
                    width: 10px;
                    height: 10px;
                }
            }
        }
    }

    .search-top-bar-mobile {
        display: grid;
        place-items: center;
    }

    .mobile-search-overlay {
        position: fixed;
        inset: 0;
        z-index: var(--max-layer-modal-backdrop, 1300);
        background-color: rgb(0 0 0 / 50%);

        &.search-fade-enter-active,
        &.search-fade-leave-active {
            transition: opacity 0.2s ease;
        }

        &.search-fade-enter-from,
        &.search-fade-leave-to {
            opacity: 0;
        }
    }

    .mobile-search-panel {
        position: fixed;
        top: var(--top-menu-height, 60px);
        left: 0;
        width: 100%;
        z-index: var(--max-layer-modal, 1310);
        box-sizing: border-box;
        padding: 0.6rem 0.75rem;
        background-color: var(--layout-shell-bg, #003048);
        box-shadow: 0 8px 24px rgb(0 0 0 / 35%);

        &.search-slide-down-enter-active,
        &.search-slide-down-leave-active {
            transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
        }

        &.search-slide-down-enter-from,
        &.search-slide-down-leave-to {
            transform: translateY(-12px);
            opacity: 0;
        }

        .mobile-search-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;

            .mobile-input {
                display: flex;
                flex: 1;
                min-width: 0;
            }

            .btn-close-search {
                flex-shrink: 0;
            }
        }
    }
</style>
