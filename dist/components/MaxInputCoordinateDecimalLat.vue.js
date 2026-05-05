const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '', done: undefined, required: false, caution: undefined });
const emit = defineEmits(['update:modelValue', 'complete']);
const temp_value = ref(toNumber(props.modelValue) !== 0 ? toNumber(props.modelValue) : '');
const only_numbers = computed(() => toNumber(temp_value.value));
const isDone = ref(props.done ?? null);
const checkDone = () => {
    isDone.value = done.value;
};
const done = computed(() => {
    if (props.done !== undefined)
        return props.done;
    return !(only_numbers.value < -33.8 || only_numbers.value > 5.3 || only_numbers.value === 0 || isNaN(only_numbers.value));
});
const caution = computed(() => {
    if (props.caution !== undefined)
        return props.caution;
    if (temp_value.value === '')
        return false;
    return !done.value;
});
const error_msg = computed(() => {
    if (!caution.value)
        return null;
    const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
    if (temp_value.value === '' && props.required)
        return attrs_error_message ?? 'Campo obrigatório';
    return attrs_error_message ?? 'Latitude inválida (Brasil)';
});
const negative = ref(false);
const maskValue = computed(() => {
    const tokens = {
        '#': { pattern: /[0-9]/ },
        '9': { pattern: /[0-9]/, optional: true },
        '3': { pattern: /[0-3-]/, optional: true }
    };
    return {
        tokens: tokens,
        mask: negative.value ? '-39.######' : '33.######',
        eager: true
    };
});
watch(temp_value, () => {
    if (temp_value?.value < 0)
        negative.value = true;
    emit('update:modelValue', temp_value.value);
    if (done.value)
        emit('complete', temp_value.value);
}, { immediate: true });
watch(() => props.modelValue, () => {
    temp_value.value = props.modelValue;
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
    error: (__VLS_ctx.error_msg),
    caution: (__VLS_ctx.caution),
    done: (__VLS_ctx.isDone),
}));
const __VLS_2 = __VLS_1({
    ...(props),
    error: (__VLS_ctx.error_msg),
    caution: (__VLS_ctx.caution),
    done: (__VLS_ctx.isDone),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.InputText} */
InputText;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onBlur': {} },
    number: true,
    type: "text",
    modelValue: (__VLS_ctx.temp_value),
    autoClear: "false",
    slotChar: " ",
    fluid: true,
    placeholder: (`00,000000`),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onBlur': {} },
    number: true,
    type: "text",
    modelValue: (__VLS_ctx.temp_value),
    autoClear: "false",
    slotChar: " ",
    fluid: true,
    placeholder: (`00,000000`),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.checkDone();
            // @ts-ignore
            [error_msg, caution, isDone, temp_value, checkDone,];
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
