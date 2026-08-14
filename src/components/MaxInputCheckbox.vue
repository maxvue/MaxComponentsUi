<template>
    <div :class="`max-check-box ${!label ? 'no-label' : ''}`" v-bind="$attrs">
        <input
            :id="id"
            v-model="temp_value"
            type="checkbox"
            class="check-box"
        />
        <label v-if="label" class="label-checkbox" :for="id">{{ label }}</label>
    </div>
</template>

<script setup lang="ts">
    import { Random } from '@maxvue/max-use';
    import { ref, watch } from 'vue';

    defineOptions({ inheritAttrs: false });

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

    watch(() => props.modelValue, (val) => temp_value.value = val);
</script>

<style lang="scss">
    .max-check-box {
        display: grid;
        grid-template-columns: auto 1fr;
        place-items: center start;
        gap: 0.5rem;

        &[circle] {
            .check-box {
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
            cursor: pointer;
        }

        .check-box {
            appearance: none;
            width: 1.25rem;
            height: 1.25rem;
            margin: 0;
            border: 1px solid var(--primary-300);
            border-radius: 4px;
            background: var(--background-0);
            cursor: pointer;
            display: grid;
            place-items: center;
            transition: background 0.15s, border-color 0.15s;

            &:hover {
                border-color: var(--primary-400);
            }

            &:focus-visible {
                outline: none;
                box-shadow: 0 0 0 2px var(--primary-200);
            }

            &::after {
                content: '';
                width: 0.375rem;
                height: 0.625rem;
                border: solid var(--background-0);
                border-width: 0 2px 2px 0;
                transform: rotate(45deg) scale(0);
                transition: transform 0.1s;
            }

            &:checked {
                background: var(--primary-500);
                border-color: var(--primary-500);
            }

            &:checked::after {
                transform: rotate(45deg) scale(1);
            }
        }
    }
</style>
