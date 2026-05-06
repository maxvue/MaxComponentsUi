<template>
    <InputBase v-bind="attrs" :done="done" :caution="caution" :error="error_msg ? (attrs.error ?? error_msg) : false">
        <InputText ref="primevueInput" v-if="!is_number" type="text" v-bind="attrs" v-model="temp_value" @focus="focused++" @blur="blured++" v-tooltip.focus.top="attrs.tooltipFocus" />
        <InputNumber v-else v-bind="attrs" fluid v-model="temp_value" />
    </InputBase>
</template>

<script setup lang="ts">
    import type { Ref } from 'vue';
    import { ref, computed, watch, onMounted, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import InputText from 'primevue/inputtext';
    import InputNumber from 'primevue/inputnumber';

    const attrs: any = useAttrs();

    const is_number = computed(() => attrs.prefix !== undefined || attrs.suffix !== undefined || attrs.number !== undefined);

    const props = withDefaults(
        defineProps<{
            modelValue: any;
        }>(),
        { modelValue: '' }
    );

    const primevueInput = ref();
    const temp_value = ref(props.modelValue);
    const emit = defineEmits(['update:modelValue']);

    watch(temp_value, () => {
        emit('update:modelValue', temp_value.value);
    });

    watch(
        () => props.modelValue,
        () => {
            temp_value.value = props.modelValue;
        }
    );

    const focused: Ref<number> = ref(0);
    const blured: Ref<number> = ref(0);

    const done = computed(() => {
        if (attrs.name !== undefined && (temp_value.value ?? '').toString().length > 0) return true;
        if (attrs.names !== undefined && (temp_value.value ?? '').toString().length > 4 && (temp_value.value ?? '').toString().split(' ').length > 1) return true;
        if (attrs.numbers !== undefined && String(temp_value.value).replace(/\D/g, '').length > 1) return true;
        if (attrs.number !== undefined && String(temp_value.value).replace(/\D/g, '').length > 0) return true;
        return null;
    });

    const caution = computed(() => {
        const isReq = attrs.required !== undefined ? true : (temp_value.value ?? '').toString().length > 0;
        if (isReq && focused.value > 0 && focused.value === blured.value) return done.value === null ? false : !done.value;
        return false;
    });

    const error_msg = computed(() => {
        if (caution.value && (temp_value.value ?? '').toString().length === 0) return 'Campo obrigatório';
        if (caution.value && (temp_value.value ?? '').toString().length > 0) return 'Valor Inválido';
        return false;
    });

    onMounted(() => {
        temp_value.value = props.modelValue;
    });

    const setFocus = () => {
        if (primevueInput.value) if (typeof primevueInput.value.focus === 'function') primevueInput.value.focus();
        else if (primevueInput.value.$el && typeof primevueInput.value.$el.focus === 'function') primevueInput.value.$el.focus();

    };

    defineExpose({
        setFocus
    });
</script>

<style lang="scss">
    .input-base-main-div {
        .p-inputnumber {
            width: 100%;
            height: 100%;
        }
    }
</style>
