<template>
    <InputBase v-bind="attrs" class="input-search-main-div" :iconRight="isLoading === true ? 'line-md:loading-twotone-loop' :  'material-symbols:search-rounded'">
        <InputText type="text" v-bind="attrs" fluid v-model="temp_value" @input="onInput" />
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import InputText from 'primevue/inputtext';
    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            isLoading?: boolean;
        }>(),
        { modelValue: '', isLoading: false }
    );

    const emit = defineEmits(['update:modelValue', 'search']);
    const temp_value = ref(props.modelValue);

    watch(temp_value, (val) => emit('update:modelValue', val));
    watch(() => props.modelValue, (val) => temp_value.value = val);

    let debounceTimer: ReturnType<typeof setTimeout>;

    const onInput = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (temp_value.value && temp_value.value.length > 1) emit('search', temp_value.value);

        }, 300);
    };
</script>

<style lang="scss">
    .p-autocomplete-option {
        padding: 0 !important;
    }

    .p-autocomplete-list {
        gap: 5px !important;
    }

    .p-autocomplete-overlay {
        z-index: 99999 !important;
    }

    .tst1 {
        padding-left: 20px;
        font-weight: 300;
        color: var(--background-650);
    }

    .tst2 {
        font-weight: 600;
    }
</style>
