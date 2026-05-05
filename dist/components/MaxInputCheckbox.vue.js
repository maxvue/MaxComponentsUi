const attrs = useAttrs();
const id = Random();
const props = withDefaults(defineProps(), { modelValue: false });
const temp_value = ref(props.modelValue);
const emit = defineEmits(['update:modelValue']);
watch(temp_value, (val) => {
    emit('update:modelValue', val);
});
watch(() => props.modelValue, (val) => {
    temp_value.value = val;
});
const __VLS_defaults = { modelValue: false };
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
    ...{ class: (`checkbox-input-main-div ${!__VLS_ctx.label ? 'no-label' : ''}`) },
});
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Checkbox} */
Checkbox;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.temp_value),
    inputId: (__VLS_ctx.id),
    binary: true,
    ...(__VLS_ctx.attrs),
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.temp_value),
    inputId: (__VLS_ctx.id),
    binary: true,
    ...(__VLS_ctx.attrs),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
if (__VLS_ctx.label) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "label-checkbox" },
    });
    /** @type {__VLS_StyleScopedClasses['label-checkbox']} */ ;
    (__VLS_ctx.label);
}
// @ts-ignore
[label, label, label, temp_value, id, attrs,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
