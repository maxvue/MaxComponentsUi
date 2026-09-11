<template>
    <div
        class="max-input-radio radio-button-input-main-div"
        :class="{ 'is-disabled': isRadioDisabled }"
        @click="onClick"
    >
        <input
            ref="inputRef"
            type="radio"
            class="max-radio-native"
            :id="id"
            :name="name ?? 'radio-group'"
            :value="value"
            :checked="isChecked"
            :disabled="isRadioDisabled"
            v-bind="inputAttrs"
            @change="onChange"
        />
        <label :for="id" v-if="attrs.label" class="max-radio-label">{{ attrs.label }}</label>
        <MaxIcon v-if="attrs.icon" :icon="attrs.icon" />
    </div>
</template>

<script setup lang="ts">
    import { Random } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: any;
            value?: any;
            name?: string;
            disabled?: boolean;
        }>(),
        { modelValue: null, value: null, disabled: false }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: any];
    }>();

    const temp_value = ref(props.modelValue);

    const isRadioDisabled = computed(() => Boolean(props.disabled || attrs.disabled));
    const isChecked = computed(() => temp_value.value === props.value);

    const inputAttrs = computed(() => {
        const { label: _label, icon: _icon, disabled: _disabled, ...rest } = attrs as Record<string, unknown>;
        return rest;
    });

    const onChange = () => {
        if (isRadioDisabled.value) return;
        temp_value.value = props.value;
    };

    watch(temp_value, (val) => emit('update:modelValue', val));

    watch(() => props.modelValue, (val) => {
        temp_value.value = val;
    });

    const id = Random();
    const inputRef = ref<HTMLInputElement | null>(null);

    const onClick = (e: Event) => {
        if (isRadioDisabled.value) return;
        if (e && (e.target as HTMLElement).tagName === 'INPUT') return;
        temp_value.value = props.value;
    };
</script>

<style lang="scss" scoped>
.radio-button-input-main-div {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    &.is-disabled {
        cursor: not-allowed;
        opacity: 0.5;

        .max-radio-label {
            cursor: not-allowed;
            color: var(--background-500);
        }
    }

    .max-radio-label {
        cursor: pointer;
    }

    .max-radio-native {
        appearance: none;
        margin: 0;
        width: 20px;
        height: 20px;
        border: 2px solid var(--background-400);
        border-radius: 50%;
        display: grid;
        place-content: center;
        cursor: pointer;
        background: var(--background-0);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;

        &::before {
            content: '';
            width: 10px;
            height: 10px;
            border-radius: 50%;
            transform: scale(0);
            transition: transform 0.15s ease;
            background: var(--max-primary-500, var(--primary-500, #00768e));
        }

        &:checked {
            border-color: var(--max-primary-500, var(--primary-500, #00768e));

            &::before {
                transform: scale(1);
            }
        }

        &:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--max-primary-500, #00768e) 25%, transparent);
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.6;
        }
    }
}
</style>
