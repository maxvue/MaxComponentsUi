<template>
    <ul
        class="max-top-toolbar-submenu p-menubar-submenu"
        role="menu"
        :id="props.id"
        :aria-labelledby="props.parentId"
        @mouseenter="emit('keep-open')"
        @mouseleave="emit('schedule-close')"
    >
        <li
            v-for="(item, index) in props.items"
            :key="index"
            class="submenu-item p-menubar-item"
            :class="{ 'has-nested': hasChildren(item), 'is-active': activeSubmenu === index, 'is-disabled': item.disabled }"
            role="none"
            @mouseenter="onItemEnter(index, item)"
            @mouseleave="emit('schedule-close')"
        >
            <div class="submenu-item-content p-menubar-item-content">
                <div v-if="item.divider" class="divider-space" role="separator"></div>
                <div
                    v-else-if="hasContent(item.label)"
                    :ref="(el) => setItemRef(el, index)"
                    class="menu-item-content"
                    :class="{ 'has-children': hasChildren(item), 'is-disabled': item.disabled, 'is-focused': focusedIndex === index }"
                    role="menuitem"
                    :id="getItemId(index)"
                    :tabindex="focusedIndex === index && !item.disabled ? 0 : -1"
                    :aria-haspopup="hasChildren(item) ? 'menu' : undefined"
                    :aria-expanded="hasChildren(item) ? (activeSubmenu === index ? 'true' : 'false') : undefined"
                    :aria-controls="hasChildren(item) ? getSubmenuId(index) : undefined"
                    :aria-disabled="item.disabled ? 'true' : undefined"
                    @click="onItemClick(item, index)"
                    @focus="focusedIndex = index"
                    @keydown="onSubmenuItemKeydown($event, index, item)"
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
                    <MaxIcon
                        v-if="hasChildren(item)"
                        icon="lucide:chevron-right"
                        class="menu-item-chevron"
                        aria-hidden="true"
                        tabindex="-1"
                    />
                </div>
                <MaxIconButton
                    v-else
                    :ref="(el) => setItemRef(el, index)"
                    v-tooltip.bottom="item.tooltip ?? false"
                    role="menuitem"
                    :id="getItemId(index)"
                    :tabindex="focusedIndex === index && !item.disabled ? 0 : -1"
                    :aria-label="item.ariaLabel || item.label || item.title || (typeof item.tooltip === 'string' ? item.tooltip : 'Opção')"
                    :aria-disabled="item.disabled ? 'true' : undefined"
                    :icon="item.icon"
                    :transparent="true"
                    :route="item.route ?? null"
                    :action="item.action"
                    :data="item.data ?? item.props ?? item.query"
                    size="1.5"
                    @focus="focusedIndex = index"
                    @click="onItemClick(item, index)"
                    @keydown="onSubmenuItemKeydown($event, index, item)"
                />
            </div>

            <!-- Submenu recursivo aninhado -->
            <MaxTopToolbarSubmenu
                v-if="hasChildren(item) && activeSubmenu === index"
                :ref="(el) => setNestedSubmenuRef(el, index)"
                :id="getSubmenuId(index)"
                :parent-id="getItemId(index)"
                :level="props.level + 1"
                :items="item.items ?? []"
                class="max-top-toolbar-submenu-nested p-menubar-submenu-nested"
                @keep-open="emit('keep-open')"
                @schedule-close="emit('schedule-close')"
                @item-click="emit('item-click', $event)"
                @close="onNestedSubmenuClose(index)"
                @close-all="emit('close-all')"
            />
        </li>
    </ul>
</template>

