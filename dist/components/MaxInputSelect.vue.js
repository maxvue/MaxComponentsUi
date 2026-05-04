const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: null });
const emit = defineEmits(['update:modelValue', 'before-show']);
const temp_value = ref(props.modelValue);
watch(temp_value, (val) => {
    emit('update:modelValue', val);
});
watch(() => props.modelValue, (val) => {
    temp_value.value = val;
});
const loading = ref(false);
const optionsField = ref([]);
const resolvedOptions = computed(() => {
    if (optionsField.value && optionsField.value.length > 0)
        return optionsField.value;
    if (props.options)
        return props.options;
    if (props.groupOptions)
        return props.groupOptions;
    if (attrs.options)
        return attrs.options;
    if (attrs.groupOptions)
        return attrs.groupOptions;
    return [];
});
async function before_show(event) {
    emit('before-show', event);
    if (props.loadOptions) {
        loading.value = true;
        try {
            optionsField.value = await props.loadOptions();
        }
        finally {
            loading.value = false;
        }
    }
}
const __VLS_defaults = { modelValue: null };
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
    ...{ class: "select_input_div" },
    options: (__VLS_ctx.resolvedOptions),
}));
const __VLS_2 = __VLS_1({
    ...(__VLS_ctx.attrs),
    ...{ class: "select_input_div" },
    options: (__VLS_ctx.resolvedOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['select_input_div']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
if (__VLS_ctx.attrs.placeholder !== undefined && (!__VLS_ctx.temp_value || __VLS_ctx.temp_value === '')) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "placeholder-select" },
    });
    /** @type {__VLS_StyleScopedClasses['placeholder-select']} */ ;
    (__VLS_ctx.attrs.placeholder);
}
if (__VLS_ctx.attrs.groupOptions || (__VLS_ctx.resolvedOptions.length > 0 && __VLS_ctx.resolvedOptions[0]?.items)) {
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.Select | typeof __VLS_components.Select} */
    Select;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onBeforeShow': {} },
        ...(__VLS_ctx.attrs),
        modelValue: (__VLS_ctx.temp_value),
        loading: (__VLS_ctx.loading),
        options: (__VLS_ctx.resolvedOptions),
        optionGroupLabel: "label",
        optionGroupChildren: "items",
        optionValue: (__VLS_ctx.attrs.optionValue ?? 'value'),
        ref: "elem",
        emptyMessage: (__VLS_ctx.attrs.emptyMessage ?? 'Nenhum registro encontrado'),
        editable: (__VLS_ctx.attrs.editable ?? false),
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onBeforeShow': {} },
        ...(__VLS_ctx.attrs),
        modelValue: (__VLS_ctx.temp_value),
        loading: (__VLS_ctx.loading),
        options: (__VLS_ctx.resolvedOptions),
        optionGroupLabel: "label",
        optionGroupChildren: "items",
        optionValue: (__VLS_ctx.attrs.optionValue ?? 'value'),
        ref: "elem",
        emptyMessage: (__VLS_ctx.attrs.emptyMessage ?? 'Nenhum registro encontrado'),
        editable: (__VLS_ctx.attrs.editable ?? false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ beforeShow: {} },
        { onBeforeShow: (...[$event]) => {
                if (!(__VLS_ctx.attrs.groupOptions || (__VLS_ctx.resolvedOptions.length > 0 && __VLS_ctx.resolvedOptions[0]?.items)))
                    return;
                __VLS_ctx.before_show;
                // @ts-ignore
                [attrs, attrs, attrs, attrs, attrs, attrs, attrs, attrs, resolvedOptions, resolvedOptions, resolvedOptions, resolvedOptions, temp_value, temp_value, temp_value, loading, before_show,];
            } });
    var __VLS_14 = {};
    const { default: __VLS_16 } = __VLS_10.slots;
    {
        const { option: __VLS_17 } = __VLS_10.slots;
        const [slotProps] = __VLS_vSlot(__VLS_17);
        var __VLS_18 = {
            option: (slotProps.option),
            selected: (slotProps.selected),
            index: (slotProps.index),
        };
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "label_div" },
        });
        /** @type {__VLS_StyleScopedClasses['label_div']} */ ;
        if (slotProps.option['icon']) {
            let __VLS_20;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
                icon: (slotProps.option['icon']),
                size: (slotProps.option['iconSize'] ?? '1'),
                ...{ style: ({ width: '30px' }) },
            }));
            const __VLS_22 = __VLS_21({
                icon: (slotProps.option['icon']),
                size: (slotProps.option['iconSize'] ?? '1'),
                ...{ style: ({ width: '30px' }) },
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "labelz" },
        });
        /** @type {__VLS_StyleScopedClasses['labelz']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: ({ color: __VLS_ctx.attrs.color }) },
        });
        __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (slotProps.option.label) }, null, null);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "subLabel" },
        });
        __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (slotProps.option?.sub_label ?? slotProps.option?.sub ?? slotProps.option?.subLabel) }, null, null);
        /** @type {__VLS_StyleScopedClasses['subLabel']} */ ;
        // @ts-ignore
        [attrs,];
    }
    {
        const { optiongroup: __VLS_25 } = __VLS_10.slots;
        const [slotProps] = __VLS_vSlot(__VLS_25);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "label_div" },
        });
        /** @type {__VLS_StyleScopedClasses['label_div']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "labelz" },
        });
        /** @type {__VLS_StyleScopedClasses['labelz']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        (slotProps.option.label);
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_10;
    var __VLS_11;
}
else {
    let __VLS_26;
    /** @ts-ignore @type { | typeof __VLS_components.Select | typeof __VLS_components.Select} */
    Select;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        ...{ 'onBeforeShow': {} },
        ...(__VLS_ctx.attrs),
        modelValue: (__VLS_ctx.temp_value),
        loading: (__VLS_ctx.loading),
        options: (__VLS_ctx.resolvedOptions),
        optionLabel: (__VLS_ctx.attrs.optionLabel ?? 'name'),
        optionValue: (__VLS_ctx.attrs.optionValue ?? 'value'),
        emptyMessage: (__VLS_ctx.attrs.emptyMessage ?? 'Nenhum registro encontrado'),
        editable: (__VLS_ctx.attrs.editable ?? false),
    }));
    const __VLS_28 = __VLS_27({
        ...{ 'onBeforeShow': {} },
        ...(__VLS_ctx.attrs),
        modelValue: (__VLS_ctx.temp_value),
        loading: (__VLS_ctx.loading),
        options: (__VLS_ctx.resolvedOptions),
        optionLabel: (__VLS_ctx.attrs.optionLabel ?? 'name'),
        optionValue: (__VLS_ctx.attrs.optionValue ?? 'value'),
        emptyMessage: (__VLS_ctx.attrs.emptyMessage ?? 'Nenhum registro encontrado'),
        editable: (__VLS_ctx.attrs.editable ?? false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    let __VLS_31;
    const __VLS_32 = ({ beforeShow: {} },
        { onBeforeShow: (...[$event]) => {
                if (!!(__VLS_ctx.attrs.groupOptions || (__VLS_ctx.resolvedOptions.length > 0 && __VLS_ctx.resolvedOptions[0]?.items)))
                    return;
                __VLS_ctx.before_show;
                // @ts-ignore
                [attrs, attrs, attrs, attrs, attrs, resolvedOptions, temp_value, loading, before_show,];
            } });
    const { default: __VLS_33 } = __VLS_29.slots;
    {
        const { option: __VLS_34 } = __VLS_29.slots;
        const [slotProps] = __VLS_vSlot(__VLS_34);
        var __VLS_35 = {
            option: (slotProps.option),
            selected: (slotProps.selected),
            index: (slotProps.index),
        };
        if (__VLS_ctx.attrs.category === true) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: (`category ${slotProps.option.category}`) },
            });
            (slotProps.option.category === 'UTILITY' ? 'A' : '');
            (slotProps.option.category === 'MARKETING' ? 'B' : '');
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "label_div" },
        });
        /** @type {__VLS_StyleScopedClasses['label_div']} */ ;
        if (slotProps.option['icon']) {
            let __VLS_37;
            /** @ts-ignore @type { | typeof __VLS_components.Icon} */
            Icon;
            // @ts-ignore
            const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
                icon: (slotProps.option['icon']),
                size: (slotProps.option['iconSize'] ?? '1'),
                ...{ style: ({ width: '30px' }) },
            }));
            const __VLS_39 = __VLS_38({
                icon: (slotProps.option['icon']),
                size: (slotProps.option['iconSize'] ?? '1'),
                ...{ style: ({ width: '30px' }) },
            }, ...__VLS_functionalComponentArgsRest(__VLS_38));
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "labelz" },
        });
        /** @type {__VLS_StyleScopedClasses['labelz']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: ({ color: __VLS_ctx.attrs.color }) },
        });
        __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (slotProps.option[__VLS_ctx.attrs.optionLabel ?? 'name'] ?? slotProps.option.label) }, null, null);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "subLabel" },
        });
        __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (slotProps.option?.sub_label ?? slotProps.option?.sub ?? slotProps.option?.subLabel) }, null, null);
        /** @type {__VLS_StyleScopedClasses['subLabel']} */ ;
        if (slotProps.option['img']) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (`/media/images/${slotProps.option['img']}`),
                alt: "Image",
                ...{ class: "img-label" },
            });
            /** @type {__VLS_StyleScopedClasses['img-label']} */ ;
        }
        // @ts-ignore
        [attrs, attrs, attrs,];
    }
    {
        const { value: __VLS_42 } = __VLS_29.slots;
        const [value] = __VLS_vSlot(__VLS_42);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ style: ({ color: __VLS_ctx.resolvedOptions.find((option) => option[__VLS_ctx.attrs.optionValue ?? 'value'] === value.value)?.color }) },
        });
        (__VLS_ctx.resolvedOptions.find((option) => option[__VLS_ctx.attrs.optionValue ?? 'value'] === value.value)?.[__VLS_ctx.attrs.optionLabel ?? 'name'] ?? __VLS_ctx.resolvedOptions.find((option) => option[__VLS_ctx.attrs.optionValue ?? 'value'] === value.value)?.label);
        // @ts-ignore
        [attrs, attrs, attrs, attrs, resolvedOptions, resolvedOptions, resolvedOptions,];
    }
    // @ts-ignore
    [];
    var __VLS_29;
    var __VLS_30;
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_15 = __VLS_14, __VLS_19 = __VLS_18, __VLS_36 = __VLS_35;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
