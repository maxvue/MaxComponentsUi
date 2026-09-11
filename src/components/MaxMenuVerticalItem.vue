<template>
    <div
        v-for="(item, index) in props.items"
        :key="item.id ?? index"
        v-tooltip.right="item.details.tooltip"
        :class="`max-menu-vertical-item item_menu ${isActive(item) ? 'active' : ''}`"
        :page_component="item.details.page_component"
        role="link"
        tabindex="0"
        @click="(event) => handleItemClick(item, event)"
        @keydown.enter="(event) => handleItemClick(item, event)"
    >
        <MaxIconButton
            :i="item.details.icon ?? undefined"
            size="1.5"
            :light="!isActive(item)"
            :color="isActive(item) ? 'var(--blue-750)' : undefined"
            :route="item.details.route?.trim() ?? null"
        />
        <svg class="curva cima" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 3000 3000">
            <path d="M-7.07 3007.07c0,-1656.85 1343.15,-3000 3000,-3000l-3000 0 0 3000z" />
        </svg>
        <svg class="curva baixo" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 3000 3000">
            <path d="M-7.07 3007.07c0,-1656.85 1343.15,-3000 3000,-3000l-3000 0 0 3000z" />
        </svg>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';
    import { snakeCase, goToRoute } from '@maxvue/max-use';
    import MaxIconButton from './MaxIconButton.vue';
    import { useSystemStore } from '../stores/useSystem.Store';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';
    import type { SideMenuItem } from '../types/app';

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

    /** Marca o item cujo componente de página ou rotas filhas correspondem à rota atual. */
    const isActive = (item: SideMenuItem): boolean => {
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

        return false;
    };

    const handleItemClick = (item: SideMenuItem, event?: MouseEvent | KeyboardEvent): void => {
        useSearchBarStore().input_value = '';

        // Se o clique originou do botão de ícone interno, deixa o MaxIconButton gerenciar a navegação
        const target = event?.target as HTMLElement | null;
        if (target?.closest('.max-icon-button')) return;

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
