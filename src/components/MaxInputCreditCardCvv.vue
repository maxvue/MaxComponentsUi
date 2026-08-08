<template>
    <InputBase v-bind="props" class="input-credit-card-cvv-base" text-center :label="props.label" :done="done" :required="props.required" :error="error_msg">
        <MaxBaseInput type="text" v-bind="attrs" v-model="temp_value" v-maska:unmaskedValue.unmasked="maskValue" placeholder="000" @blur="checkDone()" />
    </InputBase>
</template>

<script setup lang="ts">
    import { vMaska } from 'maska/vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxBaseInput from './base/MaxBaseInput.vue';
    import { onlyNumbers } from '@maxvue/max-use';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            label?: string | undefined;
            len?: number;
            required?: boolean;
        }>(),
        { modelValue: '', label: 'CVV', len: 3, required: false }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
    }>();

    const toText = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

    const temp_value = ref(toText(props.modelValue));
    const unmaskedValue = ref('');

    const isDone = ref<boolean | null>(null);

    const done = computed(() => isDone.value ?? (unmaskedValue.value.length > 0 ? unmaskedValue.value.length === props.len : null));

    const checkDone = () => {
        isDone.value = unmaskedValue.value.length > 0 ? unmaskedValue.value.length === props.len : (props.required ? false : null);
    };

    const error_msg = computed(() => {
        if (isDone.value === false) return unmaskedValue.value.length === 0 ? 'Campo obrigatório' : 'CVV inválido';
        return null;
    });

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ }
        };

        return {
            tokens: tokens,
            mask: '#'.repeat(props.len)
        };
    });

    watch(unmaskedValue, () => {
        emit('update:modelValue', unmaskedValue.value);
        if (isDone.value !== null) checkDone();
    });

    watch(
        () => props.modelValue,
        () => {
            const numbers = onlyNumbers(toText(props.modelValue));
            if (numbers !== onlyNumbers(temp_value.value)) temp_value.value = toText(props.modelValue);
        }
    );

    defineExpose({ unmaskedValue });
</script>

<style lang="scss">
.input-credit-card-cvv-base {
    input {
        letter-spacing: 2px;
    }
}
</style>
