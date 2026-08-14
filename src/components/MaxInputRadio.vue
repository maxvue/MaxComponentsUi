<template>
    <div class="radio-button-input-main-div" @click="onClick">
        <input
            ref="inputRef"
            type="radio"
            class="max-radio-native"
            :id="id"
            :name="name ?? 'radio-group'"
            :value="value"
            :checked="isChecked"
            v-bind="inputAttrs"
            @change="onChange"
        />
        <div v-if="attrs.label">{{ attrs.label }}</div>
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
        }>(),
        { modelValue: null, value: null }
    );

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);

    const isChecked = computed(() => temp_value.value === props.value);

    const inputAttrs = computed(() => {
        const { label, icon, ...rest } = attrs as Record<string, unknown>;
        return rest;
    });

    const onChange = () => {
        temp_value.value = props.value;
    };

    watch(temp_value, (val) => emit('update:modelValue', val));

    watch(() => props.modelValue, (val) => temp_value.value = val);

    const id = Random();
    const inputRef = ref<HTMLInputElement | null>(null);

    const onClick = (e: Event) => {
        if (e && (e.target as HTMLElement).tagName === 'INPUT') return;
        temp_value.value = props.value;
    };
</script>

<style lang="scss">
    .radio-button-input-main-div {
        display: grid;
        gap: 10px;
        grid-template-columns: auto 1fr;
        cursor: pointer;
        place-items: center start;

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
                background: var(--primary-500);
            }

            &:checked {
                border-color: var(--primary-500);

                &::before {
                    transform: scale(1);
                }
            }

            &:focus-visible {
                outline: none;
                box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-500) 25%, transparent);
            }

            &:disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }
        }
    }
</style>
