<template>
    <InputBase v-bind="props" :error="error_msg" :caution="caution" :done="isDone">
        <InputText number type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" slotChar=" " fluid @blur="checkDone()" :placeholder="`00,000000`" />
    </InputBase>
</template>

<script setup lang="ts">
    import { toNumber } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import InputText from 'primevue/inputtext';
    import { vMaska } from 'maska/vue';
    const attrs: any = useAttrs();

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
        return !(only_numbers.value <= -74 || only_numbers.value > -32.4 || only_numbers.value === 0 || isNaN(only_numbers.value));
    });

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        if (temp_value.value === '') return false;
        return !done.value;
    });

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (temp_value.value === '' && props.required) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Longitude inválida (Brasil)';
    });

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ },
            '7': { pattern: /[3-7]/ }
        };

        const mask = '-7#.######';
        return {
            tokens: tokens,
            mask: mask,
            eager: true
        };
    });

    watch(temp_value, () => {
        const val = toNumber(temp_value.value, 6);
        emit('update:modelValue', val);
        if (done.value) emit('complete', val);

    }, { immediate: true });

    watch(() => props.modelValue, () => temp_value.value = props.modelValue ? toNumber(props.modelValue, 6) : temp_value.value);
</script>