<script setup lang="ts">
    import { ref, watch, nextTick } from 'vue';
    import { hasContent } from '@maxvue/max-use';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxIcon from './MaxIcon.vue';

    defineOptions({
        name: 'MaxTopToolbarSubmenu'
    });

    export interface MaxTopToolbarSubmenuItem {
        label?: string;
        subLabel?: string;
        ariaLabel?: string;
        title?: string;
        icon?: string;
        icon_size?: number | string;
        divider?: boolean;
        disabled?: boolean;
        tooltip?: string | boolean;
        route?: string | null;
        action?: ((...args: any[]) => void);
        command?: ((event: { item: any }) => void);
        data?: any;
        props?: any;
        query?: any;
        items?: MaxTopToolbarSubmenuItem[];
    }

    const props = withDefaults(
        defineProps<{
            items: MaxTopToolbarSubmenuItem[];
            id?: string;
            parentId?: string;
            level?: number;
        }>(),
        {
            items: () => [],
            level: 1
        }
    );

    const emit = defineEmits<{
        'keep-open': [];
        'schedule-close': [];
        'item-click': [item: MaxTopToolbarSubmenuItem];
        'close': [];
        'close-all': [];
    }>();

    const activeSubmenu = ref<number | null>(null);
    const focusedIndex = ref<number>(0);
    const itemRefs = ref<Record<number, HTMLElement | null>>({});
    const nestedSubmenuRefs = ref<Record<number, any>>({});

    const setItemRef = (el: any, index: number) => {
        if (el) itemRefs.value[index] = el.$el ?? el;
        else delete itemRefs.value[index];
    };

    const setNestedSubmenuRef = (el: any, index: number) => {
        if (el) nestedSubmenuRefs.value[index] = el;
        else delete nestedSubmenuRefs.value[index];
    };

    const hasChildren = (item: MaxTopToolbarSubmenuItem): boolean => Array.isArray(item?.items) && item.items.length > 0;

    const getItemId = (index: number): string => {
        return props.id ? `${props.id}-item-${index}` : `toolbar-submenu-item-${index}`;
    };

    const getSubmenuId = (index: number): string => {
        return props.id ? `${props.id}-nested-${index}` : `toolbar-submenu-nested-${index}`;
    };

    const getNavigableIndices = (): number[] => {
        if (!props.items || !Array.isArray(props.items)) return [];
        return props.items
            .map((item, idx) => (!item.divider && !item.disabled ? idx : -1))
            .filter((idx) => idx !== -1);
    };

    watch(
        () => props.items,
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

    const focusFirstItem = (): void => {
        const indices = getNavigableIndices();
        if (indices.length > 0) focusItemElement(indices[0]);
    };

    const focusLastItem = (): void => {
        const indices = getNavigableIndices();
        if (indices.length > 0) focusItemElement(indices[indices.length - 1]);
    };

    const onItemEnter = (index: number, item: MaxTopToolbarSubmenuItem): void => {
        emit('keep-open');
        focusedIndex.value = index;
        if (hasChildren(item)) activeSubmenu.value = index;
        else activeSubmenu.value = null;
    };

    const onItemClick = (item: MaxTopToolbarSubmenuItem, index?: number): void => {
        if (item.disabled) return;
        if (index !== undefined) focusedIndex.value = index;
        if (hasChildren(item)) {
            if (activeSubmenu.value === index) activeSubmenu.value = null;
            else activeSubmenu.value = index ?? 0;
            return;
        }
        emit('item-click', item);
    };

    const openNestedSubmenuAndFocusFirst = (index: number): void => {
        activeSubmenu.value = index;
        focusedIndex.value = index;
        nextTick(() => {
            if (nestedSubmenuRefs.value[index]?.focusFirstItem) nestedSubmenuRefs.value[index].focusFirstItem();
        });
    };

    const onNestedSubmenuClose = (index: number): void => {
        activeSubmenu.value = null;
        focusItemElement(index);
    };

    const onSubmenuItemKeydown = (event: KeyboardEvent, index: number, item: MaxTopToolbarSubmenuItem): void => {
        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                const nextIdx = getNextNavigableIndex(index);
                focusItemElement(nextIdx);
                break;
            }
            case 'ArrowUp': {
                event.preventDefault();
                const prevIdx = getPrevNavigableIndex(index);
                focusItemElement(prevIdx);
                break;
            }
            case 'Home': {
                event.preventDefault();
                focusFirstItem();
                break;
            }
            case 'End': {
                event.preventDefault();
                focusLastItem();
                break;
            }
            case 'ArrowRight': {
                if (hasChildren(item) && !item.disabled) {
                    event.preventDefault();
                    openNestedSubmenuAndFocusFirst(index);
                }
                break;
            }
            case 'ArrowLeft':
            case 'Escape': {
                event.preventDefault();
                emit('close');
                break;
            }
            case 'Enter':
            case ' ': {
                if (item.disabled) {
                    event.preventDefault();
                    break;
                }
                event.preventDefault();
                if (hasChildren(item)) openNestedSubmenuAndFocusFirst(index);
                else onItemClick(item, index);
                break;
            }
            case 'Tab': {
                emit('close-all');
                break;
            }
        }
    };

    defineExpose({
        focusFirstItem,
        focusLastItem,
        focusItem: focusItemElement,
        activeSubmenu,
        focusedIndex
    });
</script>

<style lang="scss" scoped>
.max-top-toolbar-submenu {
    list-style: none;
    margin: 0;
    padding: 4px;
    min-width: 180px;
    width: max-content;
    background: var(--background-0, #fff);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -1px rgb(0 0 0 / 6%);
    display: flex;
    flex-direction: column;
    gap: 2px;

    .submenu-item {
        position: relative;
        border-radius: 4px;

        &.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        &:hover,
        &.is-active,
        &.is-focused {
            background-color: var(--background-100, #f1f5f9);

            .submenu-item-content .menu-item-content {
                color: var(--background-800, #1e293b);
            }
        }

        .submenu-item-content {
            width: 100%;

            .divider-space {
                height: 1px;
                background-color: var(--surface-border);
                margin: 4px 0;
            }

            .menu-item-content {
                outline: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 6px 10px;
                color: var(--background-700, #334155);
                font-size: 0.875rem;
                transition: background-color 0.16s ease, color 0.16s ease;

                &:focus-visible {
                    outline: 2px solid var(--max-primary-500, #00768e);
                    outline-offset: -2px;
                    border-radius: 4px;
                }

                &.is-disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    pointer-events: none;
                }

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

        .max-top-toolbar-submenu-nested {
            position: absolute;
            left: 100% !important;
            right: unset !important;
            top: 0 !important;
            transform: translateX(8px) !important;
            z-index: var(--max-layer-dropdown, 1000) !important;
        }
    }
}
</style>
