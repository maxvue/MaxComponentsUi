const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: false, done: undefined, required: false, caution: undefined });
const emit = defineEmits(['update:modelValue']);
const temp_value = ref(props.modelValue);
const isDone = ref(props.done ?? null);
const caution = computed(() => {
    if (props.caution !== undefined)
        return props.caution;
    return isDone.value === false;
});
watch(temp_value, () => {
    isDone.value = props.done ?? null;
    emit('update:modelValue', temp_value.value);
}, { immediate: true });
watch(() => props.modelValue, (val) => {
    temp_value.value = val;
});
const __VLS_defaults = { modelValue: false, done: undefined, required: false, caution: undefined };
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
    modelValue: props.modelValue,
    ...{ class: "input-switch-main" },
    caution: (__VLS_ctx.caution),
    done: (__VLS_ctx.isDone ?? undefined),
    iconRight: (__VLS_ctx.icon ?? 'ph:toggle-right-duotone'),
}));
const __VLS_2 = __VLS_1({
    ...(props),
    modelValue: props.modelValue,
    ...{ class: "input-switch-main" },
    caution: (__VLS_ctx.caution),
    done: (__VLS_ctx.isDone ?? undefined),
    iconRight: (__VLS_ctx.icon ?? 'ph:toggle-right-duotone'),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['input-switch-main']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "input-grid-switch" },
});
/** @type {__VLS_StyleScopedClasses['input-grid-switch']} */ ;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.ToggleSwitch} */
ToggleSwitch;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...(__VLS_ctx.attrs),
    modelValue: (__VLS_ctx.temp_value),
}));
const __VLS_9 = __VLS_8({
    ...(__VLS_ctx.attrs),
    modelValue: (__VLS_ctx.temp_value),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "rotulo" },
});
/** @type {__VLS_StyleScopedClasses['rotulo']} */ ;
(__VLS_ctx.question);
// @ts-ignore
[caution, isDone, icon, attrs, temp_value, question,];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
