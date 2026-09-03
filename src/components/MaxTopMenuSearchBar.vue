<template>
    <div v-if="!isMobile" class="search-top-bar">
        <MaxInputText
            ref="input_search_ref"
            v-model="search_bar.input_value"
            w-max-400
            flex
            :placeholder="props.placeholder"
            class="search-top-bar-input"
            :icon="search_bar.is_filtering ? 'eos-icons:loading' : 'material-symbols:search-rounded'"
            no-message
        >
            <slot></slot>
        </MaxInputText>
    </div>

    <!-- Versão Mobile: MaxIconButton que abre painel flutuante com slide-down -->
    <div v-else class="search-top-bar-mobile">
        <MaxIconButton
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
                <div v-if="is_open" class="mobile-search-panel" role="dialog" aria-modal="true" aria-label="Pesquisa">
                    <div class="mobile-search-content">
                        <MaxInputText
                            ref="input_search_mobile_ref"
                            v-model="search_bar.input_value"
                            flex
                            :placeholder="props.placeholder"
                            class="search-top-bar-input mobile-input"
                            :icon="search_bar.is_filtering ? 'eos-icons:loading' : 'material-symbols:search-rounded'"
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
    import { useMagicKeys, whenever } from '@maxvue/max-use';
    import MaxInputText from './MaxInputText.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';
    import { useSystemStore } from '../stores/useSystem.Store';

    const props = withDefaults(defineProps<{
        /**
         * Texto do campo. No engeapp exibia a contagem de projetos, que vinha da
         * store do board — domínio da aplicação, por isso agora é uma prop.
         */
        placeholder?: string;
        /** Dispositivo atual ('desktop' | 'mobile'). Quando omitido, consulta useSystemStore(). */
        screen?: string;
    }>(), {
        placeholder: 'Pesquisar'
    });

    const attrs = useAttrs();
    const system = useSystemStore();
    const search_bar = useSearchBarStore();
    const input_search_ref: Ref<any> = ref();
    const input_search_mobile_ref: Ref<any> = ref();
    const is_open = ref(false);

    const isMobile = computed<boolean>(() => {
        const target = props.screen ?? (attrs.screen as string | undefined);
        if (target) return target === 'mobile';
        return system.type_device === 'mobile';
    });

    const openSearch = (): void => {
        is_open.value = true;
        nextTick(() => {
            input_search_mobile_ref.value?.setFocus?.();
        });
    };

    const closeSearch = (): void => {
        is_open.value = false;
    };

    const toggleMobileSearch = (): void => {
        if (is_open.value) closeSearch();
        else openSearch();
    };

    const keys = useMagicKeys();
    const isCtrlF = keys['Control+F'];
    const isEscape = keys['Escape'];

    whenever(isCtrlF, () => {
        if (isMobile.value) openSearch();
        else input_search_ref.value?.setFocus?.();
    });

    whenever(isEscape, () => {
        if (is_open.value) closeSearch();
    });

    /** Impede o Ctrl+F nativo do navegador enquanto a barra existe. */
    const handleSearchKeydown = (event: KeyboardEvent): void => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') event.preventDefault();
        if (event.key === 'Escape' && is_open.value) closeSearch();
    };

    onMounted(() => document.addEventListener('keydown', handleSearchKeydown));
    onUnmounted(() => document.removeEventListener('keydown', handleSearchKeydown));
</script>

<style lang="scss">
    .search-top-bar {
        position: relative;
        display: grid;
        width: 100%;
        height: 36px;
        place-items: center;

        .max-input-field-div {
            border: none !important;
            outline: rgb(255 255 255 / 10%) 1px solid !important;
            background-color: rgb(0 0 0 / 10%) !important;
        }

        .search-top-bar-input {
            position: relative;

            input {
                border-color: rgb(255 255 255 / 7%);
                background-color: rgb(255 255 255 / 7%);
                color: rgb(255 255 255 / 70%);
                padding-left: 35px !important;
            }

            .max-icon-div {
                svg {
                    color: rgb(255 255 255 / 20%) !important;
                }
            }

            .checkbox-search-top {
                position: absolute;
                right: 15px;
                bottom: 8px;
                display: grid;
                place-items: center start;

                svg {
                    width: 10px;
                    height: 10px;
                }

                .p-checkbox-checked {
                    .p-checkbox-box {
                        border: 1px solid rgb(255 255 255 / 20%) !important;
                        background-color: rgb(0 0 0 / 20%) !important;
                    }
                }
            }
        }

        .p-checkbox-box {
            border: 1px solid rgb(255 255 255 / 10%) !important;
            background-color: rgb(255 255 255 / 10%) !important;
            min-width: 16px !important;
            width: 16px !important;
            min-height: 16px !important;
            height: 16px !important;
            transform: translateX(-45px) !important;
        }

        input {
            padding: 0 !important;
        }

        .p-checkbox-input {
            padding: 0 !important;
        }
    }

    .search-top-bar-mobile {
        display: grid;
        place-items: center;
    }

    .mobile-search-overlay {
        position: fixed;
        inset: 0;
        z-index: 940;
        background-color: rgb(0 0 0 / 50%);
    }

    .mobile-search-panel {
        position: fixed;
        top: var(--top-menu-height, 60px);
        left: 0;
        width: 100%;
        z-index: 950;
        box-sizing: border-box;
        padding: 0.6rem 0.75rem;
        background-color: var(--blue-850, #0f172a);
        box-shadow: 0 8px 24px rgb(0 0 0 / 35%);

        .mobile-search-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;

            .mobile-input {
                flex: 1;
                min-width: 0;
            }

            .btn-close-search {
                flex-shrink: 0;
            }
        }
    }

    .search-fade-enter-active,
    .search-fade-leave-active {
        transition: opacity 0.2s ease;
    }

    .search-fade-enter-from,
    .search-fade-leave-to {
        opacity: 0;
    }

    .search-slide-down-enter-active,
    .search-slide-down-leave-active {
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
    }

    .search-slide-down-enter-from,
    .search-slide-down-leave-to {
        transform: translateY(-12px);
        opacity: 0;
    }
</style>
