<template>
    <div :class="`max-check-box ${!label ? 'no-label' : ''}`" >
        <Checkbox v-bind="props" v-model="temp_value" :inputId="id" binary class="check-box" />
        <div class="label-checkbox" v-if="label">{{ label }}</div>
    </div>
</template>

<script setup lang="ts">
    import { Random } from '@maxvue/max-use';
    import { ref, watch } from 'vue';
    import Checkbox from 'primevue/checkbox';

    const id = Random();

    const props = withDefaults(
        defineProps<{
            modelValue: boolean;
            label?: string;
        }>(),
        { modelValue: false }
    );

    const temp_value = ref(props.modelValue);
    const emit = defineEmits(['update:modelValue']);

    watch(temp_value, (val) => emit('update:modelValue', val));

    watch( () => props.modelValue, (val) => temp_value.value = val);
</script>

<style lang="scss">
    .max-check-box {
        display: grid;
        grid-template-columns: auto 1fr;
        place-items: center start;
        gap: 0.5rem;

        &[circle] {
            .p-checkbox-box {
                border-radius: 50%;
            }
        }

        &.no-label {
            gap: 0;
        }

        .label-checkbox {
            color: var(--primary-750);
            font-size: 0.955rem;
            font-weight: 400;
            text-align: left;
        }
    }
</style>
