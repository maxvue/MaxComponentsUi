<template>
    <ul class="p-menubar-submenu" role="menu" @mouseenter="emit('keep-open')" @mouseleave="emit('schedule-close')">
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
                    pointer
                    w-flex
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
                    light
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
