<template>
    <div
        v-for="(item, index) in props.items"
        :key="item.id ?? index"
        v-tooltip.right="item.details.tooltip"
        :class="`max-menu-vertical-item item_menu ${isActive(item) ? 'active' : ''} ${isFlyoutActive(item) ? 'flyout-active' : ''} ${hasSubItems(item) ? 'has-subitems' : ''}`"
        :page_component="item.details.page_component"
        role="link"
        tabindex="0"
        :aria-label="item.details.tooltip || item.details.label || item.details.title || item.details.route || 'Item de menu'"
        :aria-current="isActive(item) ? 'page' : undefined"
        :aria-haspopup="hasSubItems(item) ? 'true' : undefined"
        :aria-expanded="hasSubItems(item) ? isFlyoutActive(item) : undefined"
        @click="(event) => handleItemClick(item, event)"
        @keydown.enter="(event) => handleItemClick(item, event)"
    >
        <MaxIcon
            v-if="item.details.icon"
            :icon="item.details.icon"
            :i="item.details.icon"
            size="1.5"
            :light="isFlyoutActive(item) ? true : !isActive(item)"
            :color="isFlyoutActive(item) ? 'var(--layout-shell-text, #ffffff)' : (isActive(item) ? 'var(--blue-750)' : undefined)"
            aria-hidden="true"
            tabindex="-1"
            class="max-menu-vertical-item-icon"
        />
        <span v-if="hasSubItems(item)" class="subitem-indicator" aria-hidden="true" />
        <svg class="curva cima" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 3000 3000" aria-hidden="true" tabindex="-1">
            <path d="M-7.07 3007.07c0,-1656.85 1343.15,-3000 3000,-3000l-3000 0 0 3000z" />
        </svg>
        <svg class="curva baixo" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 3000 3000" aria-hidden="true" tabindex="-1">
            <path d="M-7.07 3007.07c0,-1656.85 1343.15,-3000 3000,-3000l-3000 0 0 3000z" />
        </svg>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';
    import { snakeCase, goToRoute } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import { useSystemStore } from '../stores/useSystem.Store';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';
    import { hasSubItems, hasActiveSubItem } from '../helpers/menuHelpers';
    import type { SideMenuItem } from '../types/app';

    const props = withDefaults(defineProps<{
        /** Itens renderizados. */
        items: SideMenuItem[];
        /** Centraliza o texto do item. */
        textCenter?: boolean;
        /** Identificador do item atualmente aberto no flyout. */
        activeFlyoutId?: string | null;
    }>(), {
        textCenter: false,
        activeFlyoutId: null
    });

    const emit = defineEmits<{
        itemClick: [item: SideMenuItem, event?: MouseEvent | KeyboardEvent];
        openSubmenu: [item: SideMenuItem];
    }>();

    const system = useSystemStore();
    const route = useRoute();

    /** Mapa de rotas filhas/subpáginas que mantêm o menu pai ativo. */
    const ROUTE_MATCHES: Record<string, string[]> = {
        commercial_proposals: ['commercial_proposal_detail', 'proposals', 'proposal_public_view'],
        proposals: ['commercial_proposals', 'commercial_proposal_detail', 'proposal_public_view'],
        solar_company_projects: ['integrador_client_show', 'integrador_projects', 'integrador_inspections', 'integrador_approved', 'integrador_finished', 'integrador_clients'],
        board: ['project', 'planner_card']
    };

    /** Nome da página/rota atual, priorizando o useRoute reativo local com fallback na store. */
    const currentPage = computed<string>(() => {
        return String(route?.name || system.page || '');
    });

    /** Verifica se o flyout para este item específico está aberto. */
    const isFlyoutActive = (item: SideMenuItem): boolean => {
        const activeSubmenu = system.active_side_submenu;
        const activeId = props.activeFlyoutId || (activeSubmenu ? (activeSubmenu.id || activeSubmenu.details?.page_component || activeSubmenu.details?.route) : null);
        if (!activeId) return false;
        const id = item.id || item.details?.page_component || item.details?.route;
        return id === activeId;
    };

    /** Marca o item cujo componente de página ou rotas filhas correspondem à rota atual. */
    const isActive = (item: SideMenuItem): boolean => {
        if (isFlyoutActive(item)) return true;

        const current = currentPage.value;
        if (!current) return false;

        const pageComponent = snakeCase(item.details.page_component ?? '');
        const itemRoute = snakeCase(item.details.route ?? '');

        // 1. Correspondência exata pelo page_component ou pela route
        if (pageComponent === current || itemRoute === current) return true;

        // 2. Correspondência declarada explicitamente no item (matches)
        const customMatches: string[] = (item.details as any)?.matches || (item as any)?.matches || [];
        if (customMatches.includes(current)) return true;

        // 3. Correspondência pelo mapa padrão de rotas filhas
        const knownMatches = ROUTE_MATCHES[pageComponent] || ROUTE_MATCHES[itemRoute];
        if (knownMatches?.includes(current)) return true;

        // 4. Correspondência se algum subitem estiver ativo
        if (hasActiveSubItem(item, current)) return true;

        return false;
    };

    const handleItemClick = (item: SideMenuItem, event?: MouseEvent | KeyboardEvent): void => {
        emit('itemClick', item, event);

        if (hasSubItems(item)) {
            emit('openSubmenu', item);
            return;
        }

        useSearchBarStore().input_value = '';

        const targetRoute = item.details.route?.trim();
        if (targetRoute) goToRoute(targetRoute);
    };
