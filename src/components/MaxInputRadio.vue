<template>
    <div class="radio-button-input-main-div" @click="onClick">
        <RadioButton v-bind="attrs" :inputId="id" :name="name ?? 'radio-group'" ref="button" v-model="temp_value" :value="value" />
        <div v-if="attrs.label">{{ attrs.label }}</div>
        <Icon v-if="attrs.icon" :icon="attrs.icon" />
    </div>
</template>

<script setup lang="ts">
    import { Random } from '@maxvue/max-use';
    import { ref, watch, useAttrs } from 'vue';
    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: any;
            value?: any;
            name?: string;
        }>(),
        { modelValue: null, value: null }
    );

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);

    watch(temp_value, (val) => emit('update:modelValue', val));

    watch(() => props.modelValue,(val) => temp_value.value = val);

    const id = Random();
    const button = ref();

    const onClick = () => {
        if(button.value && button.value.$el) {
            const input = button.value.$el.querySelector('input');
            if(input) input.click();
        }
    };
</script>

<style lang="scss">
    .radio-button-input-main-div {
        display: grid;
        gap: 10px;
        grid-template-columns: auto 1fr;
        cursor: pointer;
        place-items: center start;
    }
</style>
