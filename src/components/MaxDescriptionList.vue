<template>
    <dl class="max-description-list" :class="`max-description-list--${props.columns}`">
        <div v-for="item in props.items" :key="item.id" class="max-description-list__item"><dt>{{ item.label }}</dt><dd><slot name="value" :item="item">{{ displayValue(item.value) }}</slot><slot name="actions" :item="item" /></dd></div>
    </dl>
</template>

<script setup lang="ts">
    import type { MaxDescriptionListProps, MaxDescriptionItem } from '../types/descriptionList';

    const props = withDefaults(defineProps<MaxDescriptionListProps>(), { columns: 2, emptyValue: '—' });
    defineSlots<{ value(props: { item: MaxDescriptionItem }): unknown; actions(props: { item: MaxDescriptionItem }): unknown }>();
    function displayValue(value: MaxDescriptionItem['value']): string | number { if (value === false) return 'Não'; if (value === true) return 'Sim'; if (value === null || value === undefined || value === '') return props.emptyValue; return value; }
</script>

<style lang="scss" scoped>
.max-description-list { display: grid; gap: 12px; margin: 0; }
.max-description-list--1 { grid-template-columns: 1fr; }
.max-description-list--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.max-description-list--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.max-description-list__item { min-width: 0; }
dt { color: var(--background-600, #475569); font-size: 12px; }
dd { display: flex; gap: 6px; margin: 2px 0 0; overflow-wrap: anywhere; }

@media (width <= 600px) { .max-description-list--2, .max-description-list--3 { grid-template-columns: 1fr; } }
</style>
