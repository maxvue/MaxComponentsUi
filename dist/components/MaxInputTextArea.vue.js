const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '' });
const isDone = ref(props.done ?? null);
const checkDone = () => {
    isDone.value = props.done ?? null;
};
const emit = defineEmits(['update:modelValue']);
const temp_value = ref(props.modelValue);
watch(temp_value, () => {
    emit('update:modelValue', temp_value.value);
}, { immediate: true });
watch(() => props.modelValue, (val) => temp_value.value = val);
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
    ...{ class: "input-text-area-main-div" },
}));
const __VLS_2 = __VLS_1({
    ...(__VLS_ctx.attrs),
    ...{ class: "input-text-area-main-div" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['input-text-area-main-div']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.Textarea} */
Textarea;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onBlur': {} },
    ...(__VLS_ctx.attrs),
    autoResize: (__VLS_ctx.attrs.autoResize !== false && __VLS_ctx.attrs['auto-resize'] !== false),
    rows: (__VLS_ctx.attrs.rows ?? 3),
    modelValue: (__VLS_ctx.temp_value),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onBlur': {} },
    ...(__VLS_ctx.attrs),
    autoResize: (__VLS_ctx.attrs.autoResize !== false && __VLS_ctx.attrs['auto-resize'] !== false),
    rows: (__VLS_ctx.attrs.rows ?? 3),
    modelValue: (__VLS_ctx.temp_value),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.checkDone();
            // @ts-ignore
            [attrs, attrs, attrs, attrs, attrs, temp_value, checkDone,];
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
