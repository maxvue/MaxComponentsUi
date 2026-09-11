<template>
    <div
        :class="`max-input-checkbox max-check-box ${!label ? 'no-label' : ''} ${isDisabled ? 'disabled' : ''}`"
        :disabled="isDisabled ? '' : undefined"
        v-bind="rootAttrs"
    >
        <input
            :id="id"
            v-model="temp_value"
            type="checkbox"
            class="check-box"
            :disabled="isDisabled"
            v-bind="inputAttrs"
        />
        <label v-if="label" class="label-checkbox" :for="id">{{ label }}</label>
    </div>
</template>

<script setup lang="ts">
    import { Random } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs } from 'vue';

    defineOptions({ inheritAttrs: false });

    const attrs = useAttrs();
    const id = Random();

    const props = withDefaults(
        defineProps<{
            modelValue: boolean;
            label?: string;
            disabled?: boolean;
        }>(),
        { modelValue: false, disabled: false }
    );

    const isDisabled = computed(() => {
        return Boolean(props.disabled || (attrs.disabled !== undefined && attrs.disabled !== false && attrs.disabled !== 'false'));
    });

    const rootAttrs = computed(() => {
        const { name: _n, required: _r, disabled: _d, tabindex: _t, autofocus: _a, ...rest } = attrs;
        return rest;
    });

    const inputAttrs = computed(() => {
        const { circle: _c, class: _cl, style: _s, disabled: _d, ...rest } = attrs;
        return rest;
    });

    const temp_value = ref(props.modelValue);
    const emit = defineEmits<{
        'update:modelValue': [value: any];
    }>();

    watch(temp_value, (val) => {
        if (isDisabled.value) {
            temp_value.value = props.modelValue;
            return;
        }
        emit('update:modelValue', val);
    });

    watch(() => props.modelValue, (val) => {
        temp_value.value = val;
    });
</script>

<style lang="scss" scoped>
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

        &[disabled],
        &.disabled {
            cursor: not-allowed;

            .label-checkbox {
                cursor: not-allowed;
                opacity: 0.6;
            }

            .check-box {
                cursor: not-allowed;
                opacity: 0.6;
                pointer-events: none;
            }
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
            border: 1px solid var(--background-400);
            border-radius: 4px;
            background: var(--background-200);
            cursor: pointer;
            display: grid;
            place-items: center;
            transition: background 0.15s, border-color 0.15s;

            &:hover:not(:disabled) {
                border-color: var(--background-500);
            }

            &:focus-visible {
                outline: none;
                box-shadow: 0 0 0 2px var(--blue-200);
            }

            &:disabled {
                cursor: not-allowed;
                opacity: 0.6;
                pointer-events: none;
            }

            &::after {
                content: '';
                width: 0.375rem;
                height: 0.625rem;
                border: solid var(--background-0);
                border-width: 0 2px 2px 0;
                transform: rotate(45deg) scale(0);
                transition: transform 0.1s;
                margin: 0 0 1px;
            }

            &:checked {
                background: var(--blue-750);
                border-color: var(--blue-750);
            }

            &:checked::after {
                transform: rotate(45deg) scale(1);
            }
        }
    }
</style>
