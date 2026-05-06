const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '', options: () => [], done: undefined, required: false, caution: undefined });
const list = computed(() => props.options ?? []);
const search_value = ref(props.modelValue);
const filtered_values = ref([]);
const search_value_string = computed(() => {
    if (search_value.value && typeof search_value.value === 'string')
        return search_value.value;
    if (search_value.value && typeof search_value.value === 'object')
        return search_value.value?.value ?? search_value.value?.label ?? search_value.value?.id ?? search_value.value[attrs.optionValue ?? 'value'] ?? '';
    return '';
});
const isDone = ref(props.done ?? null);
const isRequiredDone = computed(() => (props.required ? hasContent(search_value_string.value) : null));
const testIsDone = () => {
    if (props.done !== undefined)
        return props.done;
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
    if (isRequiredDone.value === false)
        return attrs_error_message ?? 'Campo obrigatório';
    return attrs_error_message ?? 'Valor inválido';
});
const emit = defineEmits(['update:modelValue']);
watch(search_value, () => {
    isDone.value = testIsDone();
    if (search_value.value && typeof search_value.value !== 'string')
        emit('update:modelValue', search_value.value);
});
watch(() => props.modelValue, () => {
    search_value.value = props.modelValue;
});
const search = () => {
    filtered_values.value = list.value.filter((item) => {
        const search = (item.value ?? '') + (item.label ?? '') + (item.name ?? '') + (item[attrs.optionValue ?? 'value'] ?? '');
        return toSearchableString(search).toLowerCase().includes(toSearchableString(search_value_string.value));
    });
};
const __VLS_defaults = { modelValue: '', options: () => [], done: undefined, required: false, caution: undefined };
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
    ...{ class: "if" },
    value: (__VLS_ctx.search_value),
    done: (__VLS_ctx.isDone),
    error: (__VLS_ctx.error_msg),
    caution: (__VLS_ctx.caution),
}));
const __VLS_2 = __VLS_1({
    ...(props),
    ...{ class: "if" },
    value: (__VLS_ctx.search_value),
    done: (__VLS_ctx.isDone),
    error: (__VLS_ctx.error_msg),
    caution: (__VLS_ctx.caution),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['if']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.AutoComplete | typeof __VLS_components.AutoComplete} */
AutoComplete;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onComplete': {} },
    ...{ 'onBlur': {} },
    ...(__VLS_ctx.attrs),
    optionLabel: "name",
    suggestions: (__VLS_ctx.filtered_values),
    forceSelection: (true),
    virtualScrollerOptions: ({ itemSize: 40 }),
    modelValue: (__VLS_ctx.search_value),
    placeholder: (__VLS_ctx.attrs.placeholder ?? 'SELECIONE'),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onComplete': {} },
    ...{ 'onBlur': {} },
    ...(__VLS_ctx.attrs),
    optionLabel: "name",
    suggestions: (__VLS_ctx.filtered_values),
    forceSelection: (true),
    virtualScrollerOptions: ({ itemSize: 40 }),
    modelValue: (__VLS_ctx.search_value),
    placeholder: (__VLS_ctx.attrs.placeholder ?? 'SELECIONE'),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ complete: {} },
    { onComplete: (__VLS_ctx.search) });
const __VLS_14 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.isDone = __VLS_ctx.testIsDone();
            // @ts-ignore
            [search_value, search_value, isDone, isDone, error_msg, caution, attrs, attrs, filtered_values, search, testIsDone,];
        } });
const { default: __VLS_15 } = __VLS_10.slots;
{
    const { option: __VLS_16 } = __VLS_10.slots;
    const [slotProps] = __VLS_vSlot(__VLS_16);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "autocomplete-item-select" },
    });
    /** @type {__VLS_StyleScopedClasses['autocomplete-item-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "autocomplete-item-select-label" },
    });
    /** @type {__VLS_StyleScopedClasses['autocomplete-item-select-label']} */ ;
    (slotProps.option[__VLS_ctx.attrs.optionLabel ?? 'label'] ?? slotProps.option.label);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "autocomplete-item-select-sub-label" },
    });
    /** @type {__VLS_StyleScopedClasses['autocomplete-item-select-sub-label']} */ ;
    (slotProps.option.subLabel ?? slotProps.option.sublabel ?? slotProps.option['sub-label']);
    // @ts-ignore
    [attrs,];
}
{
    const { content: __VLS_17 } = __VLS_10.slots;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
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
