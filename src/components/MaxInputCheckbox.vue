<template>
    <div :class="`max-check-box ${!props.label ? 'no-label' : ''}`">
        <div :class="['p-checkbox', 'p-component', { 'p-checkbox-checked': isChecked, 'p-disabled': props.disabled }]">
            <input
                :id="id"
                type="checkbox"
                class="p-checkbox-input"
                :checked="isChecked"
                :disabled="props.disabled"
                :aria-checked="props.indeterminate ? 'mixed' : isChecked"
                @change="onChange"
            />
            <div class="p-checkbox-box">
                <MaxIcon v-if="props.indeterminate" icon="mdi:minus" class="p-checkbox-icon" size="0.9" />
                <MaxIcon v-else-if="isChecked" icon="mdi:check" class="p-checkbox-icon" size="0.9" />
            </div>
        </div>
        <label :for="id" class="label-checkbox" v-if="props.label">{{ props.label }}</label>
    </div>
</template>

<script setup lang="ts">
    import { Random } from '@maxvue/max-use';
    import { computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    const id = Random();

    const props = withDefaults(
        defineProps<{
            modelValue?: any;
            label?: string;
            disabled?: boolean;
            binary?: boolean;
            value?: any;
            trueValue?: any;
            falseValue?: any;
            indeterminate?: boolean;
        }>(),
        {
            modelValue: false,
            binary: true,
            trueValue: true,
            falseValue: false,
            disabled: false,
            indeterminate: false
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [val: any];
        'change': [event: Event];
    }>();

    const isChecked = computed<boolean>(() => {
        if (props.binary) return props.modelValue === props.trueValue;

        if (Array.isArray(props.modelValue)) return props.modelValue.includes(props.value);

        return props.modelValue === props.value;
    });

    const onChange = (event: Event) => {
        if (props.disabled) return;

        let nextValue: any;
        if (props.binary) nextValue = isChecked.value ? props.falseValue : props.trueValue;
        else if (Array.isArray(props.modelValue)) nextValue = isChecked.value
            ? props.modelValue.filter((v: any) => v !== props.value)
            : [...props.modelValue, props.value];
        else nextValue = isChecked.value ? null : props.value;


        emit('update:modelValue', nextValue);
        emit('change', event);
    };
</script>

<style lang="scss">
    .max-check-box {
        display: grid;
        grid-template-columns: auto 1fr;
        place-items: center start;
        gap: 0.5rem;

        .p-checkbox {
            position: relative;
            display: inline-flex;
            user-select: none;
            vertical-align: bottom;
            cursor: pointer;
            width: 18px;
            height: 18px;

            .p-checkbox-input {
                cursor: pointer;
                appearance: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding: 0;
                margin: 0;
                opacity: 0;
                z-index: 1;
                outline: 0 none;
            }

            .p-checkbox-box {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 18px;
                height: 18px;
                color: var(--primary-750, #fff);
                border: 1px solid var(--max-border-color, #cbd5e1);
                background: var(--max-bg-color, #fff);
                border-radius: 4px;
                transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
            }

            &.p-checkbox-checked .p-checkbox-box {
                border-color: var(--max-primary-500, #3b82f6);
                background: var(--max-primary-500, #3b82f6);
                color: #fff;
            }

            &.p-disabled {
                opacity: 0.6;
                cursor: default;

                .p-checkbox-input {
                    cursor: default;
                }
            }
        }

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
            cursor: pointer;
        }
    }
</style>
