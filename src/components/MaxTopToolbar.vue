<template>
    <div v-if="showed && hasContent(toolbar.items)" ref="element_ref" :class="`max-top-toolbar tool-bar-top-main-div ${attrs.plus === true ? 'onlyOne' : ''}`">
        <nav ref="menu_ref" class="menu_bar_project_top" role="menubar">
            <ul class="max-top-toolbar-root-list p-menubar-root-list">
                <li
                    v-for="(item, index) in toolbar.items"
                    :key="index"
                    class="max-top-toolbar-item p-menubar-item"
                    role="none"
                    @mouseenter="openSubmenu(index)"
                    @mouseleave="scheduleCloseSubmenu"
                    @keydown="onMenubarItemKeydown($event, index, item)"
                >
                    <div class="max-top-toolbar-item-content p-menubar-item-content">
                        <div v-if="item.divider" class="divider-space" role="separator"></div>
                        <div
                            v-else-if="hasContent(item.label)"
                            :ref="(el) => setItemRef(el, index)"
                            class="menu-item-content root"
                            :class="{ 'is-disabled': item.disabled }"
                            role="menuitem"
                            :id="`top-toolbar-item-${index}`"
                            :tabindex="focusedIndex === index && !item.disabled ? 0 : -1"
                            :aria-haspopup="item.items && item.items.length ? 'menu' : undefined"
                            :aria-expanded="item.items && item.items.length ? (activeSubmenu === index ? 'true' : 'false') : undefined"
                            :aria-controls="item.items && item.items.length ? `top-toolbar-submenu-${index}` : undefined"
                            :aria-disabled="item.disabled ? 'true' : undefined"
                            @click="handleItemClick(item, index)"
                            @focus="focusedIndex = index"
                        >
                            <MaxIcon
                                v-if="item.icon"
                                :icon="item.icon"
                                :size="item.icon_size ?? '1.2'"
                                class="menu-item-icon"
                                aria-hidden="true"
                                tabindex="-1"
                            />
                            <div class="menu-item-labels">
                                <span class="menu-item-label">{{ item.label }}</span>
                                <span v-if="item.subLabel" class="menu-item-sublabel">{{ item.subLabel }}</span>
                            </div>
                        </div>
                        <MaxIconButton
                            v-else
                            :ref="(el) => setItemRef(el, index)"
                            v-tooltip.bottom="item.tooltip ?? false"
                            role="menuitem"
                            :id="`top-toolbar-item-${index}`"
                            :tabindex="focusedIndex === index && !item.disabled ? 0 : -1"
                            :aria-label="item.ariaLabel || item.label || item.title || (typeof item.tooltip === 'string' ? item.tooltip : undefined) || 'Ação da barra de ferramentas'"
                            :tooltip="typeof item.tooltip === 'string' ? item.tooltip : undefined"
                            :aria-disabled="item.disabled ? 'true' : undefined"
                            :icon="item.icon"
                            light
                            :transparent="true"
                            :route="item.route ?? null"
                            :action="item.action"
                            :data="item.data ?? item.props ?? item.query"
                            class="root"
                            size="1.5"
                            @focus="focusedIndex = index"
                            @click="handleItemClick(item, index)"
                        />
                    </div>

                    <!-- Submenu se houver item.items -->
                    <MaxTopToolbarSubmenu
                        v-if="item.items && item.items.length && activeSubmenu === index"
                        ref="submenuRef"
                        :id="`top-toolbar-submenu-${index}`"
                        :parent-id="`top-toolbar-item-${index}`"
                        class="max-top-toolbar-submenu-root p-menubar-submenu-root"
                        :items="item.items"
                        @keep-open="clearCloseTimer"
                        @schedule-close="scheduleCloseSubmenu"
                        @item-click="handleSubmenuItemClick"
                        @close="onSubmenuClose(index)"
                        @close-all="onSubmenuCloseAll"
                    />
                </li>
            </ul>
        </nav>
    </div>
    <slot name="plus"></slot>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs, onBeforeUnmount, watch, nextTick } from 'vue';
    import { hasContent } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxTopToolbarSubmenu from './MaxTopToolbarSubmenu.vue';
    import { useTopToolbarStore } from '../stores/useTopToolbar.Store';

    const SUBMENU_CLOSE_DELAY_MS = 1000;

    const attrs: any = useAttrs();
    const toolbar = useTopToolbarStore();

    const element_ref = ref();
    const menu_ref = ref();
    const submenuRef = ref<any>(null);
    const activeSubmenu = ref<number | null>(null);
    const focusedIndex = ref<number>(0);
    const itemRefs = ref<Record<number, HTMLElement | null>>({});

    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const showed = computed(() => (attrs.plus === true ? true : toolbar.show));

    const setItemRef = (el: any, index: number) => {
        if (el) itemRefs.value[index] = el.$el ?? el;
        else delete itemRefs.value[index];
    };

    const getNavigableIndices = (): number[] => {
        if (!toolbar.items || !Array.isArray(toolbar.items)) return [];
        return toolbar.items
            .map((item: any, idx: number) => (!item.divider && !item.disabled ? idx : -1))
            .filter((idx: number) => idx !== -1);
    };

    watch(
        () => toolbar.items,
        () => {
            const navigable = getNavigableIndices();
            if (navigable.length > 0 && !navigable.includes(focusedIndex.value)) focusedIndex.value = navigable[0];
        },
        { immediate: true, deep: true }
    );

    const getNextNavigableIndex = (currentIndex: number): number => {
        const indices = getNavigableIndices();
        if (indices.length === 0) return currentIndex;
        const pos = indices.indexOf(currentIndex);
        if (pos === -1) return indices[0];
        return indices[(pos + 1) % indices.length];
    };

    const getPrevNavigableIndex = (currentIndex: number): number => {
        const indices = getNavigableIndices();
        if (indices.length === 0) return currentIndex;
        const pos = indices.indexOf(currentIndex);
        if (pos === -1) return indices[indices.length - 1];
        return indices[(pos - 1 + indices.length) % indices.length];
    };

    const focusItemElement = (index: number): void => {
        focusedIndex.value = index;
        nextTick(() => {
            const el = itemRefs.value[index];
            if (el && typeof el.focus === 'function') el.focus();
        });
    };

    const clearCloseTimer = (): void => {
        if (closeTimer === null) return;
        clearTimeout(closeTimer);
        closeTimer = null;
    };

    const openSubmenu = (index: number): void => {
        clearCloseTimer();
        activeSubmenu.value = index;
        focusedIndex.value = index;
    };

    const scheduleCloseSubmenu = (): void => {
        clearCloseTimer();
        closeTimer = setTimeout(() => {
            activeSubmenu.value = null;
            closeTimer = null;
        }, SUBMENU_CLOSE_DELAY_MS);
    };

    const openSubmenuAndFocusFirst = (index: number): void => {
        clearCloseTimer();
        activeSubmenu.value = index;
        focusedIndex.value = index;
        nextTick(() => {
            if (submenuRef.value?.focusFirstItem) submenuRef.value.focusFirstItem();
        });
    };

    const onSubmenuClose = (index: number): void => {
        activeSubmenu.value = null;
        clearCloseTimer();
        focusItemElement(index);
    };

    const onSubmenuCloseAll = (): void => {
        activeSubmenu.value = null;
        clearCloseTimer();
    };

    onBeforeUnmount(clearCloseTimer);

    /**
     * Tratamento de teclado na barra de menu superior (menubar horizontal):
     * - ArrowRight / ArrowLeft: navega circularmente entre itens da raiz (pula divisores e desabilitados)
     * - Home / End: move para o primeiro / último item navegável
     * - ArrowDown: abre submenu e foca seu primeiro item
     * - Enter / Space: abre submenu ou dispara ação do item
     * - Escape: fecha submenu ativo e retorna foco ao item raiz
     */
    const onMenubarItemKeydown = (event: KeyboardEvent, index: number, item: any): void => {
        switch (event.key) {
            case 'ArrowRight': {
                event.preventDefault();
                clearCloseTimer();
                const nextIdx = getNextNavigableIndex(index);
                focusItemElement(nextIdx);
                break;
            }
            case 'ArrowLeft': {
                event.preventDefault();
                clearCloseTimer();
                const prevIdx = getPrevNavigableIndex(index);
                focusItemElement(prevIdx);
                break;
            }
            case 'Home': {
                event.preventDefault();
                clearCloseTimer();
                const indices = getNavigableIndices();
                if (indices.length > 0) focusItemElement(indices[0]);
                break;
            }
            case 'End': {
                event.preventDefault();
                clearCloseTimer();
                const indices = getNavigableIndices();
                if (indices.length > 0) focusItemElement(indices[indices.length - 1]);
                break;
            }
            case 'ArrowDown': {
                if (item.items && item.items.length) {
                    event.preventDefault();
                    openSubmenuAndFocusFirst(index);
                }
                break;
            }
            case 'Enter':
            case ' ': {
                if (item.disabled) {
                    event.preventDefault();
                    break;
                }
                if (item.items && item.items.length) {
                    event.preventDefault();
                    openSubmenuAndFocusFirst(index);
                } else {
                    event.preventDefault();
                    handleItemClick(item, index);
                }
                break;
            }
            case 'Escape': {
                if (activeSubmenu.value !== null) {
                    event.preventDefault();
                    const closedIdx = activeSubmenu.value;
                    activeSubmenu.value = null;
                    clearCloseTimer();
                    focusItemElement(closedIdx);
                }
                break;
            }
        }
    };

    /**
     * Executa a ação do item: função própria (`action`), callback do PrimeVue
     * (`command`) ou navegação por rota.
     */
    const handleItemClick = (item: any, index?: number): void => {
        if (item?.disabled) return;
        if (index !== undefined) focusedIndex.value = index;
        if (item?.items && item.items.length) {
            if (activeSubmenu.value === index) activeSubmenu.value = null;
            else openSubmenu(index ?? 0);
            return;
        }
        if (typeof item?.action === 'function') item.action();
        else if (typeof item?.command === 'function') item.command({ item });
        else if (item?.route || item?.data) toolbar.route(item.data ?? item.props ?? item.query, item.route);
    };

    const handleSubmenuItemClick = (item: any): void => {
        if (item?.disabled) return;
        activeSubmenu.value = null;
        clearCloseTimer();
        if (typeof item?.action === 'function') item.action();
        else if (typeof item?.command === 'function') item.command({ item });
        else if (item?.route || item?.data) toolbar.route(item.data ?? item.props ?? item.query, item.route);
    };

    defineExpose({
        activeSubmenu,
        focusedIndex,
        openSubmenu,
        scheduleCloseSubmenu,
        clearCloseTimer,
        focusItem: focusItemElement
    });
