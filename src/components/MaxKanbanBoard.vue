<template>
    <section class="max-kanban-board" :aria-label="props.label">
        <article v-for="column in props.columns" :key="column.id" class="max-kanban-board__column">
            <header><slot name="column-header" :column="column"><h3>{{ column.title }} <span>{{ column.total ?? column.items.length }}</span></h3></slot><MaxIconButton :icon="isCollapsed(column.id) ? 'lucide:chevron-down' : 'lucide:chevron-up'" :aria-label="`${isCollapsed(column.id) ? 'Expandir' : 'Recolher'} ${column.title}`" :aria-expanded="!isCollapsed(column.id)" :aria-controls="`kanban-${column.id}`" @click="emit('toggle-column', column.id)" /></header>
            <div v-if="!isCollapsed(column.id)" :id="`kanban-${column.id}`" class="max-kanban-board__items"><MaxCard v-for="item in column.items" :key="item.id" clickable :disabled="item.disabled" @click="emit('item-click', { columnId: column.id, itemId: item.id })"><template #body><slot name="item" :column-id="column.id" :item="item"><strong>{{ item.title }}</strong><span v-if="item.description">{{ item.description }}</span></slot></template></MaxCard><slot v-if="!column.items.length" name="empty-column" :column="column">Coluna vazia</slot></div>
        </article>
    </section>
</template>

<script setup lang="ts">
    import MaxIconButton from './MaxIconButton.vue';
    import MaxCard from './MaxCard.vue';
    import type { MaxKanbanBoardProps } from '../types/kanbanBoard';

    const props = withDefaults(defineProps<MaxKanbanBoardProps>(), { collapsedColumnIds: () => [], label: 'Quadro de acompanhamento' });
    const emit = defineEmits<{ 'toggle-column': [columnId: string]; 'item-click': [payload: { columnId: string; itemId: string }] }>();
    defineSlots<{ 'column-header'(props: { column: MaxKanbanBoardProps['columns'][number] }): unknown; item(props: { columnId: string; item: MaxKanbanBoardProps['columns'][number]['items'][number] }): unknown; 'empty-column'(props: { column: MaxKanbanBoardProps['columns'][number] }): unknown }>();
    function isCollapsed(id: string): boolean { return props.collapsedColumnIds.includes(id); }
</script>

<style lang="scss" scoped>
.max-kanban-board { display: flex; align-items: flex-start; gap: 12px; overflow-x: auto; padding: 4px; }
.max-kanban-board__column { flex: 0 0 min(280px, 85vw); padding: 10px; border-radius: 8px; background: var(--background-100, #f1f5f9); }
.max-kanban-board__column > header { display: flex; justify-content: space-between; align-items: center; }
.max-kanban-board__items { display: grid; gap: 8px; margin-top: 10px; }
.max-kanban-board__items :deep(.max-card) { padding: 10px; }
.max-kanban-board :deep(.max-card:focus-visible), .max-kanban-board button:focus-visible { outline: var(--max-focus-outline); outline-offset: 2px; }
</style>
