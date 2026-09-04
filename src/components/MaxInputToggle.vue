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
                    <label class="max-toggleswitch">
                        <input
                            type="checkbox"
                            class="max-toggleswitch-input"
                            :checked="modelvalue === trueValue"
                            @change="on_toggle(($event.target as HTMLInputElement).checked)"
                        />
                        <span class="max-toggleswitch-slider"></span>
                    </label>
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
            /**
             * Nome canônico: `trueLabel`. Também aceita, via atributos não
             * declarados (`useAttrs()`), os aliases legados `labelTrue`/
             * `true-label` e agora também a prop declarada `labelRight`
             * (espelhando o nome usado por `MaxInputSwitch`) — mantidos por
             * compatibilidade, não remover.
             */
            trueLabel?: string;
            /**
             * Nome canônico: `falseLabel`. Também aceita, via atributos não
             * declarados (`useAttrs()`), os aliases legados `labelFalse`/
             * `false-label` e agora também a prop declarada `labelLeft`
             * (espelhando o nome usado por `MaxInputSwitch`) — mantidos por
             * compatibilidade, não remover.
             */
            falseLabel?: string;
            /** Alias de `trueLabel`, espelhando `MaxInputSwitch.labelRight` */
            labelRight?: string;
            /** Alias de `falseLabel`, espelhando `MaxInputSwitch.labelLeft` */
            labelLeft?: string;
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

    const trueLabel = computed(() => props.trueLabel ?? props.labelRight ?? attrs.labelTrue ?? attrs['true-label'] ?? null);
    const falseLabel = computed(() => props.falseLabel ?? props.labelLeft ?? attrs.labelFalse ?? attrs['false-label'] ?? null);
    const trueValue = computed(() => props.trueValue ?? true);
    const falseValue = computed(() => props.falseValue ?? false);

    const update_value = () => {
        emit('update:modelValue', modelvalue.value);
    };

    const on_toggle = (checked: boolean) => {
        modelvalue.value = checked ? trueValue.value : falseValue.value;
    };

    defineExpose({ update_value, modelvalue });
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
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;

                .input-toggle-field-input {
                    padding: 0 10px;
                    height: 17px;
                    display: grid;
                    place-items: center;
                }

                .input-toggle-field-label {
                    color: var(--background-650);
                    font-weight: 400;

                    &.active {
                        color: var(--blue-800);
                    }
                }
            }

            .max-toggleswitch {
                position: relative;
                display: inline-block;
                width: 34px;
                height: 18px;
                cursor: pointer;

                .max-toggleswitch-input {
                    position: absolute;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    cursor: pointer;
                    z-index: 1;
                }

                .max-toggleswitch-slider {
                    position: absolute;
                    inset: 0;
                    border-radius: 999px;
                    background-color: var(--background-300);
                    transition: background-color 0.2s ease;

                    &::before {
                        content: '';
                        position: absolute;
                        width: 12px;
                        height: 12px;
                        top: 3px;
                        left: 4px;
                        border-radius: 50%;
                        background-color: var(--background-0);
                        transition: left 0.2s ease;
                    }
                }

                .max-toggleswitch-input:checked + .max-toggleswitch-slider {
                    background-color: var(--blue-600);

                    &::before {
                        left: calc(100% - 16px);
                    }
                }

                .max-toggleswitch-input:focus-visible + .max-toggleswitch-slider {
                    outline: 2px solid var(--blue-600);
                    outline-offset: 1px;
                }
            }
        }
    }
</style>
