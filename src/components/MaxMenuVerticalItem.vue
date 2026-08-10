<template>
    <div
        v-for="(item, index) in props.items"
        :key="item.id ?? index"
        v-tooltip.right="item.details.tooltip"
        :class="`item_menu ${isActive(item) ? 'active' : ''}`"
        :page_component="item.details.page_component"
        @click="clearSearch"
    >
        <MaxIconButton :i="item.details.icon ?? undefined" size="1.5" light :route="item.details.route?.trim() ?? null" />
        <svg class="curva cima" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 3000 3000">
            <path d="M-7.07 3007.07c0,-1656.85 1343.15,-3000 3000,-3000l-3000 0 0 3000z" />
        </svg>
        <svg class="curva baixo" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 3000 3000">
            <path d="M-7.07 3007.07c0,-1656.85 1343.15,-3000 3000,-3000l-3000 0 0 3000z" />
        </svg>
    </div>
</template>

<script setup lang="ts">
    import { snakeCase } from '@maxvue/max-use';
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

    /** Marca o item cujo componente de página corresponde à rota atual. */
    const isActive = (item: SideMenuItem): boolean => snakeCase(item.details.page_component ?? '') === system.page;

    const clearSearch = (): void => {
        useSearchBarStore().input_value = '';
    };
</script>

<style lang="scss">
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
            color: var(--text-250);
            transition: color 0.3s ease;
            place-items: center;

            &:hover {
                color: var(--blue-525);
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

            .max-icon-div {
                z-index: 1;

                &:hover {
                    color: var(--blue-750) !important;
                }
            }

            .curva {
                display: block;
                position: absolute;
                fill: var(--blue-825);

                &.cima {
                    top: -20px;
                    right: 0;
                    transform: rotate(180deg);
                    fill: var(--blue-825);
                }

                &.baixo {
                    right: 0;
                    bottom: -20px;
                    transform: rotate(90deg);
                    fill: var(--blue-825);
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
                background-color: var(--blue-825);
                z-index: 0;
            }
        }
    }
</style>
