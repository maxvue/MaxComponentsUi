import { parsePhoneNumberFromString } from 'libphonenumber-js';
const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '', done: undefined, required: false, caution: undefined });
const emit = defineEmits(['update:modelValue']);
const method = ref();
const name_method = ref('Email ou Whatsapp');
const temp_value = ref(props.modelValue);
const iconLeft = computed(() => (method.value === 'whatsapp' ? (attrs.icon ?? attrs.icon_left ?? attrs['icon-left'] ?? 'ic:baseline-whatsapp') : 'prime:at'));
const isDone = ref(props.done ?? null);
const checkDone = () => {
    isDone.value = done.value;
};
const done = computed(() => {
    if (props.done !== undefined)
        return props.done;
    if (temp_value.value === '')
        return props.required ? false : null;
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
    if (phoneNumber && phoneNumber.isValid())
        return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(temp_value.value);
});
const caution = computed(() => {
    if (props.caution !== undefined)
        return props.caution;
    if (temp_value.value === '' && !props.required)
        return false;
    return done.value === false;
});
const error_msg = computed(() => {
    if (!caution.value)
        return null;
    const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
    if (props.required && temp_value.value === '')
        return attrs_error_message ?? 'Campo obrigatório';
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
    if (only_letters.length > 1)
        return {
            tokens: tokens,
            mask: maskMail()
        };
    if (only_numbers.length > 1)
        return {
            tokens: tokens,
            mask: maskPhone(only_numbers)
        };
    return {
        tokens: tokens,
        mask: '%'
    };
});
const maskPhone = (value) => {
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
    if (isDone.value !== null)
        isDone.value = done.value;
});
watch(() => props.modelValue, () => {
    temp_value.value = props.modelValue;
});
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
const __VLS_defaults = { modelValue: '', done: undefined, required: false, caution: undefined };
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.InputBase | typeof __VLS_components.InputBase} */
InputBase;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...(props),
    ...{ class: "input-base-phone-mail-main-div" },
    label: (__VLS_ctx.attrs.label ?? __VLS_ctx.name_method),
    icon: (__VLS_ctx.iconLeft),
    done: (__VLS_ctx.done ?? undefined),
    caution: (__VLS_ctx.caution),
    error: (__VLS_ctx.error_msg),
}));
const __VLS_2 = __VLS_1({
    ...(props),
    ...{ class: "input-base-phone-mail-main-div" },
    label: (__VLS_ctx.attrs.label ?? __VLS_ctx.name_method),
    icon: (__VLS_ctx.iconLeft),
    done: (__VLS_ctx.done ?? undefined),
    caution: (__VLS_ctx.caution),
    error: (__VLS_ctx.error_msg),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['input-base-phone-mail-main-div']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.InputText} */
InputText;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onBlur': {} },
    type: "text",
    ...(__VLS_ctx.attrs),
    modelValue: (__VLS_ctx.temp_value),
    autoClear: "false",
    slotChar: " ",
    placeholder: (__VLS_ctx.attrs.email !== undefined || __VLS_ctx.attrs.mail !== undefined ? 'usuario@email.com' : '(99) 9 9999 - 9999'),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onBlur': {} },
    type: "text",
    ...(__VLS_ctx.attrs),
    modelValue: (__VLS_ctx.temp_value),
    autoClear: "false",
    slotChar: " ",
    placeholder: (__VLS_ctx.attrs.email !== undefined || __VLS_ctx.attrs.mail !== undefined ? 'usuario@email.com' : '(99) 9 9999 - 9999'),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.checkDone();
            // @ts-ignore
            [attrs, attrs, attrs, attrs, name_method, iconLeft, done, caution, error_msg, temp_value, checkDone,];
        } });
__VLS_asFunctionalDirective(__VLS_directives.vMaska, {})(null, { ...__VLS_directiveBindingRestFields, arg: 'unmaskedValue', modifiers: { unmasked: true, }, value: (__VLS_ctx.maskValue) }, null, null);
var __VLS_10;
var __VLS_11;
// @ts-ignore
[vMaska, maskValue,];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
