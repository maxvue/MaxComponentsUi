<template>
    <div
        v-bind="rootAttrs"
        :class="`max-input-toggle input-toggle-field-main-div ${hasLabel ? 'labeled' : ''}`"
    >
        <div :class="`input-toggle-field-label-main-div ${hasLabelCenter ? 'label-center' : ''}`">
            <label
                :for="toggleInputId"
                class="input-toggle-field-label-div"
                v-if="hasLabel"
            >
                {{ resolvedLabel }}
            </label>
        </div>
        <div :class="`input-toggle-field-input-div ${hasLabel ? 'labeled' : ''}`">
            <div :class="`input-toggle-field ${hasLabel ? 'labeled' : ''}`">
                <div :class="`input-toggle-field-label ${falseValue === modelvalue ? 'active' : ''}`" v-if="falseLabel">
                    {{ falseLabel ?? '' }}
                </div>
                <div class="input-toggle-field-input">
                    <label :for="toggleInputId" class="max-toggleswitch">
                        <input
                            :id="toggleInputId"
                            type="checkbox"
                            class="max-toggleswitch-input"
                            :checked="modelvalue === trueValue"
                            :aria-label="resolvedLabel ? undefined : 'Alternar opção'"
                            :disabled="resolvedDisabled"
                            :name="resolvedName"
                            :required="resolvedRequired"
                            v-bind="controlAttrs"
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

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();

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
            label?: string;
            labelCenter?: boolean | string;
            id?: string;
            name?: string;
            disabled?: boolean;
            required?: boolean;
        }>(),
        {
            modelValue: false,
            trueValue: true,
            falseValue: false,
            trueLabel: undefined,
            falseLabel: undefined,
            labelRight: undefined,
            labelLeft: undefined,
            label: undefined,
            labelCenter: undefined,
            id: undefined,
            name: undefined,
            disabled: undefined,
            required: undefined
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: any];
    }>();

    const fallbackId = ref(`max-toggle-${Math.random().toString(36).slice(2, 9)}`);
    const toggleInputId = computed(() => props.id ?? (attrs.id as string | undefined) ?? fallbackId.value);

    const resolvedLabel = computed(() => props.label ?? (attrs.label as string | undefined));
    const hasLabel = computed(() => resolvedLabel.value !== undefined);
    const hasLabelCenter = computed(() => props.labelCenter !== undefined || attrs.labelCenter !== undefined);

    const resolvedDisabled = computed(() => {
        if (props.disabled !== undefined) return props.disabled;
        if (attrs.disabled !== undefined && attrs.disabled !== false) return true;
        return undefined;
    });

    const resolvedName = computed(() => props.name ?? (attrs.name as string | undefined));

    const resolvedRequired = computed(() => {
        if (props.required !== undefined) return props.required;
        if (attrs.required !== undefined && attrs.required !== false) return true;
        return undefined;
    });

    const CONTROL_ATTR_KEYS = new Set([
        'name',
        'disabled',
        'required',
        'tabindex',
        'form',
        'value',
        'checked',
        'aria-label',
        'aria-labelledby',
        'aria-describedby',
        'aria-required',
        'aria-disabled'
    ]);

    const rootAttrs = computed(() => {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(attrs)) if (
            !CONTROL_ATTR_KEYS.has(key) &&
            key !== 'id' &&
            key !== 'label' &&
            key !== 'labelCenter' &&
            key !== 'labelTrue' &&
            key !== 'labelFalse' &&
            key !== 'true-label' &&
            key !== 'false-label'
        ) result[key] = value;


        return result;
    });

    const controlAttrs = computed(() => {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(attrs)) if (
            CONTROL_ATTR_KEYS.has(key) &&
            key !== 'name' &&
            key !== 'disabled' &&
            key !== 'required'
        ) result[key] = value;


        return result;
    });

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

    const trueLabel = computed(() => props.trueLabel ?? props.labelRight ?? (attrs.labelTrue as string | undefined) ?? (attrs['true-label'] as string | undefined) ?? null);
    const falseLabel = computed(() => props.falseLabel ?? props.labelLeft ?? (attrs.labelFalse as string | undefined) ?? (attrs['false-label'] as string | undefined) ?? null);
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

<style lang="scss" scoped>
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
            font-family: inherit;
            font-size: 0.85rem;
            color: var(--background-750);
            cursor: pointer;

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
                color: var(--background-700);
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

                &:focus-visible + .max-toggleswitch-slider {
                    outline: 2px solid var(--max-primary-500, var(--blue-600, #00768e));
                    outline-offset: 2px;
                }
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
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    *,
    ::before,
    ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
</style>
