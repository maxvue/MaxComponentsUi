const router = typeof useRouter !== 'undefined' ? useRouter() : null;
const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '', done: undefined, required: false, caution: undefined });
const searchInput = ref(props.modelValue);
const list = ref([]);
watch(searchInput, async (value) => {
    if (hasContent(value)) {
        apiGetRoute(props.route, { ...(props.data ?? {}), input_value: searchInput.value }).then((res) => {
            list.value = toArray(res);
            if (isBlank(list.value) || size(list.value) === 0)
                return;
            search();
        });
        return;
    }
}, { deep: true });
const filtered_values = ref([]);
const emit = defineEmits(['update:modelValue']);
const searchInput_string = computed(() => {
    if (searchInput.value && typeof searchInput.value === 'string')
        return searchInput.value;
    if (searchInput.value && typeof searchInput.value === 'object')
        return searchInput.value?.value ?? searchInput.value?.label ?? searchInput.value?.id ?? searchInput.value[attrs.optionValue ?? 'value'] ?? '';
    return '';
});
const isDone = ref(props.done ?? null);
const isRequiredDone = computed(() => (props.required ? hasContent(searchInput_string.value) : null));
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
watch(searchInput, () => {
    isDone.value = testIsDone();
    if (searchInput.value && typeof searchInput.value !== 'string')
        emit('update:modelValue', searchInput.value);
});
watch(() => props.modelValue, () => {
    searchInput.value = props.modelValue;
});
const search = () => {
    if (hasContent(list.value))
        filtered_values.value = list.value.filter((item) => {
            const searchStr = (item.value ?? '') + (item.label ?? '') + (item.name ?? '') + (item[attrs.optionValue ?? 'value'] ?? '');
            return toSearchableString(searchStr).toLowerCase().includes(toSearchableString(searchInput_string.value));
        });
};
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
/** @ts-ignore @type { | typeof __VLS_components.InputBase | typeof __VLS_components.InputBase} */
InputBase;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...(props),
    ...{ class: "if" },
    value: (__VLS_ctx.searchInput),
    done: (__VLS_ctx.isDone),
    error: (__VLS_ctx.error_msg),
    caution: (__VLS_ctx.caution),
}));
const __VLS_2 = __VLS_1({
    ...(props),
    ...{ class: "if" },
    value: (__VLS_ctx.searchInput),
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
    optionLabel: "label",
    suggestions: (__VLS_ctx.filtered_values),
    forceSelection: (true),
    virtualScrollerOptions: ({ itemSize: 40 }),
    modelValue: (__VLS_ctx.searchInput),
    placeholder: (__VLS_ctx.attrs.placeholder ?? 'SELECIONE'),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onComplete': {} },
    ...{ 'onBlur': {} },
    ...(__VLS_ctx.attrs),
    optionLabel: "label",
    suggestions: (__VLS_ctx.filtered_values),
    forceSelection: (true),
    virtualScrollerOptions: ({ itemSize: 40 }),
    modelValue: (__VLS_ctx.searchInput),
    placeholder: (__VLS_ctx.attrs.placeholder ?? 'SELECIONE'),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ complete: {} },
    { onComplete: (__VLS_ctx.search) });
const __VLS_14 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.isDone = __VLS_ctx.testIsDone();
            // @ts-ignore
            [searchInput, searchInput, isDone, isDone, error_msg, caution, attrs, attrs, filtered_values, search, testIsDone,];
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
    (slotProps.option.sub_label);
    // @ts-ignore
    [];
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
