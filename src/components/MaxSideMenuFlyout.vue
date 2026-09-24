<template>
    <div
        v-if="props.visible && props.backdrop"
        class="max-side-menu-flyout-backdrop"
        tabindex="-1"
        aria-hidden="true"
        @click="emit('close')"
    />

    <transition name="max-flyout-slide">
        <aside
            v-if="props.visible && activeItem"
            ref="flyoutRef"
            class="max-side-menu-flyout panel0"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
            tabindex="-1"
            @keydown.esc.stop="emit('close')"
        >
            <!-- Cabeçalho do menu lateral -->
            <div class="flyout-header">
                <div class="flyout-title-wrap">
                    <MaxIcon
                        v-if="parentIcon"
                        :icon="parentIcon"
                        size="1.2"
                        light
                        class="flyout-header-icon"
                    />
                    <span class="flyout-title">{{ title }}</span>
                </div>
                <MaxIconButton
                    icon="material-symbols:close-rounded"
                    size="1.2"
                    light
                    class="flyout-close-btn"
                    aria-label="Fechar submenu"
                    @click="emit('close')"
                />
            </div>

            <!-- Lista de opções -->
            <nav class="flyout-content" aria-label="Subitens">
                <!-- Se o item pai possui rota própria cadastrada, exibe como Visão Geral -->
                <div
                    v-if="parentRoute"
                    class="flyout-item parent-overview"
                    :class="{ active: isParentActive }"
                    role="link"
                    tabindex="0"
                    :aria-label="`${title} - Visão Geral`"
                    :aria-current="isParentActive ? 'page' : undefined"
                    @click="handleParentClick"
                    @keydown.enter="handleParentClick"
                >
                    <MaxIcon
                        v-if="parentIcon"
                        :icon="parentIcon"
                        size="1.1"
                        light
                        class="flyout-item-icon"
                    />
                    <span class="flyout-item-label">{{ title }} (Visão Geral)</span>
                </div>

                <!-- Subitens do item selecionado -->
                <div
                    v-for="(sub, index) in subitems"
                    :key="sub.id ?? getMenuItemRoute(sub) ?? index"
                    class="flyout-item"
                    :class="{ active: isSubItemActive(sub, currentRouteName) }"
                    role="link"
                    tabindex="0"
                    :aria-label="getMenuItemLabel(sub)"
                    :aria-current="isSubItemActive(sub, currentRouteName) ? 'page' : undefined"
                    @click="handleSubItemClick(sub)"
                    @keydown.enter="handleSubItemClick(sub)"
                >
                    <MaxIcon
                        v-if="getMenuItemIcon(sub)"
                        :icon="getMenuItemIcon(sub)!"
                        size="1.1"
                        light
                        class="flyout-item-icon"
                    />
                    <span class="flyout-item-label">{{ getMenuItemLabel(sub) }}</span>
                </div>
            </nav>
        </aside>
    </transition>
</template>

<script setup lang="ts">
    import { computed, ref, watch, nextTick } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { goToRoute } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';
    import {
        getSubItems,
        getMenuItemLabel,
        getMenuItemIcon,
        getMenuItemRoute,
        isSubItemActive
    } from '../helpers/menuHelpers';
    import { isMenuRouteActive } from '../helpers/menuRouteMatches';
    import type { SideMenuItem, SideMenuSubItem } from '../types/app';

    const props = withDefaults(defineProps<{
        /** Controla a visibilidade do painel. */
        visible: boolean;
        /** Item pai selecionado na barra principal. */
        item: SideMenuItem | null;
        /** Rota atual para marcação do item ativo. */
        currentRoute?: string;
        /** Exibe backdrop escuro de tela cheia (opcional, padrão false para layout panel0). */
        backdrop?: boolean;
    }>(), {
        backdrop: false
    });

    const emit = defineEmits<{
        close: [];
        select: [subitem: SideMenuSubItem];
    }>();

    const flyoutRef = ref<HTMLElement | null>(null);
    const router = useRouter();
    const route = useRoute();

    // Cache do último item válido para manter conteúdo visível durante a animação de fechamento
    const activeItem = ref<SideMenuItem | null>(props.item);

    watch(() => props.item, (newItem) => {
        if (newItem) activeItem.value = newItem;
    }, { immediate: true });

    const currentRouteName = computed<string>(() => {
        return String(props.currentRoute || route?.name || '');
    });

    const title = computed<string>(() => {
        return activeItem.value ? getMenuItemLabel(activeItem.value) : '';
    });

    const parentIcon = computed<string | null>(() => {
        return activeItem.value ? getMenuItemIcon(activeItem.value) : null;
    });

    const parentRoute = computed<string | null>(() => {
        return activeItem.value ? getMenuItemRoute(activeItem.value) : null;
    });

    const isParentActive = computed<boolean>(() => {
        return Boolean(activeItem.value && isMenuRouteActive(activeItem.value, currentRouteName.value));
    });

    const subitems = computed<SideMenuSubItem[]>(() => {
        return activeItem.value ? getSubItems(activeItem.value) : [];
    });

    // Foca o flyout quando aberto para suporte a acessibilidade e Escape
    watch(() => props.visible, (isOpen) => {
        if (isOpen) nextTick(() => {
            flyoutRef.value?.focus();
        });

    });

    function navigateTo(targetRoute: string | null): void {
        if (!targetRoute) return;

        useSearchBarStore().input_value = '';

        if (targetRoute.startsWith('/')) {
            if (route?.path !== targetRoute) router.push(targetRoute);
        } else goToRoute(targetRoute);

    }

    function handleParentClick(): void {
        emit('close');
        if (parentRoute.value) navigateTo(parentRoute.value);

    }

    function handleSubItemClick(subitem: SideMenuSubItem): void {
        emit('select', subitem);
        emit('close');

        if (typeof subitem.action === 'function') {
            subitem.action();
            return;
        }

        const targetRoute = getMenuItemRoute(subitem);
        if (targetRoute) navigateTo(targetRoute);

    }
