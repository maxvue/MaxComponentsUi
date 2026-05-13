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
                    <ToggleSwitch v-model="modelvalue" @change="update_value" />
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
    import ToggleSwitch from 'primevue/toggleswitch';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: any;
            trueLabel?: string;
            falseLabel?: string;
            trueValue?: any;
            falseValue?: any;
        }>(),
        { modelValue: false, trueValue: true, falseValue: false }
    );

    const emit = defineEmits(['update:modelValue']);
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

    const update_value = () => {
        emit('update:modelValue', modelvalue.value);
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
            place-items: start center;
            padding-top: 7px;
            height: 100%;
            max-height: 36px;

            &.labeled {
                padding-top: 10px;
                width: 100%;
                border-radius: 0.5rem;
                border: 1px solid var(--max-inputtext-border-color);
            }

            .input-toggle-field {
                display: grid;
                grid-template-columns: auto auto 1fr;

                .input-toggle-field-input {
                    padding: 0 10px;
                }

                .input-toggle-field-label {
                    color: var(--background-650);
                    font-weight: 400;

                    &.active {
                        color: var(--blue-800);
                    }
                }
            }
        }
    }
</style>
