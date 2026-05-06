import { vMaska } from 'maska/vue';
const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '', loading: false, done: undefined, required: false, caution: undefined });
const emit = defineEmits(['update:modelValue', 'complete']);
const temp_value = ref(formatCep(props.modelValue));
const temp_value_numbers = computed(() => onlyNumbers(temp_value.value ?? ''));
const maskValue = computed(() => ({ tokens: { '#': { pattern: /[0-9]/ } }, mask: '##.### - ###' }));
const isValidCep = computed(() => cepIsValid(temp_value_numbers.value));
const isDone = ref(props.done ?? null);
const checkDone = () => {
    isDone.value = done.value;
};
const done = computed(() => {
    if (props.done !== undefined)
        return props.done ?? null;
    if (temp_value_numbers.value.length > 0)
        return isValidCep.value;
    return null;
});
const caution = computed(() => {
    if (props.caution !== undefined)
        return props.caution;
    return done.value === false && temp_value_numbers.value.length > 0;
});
const error_msg = computed(() => {
    if (!caution.value)
        return null;
    const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
    if (temp_value_numbers.value.length === 0 && props.required)
        return attrs_error_message ?? 'Campo obrigatório';
    return attrs_error_message ?? 'CEP inválido';
});
watch(temp_value, () => {
    const numbers = onlyNumbers(temp_value.value);
    emit('update:modelValue', numbers);
    if (isValidCep.value)
        emit('complete', numbers);
});
watch(() => props.modelValue, () => {
    const numbers = onlyNumbers(props.modelValue);
    if (numbers !== onlyNumbers(temp_value.value))
        temp_value.value = numbers;
});
const __VLS_defaults = { modelValue: '', loading: false, done: undefined, required: false, caution: undefined };
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
    value: (__VLS_ctx.temp_value),
    done: (__VLS_ctx.done ?? undefined),
    caution: (__VLS_ctx.caution),
    error: (__VLS_ctx.error_msg ?? undefined),
    iconRight: (__VLS_ctx.loading ? 'loading' : undefined),
}));
const __VLS_2 = __VLS_1({
    ...(props),
    ...{ class: "input-base-phone-mail-main-div" },
    value: (__VLS_ctx.temp_value),
    done: (__VLS_ctx.done ?? undefined),
    caution: (__VLS_ctx.caution),
    error: (__VLS_ctx.error_msg ?? undefined),
    iconRight: (__VLS_ctx.loading ? 'loading' : undefined),
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
    modelValue: (__VLS_ctx.temp_value),
    autoClear: "false",
    slotChar: " ",
    placeholder: "00 . 000 - 000",
}));
const __VLS_9 = __VLS_8({
    ...{ 'onBlur': {} },
    type: "text",
    modelValue: (__VLS_ctx.temp_value),
    autoClear: "false",
    slotChar: " ",
    placeholder: "00 . 000 - 000",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.checkDone();
            // @ts-ignore
            [temp_value, temp_value, done, caution, error_msg, loading, checkDone,];
        } });
__VLS_asFunctionalDirective(__VLS_directives.vMaska, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.maskValue) }, null, null);
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
