<template>
    <div
        v-for="(item, index) in props.items"
        :key="item.id ?? index"
        v-tooltip.right="resolveTooltip(item)"
        :class="`max-menu-vertical-item item_menu ${isActive(item) ? 'active' : ''}`"
        :page_component="item.details?.page_component"
        role="link"
        tabindex="0"
        :aria-label="resolveLabel(item)"
        :aria-current="isActive(item) ? 'page' : undefined"
        @click="(event) => handleItemClick(item, event)"
        @keydown.enter="(event) => handleItemClick(item, event)"
        @keydown.space.prevent="(event) => handleItemClick(item, event)"
    >
        <MaxIcon
            v-if="item.details?.icon"
            :icon="item.details.icon"
            :i="item.details.icon"
            size="1.5"
            :light="!isActive(item)"
            :color="isActive(item) ? 'var(--blue-750)' : undefined"
            aria-hidden="true"
            tabindex="-1"
            class="max-menu-vertical-item-icon"
        />
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
    import { goToRoute } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import { useSystemStore } from '../stores/useSystem.Store';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';
    import type { SideMenuItem } from '../types/app';
    import { isMenuRouteActive } from '../helpers/menuRouteMatches';

    const props = withDefaults(defineProps<{
        /** Itens renderizados. */
        items: SideMenuItem[];
        /** Centraliza o texto do item. */
        textCenter?: boolean;
    }>(), {
        textCenter: false
    });

    const system = useSystemStore();
    const route = useRoute();

    /** Nome da página/rota atual, priorizando o useRoute reativo local com fallback na store. */
    const currentPage = computed<string>(() => {
        return String(route?.name || system.page || '');
    });

    /** Marca o item cujo componente de página ou rotas filhas correspondem à rota atual. */
    const isActive = (item: SideMenuItem): boolean => {
        return isMenuRouteActive(item, currentPage.value);
    };

    /** Resolve o texto do tooltip dando prioridade a details.tooltip e fallback para title raiz ou details.title */
    const resolveTooltip = (item: SideMenuItem): string => {
        const raw = item.details?.tooltip ?? item.title ?? item.details?.title ?? item.details?.label;
        return typeof raw === 'string' ? raw.trim() : '';
    };

    /** Resolve o rótulo acessível específico, rejeitando string vazia */
    const resolveLabel = (item: SideMenuItem): string => {
        const tooltip = resolveTooltip(item);
        if (tooltip) return tooltip;

        const raw = item.details?.route ?? 'Item de menu';
        return typeof raw === 'string' && raw.trim() ? raw.trim() : 'Item de menu';
    };

    const handleItemClick = (item: SideMenuItem, _event?: MouseEvent | KeyboardEvent): void => {
        useSearchBarStore().input_value = '';

        const targetRoute = item.details?.route?.trim();
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
            }
        }

        .curva {
            display: none;
        }


        &.active {
            position: relative;

            :deep(.max-icon-div),
            :deep(.max-icon) {
                z-index: 1;
                color: var(--blue-750) !important;

                svg {
                    color: var(--blue-200) !important;
                    fill: currentcolor;
                }

                &:hover {
                    color: var(--blue-0) !important;

                    svg {
                        color: var(--blue-0) !important;
                    }
                }
            }

            .curva {
                display: block;
                position: absolute;
                fill: var(--blue-800);

                &.cima {
                    top: -20px;
                    right: 0;
                    transform: rotate(180deg);
                    fill: var(--blue-800);
                }

                &.baixo {
                    right: 0;
                    bottom: -20px;
                    transform: rotate(90deg);
                    fill: var(--blue-800);
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
                background-color: var(--blue-800);
                z-index: 0;
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
</style>
