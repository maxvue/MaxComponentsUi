<template>
    <div class="max-tag-list" v-bind="attrs">
        <div v-for="item in items_array" >
            <MaxTagSelect flex :modelValue="item.value" :options="getOptions(item)" no-dropdown uppercase >
                <template #btn-right>
                    <div style="opacity: 0.4;" v-tooltip="'Remover'">
                        <MaxIconButton i="mynaui:x-circle" size="1.3"/>
                    </div>
                </template>
            </MaxTagSelect>
            <!-- {{ item }} -->
        </div>
    </div>
</template>


<script setup lang="ts">
    import { ref, computed, watch, useAttrs, Ref } from 'vue';
    import { getColorFromVar, contrastColor, isBlank, watchDebounced } from '@maxvue/max-use';
    import MaxGrid from './MaxGrid.vue';
    import MaxTagSelect from './MaxTagSelect.vue';
    import MaxIconButton from './MaxIconButton.vue';

    const attrs = useAttrs();

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

        .tag-value-text {
            padding: 0 0 0 30px !important;
        }
    }
</style>
