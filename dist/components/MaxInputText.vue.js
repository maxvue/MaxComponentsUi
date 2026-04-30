const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '', done: undefined, required: false, caution: undefined });
const temp_value = ref(props.modelValue);
const isDone = ref(props.done ?? null);
const isEqual = computed(() => {
    return typeof props.targetValue === 'string' && hasContent(props.targetValue) ? normalizeToSearch(props.targetValue) === normalizeToSearch(temp_value.value) : null;
});
const isRequiredDone = computed(() => (props.required ? hasContent(temp_value.value) : null));
const testIsDone = () => {
    if (props.done !== undefined)
        return props.done;
    if (isEqual.value !== null)
        return isEqual.value;
    if (isRequiredDone.value !== null)
        return isRequiredDone.value;
    if (props.caution !== undefined)
        return !props.caution;
    return null;
};
const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));
const error_msg = computed(() => {
    if (!caution.value)
        return null;
    const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
    if (isEqual.value === false)
        return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
    if (isRequiredDone.value === false)
        return attrs_error_message ?? 'Campo obrigatório';
    return attrs_error_message ?? 'Valor inválido';
});
const emit = defineEmits(['update:modelValue']);
watch(temp_value, () => {
    isDone.value = testIsDone();
    emit('update:modelValue', temp_value.value);
});
watch(() => props.modelValue, () => (temp_value.value = props.modelValue));
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
/** @ts-ignore @type {typeof __VLS_components.InputBase | typeof __VLS_components.InputBase} */
InputBase;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...(props),
    value: (__VLS_ctx.temp_value),
    done: (__VLS_ctx.isDone),
    error: (__VLS_ctx.error_msg),
    caution: (__VLS_ctx.caution),
}));
const __VLS_2 = __VLS_1({
    ...(props),
    value: (__VLS_ctx.temp_value),
    done: (__VLS_ctx.isDone),
    error: (__VLS_ctx.error_msg),
    caution: (__VLS_ctx.caution),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.InputText} */
InputText;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onBlur': {} },
    type: "text",
    modelValue: (__VLS_ctx.temp_value),
    fluid: true,
}));
const __VLS_9 = __VLS_8({
    ...{ 'onBlur': {} },
    type: "text",
    modelValue: (__VLS_ctx.temp_value),
    fluid: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.isDone = __VLS_ctx.testIsDone();
            // @ts-ignore
            [temp_value, temp_value, isDone, isDone, error_msg, caution, testIsDone,];
        } });
var __VLS_10;
var __VLS_11;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
