<template>
    <div
        v-if="props.visible"
        class="max-side-menu-flyout-backdrop"
        tabindex="-1"
        aria-hidden="true"
        @click="emit('close')"
    />

    <transition name="max-flyout-slide">
        <aside
            v-if="props.visible && props.item"
            ref="flyoutRef"
            class="max-side-menu-flyout"
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
                        class="flyout-header-icon"
                    />
                    <span class="flyout-title">{{ title }}</span>
                </div>
                <button
                    type="button"
                    class="flyout-close-btn"
                    aria-label="Fechar submenu"
                    @click="emit('close')"
                >
                    <MaxIcon icon="material-symbols:close-rounded" size="1.2" />
                </button>
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

    const props = defineProps<{
        /** Controla a visibilidade do painel. */
        visible: boolean;
        /** Item pai selecionado na barra principal. */
        item: SideMenuItem | null;
        /** Rota atual para marcação do item ativo. */
        currentRoute?: string;
    }>();

    const emit = defineEmits<{
        close: [];
        select: [subitem: SideMenuSubItem];
    }>();

    const flyoutRef = ref<HTMLElement | null>(null);
    const router = useRouter();
    const route = useRoute();

    const currentRouteName = computed<string>(() => {
        return String(props.currentRoute || route?.name || '');
    });

    const title = computed<string>(() => {
        return props.item ? getMenuItemLabel(props.item) : '';
    });

    const parentIcon = computed<string | null>(() => {
        return props.item ? getMenuItemIcon(props.item) : null;
    });

    const parentRoute = computed<string | null>(() => {
        return props.item ? getMenuItemRoute(props.item) : null;
    });

    const isParentActive = computed<boolean>(() => {
        return Boolean(props.item && isMenuRouteActive(props.item, currentRouteName.value));
    });

    const subitems = computed<SideMenuSubItem[]>(() => {
        return props.item ? getSubItems(props.item) : [];
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
        position: fixed;
        top: 0;
        left: 55px;
        z-index: 35;
        display: flex;
        flex-direction: column;
        width: 250px;
        height: 100vh;
        height: 100dvh;
        background-color: var(--layout-shell-bg, #003048);
        border-right: 1px solid var(--layout-border, #004860);
        box-shadow: 6px 0 20px rgb(0 0 0 / 25%);
        box-sizing: border-box;
        outline: none;

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
                    color: var(--layout-shell-text, #fff);
                    flex-shrink: 0;
                }

                .flyout-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--layout-shell-text, #fff);
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
                color: var(--layout-shell-text-muted, rgb(255 255 255 / 70%));
                cursor: pointer;
                transition: background-color 0.15s ease, color 0.15s ease;

                &:hover {
                    background-color: rgb(255 255 255 / 12%);
                    color: #fff;
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
                color: var(--layout-shell-text-muted, rgb(255 255 255 / 85%));
                cursor: pointer;
                text-decoration: none;
                transition: background-color 0.15s ease, color 0.15s ease;

                .flyout-item-icon {
                    flex-shrink: 0;
                    color: rgb(255 255 255 / 75%);
                }

                .flyout-item-label {
                    font-size: 0.88rem;
                    font-weight: 500;
                    line-height: 1.3;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                &:hover {
                    background-color: rgb(255 255 255 / 12%);
                    color: #fff;

                    .flyout-item-icon {
                        color: #fff;
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
    .max-flyout-slide-enter-active,
    .max-flyout-slide-leave-active {
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
    }

    .max-flyout-slide-enter-from,
    .max-flyout-slide-leave-to {
        transform: translateX(-15px);
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
