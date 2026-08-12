<template>
    <div v-if="showed && hasContent(toolbar.items)" ref="element_ref" :class="`tool-bar-top-main-div ${attrs.plus === true ? 'onlyOne' : ''}`">
        <Menubar ref="menu_ref" :model="toolbar.items" class="menu_bar_project_top">
            <template #item="{ item, root, label }">
                <div v-if="item.divider" class="divider-space"></div>
                <div v-else-if="hasContent(label)" pointer w-flex class="menu-item-content" :class="{ root: root }" @click="handleItemClick(item)">
                    <MaxIconButton v-if="item.icon" :icon="item.icon" :size="item.icon_size" transparent />
                    <div class="menu-item-labels">
                        <span class="menu-item-label">{{ label }}</span>
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
                    :class="`${root ? 'root' : ''}`"
                    size="1.5"
                />
            </template>
        </Menubar>
    </div>
    <slot name="plus"></slot>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs } from 'vue';
    import { hasContent } from '@maxvue/max-use';
    import Menubar from 'primevue/menubar';
    import MaxIconButton from './MaxIconButton.vue';
    import { useTopToolbarStore } from '../stores/useTopToolbar.Store';

    const attrs: any = useAttrs();
    const toolbar = useTopToolbarStore();

    const element_ref = ref();
    const menu_ref = ref();

    const showed = computed(() => (attrs.plus === true ? true : toolbar.show));

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

            // O preset padrão do PrimeVue desenha borda clara e cantos
            // arredondados no menubar, pensados para fundo claro. Aqui a barra
            // fica sobre o topo escuro, então a moldura é removida.
            border: none !important;
            border-radius: 0 !important;
            background-color: var(--blue-850) !important;
            z-index: 1 !important;

            .p-menubar-root-list {
                display: flex;

                // TODOS ITEMS
                .p-menubar-item {
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
                        left: unset;
                        right: 100% !important;
                        transform: translateX(100%) translateY(10px) !important;
                        color: var(--red-600) !important;
                        width: max-content !important;
                        position: absolute;
                        z-index: 99999 !important;

                        .p-menubar-submenu {
                            left: unset !important;
                            right: 0 !important;
                            width: max-content !important;
                            transform: translateX(calc(100% + 10px)) translateY(6px) !important;
                            position: absolute;
                            overflow: visible;
                            z-index: 99999 !important;

                            &::after {
                                content: '';
                                position: absolute;
                                top: 7px;
                                left: -8px;
                                width: 8px;
                                height: 12px;
                                border-bottom: 1px solid var(--primary-200);
                                border-top: 1px solid var(--primary-200);
                                border-left: 3px solid var(--background-0);
                                border-right: 3px solid var(--background-0);
                                background: var(--primary-0) !important;
                            }
                        }

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

                // DEFINIÇÕES PARA BARRA DE MENUS (PRIMEIRA CAMADA DE ITENS);
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
