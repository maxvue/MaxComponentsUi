const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '', isLoading: false });
const emit = defineEmits(['update:modelValue', 'search']);
const temp_value = ref(props.modelValue);
watch(temp_value, (val) => emit('update:modelValue', val));
watch(() => props.modelValue, (val) => temp_value.value = val);
let debounceTimer;
const onInput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (temp_value.value && temp_value.value.length > 1)
            emit('search', temp_value.value);
    }, 300);
};
const __VLS_defaults = { modelValue: '', isLoading: false };
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
    ...{ class: "input-search-main-div" },
    iconRight: (__VLS_ctx.isLoading === true ? 'line-md:loading-twotone-loop' : 'material-symbols:search-rounded'),
}));
const __VLS_2 = __VLS_1({
    ...(__VLS_ctx.attrs),
    ...{ class: "input-search-main-div" },
    iconRight: (__VLS_ctx.isLoading === true ? 'line-md:loading-twotone-loop' : 'material-symbols:search-rounded'),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['input-search-main-div']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.InputText} */
InputText;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onInput': {} },
    type: "text",
    ...(__VLS_ctx.attrs),
    fluid: true,
    modelValue: (__VLS_ctx.temp_value),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onInput': {} },
    type: "text",
    ...(__VLS_ctx.attrs),
    fluid: true,
    modelValue: (__VLS_ctx.temp_value),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ input: {} },
    { onInput: (__VLS_ctx.onInput) });
var __VLS_10;
var __VLS_11;
// @ts-ignore
[attrs, attrs, isLoading, temp_value, onInput,];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
