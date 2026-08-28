<template>
    <div class="max-tag-list" v-bind="attrs">
        <div v-for="item in items_array" :key="item.value ?? item.id ?? item.name">
            <MaxTagSelect flex :modelValue="item.value" :options="options_array" no-dropdown uppercase @update:modelValue="(val: any) => replaceItem(item, val)">
                <template #btn-right>
                    <div class="max-tag-remove-action" v-tooltip="'Remover'" @click.stop="removeItem(item)">
                        <MaxIconButton i="material-symbols:close-rounded" size="1.35" :color="getStyleColor(item, false, true).color" />
                    </div>
                </template>
            </MaxTagSelect>
        </div>
        <div>
            <MaxTagSelect v-model="add_tag" :options="options_array" is-button icon="fluent:tag-add-20-regular" icon-size="2" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs } from 'vue';
    import { getColorFromVar, contrastColor, watchTrue } from '@maxvue/max-use';
    import MaxTagSelect from './MaxTagSelect.vue';
    import MaxIconButton from './MaxIconButton.vue';

    const attrs = useAttrs();

    const props = withDefaults(defineProps<{
        options: any[] | Record<string, any>;
    }>(), { options: () => [] });

    const model = defineModel<any[] | Record<string, any>>({ default: () => [] });

    const emit = defineEmits<{ change: [value: any[]] }>();

    const add_tag = ref<any>(null);

    const items_array = computed(() => {
        const values = Array.isArray(model.value) ? model.value : Object.values(model.value);
        return [...values];
    });

    const options_array = computed(() => {
        const values = Array.isArray(props.options) ? props.options : Object.values(props.options);
        return [...values];
    });

    const count = computed(() => items_array.value.length);

    defineExpose({ count });

    watchTrue(() => add_tag.value, () => {
        const data: any = options_array.value.find((opt: any) => opt.value === add_tag.value?.value || opt.value === add_tag.value) ?? null;
        if (data && !items_array.value.some((item: any) => item.value === data.value)) {
            const new_value = [...items_array.value, data];
            model.value = new_value;
            emit('change', new_value);
        }
        add_tag.value = null;
    });

    const replaceItem = (item: any, value: any) => {
        const option: any = options_array.value.find((o: any) => o.value === (value?.value ?? value)) ?? null;
        if (!option || option.value === item.value) return;
        // Evita duplicar uma tag que já está na lista
        if (items_array.value.some((i: any) => i !== item && i.value === option.value)) return;
        const new_value = items_array.value.map((i: any) => (i === item ? option : i));
        model.value = new_value;
        emit('change', new_value);
    };

    const removeItem = (item: any) => {
        const new_value = items_array.value.filter((i: any) => i !== item);
        model.value = new_value;
        emit('change', new_value);
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
        if (color_string === 'unset' && !is_value) {
            background = hover ? 'rgba(0,0,0, 0.1)' : 'transparent';
            text = hover ? 'var(--background-600)' : 'var(--background-650)';
        }

        return {
            backgroundColor: background,
            color: text,
            borderRadius: '6px',
            padding: '0 6px !important',
            gap: '4px'
        };
    };
</script>

<style lang="scss">
.max-tag-list {
    display: flex;
    align-items: center;
    gap: 6px;

    .max-tag-remove-action {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.85;
        margin-left: 4px;
        padding: 2px;
        border-radius: 4px;
        transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease;

        &:hover {
            opacity: 1;
            transform: scale(1.15);
            background-color: rgb(0 0 0 / 12%);
        }
    }
}
</style>
