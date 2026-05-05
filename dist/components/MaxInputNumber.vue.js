const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: null, done: undefined, required: false, caution: undefined });
const primevueInput = ref();
const temp_value = ref(props.modelValue);
const emit = defineEmits(['update:modelValue']);
const isDone = ref(props.done ?? null);
const checkDone = () => isDone.value = done.value;
const done = computed(() => {
    if (props.done !== undefined)
        return props.done;
    if (props.required)
        return temp_value.value !== null && temp_value.value !== undefined;
    return null;
});
const caution = computed(() => {
    if (props.caution !== undefined)
        return props.caution;
    if (temp_value.value === null && !props.required)
        return false;
    return done.value === false;
});
const error_msg = computed(() => {
    if (!caution.value)
        return null;
    const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
    if (props.required && temp_value.value === null)
        return attrs_error_message ?? 'Campo obrigatório';
    return attrs_error_message ?? 'Valor inválido';
});
watch(temp_value, () => {
    emit('update:modelValue', temp_value.value);
    isDone.value = done.value;
});
watch(() => props.modelValue, () => temp_value.value = props.modelValue);
onMounted(() => temp_value.value = props.modelValue);
const setFocus = () => {
    if (primevueInput.value)
        if (typeof primevueInput.value.focus === 'function')
            primevueInput.value.focus();
        else
            primevueInput.value.$el.focus();
};
const __VLS_exposed = setFocus;
defineExpose(__VLS_exposed);
const __VLS_defaults = { modelValue: null, done: undefined, required: false, caution: undefined };
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
    value: (__VLS_ctx.temp_value),
    done: (__VLS_ctx.isDone),
    caution: (__VLS_ctx.caution),
    error: (__VLS_ctx.error_msg),
}));
const __VLS_2 = __VLS_1({
    ...(props),
    value: (__VLS_ctx.temp_value),
    done: (__VLS_ctx.isDone),
    caution: (__VLS_ctx.caution),
    error: (__VLS_ctx.error_msg),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.InputNumber} */
InputNumber;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onBlur': {} },
    ref: "primevueInput",
    ...(__VLS_ctx.attrs),
    fluid: true,
    modelValue: (__VLS_ctx.temp_value),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onBlur': {} },
    ref: "primevueInput",
    ...(__VLS_ctx.attrs),
    fluid: true,
    modelValue: (__VLS_ctx.temp_value),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.checkDone();
            // @ts-ignore
            [temp_value, temp_value, isDone, caution, error_msg, attrs, checkDone,];
        } });
var __VLS_14 = {};
var __VLS_10;
var __VLS_11;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_15 = __VLS_14;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => __VLS_exposed,
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
