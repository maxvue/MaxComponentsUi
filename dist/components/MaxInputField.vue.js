const attrs = useAttrs();
const is_number = computed(() => attrs.prefix !== undefined || attrs.suffix !== undefined || attrs.number !== undefined);
const props = withDefaults(defineProps(), { modelValue: '' });
const primevueInput = ref();
const temp_value = ref(props.modelValue);
const emit = defineEmits(['update:modelValue']);
watch(temp_value, () => {
    emit('update:modelValue', temp_value.value);
});
watch(() => props.modelValue, () => {
    temp_value.value = props.modelValue;
});
const focused = ref(0);
const blured = ref(0);
const done = computed(() => {
    if (attrs.name !== undefined && (temp_value.value ?? '').toString().length > 0)
        return true;
    if (attrs.names !== undefined && (temp_value.value ?? '').toString().length > 4 && (temp_value.value ?? '').toString().split(' ').length > 1)
        return true;
    if (attrs.numbers !== undefined && String(temp_value.value).replace(/\D/g, '').length > 1)
        return true;
    if (attrs.number !== undefined && String(temp_value.value).replace(/\D/g, '').length > 0)
        return true;
    return null;
});
const caution = computed(() => {
    const isReq = attrs.required !== undefined ? true : (temp_value.value ?? '').toString().length > 0;
    if (isReq && focused.value > 0 && focused.value === blured.value)
        return done.value === null ? false : !done.value;
    return false;
});
const error_msg = computed(() => {
    if (caution.value && (temp_value.value ?? '').toString().length === 0)
        return 'Campo obrigatório';
    if (caution.value && (temp_value.value ?? '').toString().length > 0)
        return 'Valor Inválido';
    return false;
});
onMounted(() => {
    temp_value.value = props.modelValue;
});
const setFocus = () => {
    if (primevueInput.value)
        if (typeof primevueInput.value.focus === 'function')
            primevueInput.value.focus();
        else if (primevueInput.value.$el && typeof primevueInput.value.$el.focus === 'function')
            primevueInput.value.$el.focus();
};
const __VLS_exposed = {
    setFocus
};
defineExpose(__VLS_exposed);
const __VLS_defaults = { modelValue: '' };
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
    ...(__VLS_ctx.attrs),
    done: (__VLS_ctx.done),
    caution: (__VLS_ctx.caution),
    error: (__VLS_ctx.error_msg ? (__VLS_ctx.attrs.error ?? __VLS_ctx.error_msg) : false),
}));
const __VLS_2 = __VLS_1({
    ...(__VLS_ctx.attrs),
    done: (__VLS_ctx.done),
    caution: (__VLS_ctx.caution),
    error: (__VLS_ctx.error_msg ? (__VLS_ctx.attrs.error ?? __VLS_ctx.error_msg) : false),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
if (!__VLS_ctx.is_number) {
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.InputText} */
    InputText;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onFocus': {} },
        ...{ 'onBlur': {} },
        ref: "primevueInput",
        type: "text",
        ...(__VLS_ctx.attrs),
        modelValue: (__VLS_ctx.temp_value),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onFocus': {} },
        ...{ 'onBlur': {} },
        ref: "primevueInput",
        type: "text",
        ...(__VLS_ctx.attrs),
        modelValue: (__VLS_ctx.temp_value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ focus: {} },
        { onFocus: (...[$event]) => {
                if (!(!__VLS_ctx.is_number))
                    return;
                __VLS_ctx.focused++;
                // @ts-ignore
                [attrs, attrs, attrs, done, caution, error_msg, error_msg, is_number, temp_value, focused,];
            } });
    const __VLS_14 = ({ blur: {} },
        { onBlur: (...[$event]) => {
                if (!(!__VLS_ctx.is_number))
                    return;
                __VLS_ctx.blured++;
                // @ts-ignore
                [blured,];
            } });
    __VLS_asFunctionalDirective(__VLS_directives.vTooltip, {})(null, { ...__VLS_directiveBindingRestFields, modifiers: { focus: true, top: true, }, value: (__VLS_ctx.attrs.tooltipFocus) }, null, null);
    var __VLS_15 = {};
    var __VLS_10;
    var __VLS_11;
}
else {
    let __VLS_17;
    /** @ts-ignore @type { | typeof __VLS_components.InputNumber} */
    InputNumber;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        ...(__VLS_ctx.attrs),
        fluid: true,
        modelValue: (__VLS_ctx.temp_value),
    }));
    const __VLS_19 = __VLS_18({
        ...(__VLS_ctx.attrs),
        fluid: true,
        modelValue: (__VLS_ctx.temp_value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
}
// @ts-ignore
[attrs, attrs, temp_value, vTooltip,];
var __VLS_3;
// @ts-ignore
var __VLS_16 = __VLS_15;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => __VLS_exposed,
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
