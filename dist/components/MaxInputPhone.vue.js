import { vMaska } from 'maska/vue';
import { watchDebounced } from '@vueuse/core';
const attrs = useAttrs();
const props = withDefaults(defineProps(), { modelValue: '' });
const emit = defineEmits(['update:modelValue']);
const defaultCountries = [
    { name: 'Brasil', value: 55, sigla: 'br' },
    { name: 'United States', value: 1, sigla: 'us' },
    { name: 'Portugal', value: 351, sigla: 'pt' },
    { name: 'Argentina', value: 54, sigla: 'ar' },
    { name: 'Uruguay', value: 598, sigla: 'uy' }
];
const countryOptions = computed(() => props.countries && props.countries.length > 0 ? props.countries : defaultCountries);
const country = ref({ value: 55, sigla: 'br' });
const phone = ref('');
const noMask = ref(false);
const onFocus = ref(false);
watch(phone, () => {
    if (phone.value.length > 0 && phone.value[0] === '0')
        phone.value = phone.value.substring(1);
});
const { ctrl, v } = useMagicKeys();
watch(() => [ctrl.value, v.value], () => {
    if (ctrl.value && v.value && onFocus.value) {
        noMask.value = true;
        setTimeout(() => {
            noMask.value = false;
        }, 30);
    }
});
const item_selected = computed(() => countryOptions.value.find((item) => item.value === country.value.value) ?? null);
const onlyNumbersStr = (str) => str ? String(str).replace(/\D/g, '') : '';
watch(() => props.modelValue, () => {
    if (!props.modelValue?.length || props.modelValue?.length === 0) {
        phone.value = '';
        return;
    }
    const model_value = onlyNumbersStr(props.modelValue);
    country.value = { value: parseInt(model_value.substring(0, 1)) };
    if (item_selected.value) {
        country.value = item_selected.value;
        phone.value = model_value.substring(1);
        return;
    }
    if (props.modelValue?.length > 1) {
        country.value = { value: parseInt(model_value.substring(0, 2)) };
        if (item_selected.value) {
            country.value = item_selected.value;
            phone.value = model_value.substring(2);
            return;
        }
    }
    if (props.modelValue?.length > 2) {
        country.value = { value: parseInt(model_value.substring(0, 3)) };
        if (item_selected.value) {
            country.value = item_selected.value;
            phone.value = model_value.substring(3);
            return;
        }
    }
    country.value = { value: 55, sigla: 'br' };
}, { immediate: true });
const temp_value = computed(() => country.value.value + onlyNumbersStr(phone.value));
const only_numbers = computed(() => onlyNumbersStr(temp_value.value));
watchDebounced(temp_value, () => {
    if (temp_value.value !== props.modelValue)
        emit('update:modelValue', temp_value.value);
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
        mask: onlyNumbersStr(only_numbers.value).length > 4 && (only_numbers.value[4] === '9' || only_numbers.value[4] === '8' || only_numbers.value[4] === '7' || only_numbers.value[4] === '6') ? '(##) 9 #### - ####$$' : '(##) #### - ####$$'
    };
});
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
    ...{ class: "input-phone" },
}));
const __VLS_2 = __VLS_1({
    ...(__VLS_ctx.attrs),
    ...{ class: "input-phone" },
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
    options: (__VLS_ctx.countryOptions),
    filter: true,
    filterFields: (['name', 'value']),
}));
const __VLS_9 = __VLS_8({
    modelValue: (__VLS_ctx.country),
    options: (__VLS_ctx.countryOptions),
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
    __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (slotProps.option.label || slotProps.option.name) }, null, null);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "subLabel" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: ('( + ' + slotProps.option?.value + ' )') }, null, null);
    /** @type {__VLS_StyleScopedClasses['subLabel']} */ ;
    // @ts-ignore
    [attrs, country, countryOptions,];
}
{
    const { value: __VLS_16 } = __VLS_10.slots;
    const [value] = __VLS_vSlot(__VLS_16);
    if (value.value) {
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
            p2: true,
        });
        (value.value.value);
    }
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
    ...{ 'onFocus': {} },
    ...{ 'onBlur': {} },
    type: "text",
    slotB: true,
    modelValue: (__VLS_ctx.phone),
    flex: true,
    autoClear: "false",
    slotChar: " ",
    placeholder: (parseInt(__VLS_ctx.country.value) === 55 ? '(99) 9 9999 - 9999' : ''),
    p0: true,
}));
const __VLS_19 = __VLS_18({
    ...{ 'onFocus': {} },
    ...{ 'onBlur': {} },
    type: "text",
    slotB: true,
    modelValue: (__VLS_ctx.phone),
    flex: true,
    autoClear: "false",
    slotChar: " ",
    placeholder: (parseInt(__VLS_ctx.country.value) === 55 ? '(99) 9 9999 - 9999' : ''),
    p0: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
let __VLS_22;
const __VLS_23 = ({ focus: {} },
    { onFocus: (...[$event]) => {
            __VLS_ctx.onFocus = true;
            // @ts-ignore
            [country, phone, onFocus,];
        } });
const __VLS_24 = ({ blur: {} },
    { onBlur: (...[$event]) => {
            __VLS_ctx.onFocus = false;
            // @ts-ignore
            [onFocus,];
        } });
__VLS_asFunctionalDirective(__VLS_directives.vMaska, {})(null, { ...__VLS_directiveBindingRestFields, arg: 'unmaskedValue', modifiers: { unmasked: true, }, value: (__VLS_ctx.maskValue) }, null, null);
var __VLS_20;
var __VLS_21;
// @ts-ignore
[vMaska, maskValue,];
var __VLS_3;
// @ts-ignore
var __VLS_15 = __VLS_14;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
    props: {},
});
const __VLS_export = {};
export default {};
