<template>
    <InputBase v-bind="props" class="input-credit-card-date-base" text-center :label="props.label" :done="done" :required="props.required" :error="error_msg">
        <MaxBaseInput type="text" v-bind="attrs" v-model="temp_value" v-maska:unmaskedValue.unmasked="maskValue" placeholder="MM/AA" @blur="checkDone()" />
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
            required?: boolean;
        }>(),
        { modelValue: '', label: 'Validade', required: false }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
    }>();

    const toText = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

    const temp_value = ref(toText(props.modelValue));
    const unmaskedValue = ref('');

    const isDone = ref<boolean | null>(null);

    /** Válido quando há 4 dígitos (MMAA) e o mês está entre 01 e 12. */
    const isValidDate = (value: string): boolean => {
        if (value.length !== 4) return false;
        const month = Number(value.slice(0, 2));
        return month >= 1 && month <= 12;
    };

    const done = computed(() => isDone.value ?? (unmaskedValue.value.length > 0 ? isValidDate(unmaskedValue.value) : null));

    const checkDone = () => {
        isDone.value = unmaskedValue.value.length > 0 ? isValidDate(unmaskedValue.value) : (props.required ? false : null);
    };

    const error_msg = computed(() => {
        if (isDone.value === false) return unmaskedValue.value.length === 0 ? 'Campo obrigatório' : 'Validade inválida';
        return null;
    });

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ }
        };

        return {
            tokens: tokens,
            mask: '##/##'
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
.input-credit-card-date-base {
    input {
        letter-spacing: 2px;
    }
}
</style>
