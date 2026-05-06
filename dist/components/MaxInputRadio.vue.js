const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: null, value: null });
const emit = defineEmits(['update:modelValue']);
const temp_value = ref(props.modelValue);
watch(temp_value, (val) => emit('update:modelValue', val));
watch(() => props.modelValue, (val) => temp_value.value = val);
const id = Random();
const button = ref();
const onClick = () => {
    if (button.value && button.value.$el) {
        const input = button.value.$el.querySelector('input');
        if (input)
            input.click();
    }
};
const __VLS_defaults = { modelValue: null, value: null };
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
    ...{ onClick: (__VLS_ctx.onClick) },
    ...{ class: "radio-button-input-main-div" },
});
/** @type {__VLS_StyleScopedClasses['radio-button-input-main-div']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.RadioButton} */
RadioButton;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...(__VLS_ctx.attrs),
    inputId: (__VLS_ctx.id),
    name: (__VLS_ctx.name ?? 'radio-group'),
    ref: "button",
    modelValue: (__VLS_ctx.temp_value),
    value: (__VLS_ctx.value),
}));
const __VLS_2 = __VLS_1({
    ...(__VLS_ctx.attrs),
    inputId: (__VLS_ctx.id),
    name: (__VLS_ctx.name ?? 'radio-group'),
    ref: "button",
    modelValue: (__VLS_ctx.temp_value),
    value: (__VLS_ctx.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
var __VLS_3;
if (__VLS_ctx.attrs.label) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    (__VLS_ctx.attrs.label);
}
if (__VLS_ctx.attrs.icon) {
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        icon: (__VLS_ctx.attrs.icon),
    }));
    const __VLS_9 = __VLS_8({
        icon: (__VLS_ctx.attrs.icon),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
}
// @ts-ignore
var __VLS_6 = __VLS_5;
// @ts-ignore
[onClick, attrs, attrs, attrs, attrs, attrs, id, name, temp_value, value,];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
