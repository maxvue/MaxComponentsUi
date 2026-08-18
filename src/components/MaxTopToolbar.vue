<template>
    <div v-if="showed && hasContent(toolbar.items)" ref="element_ref" :class="`tool-bar-top-main-div ${attrs.plus === true ? 'onlyOne' : ''}`">
        <nav ref="menu_ref" class="menu_bar_project_top" role="menubar">
            <ul class="p-menubar-root-list">
                <li
                    v-for="(item, index) in toolbar.items"
                    :key="index"
                    class="p-menubar-item"
                    role="none"
                    @mouseenter="openSubmenu(index)"
                    @mouseleave="scheduleCloseSubmenu"
                >
                    <div class="p-menubar-item-content">
                        <div v-if="item.divider" class="divider-space"></div>
                        <div
                            v-else-if="hasContent(item.label)"
                            pointer
                            w-flex
                            class="menu-item-content root"
                            @click="handleItemClick(item)"
                        >
                            <MaxIconButton v-if="item.icon" :icon="item.icon" :size="item.icon_size" transparent />
                            <div class="menu-item-labels">
                                <span class="menu-item-label">{{ item.label }}</span>
                                <span v-if="item.subLabel" class="menu-item-sublabel">{{ item.subLabel }}</span>
                            </div>
                        </div>
                        <MaxIconButton
                            v-else
                            v-tooltip.bottom="item.tooltip ?? false"
                            :icon="item.icon"
                            light
                            transparent
                            :route="item.route ?? null"
                            :action="item.action"
                            :data="item.data ?? item.props ?? item.query"
                            class="root"
                            size="1.5"
                        />
                    </div>

                    <!-- Submenu se houver item.items -->
                    <ul v-if="item.items && item.items.length && activeSubmenu === index" class="p-menubar-submenu" role="menu">
                        <li v-for="(subItem, subIndex) in item.items" :key="subIndex" class="p-menubar-item" role="none">
                            <div class="p-menubar-item-content">
                                <div
                                    v-if="hasContent(subItem.label)"
                                    pointer
                                    w-flex
                                    class="menu-item-content"
                                    @click="handleItemClick(subItem)"
                                >
                                    <MaxIconButton v-if="subItem.icon" :icon="subItem.icon" :size="subItem.icon_size" transparent />
                                    <div class="menu-item-labels">
                                        <span class="menu-item-label">{{ subItem.label }}</span>
                                        <span v-if="subItem.subLabel" class="menu-item-sublabel">{{ subItem.subLabel }}</span>
                                    </div>
                                </div>
                                <MaxIconButton
                                    v-else
                                    v-tooltip.bottom="subItem.tooltip ?? false"
                                    :icon="subItem.icon"
                                    light
                                    transparent
                                    :route="subItem.route ?? null"
                                    :action="subItem.action"
                                    :data="subItem.data ?? subItem.props ?? subItem.query"
                                    size="1.5"
                                />
                            </div>
                        </li>
                    </ul>
                </li>
            </ul>
        </nav>
    </div>
    <slot name="plus"></slot>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs, onBeforeUnmount } from 'vue';
    import { hasContent } from '@maxvue/max-use';
    import MaxIconButton from './MaxIconButton.vue';
    import { useTopToolbarStore } from '../stores/useTopToolbar.Store';

    const SUBMENU_CLOSE_DELAY_MS = 1000;

    const attrs: any = useAttrs();
    const toolbar = useTopToolbarStore();

    const element_ref = ref();
    const menu_ref = ref();
    const activeSubmenu = ref<number | null>(null);
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const showed = computed(() => (attrs.plus === true ? true : toolbar.show));

    const clearCloseTimer = (): void => {
        if (closeTimer === null) return;
        clearTimeout(closeTimer);
        closeTimer = null;
    };

    const openSubmenu = (index: number): void => {
        clearCloseTimer();
        activeSubmenu.value = index;
    };

    const scheduleCloseSubmenu = (): void => {
        clearCloseTimer();
        closeTimer = setTimeout(() => {
            activeSubmenu.value = null;
            closeTimer = null;
        }, SUBMENU_CLOSE_DELAY_MS);
    };

    onBeforeUnmount(clearCloseTimer);

    /**
     * Executa a ação do item: função própria (`action`), callback do PrimeVue
     * (`command`) ou navegação por rota.
     */
    const handleItemClick = (item: any): void => {
        if (typeof item?.action === 'function') item.action();
        else if (typeof item?.command === 'function') item.command({ item });
        else if (item?.route || item?.data) toolbar.route(item.data ?? item.props ?? item.query, item.route);
    };
</script>

<style lang="scss">
    .tool-bar-top-main-div {
        display: grid;
        position: relative;
        width: 100%;
        place-items: center;

        .menu_bar_project_top {
            top: 5px;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            background-color: var(--blue-850) !important;
            z-index: 1 !important;

            .p-menubar-root-list {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;

                // TODOS ITEMS
                .p-menubar-item {
                    position: relative;

                    &:has(.divider-space) {
                        opacity: 0;

                        .p-menubar-item-content {
                            padding: 0;
                        }

                        .divider-space {
                            width: 5px !important;
                        }
                    }

                    .p-menubar-item-content {
                        height: 40px !important;
                        display: grid;
                        width: auto !important;
                        place-items: center;
                        padding: 0 10px;
                        grid-template-columns: 1fr;

                        .menu-item-content {
                            cursor: pointer;
                            width: 100% !important;
                            height: 100% !important;
                            max-height: 40px !important;
                            display: grid;
                            place-items: center start;
                            grid-template-columns: 22px auto auto !important;
                            gap: 5px;
                            transition: transform 0.3s ease-in-out;
                            color: var(--background-700) !important;

                            .menu-item-labels {
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                line-height: 1.1;
                                overflow: hidden;

                                .menu-item-label {
                                    font-size: 0.9rem;
                                    white-space: nowrap;
                                }

                                .menu-item-sublabel {
                                    font-size: 0.72rem;
                                    opacity: 0.55;
                                    white-space: nowrap;
                                }
                            }
                        }

                        &.p-menubar-item-active {
                            .p-menubar-item-content {
                                background-color: transparent !important;
                            }
                        }
                    }

                    .p-menubar-submenu {
                        list-style: none;
                        margin: 0;
                        padding: 0;
                        left: unset;
                        right: 100% !important;
                        transform: translateX(100%) translateY(10px) !important;
                        color: var(--red-600) !important;
                        width: max-content !important;
                        position: absolute;
                        z-index: 99999 !important;
                        background: var(--background-0, #fff);
                        box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
                        border-radius: 4px;

                        .p-menubar-item {
                            .p-menubar-item-content {
                                width: auto !important;
                                white-space: nowrap;
                                color: var(--blue-700);
                                opacity: 0.8;

                                .icons {
                                    color: var(--blue-700);
                                }

                                .right-icon {
                                    padding-left: 15px;
                                }
                            }
                        }
                    }
                }

                // DEFINIÇÕES PARA BARRA DE MENUS (PRIMEIRA CAMADA DE ITENS)
                > .p-menubar-item {
                    position: relative;

                    .p-menubar-item-content {
                        color: var(--primary-500);
                    }

                    &.p-menubar-item-active,
                    &:hover {
                        .p-menubar-item-content {
                            background-color: transparent;
                            opacity: 1;
                        }
                    }
                }
            }
        }

        .p-focus {
            background-color: transparent !important;

            .p-menubar-item {
                background-color: transparent !important;
            }

            .p-menubar-item-content {
                background-color: transparent !important;
            }
        }
    }
</style>
