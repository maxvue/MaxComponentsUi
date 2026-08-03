<template>
    <InputBase v-bind="props" class="input-credit-card-number-base" text-center :label="props.label" :done="done" :required="props.required" :error="error_msg">
        <InputText type="text" v-bind="attrs" v-model="temp_value" v-maska:unmaskedValue.unmasked="maskValue" placeholder="0000 0000 0000 0000" autoClear="false" slotChar=" " @blur="checkDone()" />
    </InputBase>
</template>

<script setup lang="ts">
    import { vMaska } from 'maska/vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import InputText from 'primevue/inputtext';
    import { isValidCreditCard } from '@maxvue/max-use';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            label?: string | undefined;
            required?: boolean;
        }>(),
        { modelValue: '', label: 'Número do cartão', required: false }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
    }>();

    const toText = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

    const temp_value = ref(toText(props.modelValue));
    const unmaskedValue = ref('');

    const isDone = ref<boolean | null>(null);

    const done = computed(() => isDone.value ?? (unmaskedValue.value.length > 0 ? isValidCreditCard(unmaskedValue.value) : null));

    const checkDone = () => {
        isDone.value = unmaskedValue.value.length > 0 ? isValidCreditCard(unmaskedValue.value) : (props.required ? false : null);
    };

    const error_msg = computed(() => {
        if (isDone.value === false) return unmaskedValue.value.length === 0 ? 'Campo obrigatório' : 'Número de cartão inválido';
        return null;
    });

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ }
        };

        return {
            tokens: tokens,
            mask: '#### #### #### ####'
        };
    });

    watch(unmaskedValue, () => {
        emit('update:modelValue', unmaskedValue.value);
        if (isDone.value !== null) checkDone();
    });

    watch(
        () => props.modelValue,
        () => {
            temp_value.value = toText(props.modelValue);
        }
    );

    defineExpose({ unmaskedValue });
</script>

<style lang="scss">
.input-credit-card-number-base {
    input {
        letter-spacing: 2px;
    }
}
</style>