</script>

<style lang="scss" scoped>
    .item_menu {
        display: grid;
        width: 100%;
        height: 2.7rem;
        cursor: pointer;
        place-items: center;

        a {
            position: relative;
            display: grid;
            gap: 1rem;
            width: 100%;
            height: 100%;
            grid-template-columns: 1fr;
            color: var(--background-700);
            transition: color 0.3s ease;
            place-items: center;

            &:focus:not(:focus-visible) {
                outline: none;
            }

            &:focus-visible {
                outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
                outline-offset: -2px;
            }

            &:hover {
                color: var(--blue-100);
            }

            .item-text {
                display: none;
                color: var(--layout-shell-text, #fff);
            }
        }

        .curva {
            display: none;
        }

        .subitem-indicator {
            position: absolute;
            right: 3px;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 10px;
            border-radius: 2px;
            background-color: var(--blue-200);
            opacity: 0.6;
            transition: opacity 0.2s ease, background-color 0.2s ease;
            z-index: 2;
        }

        &.active {
            position: relative;

            a {
                color: var(--layout-shell-text, #fff);
            }

            :deep(.max-icon-div),
            :deep(.max-icon) {
                z-index: 1;
                color: var(--blue-750) !important;

                svg {
                    color: var(--blue-200) !important;
                    fill: currentcolor;
                }

                &:hover {
                    color: var(--blue-0, #fff) !important;

                    svg {
                        color: var(--blue-0, #fff) !important;
                    }
                }
            }

            .curva {
                display: block;
                position: absolute;
                fill: var(--layout-content-frame-bg, #004860);

                &.cima {
                    top: -20px;
                    right: 0;
                    transform: rotate(180deg);
                    fill: var(--layout-content-frame-bg, #004860);
                }

                &.baixo {
                    right: 0;
                    bottom: -20px;
                    transform: rotate(90deg);
                    fill: var(--layout-content-frame-bg, #004860);
                }

                &.baixo2 {
                    bottom: 0;
                    transform: rotate(90deg);
                }
            }

            &::before {
                content: '';
                position: absolute;
                left: 5px;
                width: calc(100% - 5px);
                height: 100%;
                border-radius: 10px 0 0 10px;
                background-color: var(--layout-content-frame-bg, #004860);
                z-index: 0;
            }
        }

        &.flyout-active {
            a {
                color: var(--layout-shell-text, #fff) !important;
            }

            .item-text {
                color: var(--layout-shell-text, #fff) !important;
            }

            :deep(.max-icon-div),
            :deep(.max-icon) {
                z-index: 1;
                color: var(--layout-shell-text, #fff) !important;

                svg {
                    color: var(--layout-shell-text, #fff) !important;
                    fill: currentcolor;
                }

                &:hover {
                    color: var(--blue-0, #fff) !important;

                    svg {
                        color: var(--blue-0, #fff) !important;
                    }
                }
            }

            .subitem-indicator {
                background-color: var(--blue-0, #fff);
                opacity: 1;
            }
        }

        &:not(.active) {
            position: relative;

            :deep(.max-icon-div),
            :deep(.max-icon) {
                z-index: 1;
                color: var(--blue-200) !important;
                opacity: 0.7;
                transition: opacity 0.3s ease;

                &:hover {
                    opacity: 1;
                }
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
