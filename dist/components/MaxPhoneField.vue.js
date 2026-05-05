import { country_ddi_flags } from '@/constants/ddiFlags';
const props = withDefaults(defineProps(), { done: undefined, required: false, caution: undefined });
const modelValue = defineModel({ default: '' });
const country = ref(country_ddi_flags.find((f) => f.ddi === 55) || country_ddi_flags[0]);
const phone = ref('');
const noMask = refAutoReset(false, 50);
const onFocus = ref(false);
watch(phone, () => {
    if (phone.value.startsWith('0'))
        phone.value = phone.value.substring(1);
});
const { ctrl, v } = useMagicKeys();
watch(() => [ctrl.value, v.value], () => noMask.value = ctrl.value && v.value && onFocus.value);
watch(modelValue, (newVal) => {
    if (!newVal) {
        phone.value = '';
        return;
    }
    const digits = newVal.replace(/\D/g, '');
    if (digits === temp_value.value.replace(/\D/g, ''))
        return;
    // Tenta encontrar o DDI correspondente (3, 2 ou 1 dígito)
    for (let i = 3; i >= 1; i--) {
        const ddi = parseInt(digits.substring(0, i));
        const found = country_ddi_flags.find((f) => f.ddi === ddi);
        if (found) {
            country.value = found;
            phone.value = digits.substring(i);
            return;
        }
    }
    // Default caso não encontre
    country.value = country_ddi_flags.find((f) => f.ddi === 55) || country_ddi_flags[0];
    phone.value = digits;
}, { immediate: true });
const temp_value = computed(() => country.value.value + phone.value.replace(/\D/g, ''));
const only_numbers = computed(() => String(temp_value.value).replace(/\D/g, ''));
watchDebounced(temp_value, (newVal) => {
    if (newVal !== modelValue.value)
        modelValue.value = newVal;
}, { debounce: 500 });
const maskValue = computed(() => {
    const tokens = {
        '#': { pattern: /[0-9]/ },
        $: { pattern: /[0-9]/, optional: true },
        '@': { pattern: /[a-zA-Z0-9@(.+_-]/ },
        '%': { pattern: /[a-zA-Z0-9@().+_-\s]/, optional: true, repeated: true }
    };
    if (noMask.value)
        return {
            tokens: tokens,
            mask: '$$$$$$$$$$$$$$$$$$$$$$$$$$$$$'
        };
    if (country.value.value !== 55)
        return {
            tokens: tokens,
            mask: '%'
        };
    return {
        tokens: tokens,
        mask: only_numbers.value.length > 4 && ['6', '7', '8', '9'].includes(only_numbers.value[4])
            ? '(##) 9 #### - ####$$'
            : '(##) #### - ####$$'
    };
});
const __VLS_defaultModels = {
    'modelValue': '',
};
let __VLS_modelEmit;
const __VLS_defaults = { done: undefined, required: false, caution: undefined };
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
    ...{ class: "input-phone" },
    ...(props),
    value: (__VLS_ctx.temp_value),
    done: (__VLS_ctx.done),
    error: (__VLS_ctx.error),
    caution: (__VLS_ctx.caution),
    label: (props.label ?? 'Telefone'),
    iconRight: "ic:baseline-whatsapp",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "input-phone" },
    ...(props),
    value: (__VLS_ctx.temp_value),
    done: (__VLS_ctx.done),
    error: (__VLS_ctx.error),
    caution: (__VLS_ctx.caution),
    label: (props.label ?? 'Telefone'),
    iconRight: "ic:baseline-whatsapp",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['input-phone']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "inputs-div" },
});
/** @type {__VLS_StyleScopedClasses['inputs-div']} */ ;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.Select | typeof __VLS_components.Select} */
Select;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    modelValue: (__VLS_ctx.country),
    options: (__VLS_ctx.country_ddi_flags),
    filter: true,
    filterFields: (['name', 'value']),
}));
const __VLS_9 = __VLS_8({
    modelValue: (__VLS_ctx.country),
    options: (__VLS_ctx.country_ddi_flags),
    filter: true,
    filterFields: (['name', 'value']),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
{
    const { option: __VLS_13 } = __VLS_10.slots;
    const [slotProps] = __VLS_vSlot(__VLS_13);
    var __VLS_14 = {
        option: (slotProps.option),
        selected: (slotProps.selected),
        index: (slotProps.index),
    };
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "label_div" },
    });
    /** @type {__VLS_StyleScopedClasses['label_div']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: ('https://flagcdn.com/w40/' + slotProps.option.sigla.toLowerCase() + '.png'),
        alt: "flag",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "labelz" },
    });
    /** @type {__VLS_StyleScopedClasses['labelz']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        pt2: true,
    });
    (slotProps.option.label);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "subLabel" },
    });
    /** @type {__VLS_StyleScopedClasses['subLabel']} */ ;
    (slotProps.option?.value);
    if (slotProps.option['img']) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            src: (`/media/images/${slotProps.option['img']}`),
            alt: "Image",
            ...{ class: "img-label" },
        });
        /** @type {__VLS_StyleScopedClasses['img-label']} */ ;
    }
    // @ts-ignore
    [temp_value, done, error, caution, country, country_ddi_flags,];
}
{
    const { value: __VLS_16 } = __VLS_10.slots;
    const [value] = __VLS_vSlot(__VLS_16, (_) => []);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-selected" },
    });
    /** @type {__VLS_StyleScopedClasses['item-selected']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "item-flag" },
    });
    /** @type {__VLS_StyleScopedClasses['item-flag']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        src: ('https://flagcdn.com/w40/' + value.value.sigla.toLowerCase() + '.png'),
        alt: "bandeira",
        flex: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        pl9: true,
        ...{ style: {} },
    });
    (value.value.value);
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_10;
let __VLS_17;
/** @ts-ignore @type { | typeof __VLS_components.InputText} */
InputText;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
    type: "text",
    slotB: true,
    modelValue: (__VLS_ctx.phone),
    flex: true,
    autoClear: (false),
    slotChar: " ",
    placeholder: (__VLS_ctx.country.value === 55 ? '(99) 9 9999 - 9999' : ''),
    p0: true,
    fluid: true,
}));
const __VLS_19 = __VLS_18({
    type: "text",
    slotB: true,
    modelValue: (__VLS_ctx.phone),
    flex: true,
    autoClear: (false),
    slotChar: " ",
    placeholder: (__VLS_ctx.country.value === 55 ? '(99) 9 9999 - 9999' : ''),
    p0: true,
    fluid: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_asFunctionalDirective(__VLS_directives.vMaska, {})(null, { ...__VLS_directiveBindingRestFields, arg: 'unmaskedValue', modifiers: { unmasked: true, }, value: (__VLS_ctx.maskValue) }, null, null);
// @ts-ignore
[country, phone, vMaska, maskValue,];
var __VLS_3;
// @ts-ignore
var __VLS_15 = __VLS_14;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
