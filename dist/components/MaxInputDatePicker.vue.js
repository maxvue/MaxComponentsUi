import { useDateFormat } from '@vueuse/core';
const attrs = useAttrs();
const props = withDefaults(defineProps(), { required: false });
const modelValue = defineModel({ default: '' });
const internalDate = ref(null);
const hasBeenTouched = ref(false);
// Máscara para o input de texto do DatePicker
const maskValue = '##/##/####';
// Sincroniza modelValue -> internalDate
watch(modelValue, (val) => {
    if (!val) {
        internalDate.value = null;
        return;
    }
    const dateObj = val instanceof Date ? val : new Date(val);
    if (!isNaN(dateObj.getTime())) {
        // Só atualiza se for realmente diferente para evitar loops
        if (!internalDate.value || internalDate.value.getTime() !== dateObj.getTime())
            internalDate.value = dateObj;
    }
    else
        internalDate.value = null;
}, { immediate: true });
// Sincroniza internalDate -> modelValue
watch(internalDate, (newDate) => {
    if (!newDate) {
        if (modelValue.value !== '')
            modelValue.value = '';
        return;
    }
    const formatted = useDateFormat(newDate, 'YYYY-MM-DD HH:mm:ss').value;
    if (formatted !== modelValue.value)
        modelValue.value = formatted;
});
const validate = () => {
    hasBeenTouched.value = true;
};
const isDone = computed(() => {
    if (props.done !== undefined)
        return props.done;
    return internalDate.value !== null;
});
const isCaution = computed(() => {
    if (props.caution !== undefined)
        return props.caution;
    if (!hasBeenTouched.value && !modelValue.value)
        return false;
    return props.required && !internalDate.value;
});
const errorMessage = computed(() => {
    if (typeof props.error === 'string')
        return props.error;
    if (isCaution.value)
        return (attrs.errMsg || attrs.error_message || 'Data é obrigatória');
    return null;
});
const __VLS_defaultModels = {
    'modelValue': '',
};
let __VLS_modelEmit;
const __VLS_defaults = { required: false };
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
    ...{ class: "input-base-date-picker" },
    error: (__VLS_ctx.errorMessage),
    caution: (__VLS_ctx.isCaution),
    done: (__VLS_ctx.isDone),
    iconRight: (__VLS_ctx.icon ?? 'solar:calendar-line-duotone'),
    textCenter: true,
}));
const __VLS_2 = __VLS_1({
    ...(props),
    ...{ class: "input-base-date-picker" },
    error: (__VLS_ctx.errorMessage),
    caution: (__VLS_ctx.isCaution),
    done: (__VLS_ctx.isDone),
    iconRight: (__VLS_ctx.icon ?? 'solar:calendar-line-duotone'),
    textCenter: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['input-base-date-picker']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.DatePicker} */
DatePicker;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ 'onBlur': {} },
    ...(__VLS_ctx.attrs),
    dateFormat: "dd/mm/yy",
    modelValue: (__VLS_ctx.internalDate),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onBlur': {} },
    ...(__VLS_ctx.attrs),
    dateFormat: "dd/mm/yy",
    modelValue: (__VLS_ctx.internalDate),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_12;
const __VLS_13 = ({ blur: {} },
    { onBlur: (__VLS_ctx.validate) });
__VLS_asFunctionalDirective(__VLS_directives.vMaska, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.maskValue) }, null, null);
var __VLS_10;
var __VLS_11;
// @ts-ignore
[errorMessage, isCaution, isDone, icon, attrs, internalDate, validate, vMaska, maskValue,];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default {};
