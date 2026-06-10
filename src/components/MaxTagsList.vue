<template>
    <div class="max-tag-list" v-bind="attrs">
        <div v-for="item in items_array" >
            <MaxTagSelect flex :modelValue="item.value" :options="options_array" no-dropdown uppercase >
                <template #btn-right>
                    <div v-tooltip="'Remover'" style="opacity: 0.5;" @click.stop="removeItem(item)">
                        <MaxIconButton i="mynaui:x-circle" size="1.3" :color="getStyleColor(item, false, true).color"/>
                    </div>
                </template>
            </MaxTagSelect>
        </div>
        <div>
            <MaxTagSelect v-model="add_tag" :options="options_array" is-button  icon="fluent:tag-add-20-regular" icon-size="2" />
        </div>
    </div>
</template>


<script setup lang="ts">
    import { ref, computed, watch, useAttrs, Ref } from 'vue';
    import { getColorFromVar, contrastColor } from '@maxvue/max-use';
    import MaxTagSelect from './MaxTagSelect.vue';
    import MaxIconButton from './MaxIconButton.vue';

    const attrs = useAttrs();

    const props = withDefaults(defineProps<{
        list: any[] | Record<string, any>;
        options: any[] | Record<string, any>;
    }>(),{ list: () => [], options: () => [] });

    const emit = defineEmits<{
        remove: [item: any];
    }>();

    const add_tag: Ref = ref(null);

    const new_items = ref<any[]>([]);
    const items_array = computed(() =>{
        const values = Array.isArray(props.list) ? props.list : Object.values(props.list);
        return [...values, ...new_items.value];
    } );

    const options_array = computed(() =>{
        const values = Array.isArray(props.options) ? props.options : Object.values(props.options);
        return [...values];
    } );

    const count = computed(() => items_array.value.length);

    defineExpose({ count });


    watch(add_tag, () => {
        if (add_tag.value) {

            const data: any[] | null = options_array.value.find((opt: any) => opt.value === add_tag || opt.value === add_tag.value) ?? null;
            if (data) new_items.value.push(data);

            add_tag.value = null;
        }
    });

    const removeItem = (item: any) => {
        const index = new_items.value.indexOf(item);
        if (index !== -1) new_items.value.splice(index, 1);
        else emit('remove', item);
    };

    const getColorString = (item: any) => {
        if (!item) return 'unset';
        return item.background_color ?? item.backgroundColor ?? item.tag_color ?? item.tagColor ?? item['tag-color'] ?? item['background-color'] ?? 'unset';
    };

    const getStyleColor = (item: any, hover: boolean = false, is_value: boolean = false) => {
        const color_string = getColorString(item);

        const color = color_string === 'unset' ? getColorFromVar('var(--background-500)') : getColorFromVar(color_string);

        let background = hover ? color.darken(0.2).hexa() : color.hexa();
        let text = contrastColor(background);
        if (color_string === 'unset' && ! is_value) {
            background = hover ? 'rgba(0,0,0, 0.1)' : 'transparent';
            text = hover ? 'var(--background-600)' : 'var(--background-650)';
        }


        return {
            backgroundColor: background,
            color: text,
            borderRadius: '6px',
            padding: '0 6px !important',
            gap: 0
        };
    };


</script>

<style lang="scss">
    .max-tag-list {
        display: flex;
        align-items: center;

        .tag-value-text {
            padding: 0 0 0 30px !important;
        }
    }
</style>
