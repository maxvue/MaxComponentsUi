<template>
    <MaxGrid class="max-tag-list">
        <div v-for="item in items_array">
            <MaxTagSelect :modelValue="item.value" :options="getOptions(item)" />
            {{ item }}
        </div>
    </MaxGrid>
</template>


<script setup lang="ts">
    import { ref, computed, watch, useAttrs, Ref } from 'vue';
    import { getColorFromVar, contrastColor, isBlank, watchDebounced } from '@maxvue/max-use';
    import MaxGrid from './MaxGrid.vue';
    import MaxTagSelect from './MaxTagSelect.vue';

    const props = withDefaults(defineProps<{
        list: any[] | Record<string, any>;
        options: any[] | Record<string, any>;
    }>(),{ list: () => [], options: () => [] });

    const items_array = computed(() => {
        if (Array.isArray(props.list)) return props.list;

        return Object.values(props.list);
    });

    const getOptions = (item: any): any[] => {
        const options = item.options ?? props.options;
        if (Array.isArray(options)) return options;
        return Object.values(options);
    };


</script>

<style lang="scss">
.max-tag-list {
    display: flex;
}
</style>
