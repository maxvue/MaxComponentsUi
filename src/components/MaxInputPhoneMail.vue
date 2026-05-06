<template>
    <InputBase v-bind="props" class="input-base-phone-mail-main-div" :label="attrs.label ?? name_method" :icon="iconLeft" :done="done ?? undefined" :caution="caution" :error="error_msg">
        <InputText type="text" v-bind="attrs" v-model="temp_value" v-maska:unmaskedValue.unmasked="maskValue" autoClear="false" slotChar=" " @blur="checkDone()" :placeholder="attrs.email !== undefined || attrs.mail !== undefined ? 'usuario@email.com' : '(99) 9 9999 - 9999'" />
    </InputBase>
</template>

<script setup lang="ts">
    import { onlyNumbers, onlyLetters } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, onMounted, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import InputText from 'primevue/inputtext';
    import { vMaska } from 'maska/vue';
    import { parsePhoneNumberFromString } from 'libphonenumber-js';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
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

    const emit = defineEmits(['update:modelValue']);

    const method = ref();
    const name_method = ref('Email ou Whatsapp');

    const temp_value = ref(props.modelValue);
    const iconLeft = computed(() => (method.value === 'whatsapp' ? (attrs.icon ?? attrs.icon_left ?? attrs['icon-left'] ?? 'ic:baseline-whatsapp') : 'prime:at'));

    const isDone: Ref = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = done.value;
    };

    const done = computed<boolean | null>(() => {
        if (props.done !== undefined) return props.done;
        if (temp_value.value === '') return props.required ? false : null;
        if (method.value === 'whatsapp') {
            const phoneNumber = parsePhoneNumberFromString(temp_value.value, 'BR');
            return phoneNumber ? phoneNumber.isValid() : false;
        }
        if (method.value === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(temp_value.value);
        }
        // If neither, test both
        const phoneNumber = parsePhoneNumberFromString(temp_value.value, 'BR');
        if (phoneNumber && phoneNumber.isValid()) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(temp_value.value);
    });

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        if (temp_value.value === '' && !props.required) return false;
        return done.value === false;
    });

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (props.required && temp_value.value === '') return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Valor inválido';
    });

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[a-zA-Z0-9@]/ },
            '@': { pattern: /[a-zA-Z0-9@(.+_-]/ },
            '%': { pattern: /[a-zA-Z0-9@().+_-\s]/, optional: true, repeated: true }
        };

        const only_numbers = temp_value.value ? onlyNumbers(temp_value.value) : '';
        const only_letters = temp_value.value ? onlyLetters(temp_value.value) : '';

        if (only_letters.length > 1) return {
            tokens: tokens,
            mask: maskMail()
        };

        if (only_numbers.length > 1) return {
            tokens: tokens,
            mask: maskPhone(only_numbers)
        };

        return {
            tokens: tokens,
            mask: '%'
        };
    });

    const maskPhone = (value: string) => {
        name_method.value = 'Whatsapp';
        return value[2] === '9' || value[2] === '8' || value[2] === '7' || value[2] === '6' ? '+55 (##) 9 #### - ####' : '+55 (##) #### - ####$';
    };

    const maskMail = () => {
        name_method.value = 'Email';
        method.value = 'email';
        temp_value.value = temp_value.value ? temp_value.value.replace(/[()\-\s]/g, '') : '';
        return '%';
    };

    watch(temp_value, () => {
        emit('update:modelValue', temp_value.value);
        if(isDone.value !== null) isDone.value = done.value;
    });

    watch(
        () => props.modelValue,
        () => {
            temp_value.value = props.modelValue;
        }
    );

    onMounted(() => {
        if (attrs.phone !== undefined || attrs.whatsapp !== undefined || attrs.zap !== undefined) {
            method.value = 'whatsapp';
            name_method.value = 'Whatsapp';
        }
        if (attrs.email !== undefined || attrs['e-mail'] !== undefined || attrs.mail !== undefined) {
            method.value = 'email';
            name_method.value = 'Email';
        }
    });
</script>

<style lang="scss" scoped>
    input {
        grid-column: 2;
        position: relative;
    }
</style>
