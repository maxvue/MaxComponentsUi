<template>
    <InputBase v-bind="attrs" class="select_input_div" :options="resolvedOptions">
        <!-- SELECT EM GRUPO -->
        <div v-if="attrs.placeholder !== undefined && (!temp_value || temp_value === '')" class="placeholder-select">
            {{ attrs.placeholder }}
        </div>
        <Select v-if="attrs.groupOptions || (resolvedOptions.length > 0 && resolvedOptions[0]?.items)" v-bind="attrs" v-model="temp_value" :loading="loading" @before-show="(before_show as any)" :options="resolvedOptions" optionGroupLabel="label" optionGroupChildren="items" :optionValue="attrs.optionValue ?? 'value'" ref="elem" :emptyMessage="attrs.emptyMessage ?? 'Nenhum registro encontrado'" :editable="attrs.editable ?? false">
            <template #option="slotProps">
                <slot name="option" :option="slotProps.option" :selected="slotProps.selected" :index="slotProps.index">
                    <div class="label_div">
                        <Icon :icon="slotProps.option['icon']" v-if="slotProps.option['icon']" :size="slotProps.option['iconSize'] ?? '1'" :style="{ width: '30px' }" />
                        <div class="labelz">
                            <div v-html="slotProps.option.label" :style="{ color: attrs.color }"></div>
                        </div>
                        <div class="subLabel" v-html="slotProps.option?.sub_label ?? slotProps.option?.sub ?? slotProps.option?.subLabel"></div>
                    </div>
                </slot>
            </template>
            <template #optiongroup="slotProps">
                <div class="label_div">
                    <div class="labelz">
                        <div>{{ slotProps.option.label }}</div>
                    </div>
                </div>
            </template>
        </Select>
        <!-- SELECT NORMAL -->
        <Select v-else v-bind="attrs" v-model="temp_value" :loading="loading" @before-show="(before_show as any)" :options="resolvedOptions" :optionLabel="attrs.optionLabel ?? 'name'" :optionValue="attrs.optionValue ?? 'value'" :emptyMessage="attrs.emptyMessage ?? 'Nenhum registro encontrado'" :editable="attrs.editable ?? false">
            <template #option="slotProps">
                <slot name="option" :option="slotProps.option" :selected="slotProps.selected" :index="slotProps.index">
                    <div :class="`category ${slotProps.option.category}`" v-if="attrs.category === true">{{ slotProps.option.category === 'UTILITY' ? 'A' : '' }}{{ slotProps.option.category === 'MARKETING' ? 'B' : '' }}</div>
                    <div class="label_div">
                        <Icon :icon="slotProps.option['icon']" v-if="slotProps.option['icon']" :size="slotProps.option['iconSize'] ?? '1'" :style="{ width: '30px' }" />
                        <div class="labelz">
                            <div v-html="slotProps.option[attrs.optionLabel ?? 'name'] ?? slotProps.option.label" :style="{ color: attrs.color }"></div>
                        </div>
                        <div class="subLabel" v-html="slotProps.option?.sub_label ?? slotProps.option?.sub ?? slotProps.option?.subLabel"></div>
                        <img v-if="slotProps.option['img']" :src="`/media/images/${slotProps.option['img']}`" alt="Image" class="img-label" />
                    </div>
                </slot>
            </template>
            <template #value="value">
                <div :style="{ color: resolvedOptions.find((option: any) => option[attrs.optionValue ?? 'value'] === value.value)?.color }">
                    {{ resolvedOptions.find((option: any) => option[attrs.optionValue ?? 'value'] === value.value)?.[attrs.optionLabel ?? 'name'] ?? resolvedOptions.find((option: any) => option[attrs.optionValue ?? 'value'] === value.value)?.label }}
                </div>
            </template>
        </Select>
    </InputBase>
</template>

<script setup lang="ts">
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: any;
            options?: any[];
            groupOptions?: any[];
            loadOptions?: () => Promise<any[]>;
        }>(),
        { modelValue: null }
    );

    const emit = defineEmits(['update:modelValue', 'before-show']);
    const temp_value = ref(props.modelValue);

    watch(temp_value, (val) => {
        emit('update:modelValue', val);
    });

    watch(
        () => props.modelValue,
        (val) => {
            temp_value.value = val;
        }
    );

    const loading = ref(false);
    const optionsField = ref<any[]>([]);

    const resolvedOptions = computed(() => {
        if (optionsField.value && optionsField.value.length > 0) return optionsField.value;
        if (props.options) return props.options;
        if (props.groupOptions) return props.groupOptions;
        if (attrs.options) return attrs.options;
        if (attrs.groupOptions) return attrs.groupOptions;
        return [];
    });

    async function before_show(event: any) {
        emit('before-show', event);
        if (props.loadOptions) {
            loading.value = true;
            try {
                optionsField.value = await props.loadOptions();
            } finally {
                loading.value = false;
            }
        }
    }
</script>

<style lang="scss">
    .select_input_div {
        &[small] {
            padding: 0 !important;

            .p-select {
                padding: 0 5px 0 0 !important;

                span {
                    font-size: 0.85rem !important;

                    // color: var(--background-600) !important;
                }
            }
        }

        .p-select {
            width: 100%;
        }

        .p-select-label {
            border: none !important;
            padding: 0 !important;
            display: grid;
            place-items: center start;
            outline: none !important;

            &:focus {
                border: none !important;
                outline: none !important;
                outline-offset: 0 !important;
                box-shadow: none;
            }
        }

        .placeholder-select {
            position: absolute;
            color: var(--background-600);
            font-size: 0.9rem;
        }
    }

    .label_div {
        display: grid;
        grid-template-columns: auto 1fr auto;
        width: 100% !important;
        place-items: center start;
        gap: 10px;

        .icon-div {
            color: var(--background-650) !important;
        }

        &:hover {
            .icon-div {
                color: var(--background-650) !important;
            }
        }

        .subLabel {
            color: var(--background-600);
            padding-left: 1rem;
            text-align: right;
            width: 100%;
            font-size: 0.85rem;
        }

        .labelz {
            display: grid;
            place-items: center;
            color: var(--background-750);
        }

        img {
            max-height: 20px;
        }
    }

    .p-select-list-container {
        .p-virtualscroller {
            max-height: 250px !important;
            overflow: hidden !important;
            overflow-y: auto !important;
        }
    }

    .p-select-option {
        &:hover {
            background-color: var(--background-300) !important;

            &.p-select-option-selected {
                background-color: var(--blue-700) !important;
                color: var(--background-0) !important;

                .icon-div {
                    color: var(--background-200) !important;
                }

                .labelz,
                .subLabel {
                    color: var(--background-0);
                }
            }
        }

        // SEM MOUSE EM CIMA
        &.p-select-option-selected {
            background-color: var(--blue-600) !important;

            &:hover {
                background-color: var(--blue-700) !important;
            }

            .icon-div {
                color: var(--background-200) !important;
            }

            .labelz,
            .subLabel {
                color: var(--background-0);
            }
        }

        .labelz,
        .subLabel {
            color: var(--background-650);
        }

        .category {
            width: 20px;
            margin-right: 10px;
            display: grid;
            place-items: center;
            border-radius: 5px;

            &.UTILITY {
                background-color: var(--blue-200);
                color: var(--blue-600);
            }

            &.MARKETING {
                background-color: var(--orange-200);
                color: var(--red-b-500);
            }
        }
    }
</style>