</script>

<style lang="scss" scoped>
    .max-side-menu-flyout-backdrop {
        position: fixed;
        inset: 0;
        z-index: 30;
        background-color: rgb(0 0 0 / 25%);
        backdrop-filter: blur(1px);
    }

    .max-side-menu-flyout {
        position: relative;
        z-index: 5;
        display: flex;
        flex-direction: column;
        width: 240px;
        min-width: 240px;
        max-width: 240px;
        height: 100%;
        max-height: 100%;
        background-color: var(--layout-content-frame-bg, #004860);
        border-radius: 8px;
        box-sizing: border-box;
        outline: none;
        overflow: hidden;

        .flyout-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 1rem;
            border-bottom: 1px solid rgb(255 255 255 / 10%);
            flex-shrink: 0;

            .flyout-title-wrap {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                min-width: 0;

                .flyout-header-icon {
                    color: var(--blue-100, #bfe7ef);
                    flex-shrink: 0;
                }

                .flyout-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--blue-200);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            .flyout-close-btn {
                display: grid;
                place-items: center;
                width: 28px;
                height: 28px;
                padding: 0;
                border: none;
                border-radius: 6px;
                background: transparent;
                cursor: pointer;
                transition: background-color 0.15s ease, opacity 0.15s ease;

                &:hover {
                    background-color: rgb(255 255 255 / 12%);
                }

                &:focus-visible {
                    outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
                    outline-offset: 1px;
                }
            }
        }

        .flyout-content {
            flex: 1 1 auto;
            overflow-y: auto;
            padding: 0.75rem 0.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;

            &::-webkit-scrollbar {
                width: 4px;
            }

            &::-webkit-scrollbar-thumb {
                background: rgb(255 255 255 / 20%);
                border-radius: 4px;
            }

            .flyout-item {
                display: flex;
                align-items: center;
                gap: 0.7rem;
                min-height: 38px;
                padding: 0.45rem 0.75rem;
                border-radius: 6px;
                color: var(--blue-200);
                cursor: pointer;
                text-decoration: none;
                transition: background-color 0.15s ease, color 0.15s ease;

                .flyout-item-icon {
                    flex-shrink: 0;
                    color: var(--blue-100, #bfe7ef);
                    transition: color 0.15s ease;
                }

                .flyout-item-label {
                    font-size: 0.88rem;
                    font-weight: 500;
                    line-height: 1.3;
                    color: var(--blue-200);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    transition: color 0.15s ease;
                }

                &:hover {
                    background-color: rgb(255 255 255 / 12%);
                    color: var(--blue-0, #fff);

                    .flyout-item-icon {
                        color: var(--blue-0, #fff);
                    }

                    .flyout-item-label {
                        color: var(--blue-0, #fff);
                    }
                }

                &.active {
                    background-color: var(--max-primary-500, #00768e);
                    color: #fff;

                    .flyout-item-icon {
                        color: #fff;
                    }

                    .flyout-item-label {
                        font-weight: 600;
                        color: #fff;
                    }
                }

                &:focus-visible {
                    outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
                    outline-offset: -2px;
                }
            }
        }
    }

    /* Animações de entrada e saída do flyout */
    .max-flyout-slide-enter-active {
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out;
    }

    .max-flyout-slide-leave-active {
        transition: transform 0.24s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease-in;
    }

    .max-flyout-slide-enter-from,
    .max-flyout-slide-leave-to {
        transform: translateX(-16px);
        opacity: 0;
    }

    @media (prefers-reduced-motion: reduce) {
        .max-flyout-slide-enter-active,
        .max-flyout-slide-leave-active {
            transition: none !important;
        }

        .flyout-item,
        .flyout-close-btn {
            transition: none !important;
        }
    }
</style>
