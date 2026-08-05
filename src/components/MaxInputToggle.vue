<template>
    <div :class="`input-toggle-field-main-div ${attrs.label !== undefined ? 'labeled' : ''}`">
        <div :class="`input-toggle-field-label-main-div ${attrs.labelCenter !== undefined ? 'label-center' : ''}`">
            <div class="input-toggle-field-label-div" v-if="attrs.label !== undefined">
                {{ attrs.label }}
            </div>
        </div>
        <div :class="`input-toggle-field-input-div ${attrs.label !== undefined ? 'labeled' : ''}`">
            <div :class="`input-toggle-field ${attrs.label !== undefined ? 'labeled' : ''}`">
                <div :class="`input-toggle-field-label ${falseValue === modelvalue ? 'active' : ''}`" v-if="falseLabel">
                    {{ falseLabel ?? '' }}
                </div>
                <div class="input-toggle-field-input">
                    <div :class="['p-toggleswitch', 'p-component', { 'p-toggleswitch-checked': isChecked, 'p-disabled': props.disabled }]">
                        <input
                            type="checkbox"
                            role="switch"
                            class="p-toggleswitch-input"
                            :checked="isChecked"
                            :aria-checked="isChecked"
                            :disabled="props.disabled"
                            @change="onToggleChange"
                        />
                        <span class="p-toggleswitch-slider">
                            <div class="p-toggleswitch-handle"></div>
                        </span>
                    </div>
                </div>
                <div :class="`input-toggle-field-label ${trueValue === modelvalue ? 'active' : ''}`" v-if="trueLabel">
                    {{ trueLabel ?? '' }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs } from 'vue';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: any;
            trueLabel?: string;
            falseLabel?: string;
            trueValue?: any;
            falseValue?: any;
            disabled?: boolean;
        }>(),
        { modelValue: false, trueValue: true, falseValue: false, disabled: false }
    );

    const emit = defineEmits<{
        'update:modelValue': [val: any];
        'change': [event: Event];
    }>();

    const modelvalue = ref(props.modelValue);

    watch(modelvalue, (val) => {
        emit('update:modelValue', val);
    });

    watch(
        () => props.modelValue,
        (val) => {
            modelvalue.value = val;
        }
    );

    const trueLabel = computed(() => props.trueLabel ?? attrs.labelTrue ?? attrs['true-label'] ?? null);
    const falseLabel = computed(() => props.falseLabel ?? attrs.labelFalse ?? attrs['false-label'] ?? null);
    const trueValue = computed(() => props.trueValue ?? true);
    const falseValue = computed(() => props.falseValue ?? false);

    const isChecked = computed(() => modelvalue.value === trueValue.value);

    const update_value = () => {
        emit('update:modelValue', modelvalue.value);
    };

    const onToggleChange = (event: Event) => {
        if (props.disabled) return;
        modelvalue.value = isChecked.value ? falseValue.value : trueValue.value;
        update_value();
        emit('change', event);
    };
</script>

<style lang="scss">
    .input-toggle-field-main-div {
        display: grid;
        place-items: start center;
        height: 36px;
        position: relative;
        background-color: var(--background-0);

        &.labeled {
            width: 100%;
        }

        &[leftalign] {
            .input-toggle-field-input-div {
                place-items: start;
                padding-left: 20px;
            }
        }

        .input-toggle-field-label-main-div {
            position: absolute;
            width: 100%;
            display: grid;
            transform: translateY(-50%);
            place-items: start;
            padding: 0 20px;

            &.label-center {
                place-items: center;
            }

            .input-toggle-field-label-div {
                position: relative;
                z-index: 1;
                font-family: Jost, sans-serif !important;
                font-size: 0.85rem;
                color: var(--background-600);

                &::after {
                    content: '';
                    position: absolute;
                    width: calc(100% + 12px);
                    left: -6px;
                    top: calc(50% + 1px);
                    transform: translateY(-50%);
                    height: 3px;
                    bottom: 4px;
                    background-color: var(--background-0);
                    z-index: -1;
                }
            }
        }

        .input-toggle-field-input-div {
            display: grid;
            place-items: center;
            padding-top: 3px;
            height: 100%;
            max-height: 36px;

            &.labeled {
                padding-top: 6px;
                width: 100%;
                border-radius: 0.5rem;
                border: 1px solid var(--max-inputtext-border-color);
            }

            .input-toggle-field {
                max-height: 26px;
                display: grid;
                grid-template-columns: auto auto 1fr;
                place-items: center;

                .input-toggle-field-input {
                    padding: 0 10px;
                    height: 17px;
                }

                .input-toggle-field-label {
                    color: var(--background-650);
                    font-weight: 400;

                    &.active {
                        color: var(--blue-800);
                    }
                }
            }

            .p-toggleswitch {
                position: relative;
                display: inline-block;
                width: 2.5rem;
                height: 1.25rem;
                max-height: 18px;

                .p-toggleswitch-input {
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

                .p-toggleswitch-slider {
                    position: absolute;
                    cursor: pointer;
                    inset: 0;
                    background-color: var(--max-border-color, #cbd5e1);
                    transition: 0.2s;
                    border-radius: 1rem;
                }

                .p-toggleswitch-handle {
                    position: absolute;
                    content: '';
                    height: 12px;
                    width: 12px;
                    left: 4px;
                    top: 3px;
                    background-color: white;
                    transition: 0.2s;
                    border-radius: 50%;
                }

                &.p-toggleswitch-checked {
                    .p-toggleswitch-slider {
                        background-color: var(--max-primary-500, #3b82f6);
                    }

                    .p-toggleswitch-handle {
                        left: calc(100% - 16px);
                    }
                }

                &.p-disabled {
                    opacity: 0.6;
                    cursor: default;

                    .p-toggleswitch-input {
                        cursor: default;
                    }
                }
            }
        }
    }
</style>
