<template>
    <InputBase v-bind="props" :error="error" :caution="caution" :done="isDone">
        <input
            type="text"
            class="p-inputtext p-component"
            v-model="temp_value"
            v-maska="maskValue"
            @blur="checkDone()"
            placeholder="00,000000"
            :disabled="props.disabled"
        />
    </InputBase>
</template>

<script setup lang="ts">
    import { toNumber, isBlank } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch } from 'vue';
    import InputBase from './InputBase.vue';
    import { vMaska } from 'maska/vue';

    const props = withDefaults(
        defineProps<{
            modelValue: string | number;
            icon?: string | undefined;
            i?: string | undefined;
            disabled?: boolean | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
            required?: boolean;
        }>(),
        { modelValue: '', done: undefined, required: false, caution: undefined }
    );

    const emit = defineEmits(['update:modelValue', 'complete']);

    const temp_value: Ref = ref(toNumber(props.modelValue) !== 0 ? toNumber(props.modelValue) : '');

    const only_numbers = computed(() => toNumber(temp_value.value));

    const isDone: Ref = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = done.value;
    };

    const done = computed(() => {
        if (props.done !== undefined) return props.done;
        return !(only_numbers.value < -33.8 || only_numbers.value > 5.3 || only_numbers.value === 0 || isNaN(only_numbers.value));
    });

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        if (temp_value.value === '') return false;
        return !done.value;
    });

    const error = computed(() => {
        if (isBlank(temp_value.value)) return props.required ? 'Campo obrigatório' : false;
        if (!done.value) return 'Latitude inválida.';
        return false;
    });

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ },
            '9': { pattern: /[0-9]/, optional: true },
            'S': { pattern: /-/, optional: true }
        };

        return {
            tokens: tokens,
            mask: 'S99.######',
            eager: true
        };
    });

    const negative: Ref = ref(false);

    watch(
        temp_value,
        () => {
            if (temp_value?.value < 0) negative.value = true;
            else negative.value = false;
            const val = toNumber(temp_value.value, 6);
            emit('update:modelValue', val);
            if (done.value) emit('complete', val);

        },
        { immediate: true }
    );

    watch(
        () => props.modelValue,
        () => {
            temp_value.value = props.modelValue;
        }
    );
</script>