</script>

<style lang="scss" scoped>
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
            background-color: transparent !important;
            z-index: 1 !important;

            .max-top-toolbar-root-list,
            .p-menubar-root-list {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;

                // ITENS DA BARRA RAIZ (PRIMEIRA CAMADA)
                > .max-top-toolbar-item,
                > .p-menubar-item {
                    position: relative;

                    &:has(.divider-space) {
                        opacity: 0;

                        .max-top-toolbar-item-content,
                        .p-menubar-item-content {
                            padding: 0;
                        }

                        .divider-space {
                            width: 5px !important;
                        }
                    }

                    .max-top-toolbar-item-content,
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
                            display: flex;
                            align-items: center;
                            justify-content: flex-start;
                            gap: 6px;
                            transition: transform 0.3s ease-in-out, color 0.2s ease;
                            color: var(--layout-shell-text-muted, rgb(255 255 255 / 80%)) !important;
                            outline: none;

                            &:hover {
                                color: var(--layout-shell-text, #fff) !important;
                            }

                            &:focus-visible {
                                outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e)); /* Foco canônico */
                                outline-offset: 2px;
                                border-radius: 4px;
                                color: var(--layout-shell-text, #fff) !important;
                            }

                            .menu-item-labels {
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                line-height: 1.1;
                                overflow: hidden;
                                flex: 1;

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

                            .menu-item-chevron {
                                margin-left: auto;
                                opacity: 0.6;
                                font-size: 0.9rem;
                                padding-left: 8px;
                            }
                        }

                        &.max-top-toolbar-item-active,
                        &.p-menubar-item-active {
                            .max-top-toolbar-item-content,
                            .p-menubar-item-content {
                                background-color: transparent !important;
                            }
                        }
                    }

                    &.max-top-toolbar-item-active,
                    &.p-menubar-item-active,
                    &:hover {
                        .max-top-toolbar-item-content,
                        .p-menubar-item-content {
                            background-color: transparent;
                            opacity: 1;
                        }
                    }

                    :deep(.max-top-toolbar-submenu-root),
                    :deep(.p-menubar-submenu-root) {
                        position: absolute;
                        left: unset;
                        right: 100% !important;
                        transform: translateX(100%) translateY(10px) !important;
                        z-index: var(--z-dropdown, 1000) !important;
                    }
                }
            }
        }

        .is-focused,
        .p-focus {
            background-color: transparent !important;

            .max-top-toolbar-item,
            .p-menubar-item {
                background-color: transparent !important;
            }

            .max-top-toolbar-item-content,
            .p-menubar-item-content {
                background-color: transparent !important;
            }
        }
    }

    @media (prefers-reduced-motion: reduce) {
        *,
        ::before,
        ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }
    }
</style>
