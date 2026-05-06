const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: false, trueValue: true, falseValue: false });
const emit = defineEmits(['update:modelValue']);
const modelvalue = ref(props.modelValue);
watch(modelvalue, (val) => {
    emit('update:modelValue', val);
});
watch(() => props.modelValue, (val) => {
    modelvalue.value = val;
});
const trueLabel = computed(() => props.trueLabel ?? attrs.labelTrue ?? attrs['true-label'] ?? null);
const falseLabel = computed(() => props.falseLabel ?? attrs.labelFalse ?? attrs['false-label'] ?? null);
const trueValue = computed(() => props.trueValue ?? true);
const falseValue = computed(() => props.falseValue ?? false);
const update_value = () => {
    emit('update:modelValue', modelvalue.value);
};
const __VLS_defaults = { modelValue: false, trueValue: true, falseValue: false };
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: (`input-toggle-field-main-div ${__VLS_ctx.attrs.label !== undefined ? 'labeled' : ''}`) },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: (`input-toggle-field-label-main-div ${__VLS_ctx.attrs.labelCenter !== undefined ? 'label-center' : ''}`) },
});
if (__VLS_ctx.attrs.label !== undefined) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "input-toggle-field-label-div" },
    });
    /** @type {__VLS_StyleScopedClasses['input-toggle-field-label-div']} */ ;
    (__VLS_ctx.attrs.label);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: (`input-toggle-field-input-div ${__VLS_ctx.attrs.label !== undefined ? 'labeled' : ''}`) },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: (`input-toggle-field ${__VLS_ctx.attrs.label !== undefined ? 'labeled' : ''}`) },
});
if (__VLS_ctx.falseLabel) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: (`input-toggle-field-label ${__VLS_ctx.falseValue === __VLS_ctx.modelvalue ? 'active' : ''}`) },
    });
    (__VLS_ctx.falseLabel ?? '');
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-toggle-field-input" },
});
/** @type {__VLS_StyleScopedClasses['input-toggle-field-input']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.ToggleSwitch} */
ToggleSwitch;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onChange': {} },
    ...(__VLS_ctx.attrs),
    modelValue: (__VLS_ctx.modelvalue),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onChange': {} },
    ...(__VLS_ctx.attrs),
    modelValue: (__VLS_ctx.modelvalue),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ change: {} },
    { onChange: (__VLS_ctx.update_value) });
var __VLS_3;
var __VLS_4;
if (__VLS_ctx.trueLabel) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: (`input-toggle-field-label ${__VLS_ctx.trueValue === __VLS_ctx.modelvalue ? 'active' : ''}`) },
    });
    (__VLS_ctx.trueLabel ?? '');
}
// @ts-ignore
[attrs, attrs, attrs, attrs, attrs, attrs, attrs, falseLabel, falseLabel, falseValue, modelvalue, modelvalue, modelvalue, update_value, trueLabel, trueLabel, trueValue,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
