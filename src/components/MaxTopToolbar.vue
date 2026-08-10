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
        width: 100%;
        place-items: center start;

        .menu-item-content {
            display: grid;
            gap: 0.5rem;
            grid-auto-flow: column;
            place-items: center;

            .menu-item-labels {
                display: grid;

                .menu-item-sublabel {
                    font-size: 0.75rem;
                    opacity: 0.7;
                }
            }
        }

        .divider-space {
            width: 1px;
            height: 20px;
            background-color: rgb(255 255 255 / 20%);
        }
    }
</style>
