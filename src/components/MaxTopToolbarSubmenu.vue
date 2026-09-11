<template>
    <ul class="max-top-toolbar-submenu p-menubar-submenu" role="menu" @mouseenter="emit('keep-open')" @mouseleave="emit('schedule-close')">
        <li
            v-for="(item, index) in props.items"
            :key="index"
            class="p-menubar-item"
            :class="{ 'has-nested': hasChildren(item), 'is-active': activeSubmenu === index }"
            role="none"
            @mouseenter="onItemEnter(index, item)"
            @mouseleave="emit('schedule-close')"
        >
            <div class="p-menubar-item-content">
                <div v-if="item.divider" class="divider-space"></div>
                <div
                    v-else-if="hasContent(item.label)"
                    class="menu-item-content"
                    :class="{ 'has-children': hasChildren(item) }"
                    @click="onItemClick(item)"
                >
                    <MaxIconButton v-if="item.icon" :icon="item.icon" :size="item.icon_size" transparent />
                    <div class="menu-item-labels">
                        <span class="menu-item-label">{{ item.label }}</span>
                        <span v-if="item.subLabel" class="menu-item-sublabel">{{ item.subLabel }}</span>
                    </div>
                    <MaxIcon v-if="hasChildren(item)" icon="lucide:chevron-right" class="menu-item-chevron" />
                </div>
                <MaxIconButton
                    v-else
                    v-tooltip.bottom="item.tooltip ?? false"
                    :icon="item.icon"
                    transparent
                    :route="item.route ?? null"
                    :action="item.action"
                    :data="item.data ?? item.props ?? item.query"
                    size="1.5"
                />
            </div>

            <!-- Submenu recursivo aninhado -->
            <MaxTopToolbarSubmenu
                v-if="hasChildren(item) && activeSubmenu === index"
                :items="item.items"
                class="p-menubar-submenu-nested"
                @keep-open="emit('keep-open')"
                @schedule-close="emit('schedule-close')"
                @item-click="emit('item-click', $event)"
            />
        </li>
    </ul>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { hasContent } from '@maxvue/max-use';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxIcon from './MaxIcon.vue';

    defineOptions({
        name: 'MaxTopToolbarSubmenu'
    });

    const props = defineProps<{
        items: any[];
    }>();

    const emit = defineEmits<{
        (e: 'keep-open'): void;
        (e: 'schedule-close'): void;
        (e: 'item-click', item: any): void;
    }>();

    const activeSubmenu = ref<number | null>(null);

    const hasChildren = (item: any): boolean => Array.isArray(item?.items) && item.items.length > 0;

    const onItemEnter = (index: number, item: any): void => {
        emit('keep-open');
        if (hasChildren(item)) activeSubmenu.value = index;
        else activeSubmenu.value = null;

    };

    const onItemClick = (item: any): void => {
        emit('item-click', item);
    };
</script>

<style lang="scss" scoped>
.max-top-toolbar-submenu {
    list-style: none;
    margin: 0;
    padding: 4px;
    min-width: 180px;
    width: max-content;
    background: var(--background-0, #fff);
    border: 1px solid var(--surface-border, #e2e8f0);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    display: flex;
    flex-direction: column;
    gap: 2px;

    .p-menubar-item {
        position: relative;
        border-radius: 4px;

        &:hover,
        &.is-active {
            background-color: var(--background-100, #f1f5f9);

            .p-menubar-item-content .menu-item-content {
                color: var(--background-800, #1e293b);
            }
        }

        .p-menubar-item-content {
            width: 100%;

            .divider-space {
                height: 1px;
                background-color: var(--surface-border, #e2e8f0);
                margin: 4px 0;
            }

            .menu-item-content {
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 6px 10px;
                color: var(--background-700, #334155);
                font-size: 0.875rem;
                transition: background-color 0.16s ease, color 0.16s ease;

                :deep(.max-icon-div) {
                    color: currentcolor !important;
                }

                .menu-item-labels {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    line-height: 1.2;
                    overflow: hidden;
                    flex: 1;

                    .menu-item-label {
                        font-size: 0.875rem;
                        font-weight: 500;
                        white-space: nowrap;
                        color: inherit;
                    }

                    .menu-item-sublabel {
                        font-size: 0.72rem;
                        white-space: nowrap;
                        opacity: 0.75;
                        color: var(--background-500, #64748b);
                    }
                }

                .menu-item-chevron {
                    margin-left: auto;
                    margin-right: 10px;
                    opacity: 0.6;
                    font-size: 0.875rem;
                    padding-left: 8px;
                    color: inherit;
                }
            }
        }

        .p-menubar-submenu-nested {
            position: absolute;
            left: 100% !important;
            right: unset !important;
            top: 0 !important;
            transform: translateX(8px) !important;
            z-index: 100000 !important;
        }
    }
}
</style>
